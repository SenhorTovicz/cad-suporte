(function () {
    const container = document.getElementById('canvas-guincho');

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f2f6);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(2.4, 1.8, 3.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0.5, 0);

    const light1 = new THREE.DirectionalLight(0xffffff, 1.2);
    light1.position.set(5, 10, 7);
    scene.add(light1);
    const light2 = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(light2);

    const grid = new THREE.GridHelper(10, 20, 0x7f8c8d, 0xbdc3c7);
    grid.position.y = -1.0;
    scene.add(grid);

    const materialAco = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.4, metalness: 0.8 });
    const materialConcreto = new THREE.MeshLambertMaterial({ color: 0x95a5a6 });
    const materialFuro = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.6, metalness: 0.3 });
    const materialRosca = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.5, metalness: 0.6 });
    const materialBorracha = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.9, metalness: 0.05 });
    const materialColar = new THREE.MeshStandardMaterial({ color: 0x34495e, roughness: 0.5, metalness: 0.6 });
    const materialCaixa = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.8, metalness: 0.1 });
    const materialLabel = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.5, metalness: 0.2 });
    const materialMotorBody = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.5, metalness: 0.6 });
    const materialTambor = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, roughness: 0.35, metalness: 0.85 });

    const grupo = new THREE.Group();
    scene.add(grupo);

    let lajeMesh;

    function limpar() {
        while (grupo.children.length > 0) grupo.remove(grupo.children[0]);
        if (lajeMesh) scene.remove(lajeMesh);
    }

    function addBarra(comp, bitola, x, y, z, eixo, material) {
        let geom;
        if (eixo === 'y') geom = new THREE.BoxGeometry(bitola, comp, bitola);
        else if (eixo === 'x') geom = new THREE.BoxGeometry(comp, bitola, bitola);
        else geom = new THREE.BoxGeometry(bitola, bitola, comp);
        const mesh = new THREE.Mesh(geom, material || materialAco);
        mesh.position.set(x, y, z);
        grupo.add(mesh);
        return mesh;
    }

    // Barra (perfil quadrado) ligando dois pontos 3D quaisquer — usada nas diagonais.
    function addBarraEntrePontos(x1, y1, z1, x2, y2, z2, bitola, material) {
        const p1 = new THREE.Vector3(x1, y1, z1);
        const p2 = new THREE.Vector3(x2, y2, z2);
        const dir = new THREE.Vector3().subVectors(p2, p1);
        const len = dir.length();
        const geom = new THREE.BoxGeometry(bitola, len, bitola);
        const mesh = new THREE.Mesh(geom, material || materialAco);
        mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
        grupo.add(mesh);
        return mesh;
    }

    function atualizarModelo() {
        limpar();

        const alturaTorre = lerNumInput('alturaTorre');
        const alturaMF = lerNumInput('alturaMF');
        const compDiagG = lerNumInput('compDiagG');
        const compRosca = lerNumInput('compRosca');
        const espLaje = lerNumInput('espLaje');

        const larguraCaixa = lerNumInput('larguraCaixa');
        const alturaCaixa = lerNumInput('alturaCaixa');
        const profCaixa = lerNumInput('profCaixa');

        const bitolaTorre = lerNumInput('bitolaTorre') / 1000;
        const bitolaDiagG = lerNumInput('bitolaDiagG') / 1000;

        const qtdGuinchos = lerIntInput('qtdGuinchos');

        // Mão francesa: colar em (0, alturaMF); base vai até (-baseReach, 0) sobre a laje
        const baseReach = Math.sqrt(Math.max(compDiagG * compDiagG - alturaMF * alturaMF, 0.0001));

        // Laje (topo em y=0, borda direita em x=0, estende-se para a esquerda)
        const largLaje = Math.max(1.2, baseReach + larguraCaixa + 0.6);
        const profLaje = Math.max(0.9, 1.9 * baseReach + 0.4);
        const geomLaje = new THREE.BoxGeometry(largLaje, espLaje, profLaje);
        lajeMesh = new THREE.Mesh(geomLaje, materialConcreto);
        lajeMesh.position.set(-largLaje / 2, -espLaje / 2, 0);
        scene.add(lajeMesh);

        // ============ PEÇA FIXA: MÃO FRANCESA (presa na laje) ============
        // Colar (luva) por onde o mastro passa — apex das 3 mãos francesas
        const ladoColar = bitolaTorre + 0.035;
        const geomColar = new THREE.BoxGeometry(ladoColar, ladoColar * 1.6, ladoColar);
        const colar = new THREE.Mesh(geomColar, materialColar);
        colar.position.set(0, alturaMF, 0);
        grupo.add(colar);

        // Ângulo da diagonal no plano vertical (igual para as três mãos francesas)
        const anguloDiag = Math.atan2(alturaMF, baseReach);

        // Uma mão francesa = base na laje + diagonal (colar→pé) + barra roscada c/ borracha.
        // Três iguais: a do meio (para o vão) e duas laterais, travando o tombamento p/ os lados.
        function addMaoFrancesa(fx, fz) {
            // Base sobre a laje: do pé do mastro até o pé da mão francesa
            addBarraEntrePontos(0, bitolaTorre / 2, 0, fx, bitolaTorre / 2, fz, bitolaTorre, materialAco);

            // Diagonal RETA como a central: mesma inclinação no plano vertical, apenas
            // girada em torno do eixo do mastro (sem torcer a seção da barra). O corte
            // das pontas fica em ângulo para encaixar no colar e no pé.
            const phi = Math.atan2(fz, -fx);
            const diag = new THREE.Mesh(new THREE.BoxGeometry(compDiagG, bitolaDiagG, bitolaDiagG), materialAco);
            const qz = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), anguloDiag);
            const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), phi);
            diag.quaternion.copy(qy).multiply(qz);
            const mx = -baseReach / 2;
            diag.position.set(mx * Math.cos(phi), alturaMF / 2, -mx * Math.sin(phi));
            grupo.add(diag);

            const borracha = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.03, 0.11), materialBorracha);
            borracha.position.set(fx, 0.015, fz);
            grupo.add(borracha);

            const rosca = new THREE.Mesh(new THREE.BoxGeometry(bitolaTorre * 0.5, compRosca, bitolaTorre * 0.5), materialRosca);
            rosca.position.set(fx, 0.03 + compRosca / 2, fz);
            grupo.add(rosca);

            const knob = new THREE.Mesh(new THREE.CylinderGeometry(bitolaTorre * 0.55, bitolaTorre * 0.55, bitolaTorre * 0.5, 12), materialFuro);
            knob.position.set(fx, 0.03 + compRosca, fz);
            grupo.add(knob);
        }

        const splay = 65 * Math.PI / 180;
        const fxSide = -baseReach * Math.cos(splay);
        const fzSide = baseReach * Math.sin(splay);
        addMaoFrancesa(-baseReach, 0);      // do meio (para o vão)
        addMaoFrancesa(fxSide, fzSide);     // lateral 1
        addMaoFrancesa(fxSide, -fzSide);    // lateral 2

        // ============ PEÇA MÓVEL: MASTRO (cavalete) que passa pelo colar ============
        // Mastro vertical: sobe (sobra = regulagem) e desce até ficar RENTE com a
        // barra horizontal que engata por baixo da laje.
        const descidaMast = espLaje + bitolaTorre;
        const alturaMastroTotal = alturaTorre + descidaMast;
        addBarra(alturaMastroTotal, bitolaTorre, 0, alturaTorre - alturaMastroTotal / 2, 0, 'y');

        // Furos ao longo do mastro (regulam a altura como um cavalete)
        const nFuros = Math.max(3, Math.floor((alturaTorre + descidaMast) / 0.11));
        const rFuro = bitolaTorre * 0.26;
        for (let i = 0; i < nFuros; i++) {
            const y = -descidaMast + 0.06 + i * (Math.max(alturaTorre + descidaMast - 0.12, 0.01) / Math.max(nFuros - 1, 1));
            const geomFuro = new THREE.CylinderGeometry(rFuro, rFuro, 0.01, 16);
            const furo = new THREE.Mesh(geomFuro, materialFuro);
            furo.rotation.x = Math.PI / 2;
            furo.position.set(0, y, bitolaTorre / 2 + 0.002);
            grupo.add(furo);
        }

        // Pino do cavalete: atravessa o mastro logo acima do colar (trava a altura)
        const geomPino = new THREE.CylinderGeometry(0.012, 0.012, bitolaTorre + 0.12, 12);
        const pino = new THREE.Mesh(geomPino, materialRosca);
        pino.rotation.x = Math.PI / 2;
        pino.position.set(0, alturaMF + ladoColar * 0.8, 0);
        grupo.add(pino);

        // Pé/gancho sob a laje (parte da peça do mastro, engata por baixo)
        const compPe = Math.min(baseReach, 0.5) + 0.05;
        addBarra(compPe, bitolaTorre, -compPe / 2 + bitolaTorre / 2, -espLaje - bitolaTorre / 2, 0, 'x');

        // ===== Motor guincho (tipo Winch 3000lb) FIXADO no colar por uma chapa =====
        // Conjunto DEITADO ao longo de z (paralelo à borda da laje). O suporte de
        // fixação (chapa + 2 parafusos) fica ATRÁS, do lado do mastro; o cabo de
        // aço sai pela FRENTE (lado do vão) e desce até o gancho.
        const yWinch = alturaMF;
        const xChapa = 0.04;   // chapa soldada no colar (atrás da saída do cabo)
        const xWinch = 0.14;   // corpo do guincho, à frente da chapa
        const xCabo = 0.21;    // saída do cabo de aço, sobre o vão

        // Chapa de ferro soldada na luva (colar) — suporte de fixação com 2 parafusos
        const geomChapa = new THREE.BoxGeometry(0.014, ladoColar * 1.9, 0.24);
        const chapa = new THREE.Mesh(geomChapa, materialAco);
        chapa.position.set(xChapa, yWinch, 0);
        grupo.add(chapa);
        for (const dz of [-0.08, 0.08]) {
            const parafuso = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.03, 10), materialFuro);
            parafuso.rotation.z = Math.PI / 2;
            parafuso.position.set(xChapa + 0.014, yWinch, dz);
            grupo.add(parafuso);
        }

        // Corpo do motor (cilindro escuro, eixo em z)
        const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 20), materialMotorBody);
        motor.rotation.x = Math.PI / 2;
        motor.position.set(xWinch, yWinch, -0.09);
        grupo.add(motor);

        // Tambor com cabo de aço (cilindro metálico, eixo em z), do lado do vão
        const tambor = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.13, 20), materialTambor);
        tambor.rotation.x = Math.PI / 2;
        tambor.position.set(xWinch, yWinch, 0.065);
        grupo.add(tambor);
        for (const zf of [0.005, 0.125]) {
            const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.012, 20), materialFuro);
            flange.rotation.x = Math.PI / 2;
            flange.position.set(xWinch, yWinch, zf);
            grupo.add(flange);
        }

        // Cabo de aço sai pela frente do tambor (lado do vão) e desce até o gancho
        const alturaGancho = Math.min(alturaMF + espLaje + 0.35, 1.0);
        const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, alturaGancho, 8), materialTambor);
        cabo.position.set(xCabo, yWinch - 0.05 - alturaGancho / 2, 0.065);
        grupo.add(cabo);

        const gancho = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 16, Math.PI * 1.5), materialAco);
        gancho.position.set(xCabo, yWinch - 0.05 - alturaGancho - 0.03, 0.065);
        grupo.add(gancho);

        // ============ CAIXA (fonte + bateria, tipo USINA BOB) sobre a laje ============
        if (larguraCaixa > 0 && alturaCaixa > 0 && profCaixa > 0) {
            const xCaixa = -baseReach - 0.18 - larguraCaixa / 2;
            const zFrente = profCaixa / 2 + 0.004;
            const geomCaixa = new THREE.BoxGeometry(larguraCaixa, alturaCaixa, profCaixa);
            const caixa = new THREE.Mesh(geomCaixa, materialCaixa);
            caixa.position.set(xCaixa, alturaCaixa / 2, 0);
            grupo.add(caixa);

            // Etiqueta amarela redonda na frente (como a USINA BOB)
            const rLabel = Math.min(larguraCaixa, alturaCaixa) * 0.34;
            const geomLabel = new THREE.CylinderGeometry(rLabel, rLabel, 0.006, 24);
            const label = new THREE.Mesh(geomLabel, materialLabel);
            label.rotation.x = Math.PI / 2;
            label.position.set(xCaixa, alturaCaixa / 2, zFrente);
            grupo.add(label);

            // Faixa amarela superior (marca)
            const geomFaixa = new THREE.BoxGeometry(larguraCaixa * 0.88, alturaCaixa * 0.16, 0.006);
            const faixa = new THREE.Mesh(geomFaixa, materialLabel);
            faixa.position.set(xCaixa, alturaCaixa * 0.82, zFrente);
            grupo.add(faixa);

            // Controle (botoeira amarela) do guincho, apoiado na laje ao lado
            const geomCtrl = new THREE.BoxGeometry(0.055, 0.03, 0.11);
            const ctrl = new THREE.Mesh(geomCtrl, materialLabel);
            ctrl.position.set(xCaixa + larguraCaixa / 2 + 0.10, 0.015, 0.22);
            grupo.add(ctrl);
        }

        // ---- Cálculo de material ----
        // 3 mãos francesas: 3 diagonais + 3 bases na laje + 3 barras roscadas
        const metrosTubos = alturaMastroTotal + compPe + 3 * baseReach;
        const metrosDiag = 3 * compDiagG;
        const metrosRosca = 3 * compRosca;
        const metrosPorGuincho = metrosTubos + metrosDiag + metrosRosca;

        const totalTubos = metrosTubos * qtdGuinchos;
        const totalDiag = metrosDiag * qtdGuinchos;
        const totalGeral = metrosPorGuincho * qtdGuinchos;
        const totalBarras = Math.ceil(totalGeral / 6);
        const custoTotal = totalBarras * getPrecoBarra();

        document.getElementById('gTotalTubos').innerText = metrosTubos.toFixed(2) + ' m';
        document.getElementById('gTotalTubosQtd').innerText = totalTubos.toFixed(2) + ' m';
        document.getElementById('gTotalDiag').innerText = metrosDiag.toFixed(2) + ' m';
        document.getElementById('gTotalDiagQtd').innerText = totalDiag.toFixed(2) + ' m';
        document.getElementById('gTotalGeral').innerText = totalGeral.toFixed(2) + ' m';
        document.getElementById('gTotalBarras').innerText = totalBarras + ' barras (de 6m)';
        document.getElementById('gTotalCusto').innerText = formatBRL(custoTotal);
    }

    const listaInputs = ['alturaTorre', 'alturaMF', 'compDiagG', 'compRosca', 'espLaje',
        'larguraCaixa', 'alturaCaixa', 'profCaixa',
        'bitolaTorre', 'bitolaDiagG', 'qtdGuinchos'];
    listaInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', atualizarModelo);
    });

    function resize() {
        if (!container.clientWidth || !container.clientHeight) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    function coletarDados() {
        const dados = {};
        listaInputs.forEach(id => { dados[id] = document.getElementById(id).value; });
        dados.resumo = {
            totalGeral: document.getElementById('gTotalGeral').innerText,
            totalBarras: document.getElementById('gTotalBarras').innerText,
            custo: document.getElementById('gTotalCusto').innerText
        };
        return dados;
    }

    function aplicarDados(dados) {
        listaInputs.forEach(id => {
            if (dados[id] !== undefined) document.getElementById(id).value = dados[id];
        });
        atualizarModelo();
    }

    window.addEventListener('resize', resize);
    document.addEventListener('preco-changed', atualizarModelo);

    // Redimensiona automaticamente quando a aba fica visível (evita canvas 0x0)
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(() => resize()).observe(container);
    }

    animate();
    atualizarModelo();

    window.GuinchoApp = { resize, coletarDados, aplicarDados };
})();
