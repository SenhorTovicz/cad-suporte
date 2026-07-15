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

        // O suporte tem DUAS peças:
        //  PEÇA 1 - "L": barra horizontal (mastro 1,75) soldada numa coluna
        //           vertical (0,50). Encaixa na face externa da platibanda.
        //  PEÇA 2 - "Mão francesa": uma coluna vertical (0,50) + uma diagonal,
        //           formando o triângulo de sustentação. Nas suas duas pontas
        //           há duas LUVAS que correm pela barra de 1,75 do L, para
        //           regular o aperto conforme a espessura da platibanda.

        const topY = Math.max(altExt, altInt);

        // ---- PEÇA 1: L (mastro horizontal + coluna vertical soldada) ----
        // Mastro horizontal (barra de 1,75), da coluna do L para fora
        const geomMastro = new THREE.BoxGeometry(compMastro, bitolaMastro, bitolaMastro);
        const meshMastro = new THREE.Mesh(geomMastro, materialAco);
        meshMastro.position.set(compMastro / 2, topY, 0);
        grupoMastroHorizontal.add(meshMastro);

        // Coluna do L (barra vertical soldada na ponta do mastro), face externa
        const geomColL = new THREE.BoxGeometry(bitolaExt, altExt, bitolaExt);
        const meshColL = new THREE.Mesh(geomColL, materialAco);
        meshColL.position.set(0, topY - altExt / 2, 0);
        grupoMastroHorizontal.add(meshColL);

        // ---- Platibanda (mureta), apertada entre as duas colunas ----
        const geomPlat = new THREE.BoxGeometry(largPlatibanda, altExt, 0.22);
        platibandaMesh = new THREE.Mesh(geomPlat, materialConcreto);
        platibandaMesh.position.set(bitolaExt / 2 + largPlatibanda / 2, topY - altExt / 2, 0);
        scene.add(platibandaMesh);

        // ---- PEÇA 2: Mão francesa (coluna vertical + diagonal + 2 luvas) ----
        // 1ª luva encosta a coluna da mão francesa na face interna da platibanda
        const xLuvaA = bitolaExt / 2 + largPlatibanda + bitolaInt / 2;

        // Coluna vertical da mão francesa (barra de 0,50), face interna
        const geomColMF = new THREE.BoxGeometry(bitolaInt, altInt, bitolaInt);
        const meshColMF = new THREE.Mesh(geomColMF, materialAco);
        meshColMF.position.set(xLuvaA, topY - altInt / 2, 0);
        grupoMastroHorizontal.add(meshColMF);

        // Diagonal: da base da coluna da mão francesa até a 2ª luva no mastro
        const alcanceDiag = Math.sqrt(Math.max(compDiag * compDiag - altInt * altInt, 0.0001));
        const xLuvaB = xLuvaA + alcanceDiag;
        const anguloDiag = Math.atan2(altInt, alcanceDiag);
        const geomDiag = new THREE.BoxGeometry(compDiag, bitolaDiag, bitolaDiag);
        const meshDiag = new THREE.Mesh(geomDiag, materialAco);
        meshDiag.rotation.z = anguloDiag;
        meshDiag.position.set((xLuvaA + xLuvaB) / 2, topY - altInt / 2, 0);
        grupoMastroHorizontal.add(meshDiag);

        // Duas luvas nas pontas da mão francesa, correndo pela barra de 1,75
        const ladoLuva = bitolaMastro + 0.02;
        const geomLuva = new THREE.BoxGeometry(0.1, ladoLuva, ladoLuva);

        const luvaA = new THREE.Mesh(geomLuva, materialLuva);
        luvaA.position.set(xLuvaA, topY, 0);
        grupoMastroHorizontal.add(luvaA);

        const luvaB = new THREE.Mesh(geomLuva, materialLuva);
        luvaB.position.set(xLuvaB, topY, 0);
        grupoMastroHorizontal.add(luvaB);

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
