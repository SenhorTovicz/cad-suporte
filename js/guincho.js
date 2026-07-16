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
        const profLaje = 0.9;
        const geomLaje = new THREE.BoxGeometry(largLaje, espLaje, profLaje);
        lajeMesh = new THREE.Mesh(geomLaje, materialConcreto);
        lajeMesh.position.set(-largLaje / 2, -espLaje / 2, 0);
        scene.add(lajeMesh);

        // ============ PEÇA FIXA: MÃO FRANCESA (presa na laje) ============
        // Base horizontal sobre a laje (apoia e a barra roscada aperta)
        addBarra(baseReach, bitolaTorre, -baseReach / 2, bitolaTorre / 2, 0, 'x');

        // Diagonal: do colar (0, alturaMF) até a ponta da base (-baseReach, 0)
        const anguloDiag = Math.atan2(alturaMF, baseReach);
        const geomDiag = new THREE.BoxGeometry(compDiagG, bitolaDiagG, bitolaDiagG);
        const meshDiag = new THREE.Mesh(geomDiag, materialAco);
        meshDiag.rotation.z = anguloDiag;
        meshDiag.position.set(-baseReach / 2, alturaMF / 2, 0);
        grupo.add(meshDiag);

        // Colar (luva) por onde o mastro passa — em (0, alturaMF)
        const ladoColar = bitolaTorre + 0.035;
        const geomColar = new THREE.BoxGeometry(ladoColar, ladoColar * 1.6, ladoColar);
        const colar = new THREE.Mesh(geomColar, materialColar);
        colar.position.set(0, alturaMF, 0);
        grupo.add(colar);

        // Barra roscada com base de borracha, apertando na laje (na ponta da base)
        const xRosca = -baseReach + bitolaTorre / 2;
        const baseBorrachaH = 0.03;
        const geomBorracha = new THREE.BoxGeometry(0.11, baseBorrachaH, 0.11);
        const borracha = new THREE.Mesh(geomBorracha, materialBorracha);
        borracha.position.set(xRosca, baseBorrachaH / 2, 0);
        grupo.add(borracha);

        addBarra(compRosca, bitolaTorre * 0.5, xRosca, baseBorrachaH + compRosca / 2, 0, 'y', materialRosca);
        const geomKnob = new THREE.CylinderGeometry(bitolaTorre * 0.55, bitolaTorre * 0.55, bitolaTorre * 0.5, 12);
        const knob = new THREE.Mesh(geomKnob, materialFuro);
        knob.position.set(xRosca, baseBorrachaH + compRosca, 0);
        grupo.add(knob);

        // ============ PEÇA MÓVEL: MASTRO (cavalete) que passa pelo colar ============
        // Mastro vertical: desce sob a laje (gancho) e sobe até o topo (guincho)
        const descidaMast = espLaje + 0.16;
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

        // ===== Motor guincho (tipo Winch 3000lb) no topo do mastro =====
        // Placa de fixação, corpo do motor + tambor com cabo, e gancho do lado do vão
        const xWinch = 0.10;
        const yWinch = alturaTorre + 0.07;

        const geomPlaca = new THREE.BoxGeometry(0.09, 0.02, 0.30);
        const placa = new THREE.Mesh(geomPlaca, materialFuro);
        placa.position.set(xWinch, alturaTorre + 0.015, 0);
        grupo.add(placa);

        // Corpo do motor (cilindro escuro, eixo em z)
        const geomMotor = new THREE.CylinderGeometry(0.05, 0.05, 0.13, 20);
        const motor = new THREE.Mesh(geomMotor, materialMotorBody);
        motor.rotation.x = Math.PI / 2;
        motor.position.set(xWinch, yWinch, -0.10);
        grupo.add(motor);

        // Tambor com cabo de aço (cilindro metálico, eixo em z)
        const geomTambor = new THREE.CylinderGeometry(0.048, 0.048, 0.14, 20);
        const tambor = new THREE.Mesh(geomTambor, materialTambor);
        tambor.rotation.x = Math.PI / 2;
        tambor.position.set(xWinch, yWinch, 0.06);
        grupo.add(tambor);

        for (const zf of [-0.01, 0.13]) {
            const geomFlange = new THREE.CylinderGeometry(0.058, 0.058, 0.012, 20);
            const flange = new THREE.Mesh(geomFlange, materialFuro);
            flange.rotation.x = Math.PI / 2;
            flange.position.set(xWinch, yWinch, zf);
            grupo.add(flange);
        }

        // Cabo desce do tambor até o gancho, do lado do vão
        const alturaGancho = Math.min(alturaTorre * 0.7, 0.9);
        const geomCabo = new THREE.CylinderGeometry(0.006, 0.006, alturaGancho, 8);
        const cabo = new THREE.Mesh(geomCabo, materialTambor);
        cabo.position.set(xWinch, yWinch - 0.05 - alturaGancho / 2, 0.06);
        grupo.add(cabo);

        const geomGancho = new THREE.TorusGeometry(0.04, 0.012, 8, 16, Math.PI * 1.5);
        const gancho = new THREE.Mesh(geomGancho, materialAco);
        gancho.position.set(xWinch, yWinch - 0.05 - alturaGancho - 0.03, 0.06);
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
        const metrosTubos = alturaMastroTotal + compPe + baseReach;
        const metrosDiag = compDiagG;
        const metrosRosca = compRosca;
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
