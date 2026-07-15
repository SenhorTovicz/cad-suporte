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
    const materialLuva = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.5, metalness: 0.7 });

    const grupoMastroHorizontal = new THREE.Group();
    scene.add(grupoMastroHorizontal);

    let platibandaMesh;

    function atualizarModelo() {
        while (grupoMastroHorizontal.children.length > 0) grupoMastroHorizontal.remove(grupoMastroHorizontal.children[0]);
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

        // O suporte funciona como um SARGENTO (grampo): o poste vertical é a
        // "costela" fixa encostada na face externa da platibanda, e um pé em
        // "C" na base agarra a mureta por baixo/pela face interna. O mastro sai
        // do topo, apoiado por uma mão francesa. Duas luvas fazem as emendas.

        // Ponto da mão francesa no mastro (segunda luva)
        const alcanceHorizontalDiag = Math.sqrt(Math.max(compDiag * compDiag - altExt * altExt, 0.0001));
        const anguloDiag = Math.atan2(altExt, alcanceHorizontalDiag);

        // 1. Poste vertical (costela do sargento), encostado na face externa da platibanda
        const geomVertExt = new THREE.BoxGeometry(bitolaExt, altExt, bitolaExt);
        const meshVertExt = new THREE.Mesh(geomVertExt, materialAco);
        meshVertExt.position.set(0, altExt / 2, 0);
        grupoMastroHorizontal.add(meshVertExt);

        // 2. Tubo interno de regulagem (telescópico), corre dentro do poste
        const geomVertInt = new THREE.BoxGeometry(bitolaInt, altInt, bitolaInt);
        const meshVertInt = new THREE.Mesh(geomVertInt, materialAco);
        meshVertInt.position.set(0, altInt / 2, 0);
        grupoMastroHorizontal.add(meshVertInt);

        // 3. Pé do sargento: braço horizontal por baixo da platibanda + mordente
        //    que sobe pela face interna, apertando a mureta (o "aperto" do grampo)
        const larguraGrampo = bitolaExt / 2 + largPlatibanda + bitolaExt / 2;
        const geomBraco = new THREE.BoxGeometry(larguraGrampo, bitolaExt, bitolaExt);
        const meshBraco = new THREE.Mesh(geomBraco, materialAco);
        meshBraco.position.set(-largPlatibanda / 2, bitolaExt / 2, 0);
        grupoMastroHorizontal.add(meshBraco);

        const alturaMordente = Math.min(altExt * 0.35, 0.25);
        const geomMordente = new THREE.BoxGeometry(bitolaExt, alturaMordente, bitolaExt);
        const meshMordente = new THREE.Mesh(geomMordente, materialAco);
        const xMordente = -bitolaExt / 2 - largPlatibanda - bitolaExt / 2;
        meshMordente.position.set(xMordente, alturaMordente / 2, 0);
        grupoMastroHorizontal.add(meshMordente);

        // 4. Mastro horizontal, apoiado no topo do poste e se estendendo para fora
        const geomMastro = new THREE.BoxGeometry(compMastro, bitolaMastro, bitolaMastro);
        const meshMastro = new THREE.Mesh(geomMastro, materialAco);
        meshMastro.position.set(compMastro / 2, altExt, 0);
        grupoMastroHorizontal.add(meshMastro);

        // 5. Mão francesa (diagonal), da base do poste até a segunda luva no mastro
        const geomDiag = new THREE.BoxGeometry(compDiag, bitolaDiag, bitolaDiag);
        const meshDiag = new THREE.Mesh(geomDiag, materialAco);
        meshDiag.rotation.z = anguloDiag;
        meshDiag.position.set(alcanceHorizontalDiag / 2, altExt / 2, 0);
        grupoMastroHorizontal.add(meshDiag);

        // 6. Luvas (emendas): uma sobre o poste, outra onde entra a mão francesa
        const ladoLuva = bitolaMastro + 0.02;
        const geomLuva = new THREE.BoxGeometry(0.1, ladoLuva, ladoLuva);

        const luva1 = new THREE.Mesh(geomLuva, materialLuva);
        luva1.position.set(0, altExt, 0);
        grupoMastroHorizontal.add(luva1);

        const luva2 = new THREE.Mesh(geomLuva, materialLuva);
        luva2.position.set(alcanceHorizontalDiag, altExt, 0);
        grupoMastroHorizontal.add(luva2);

        // 7. Platibanda (mureta), apertada dentro do "C" do sargento
        const geomPlat = new THREE.BoxGeometry(largPlatibanda, altExt, 0.22);
        platibandaMesh = new THREE.Mesh(geomPlat, materialConcreto);
        platibandaMesh.position.set(-bitolaExt / 2 - largPlatibanda / 2, altExt / 2, 0);
        scene.add(platibandaMesh);

        const metros1SuporteTubos = compMastro + altExt + altInt + larguraGrampo + alturaMordente;
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
