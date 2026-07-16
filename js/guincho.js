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

        // Modo de fixação: 'laje' (apoia na laje, tripé) ou 'platibanda' (aperta a mureta)
        const modo = document.getElementById('modoFixacao').value;
        const ehLaje = modo !== 'platibanda';
        const alturaMureta = lerNumInput('alturaMureta');
        const espMureta = lerNumInput('espMureta');
        document.getElementById('secao-laje').style.display = ehLaje ? '' : 'none';
        document.getElementById('secao-platibanda').style.display = ehLaje ? 'none' : '';

        // Mão francesa: colar em (0, alturaMF); base vai até (-baseReach, 0) sobre a laje
        const baseReach = Math.sqrt(Math.max(compDiagG * compDiagG - alturaMF * alturaMF, 0.0001));

        if (ehLaje) {
            // Laje (topo em y=0, borda direita em x=0, estende-se para a esquerda)
            const largLaje = Math.max(1.2, baseReach + larguraCaixa + 0.6);
            const profLaje = Math.max(0.9, 1.9 * baseReach + 0.4);
            const geomLaje = new THREE.BoxGeometry(largLaje, espLaje, profLaje);
            lajeMesh = new THREE.Mesh(geomLaje, materialConcreto);
            lajeMesh.position.set(-largLaje / 2, -espLaje / 2, 0);
            scene.add(lajeMesh);
        }

        // ============ PEÇA FIXA: MÃO FRANCESA (presa na laje) ============
        // Luva (60x60) por onde o mastro (50x50) corre: vai da base — onde chegam os
        // 3 tubos de baixo — até o topo, onde ficam o motor e as 3 diagonais. Dá mais
        // firmeza e é nela que ficam os furos e o pino de fixação (tipo cavalete).
        const ladoLuva = bitolaTorre + 0.01;   // ~60 mm quando o mastro é 50 mm
        const geomLuva = new THREE.BoxGeometry(ladoLuva, alturaMF, ladoLuva);
        const luva = new THREE.Mesh(geomLuva, materialColar);
        luva.position.set(0, alturaMF / 2, 0);
        grupo.add(luva);

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

        // Face interna/externa da mureta (modo platibanda). Coluna fica em x=0 (lado
        // de dentro); a mureta fica no +x; a fachada/vão fica além dela.
        const xMuroInner = ladoLuva / 2;
        const xMuroOuter = ladoLuva / 2 + espMureta;
        const yBoom = Math.max(alturaMF, alturaMureta) + 0.06;
        const xDrop = xMuroOuter + 0.16;   // onde o cabo desce, do lado da fachada

        if (ehLaje) {
            const splay = 65 * Math.PI / 180;
            const fxSide = -baseReach * Math.cos(splay);
            const fzSide = baseReach * Math.sin(splay);
            addMaoFrancesa(-baseReach, 0);      // do meio (para o vão)
            addMaoFrancesa(fxSide, fzSide);     // lateral 1
            addMaoFrancesa(fxSide, -fzSide);    // lateral 2
        } else {
            // ===== Modo PLATIBANDA: aperta a mureta como um sargento =====
            const profMuro = 0.7;
            // Telhado/laje da cobertura (lado de dentro)
            const roof = new THREE.Mesh(new THREE.BoxGeometry(xMuroOuter + 1.4, 0.15, profMuro + 0.2), materialConcreto);
            roof.position.set(xMuroOuter - (xMuroOuter + 1.4) / 2, -0.075, 0);
            grupo.add(roof);
            // Mureta (platibanda)
            const muro = new THREE.Mesh(new THREE.BoxGeometry(espMureta, alturaMureta, profMuro), materialConcreto);
            muro.position.set(xMuroInner + espMureta / 2, alturaMureta / 2, 0);
            grupo.add(muro);

            // Boom: barra passando por cima da mureta, da coluna até a fachada
            addBarra(xDrop, bitolaTorre, xDrop / 2, yBoom, 0, 'x');
            // Mordente externo (na face da fachada) descendo do boom
            addBarra(0.30, bitolaTorre, xMuroOuter + bitolaTorre / 2, yBoom - 0.15, 0, 'y');

            // Barra roscada + borracha apertando a face externa da mureta (sargento)
            const yScrew = alturaMureta - 0.12;
            const borracha = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.11, 0.11), materialBorracha);
            borracha.position.set(xMuroOuter + 0.015, yScrew, 0);
            grupo.add(borracha);
            addBarra(compRosca, bitolaTorre * 0.5, xMuroOuter + 0.03 + compRosca / 2, yScrew, 0, 'x', materialRosca);
            const knob = new THREE.Mesh(new THREE.CylinderGeometry(bitolaTorre * 0.55, bitolaTorre * 0.55, bitolaTorre * 0.5, 12), materialFuro);
            knob.rotation.z = Math.PI / 2;
            knob.position.set(xMuroOuter + 0.03 + compRosca, yScrew, 0);
            grupo.add(knob);
        }

        // ============ PEÇA MÓVEL: MASTRO (cavalete) que passa pela luva ============
        // No modo laje desce até ficar rente à barra que engata sob a laje; no modo
        // platibanda começa no nível do telhado (a mureta é apertada pelo sargento).
        const descidaMast = ehLaje ? espLaje + bitolaTorre : 0;
        const alturaMastroTotal = alturaTorre + descidaMast;
        addBarra(alturaMastroTotal, bitolaTorre, 0, alturaTorre - alturaMastroTotal / 2, 0, 'y');

        // Furos: na LUVA (é onde entra o pino de fixação) e no trecho do mastro que
        // fica exposto acima da luva (a sobra = regulagem de altura, tipo cavalete).
        const rFuro = bitolaTorre * 0.22;
        function furoDisco(y, zFace) {
            const f = new THREE.Mesh(new THREE.CylinderGeometry(rFuro, rFuro, 0.01, 16), materialFuro);
            f.rotation.x = Math.PI / 2;
            f.position.set(0, y, zFace + 0.002);
            grupo.add(f);
        }
        const nFuroLuva = Math.max(2, Math.floor(alturaMF / 0.10));
        for (let i = 0; i < nFuroLuva; i++) {
            furoDisco(0.07 + i * (Math.max(alturaMF - 0.13, 0.01) / Math.max(nFuroLuva - 1, 1)), ladoLuva / 2);
        }
        const nFuroMast = Math.max(2, Math.floor(Math.max(alturaTorre - alturaMF, 0.01) / 0.10));
        for (let i = 0; i < nFuroMast; i++) {
            furoDisco(alturaMF + 0.06 + i * (Math.max(alturaTorre - alturaMF - 0.12, 0.01) / Math.max(nFuroMast - 1, 1)), bitolaTorre / 2);
        }

        // Pino de fixação atravessando a luva (trava a altura do mastro)
        const pino = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, ladoLuva + 0.12, 12), materialRosca);
        pino.rotation.z = Math.PI / 2;
        pino.position.set(0, alturaMF * 0.55, 0);
        grupo.add(pino);

        // Pé/gancho sob a laje (só no modo laje; parte da peça do mastro, engata por baixo)
        const compPe = ehLaje ? Math.min(baseReach, 0.5) + 0.05 : 0;
        if (ehLaje) {
            addBarra(compPe, bitolaTorre, -compPe / 2 + bitolaTorre / 2, -espLaje - bitolaTorre / 2, 0, 'x');
        }

        // ===== Motor guincho (tipo Winch 3000lb) FIXADO no colar por uma chapa =====
        // Conjunto DEITADO ao longo de z (paralelo à borda da laje). O suporte de
        // fixação (chapa + 2 parafusos) fica ATRÁS, do lado do mastro; o cabo de
        // aço sai pela FRENTE (lado do vão) e desce até o gancho.
        const yWinch = alturaMF;
        const zMotor = -0.07;  // chapa/motor jogados um pouco para a esquerda (fora do centro)
        const motorSide = ehLaje ? 1 : -1;  // platibanda: motor voltado para o lado de dentro
        const xChapa = 0.04 * motorSide;    // chapa soldada na luva
        const xWinch = 0.14 * motorSide;    // corpo do guincho
        // Onde o cabo desce: laje = sobre o vão; platibanda = na fachada (após a mureta)
        const xCabo = ehLaje ? 0.21 : xDrop;
        const zCabo = ehLaje ? zMotor + 0.065 : 0;
        const yCaboTop = ehLaje ? yWinch : yBoom;

        // Chapa de ferro soldada na luva — suporte de fixação com 2 parafusos
        const geomChapa = new THREE.BoxGeometry(0.014, ladoLuva * 1.7, 0.24);
        const chapa = new THREE.Mesh(geomChapa, materialAco);
        chapa.position.set(xChapa, yWinch, zMotor);
        grupo.add(chapa);
        for (const dz of [-0.08, 0.08]) {
            const parafuso = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.03, 10), materialFuro);
            parafuso.rotation.z = Math.PI / 2;
            parafuso.position.set(xChapa + 0.014 * motorSide, yWinch, zMotor + dz);
            grupo.add(parafuso);
        }

        // Corpo do motor (cilindro escuro, eixo em z)
        const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 20), materialMotorBody);
        motor.rotation.x = Math.PI / 2;
        motor.position.set(xWinch, yWinch, zMotor - 0.09);
        grupo.add(motor);

        // Tambor com cabo de aço (cilindro metálico, eixo em z)
        const tambor = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.13, 20), materialTambor);
        tambor.rotation.x = Math.PI / 2;
        tambor.position.set(xWinch, yWinch, zMotor + 0.065);
        grupo.add(tambor);
        for (const zf of [zMotor + 0.005, zMotor + 0.125]) {
            const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.012, 20), materialFuro);
            flange.rotation.x = Math.PI / 2;
            flange.position.set(xWinch, yWinch, zf);
            grupo.add(flange);
        }

        // No modo platibanda, uma roldana no boom leva o cabo até a fachada
        if (!ehLaje) {
            const roldana = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 16), materialTambor);
            roldana.rotation.x = Math.PI / 2;
            roldana.position.set(xCabo, yBoom, 0);
            grupo.add(roldana);
        }

        // Cabo de aço desce até o gancho
        const alturaGancho = ehLaje ? Math.min(alturaMF + espLaje + 0.35, 1.0) : yBoom + 0.5;
        const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, alturaGancho, 8), materialTambor);
        cabo.position.set(xCabo, yCaboTop - 0.05 - alturaGancho / 2, zCabo);
        grupo.add(cabo);

        const gancho = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 16, Math.PI * 1.5), materialAco);
        gancho.position.set(xCabo, yCaboTop - 0.05 - alturaGancho - 0.03, zCabo);
        grupo.add(gancho);

        // ============ CAIXA (fonte + bateria, tipo USINA BOB) sobre a laje ============
        if (larguraCaixa > 0 && alturaCaixa > 0 && profCaixa > 0) {
            const xCaixa = ehLaje ? (-baseReach - 0.18 - larguraCaixa / 2) : (-0.30 - larguraCaixa / 2);
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
        let metrosTubos, metrosDiag, metrosRosca;
        if (ehLaje) {
            // 3 mãos francesas: 3 diagonais + 3 bases na laje + 3 barras roscadas
            metrosTubos = alturaMastroTotal + compPe + 3 * baseReach;
            metrosDiag = 3 * compDiagG;
            metrosRosca = 3 * compRosca;
        } else {
            // Platibanda: mastro + boom por cima da mureta + mordente externo
            metrosTubos = alturaMastroTotal + xDrop + 0.30;
            metrosDiag = 0;
            metrosRosca = compRosca;
        }
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

    const listaInputs = ['modoFixacao', 'alturaTorre', 'alturaMF', 'compDiagG', 'compRosca', 'espLaje',
        'alturaMureta', 'espMureta', 'larguraCaixa', 'alturaCaixa', 'profCaixa',
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
