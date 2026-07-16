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
    const materialMotor = new THREE.MeshStandardMaterial({ color: 0xe67e22, roughness: 0.5, metalness: 0.6 });
    const materialFuro = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.6, metalness: 0.3 });
    const materialRosca = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.5, metalness: 0.6 });
    const materialBorracha = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.9, metalness: 0.05 });

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

        const alturaTorre = parseFloat(document.getElementById('alturaTorre').value) || 0;
        const compDiagG = parseFloat(document.getElementById('compDiagG').value) || 0;
        const compRosca = parseFloat(document.getElementById('compRosca').value) || 0;
        const espLaje = parseFloat(document.getElementById('espLaje').value) || 0;

        const bitolaTorre = (parseFloat(document.getElementById('bitolaTorre').value) || 0) / 1000;
        const bitolaDiagG = (parseFloat(document.getElementById('bitolaDiagG').value) || 0) / 1000;

        const qtdGuinchos = parseInt(document.getElementById('qtdGuinchos').value) || 1;

        // Base da mão francesa (invertida): vai do topo do mastro para dentro da laje
        const baseReach = Math.sqrt(Math.max(compDiagG * compDiagG - alturaTorre * alturaTorre, 0.0001));

        // Laje (topo em y=0, borda direita em x=0, estende-se para a esquerda)
        const largLaje = Math.max(1.1, baseReach + 0.4);
        const profLaje = 0.8;
        const geomLaje = new THREE.BoxGeometry(largLaje, espLaje, profLaje);
        lajeMesh = new THREE.Mesh(geomLaje, materialConcreto);
        lajeMesh.position.set(-largLaje / 2, -espLaje / 2, 0);
        scene.add(lajeMesh);

        // Mastro vertical com furos (guincho no topo), na borda da laje.
        // Desce um pouco abaixo da laje para o pé engatar por baixo (sargento).
        const descidaPe = espLaje + 0.10;
        const alturaMastroTotal = alturaTorre + descidaPe;
        addBarra(alturaMastroTotal, bitolaTorre, 0, alturaTorre - alturaMastroTotal / 2, 0, 'y');

        // Furos no mastro (regulam a altura) — discos escuros na face frontal
        const nFuros = Math.max(3, Math.floor(alturaTorre / 0.12));
        const rFuro = bitolaTorre * 0.28;
        for (let i = 0; i < nFuros; i++) {
            const y = 0.10 + i * (Math.max(alturaTorre - 0.20, 0.01) / Math.max(nFuros - 1, 1));
            const geomFuro = new THREE.CylinderGeometry(rFuro, rFuro, 0.01, 16);
            const furo = new THREE.Mesh(geomFuro, materialFuro);
            furo.rotation.x = Math.PI / 2;
            furo.position.set(0, y, bitolaTorre / 2 + 0.002);
            grupo.add(furo);
        }

        // Pé sob a laje (mordente de baixo do sargento)
        const compPe = Math.min(baseReach, 0.5) + 0.05;
        addBarra(compPe, bitolaTorre, -compPe / 2 + bitolaTorre / 2, -espLaje - bitolaTorre / 2, 0, 'x');

        // Base horizontal sobre a laje (onde a mão francesa apoia e a rosca aperta)
        addBarra(baseReach, bitolaTorre, -baseReach / 2, bitolaTorre / 2, 0, 'x');

        // Mão francesa INVERTIDA: do topo do mastro até a ponta da base sobre a laje
        const anguloDiag = Math.atan2(alturaTorre, baseReach);
        const geomDiag = new THREE.BoxGeometry(compDiagG, bitolaDiagG, bitolaDiagG);
        const meshDiag = new THREE.Mesh(geomDiag, materialAco);
        meshDiag.rotation.z = anguloDiag;
        meshDiag.position.set(-baseReach / 2, alturaTorre / 2, 0);
        grupo.add(meshDiag);

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

        // Motor guincho no topo do mastro, com cabo e gancho para o lado do vão (borda)
        const xMotor = 0.12;
        addBarra(xMotor + bitolaTorre / 2, bitolaTorre * 0.7, xMotor / 2, alturaTorre, 0, 'x'); // suporte do motor
        const geomMotor = new THREE.CylinderGeometry(0.08, 0.08, 0.18, 16);
        const motor = new THREE.Mesh(geomMotor, materialMotor);
        motor.rotation.x = Math.PI / 2;
        motor.position.set(xMotor, alturaTorre + 0.02, 0);
        grupo.add(motor);

        const alturaGancho = Math.min(alturaTorre * 0.7, 0.9);
        const geomCabo = new THREE.CylinderGeometry(0.006, 0.006, alturaGancho, 8);
        const cabo = new THREE.Mesh(geomCabo, materialFuro);
        cabo.position.set(xMotor, alturaTorre - alturaGancho / 2, 0);
        grupo.add(cabo);

        const geomGancho = new THREE.TorusGeometry(0.04, 0.012, 8, 16, Math.PI * 1.5);
        const gancho = new THREE.Mesh(geomGancho, materialAco);
        gancho.position.set(xMotor, alturaTorre - alturaGancho - 0.03, 0);
        grupo.add(gancho);

        // ---- Cálculo de material ----
        const metrosTubos = alturaMastroTotal + baseReach + compPe;
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

    const listaInputs = ['alturaTorre', 'compDiagG', 'compRosca', 'espLaje',
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

    animate();
    atualizarModelo();

    window.GuinchoApp = { resize, coletarDados, aplicarDados };
})();
