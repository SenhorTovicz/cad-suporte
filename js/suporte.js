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
    const materialFuro = new THREE.MeshStandardMaterial({ color: 0x1c2833, roughness: 0.6, metalness: 0.3 });

    const grupoMastroHorizontal = new THREE.Group();
    scene.add(grupoMastroHorizontal);

    let platibandaMesh;

    function atualizarModelo() {
        while (grupoMastroHorizontal.children.length > 0) grupoMastroHorizontal.remove(grupoMastroHorizontal.children[0]);
        if (platibandaMesh) scene.remove(platibandaMesh);

        const compMastro = lerNumInput('compMastro');
        const altExt = lerNumInput('altExt');
        const altInt = lerNumInput('altInt');
        const compDiag = lerNumInput('compDiag');

        const bitolaMastro = lerNumInput('bitolaMastro') / 1000;
        const bitolaExt = lerNumInput('bitolaExt') / 1000;
        const bitolaInt = lerNumInput('bitolaInt') / 1000;
        const bitolaDiag = lerNumInput('bitolaDiag') / 1000;

        const largPlatibanda = lerNumInput('larguraPlatibanda') / 100;

        const qtdSuportes = lerIntInput('qtdSuportes');

        // O suporte tem DUAS peças:
        //  PEÇA 1 - "L": barra horizontal (mastro 2,00) soldada numa coluna
        //           vertical (0,50), com ponta arredondada + furo p/ cabo de aço,
        //           2 chapas de fixação na coluna e 1 chapa sobre a platibanda.
        //  PEÇA 2 - "Mão francesa": coluna vertical (0,50) e diagonal (1,10) —
        //           cada uma com a sua LUVA correndo pelo mastro, movendo-se
        //           de forma independente quando o tamanho muda.

        const topY = Math.max(altExt, altInt);
        const folga = 0.03;                       // afastamento do suporte p/ platibanda
        const raioPonta = bitolaMastro / 2;       // arredondamento da ponta (sem canto vivo)

        // ---- PEÇA 2 (posições): a coluna fica na face interna da platibanda; a
        // diagonal desliza sozinha: a 2ª luva anda conforme SÓ o tamanho dela muda.
        const xLuvaA = bitolaExt / 2 + folga + largPlatibanda + bitolaInt / 2;
        const alcanceDiag = Math.sqrt(Math.max(compDiag * compDiag - altInt * altInt, 0.0001));
        const xLuvaB = xLuvaA + alcanceDiag;
        const anguloDiag = Math.atan2(altInt, alcanceDiag);
        const ladoLuva = bitolaMastro + 0.01;     // luva 60 mm p/ tubo de 50 mm

        // ---- PEÇA 1: L (mastro horizontal + coluna vertical soldada) ----
        // Segurança: o mastro nunca fica curto a ponto de a 2ª luva sair da barra.
        const compMastroEfetivo = Math.max(compMastro, xLuvaB + ladoLuva / 2 + 0.04);

        // Mastro horizontal, encurtado na ponta para receber o arredondamento
        const geomMastro = new THREE.BoxGeometry(compMastroEfetivo - raioPonta, bitolaMastro, bitolaMastro);
        const meshMastro = new THREE.Mesh(geomMastro, materialAco);
        meshMastro.position.set((compMastroEfetivo - raioPonta) / 2, topY, 0);
        grupoMastroHorizontal.add(meshMastro);

        // Ponta arredondada (meia-cana) — protege a tela, sem canto vivo
        const geomPonta = new THREE.CylinderGeometry(raioPonta, raioPonta, bitolaMastro, 20);
        const meshPonta = new THREE.Mesh(geomPonta, materialAco);
        meshPonta.rotation.x = Math.PI / 2;
        meshPonta.position.set(compMastroEfetivo - raioPonta, topY, 0);
        grupoMastroHorizontal.add(meshPonta);

        // Furo p/ passar o cabo de aço de um suporte ao outro (o mais alto possível)
        const geomFuroCabo = new THREE.CylinderGeometry(0.007, 0.007, bitolaMastro + 0.006, 12);
        const furoCabo = new THREE.Mesh(geomFuroCabo, materialFuro);
        furoCabo.rotation.x = Math.PI / 2;
        furoCabo.position.set(compMastroEfetivo - raioPonta - 0.035, topY + bitolaMastro / 2 - 0.015, 0);
        grupoMastroHorizontal.add(furoCabo);

        // Coluna do L (barra vertical soldada na ponta do mastro), face externa
        const geomColL = new THREE.BoxGeometry(bitolaExt, altExt, bitolaExt);
        const meshColL = new THREE.Mesh(geomColL, materialAco);
        meshColL.position.set(0, topY - altExt / 2, 0);
        grupoMastroHorizontal.add(meshColL);

        // ---- Chapas de fixação 150×60×6 c/ furos Ø12 ----
        function addChapaFuros(cx, cy, cz, vertical) {
            const geomCh = vertical
                ? new THREE.BoxGeometry(0.006, 0.15, 0.06)
                : new THREE.BoxGeometry(0.15, 0.006, 0.06);
            const ch = new THREE.Mesh(geomCh, materialAco);
            ch.position.set(cx, cy, cz);
            grupoMastroHorizontal.add(ch);
            for (const d of [-0.045, 0.045]) {
                const furo = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.016, 12), materialFuro);
                if (vertical) {
                    furo.rotation.z = Math.PI / 2;
                    furo.position.set(cx, cy + d, cz);
                } else {
                    furo.position.set(cx + d, cy, cz);
                }
                grupoMastroHorizontal.add(furo);
            }
        }
        // 2 chapas na coluna do L (uma em cima, outra embaixo, 30 cm entre elas),
        // dentro da folga, para parafusar na lateral da laje/platibanda
        addChapaFuros(bitolaExt / 2 + 0.003, topY - 0.10, 0, true);
        addChapaFuros(bitolaExt / 2 + 0.003, topY - 0.40, 0, true);
        // 1 chapa sobre a platibanda, a 10 cm da solda do mastro com a coluna
        addChapaFuros(0.10 + 0.075, topY - bitolaMastro / 2 - 0.003, 0, false);

        // ---- Platibanda (mureta), afastada 3 cm do suporte ----
        const altPlat = Math.max(altExt - bitolaMastro / 2, 0.1);
        const geomPlat = new THREE.BoxGeometry(largPlatibanda, altPlat, 0.22);
        platibandaMesh = new THREE.Mesh(geomPlat, materialConcreto);
        platibandaMesh.position.set(bitolaExt / 2 + folga + largPlatibanda / 2, topY - bitolaMastro / 2 - altPlat / 2, 0);
        scene.add(platibandaMesh);

        // ---- PEÇA 2 (desenho): coluna vertical + diagonal + 2 luvas ----
        // Coluna vertical da mão francesa (barra de 0,50), face interna
        const geomColMF = new THREE.BoxGeometry(bitolaInt, altInt, bitolaInt);
        const meshColMF = new THREE.Mesh(geomColMF, materialAco);
        meshColMF.position.set(xLuvaA, topY - altInt / 2, 0);
        grupoMastroHorizontal.add(meshColMF);

        // Diagonal: da base da coluna da mão francesa até a 2ª luva no mastro
        const geomDiag = new THREE.BoxGeometry(compDiag, bitolaDiag, bitolaDiag);
        const meshDiag = new THREE.Mesh(geomDiag, materialAco);
        meshDiag.rotation.z = anguloDiag;
        meshDiag.position.set((xLuvaA + xLuvaB) / 2, topY - altInt / 2, 0);
        grupoMastroHorizontal.add(meshDiag);

        // Duas luvas nas pontas da mão francesa, correndo pela barra do mastro
        const geomLuva = new THREE.BoxGeometry(0.1, ladoLuva, ladoLuva);

        const luvaA = new THREE.Mesh(geomLuva, materialLuva);
        luvaA.position.set(xLuvaA, topY, 0);
        grupoMastroHorizontal.add(luvaA);

        const luvaB = new THREE.Mesh(geomLuva, materialLuva);
        luvaB.position.set(xLuvaB, topY, 0);
        grupoMastroHorizontal.add(luvaB);

        const metros1SuporteTubos = compMastroEfetivo + altExt + altInt;
        const metros1SuporteDiag = compDiag;

        const totalMetrosTubosPedido = metros1SuporteTubos * qtdSuportes;
        const totalMetrosDiagPedido = metros1SuporteDiag * qtdSuportes;
        const totalGeralMetros = totalMetrosTubosPedido + totalMetrosDiagPedido;

        const totalBarras = Math.ceil(totalGeralMetros / 6);
        const custoMaterial = totalBarras * getPrecoBarra();

        // ---- Peso do aço (para galvanização, cobrada por kg) ----
        // Tubo de perfil vazado: peso = comprimento(m) × área da seção(mm²) × 0,00785
        // (aço a 7850 kg/m³). Usa a espessura de parede informada.
        const parede = lerNumInput('paredeTubo'); // mm
        function pesoTubo(compM, bitolaM) {
            const b = bitolaM * 1000; // mm
            const interno = Math.max(0, b - 2 * parede);
            const areaMM2 = b * b - interno * interno;
            return compM * areaMM2 * 0.00785; // kg
        }
        const pesoChapas = 3 * (0.15 * 0.06 * 0.006 * 7850);   // 3 chapas 150×60×6
        const peso1Suporte = pesoTubo(compMastroEfetivo, bitolaMastro)
            + pesoTubo(altExt, bitolaExt)
            + pesoTubo(altInt, bitolaInt)
            + pesoTubo(compDiag, bitolaDiag)
            + pesoTubo(0.2, ladoLuva)                            // 2 luvas de 100 mm
            + pesoChapas;
        const pesoTotal = peso1Suporte * qtdSuportes;

        // ---- Galvanização (R$/kg, editável no topo) e custo total ----
        const custoGalv = pesoTotal * getPrecoGalv();
        const custoTotal = custoMaterial + custoGalv;

        document.getElementById('totalTubos').innerText = metros1SuporteTubos.toFixed(2) + ' m';
        document.getElementById('totalTubosQtd').innerText = totalMetrosTubosPedido.toFixed(2) + ' m';

        document.getElementById('totalDiag').innerText = metros1SuporteDiag.toFixed(2) + ' m';
        document.getElementById('totalDiagQtd').innerText = totalMetrosDiagPedido.toFixed(2) + ' m';

        document.getElementById('totalGeral').innerText = totalGeralMetros.toFixed(2) + ' m';
        document.getElementById('totalBarras').innerText = totalBarras + ' barras (de 6m)';
        document.getElementById('totalPeso').innerText = peso1Suporte.toFixed(2) + ' kg';
        document.getElementById('totalPesoQtd').innerText = pesoTotal.toFixed(2) + ' kg';
        document.getElementById('totalCustoGalv').innerText = formatBRL(custoGalv);
        document.getElementById('totalCustoSuporte').innerText = formatBRL(custoTotal);
    }

    const listaInputs = ['compMastro', 'bitolaMastro', 'altExt', 'bitolaExt', 'altInt', 'bitolaInt', 'compDiag', 'bitolaDiag', 'qtdSuportes', 'paredeTubo'];
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

    // Redimensiona automaticamente quando a aba fica visível (evita canvas 0x0)
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(() => resize()).observe(container);
    }

    animate();
    atualizarModelo();

    window.SuporteApp = { resize, coletarDados, aplicarDados };
})();
