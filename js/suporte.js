(function () {
    const container = document.getElementById('canvas-suporte');

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f2f6);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(2.0, 1.5, 3.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

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

    const grupoMastroHorizontal = new THREE.Group();
    const grupoVRegulagemHorizontal = new THREE.Group();
    scene.add(grupoMastroHorizontal);
    scene.add(grupoVRegulagemHorizontal);

    let platibandaMesh;

    function atualizarModelo() {
        while (grupoMastroHorizontal.children.length > 0) grupoMastroHorizontal.remove(grupoMastroHorizontal.children[0]);
        while (grupoVRegulagemHorizontal.children.length > 0) grupoVRegulagemHorizontal.remove(grupoVRegulagemHorizontal.children[0]);
        if (platibandaMesh) scene.remove(platibandaMesh);

        const compMastro = parseFloat(document.getElementById('compMastro').value) || 0;
        const altExt = parseFloat(document.getElementById('altExt').value) || 0;
        const altInt = parseFloat(document.getElementById('altInt').value) || 0;
        const compDiag = parseFloat(document.getElementById('compDiag').value) || 0;

        const bitolaMastro = (parseFloat(document.getElementById('bitolaMastro').value) || 0) / 1000;
        const bitolaExt = (parseFloat(document.getElementById('bitolaExt').value) || 0) / 1000;
        const bitolaInt = (parseFloat(document.getElementById('bitolaInt').value) || 0) / 1000;
        const bitolaDiag = (parseFloat(document.getElementById('bitolaDiag').value) || 0) / 1000;

        const largPlatibanda = (parseFloat(document.getElementById('larguraPlatibanda').value) || 0) / 100;

        const qtdSuportes = parseInt(document.getElementById('qtdSuportes').value) || 1;

        const geomMastro = new THREE.BoxGeometry(compMastro, bitolaMastro, bitolaMastro);
        const meshMastro = new THREE.Mesh(geomMastro, materialAco);
        meshMastro.position.set(-(compMastro / 2 - 0.3), altExt, 0);
        grupoMastroHorizontal.add(meshMastro);

        const geomVertExt = new THREE.BoxGeometry(bitolaExt, altExt, bitolaExt);
        const meshVertExt = new THREE.Mesh(geomVertExt, materialAco);
        const posColFixaX = -0.3 + largPlatibanda + bitolaExt / 2;
        meshVertExt.position.set(posColFixaX, altExt / 2, 0);
        grupoMastroHorizontal.add(meshVertExt);

        const geomPlat = new THREE.BoxGeometry(largPlatibanda, altExt, 0.6);
        platibandaMesh = new THREE.Mesh(geomPlat, materialConcreto);
        platibandaMesh.position.set(posColFixaX - bitolaExt / 2 - largPlatibanda / 2, altExt / 2, 0);
        scene.add(platibandaMesh);

        const geomVertInt = new THREE.BoxGeometry(bitolaInt, altInt, bitolaInt);
        const meshVertInt = new THREE.Mesh(geomVertInt, materialAco);
        meshVertInt.position.set(0, -altInt / 2, 0);
        grupoVRegulagemHorizontal.add(meshVertInt);

        const geomLuvaEsq = new THREE.BoxGeometry(0.12, bitolaMastro + 0.015, bitolaMastro + 0.015);
        const meshLuvaEsq = new THREE.Mesh(geomLuvaEsq, materialAco);
        meshLuvaEsq.position.set(0, 0, 0);
        grupoVRegulagemHorizontal.add(meshLuvaEsq);

        const distHorizontalDiag = compDiag * 0.707;
        const geomDiag = new THREE.BoxGeometry(bitolaDiag, compDiag, bitolaDiag);
        const meshDiag = new THREE.Mesh(geomDiag, materialAco);
        meshDiag.rotation.z = Math.PI / 4;
        meshDiag.position.set(-distHorizontalDiag / 2, -distHorizontalDiag / 2, 0);
        grupoVRegulagemHorizontal.add(meshDiag);

        const geomLuvaDir = new THREE.BoxGeometry(0.12, bitolaMastro + 0.015, bitolaMastro + 0.015);
        const meshLuvaDir = new THREE.Mesh(geomLuvaDir, materialAco);
        meshLuvaDir.position.set(-distHorizontalDiag, 0, 0);
        grupoVRegulagemHorizontal.add(meshLuvaDir);

        const posXRegulagem = posColFixaX - bitolaExt / 2 - largPlatibanda - bitolaInt / 2;
        grupoVRegulagemHorizontal.position.set(posXRegulagem, altExt, 0);

        const metros1SuporteTubos = compMastro + altExt + altInt;
        const metros1SuporteDiag = compDiag;

        const totalMetrosTubosPedido = metros1SuporteTubos * qtdSuportes;
        const totalMetrosDiagPedido = metros1SuporteDiag * qtdSuportes;
        const totalGeralMetros = totalMetrosTubosPedido + totalMetrosDiagPedido;

        const totalBarras = Math.ceil(totalGeralMetros / 6);
        const custoTotal = totalBarras * getPrecoBarra();

        document.getElementById('totalTubos').innerText = metros1SuporteTubos.toFixed(2) + ' m';
        document.getElementById('totalTubosQtd').innerText = totalMetrosTubosPedido.toFixed(2) + ' m';

        document.getElementById('totalDiag').innerText = metros1SuporteDiag.toFixed(2) + ' m';
        document.getElementById('totalDiagQtd').innerText = totalMetrosDiagPedido.toFixed(2) + ' m';

        document.getElementById('totalGeral').innerText = totalGeralMetros.toFixed(2) + ' m';
        document.getElementById('totalBarras').innerText = totalBarras + ' barras (de 6m)';
        document.getElementById('totalCustoSuporte').innerText = formatBRL(custoTotal);
    }

    const listaInputs = ['compMastro', 'bitolaMastro', 'altExt', 'bitolaExt', 'altInt', 'bitolaInt', 'compDiag', 'bitolaDiag', 'qtdSuportes'];
    listaInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', atualizarModelo);
    });

    document.getElementById('larguraPlatibanda').addEventListener('input', (e) => {
        document.getElementById('lblPlatibanda').innerText = e.target.value + ' cm';
        atualizarModelo();
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
        return {
            larguraPlatibanda: document.getElementById('larguraPlatibanda').value,
            compMastro: document.getElementById('compMastro').value,
            bitolaMastro: document.getElementById('bitolaMastro').value,
            altExt: document.getElementById('altExt').value,
            bitolaExt: document.getElementById('bitolaExt').value,
            altInt: document.getElementById('altInt').value,
            bitolaInt: document.getElementById('bitolaInt').value,
            compDiag: document.getElementById('compDiag').value,
            bitolaDiag: document.getElementById('bitolaDiag').value,
            qtdSuportes: document.getElementById('qtdSuportes').value,
            resumo: {
                totalGeral: document.getElementById('totalGeral').innerText,
                totalBarras: document.getElementById('totalBarras').innerText,
                custo: document.getElementById('totalCustoSuporte').innerText
            }
        };
    }

    function aplicarDados(dados) {
        document.getElementById('larguraPlatibanda').value = dados.larguraPlatibanda;
        document.getElementById('lblPlatibanda').innerText = dados.larguraPlatibanda + ' cm';
        document.getElementById('compMastro').value = dados.compMastro;
        document.getElementById('bitolaMastro').value = dados.bitolaMastro;
        document.getElementById('altExt').value = dados.altExt;
        document.getElementById('bitolaExt').value = dados.bitolaExt;
        document.getElementById('altInt').value = dados.altInt;
        document.getElementById('bitolaInt').value = dados.bitolaInt;
        document.getElementById('compDiag').value = dados.compDiag;
        document.getElementById('bitolaDiag').value = dados.bitolaDiag;
        document.getElementById('qtdSuportes').value = dados.qtdSuportes;
        atualizarModelo();
    }

    window.addEventListener('resize', resize);
    document.addEventListener('preco-changed', atualizarModelo);

    animate();
    atualizarModelo();

    window.SuporteApp = { resize, coletarDados, aplicarDados };
})();
