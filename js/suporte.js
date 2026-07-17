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
    const materialFuro = new THREE.MeshStandardMaterial({ color: 0xa8b0b6, roughness: 0.55, metalness: 0.4 });

    const grupoMastroHorizontal = new THREE.Group();
    scene.add(grupoMastroHorizontal);

    let platibandaMesh;

    function atualizarModelo() {
        while (grupoMastroHorizontal.children.length > 0) {
            const filho = grupoMastroHorizontal.children[0];
            if (filho.geometry) filho.geometry.dispose();
            grupoMastroHorizontal.remove(filho);
        }
        if (platibandaMesh) {
            platibandaMesh.geometry.dispose();
            scene.remove(platibandaMesh);
        }

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
        const raioPonta = 0.02;                   // arredondamento SÓ no topo da ponta (R20)

        // ---- PEÇA 2 (posições): a coluna fica na face interna da platibanda. A
        // diagonal tem ângulo FIXO de 27° (como construída): mudar a coluna NÃO
        // mexe na diagonal e mudar a diagonal NÃO mexe na coluna.
        const xLuvaA = bitolaExt / 2 + folga + largPlatibanda + folga + bitolaInt / 2;
        const anguloDiag = 27 * Math.PI / 180;
        const alcanceDiag = compDiag * Math.cos(anguloDiag);
        const quedaDiag = compDiag * Math.sin(anguloDiag);
        const xLuvaB = xLuvaA + alcanceDiag;
        const ladoLuva = bitolaMastro + 0.01;     // luva 60 mm p/ tubo de 50 mm

        // ---- PEÇA 1: L (mastro horizontal + coluna vertical soldada) ----
        // Segurança: o mastro nunca fica curto a ponto de a 2ª luva sair da barra,
        // reservando também espaço p/ a ponta arredondada e o furo do cabo (0,15 m
        // = meia luva 0,05 + folga p/ furo e arredondamento).
        const compMastroEfetivo = Math.max(compMastro, xLuvaB + 0.15);

        // Mastro horizontal, encurtado no topo da ponta p/ receber o arredondamento
        const geomMastro = new THREE.BoxGeometry(compMastroEfetivo - raioPonta, bitolaMastro, bitolaMastro);
        const meshMastro = new THREE.Mesh(geomMastro, materialAco);
        meshMastro.position.set((compMastroEfetivo - raioPonta) / 2, topY, 0);
        grupoMastroHorizontal.add(meshMastro);

        // Faixa de baixo da ponta: canto INFERIOR reto (90°)
        const geomPontaBaixo = new THREE.BoxGeometry(raioPonta, bitolaMastro - raioPonta, bitolaMastro);
        const meshPontaBaixo = new THREE.Mesh(geomPontaBaixo, materialAco);
        meshPontaBaixo.position.set(compMastroEfetivo - raioPonta / 2, topY - raioPonta / 2, 0);
        grupoMastroHorizontal.add(meshPontaBaixo);

        // Arredondamento SÓ no canto de cima (R20) — protege a tela, sem canto vivo
        const geomPonta = new THREE.CylinderGeometry(raioPonta, raioPonta, bitolaMastro, 20);
        const meshPonta = new THREE.Mesh(geomPonta, materialAco);
        meshPonta.rotation.x = Math.PI / 2;
        meshPonta.position.set(compMastroEfetivo - raioPonta, topY + bitolaMastro / 2 - raioPonta, 0);
        grupoMastroHorizontal.add(meshPonta);

        // Furo p/ o cabo de aço, o mais próximo possível da ponta (logo atrás do R20)
        const geomFuroCabo = new THREE.CylinderGeometry(0.007, 0.007, bitolaMastro + 0.006, 12);
        const furoCabo = new THREE.Mesh(geomFuroCabo, materialFuro);
        furoCabo.rotation.x = Math.PI / 2;
        furoCabo.position.set(compMastroEfetivo - 0.025, topY + bitolaMastro / 2 - 0.014, 0);
        grupoMastroHorizontal.add(furoCabo);

        // Coluna do L (barra vertical soldada na ponta do mastro), face externa
        const geomColL = new THREE.BoxGeometry(bitolaExt, altExt, bitolaExt);
        const meshColL = new THREE.Mesh(geomColL, materialAco);
        meshColL.position.set(0, topY - altExt / 2, 0);
        grupoMastroHorizontal.add(meshColL);

        // ---- Chapas de fixação 150×60×6 c/ furos Ø12 ----
        // O lado de 150 fica ATRAVESSADO na barra: os furos sobram dos dois lados
        // da barra, livres para receber os parafusos/chumbadores na platibanda.
        function addChapaFuros(cx, cy, cz, vertical) {
            const geomCh = vertical
                ? new THREE.BoxGeometry(0.006, 0.06, 0.15)
                : new THREE.BoxGeometry(0.06, 0.006, 0.15);
            const ch = new THREE.Mesh(geomCh, materialAco);
            ch.position.set(cx, cy, cz);
            grupoMastroHorizontal.add(ch);
            for (const d of [-0.045, 0.045]) {
                const furo = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.016, 12), materialFuro);
                if (vertical) furo.rotation.z = Math.PI / 2;
                furo.position.set(cx, cy, cz + d);
                grupoMastroHorizontal.add(furo);
            }
        }
        // 2 chapas na coluna do L (uma em cima, outra embaixo — 30 cm entre elas na
        // coluna padrão de 0,50 m), acompanhando a altura real da coluna
        const recuoChapa = Math.min(0.10, altExt * 0.2);
        const chapaTopo = topY - recuoChapa;
        const chapaBaixo = topY - altExt + recuoChapa;
        addChapaFuros(bitolaExt / 2 + 0.003, chapaTopo, 0, true);
        if (chapaTopo - chapaBaixo >= 0.07) addChapaFuros(bitolaExt / 2 + 0.003, chapaBaixo, 0, true);
        // 1 chapa sobre a platibanda, a 7 cm da coluna (solda do mastro)
        addChapaFuros(0.07 + 0.03, topY - bitolaMastro / 2 - 0.003, 0, false);

        // ---- Platibanda (mureta), afastada 3 cm do suporte (lados, frente e topo) ----
        const altPlat = Math.max(altExt - bitolaMastro / 2 - folga, 0.1);
        const geomPlat = new THREE.BoxGeometry(largPlatibanda, altPlat, 0.22);
        platibandaMesh = new THREE.Mesh(geomPlat, materialConcreto);
        platibandaMesh.position.set(bitolaExt / 2 + folga + largPlatibanda / 2, topY - bitolaMastro / 2 - folga - altPlat / 2, 0);
        scene.add(platibandaMesh);

        // ---- PEÇA 2 (desenho): coluna vertical + diagonal + 2 luvas ----
        // Coluna vertical da mão francesa (barra de 0,50), face interna
        const geomColMF = new THREE.BoxGeometry(bitolaInt, altInt, bitolaInt);
        const meshColMF = new THREE.Mesh(geomColMF, materialAco);
        meshColMF.position.set(xLuvaA, topY - altInt / 2, 0);
        grupoMastroHorizontal.add(meshColMF);

        // Diagonal: pendurada na 2ª luva com ângulo fixo de 27°, descendo até a
        // linha da coluna — independente do tamanho da coluna
        const geomDiag = new THREE.BoxGeometry(compDiag, bitolaDiag, bitolaDiag);
        const meshDiag = new THREE.Mesh(geomDiag, materialAco);
        meshDiag.rotation.z = anguloDiag;
        meshDiag.position.set((xLuvaA + xLuvaB) / 2, topY - quedaDiag / 2, 0);
        grupoMastroHorizontal.add(meshDiag);

        // Duas luvas nas pontas da mão francesa, correndo pela barra do mastro
        const geomLuva = new THREE.BoxGeometry(0.1, ladoLuva, ladoLuva);

        const luvaA = new THREE.Mesh(geomLuva, materialLuva);
        luvaA.position.set(xLuvaA, topY, 0);
        grupoMastroHorizontal.add(luvaA);

        const luvaB = new THREE.Mesh(geomLuva, materialLuva);
        luvaB.position.set(xLuvaB, topY, 0);
        grupoMastroHorizontal.add(luvaB);

        // Tubos: mastro + colunas + 0,2 m das 2 luvas (também saem de barra)
        const metros1SuporteTubos = compMastroEfetivo + altExt + altInt + 0.2;
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

        // ---- Galvanização (R$/kg), mão de obra (R$/suporte) e custo total ----
        const custoGalv = pesoTotal * getPrecoGalv();
        const maoObraUnit = lerNumInput('maoObra');
        const custoMaoObra = maoObraUnit * qtdSuportes;
        const custoTotal = custoMaterial + custoGalv + custoMaoObra;

        document.getElementById('totalTubos').innerText = metros1SuporteTubos.toFixed(2) + ' m';
        document.getElementById('totalTubosQtd').innerText = totalMetrosTubosPedido.toFixed(2) + ' m';

        document.getElementById('totalDiag').innerText = metros1SuporteDiag.toFixed(2) + ' m';
        document.getElementById('totalDiagQtd').innerText = totalMetrosDiagPedido.toFixed(2) + ' m';

        document.getElementById('totalGeral').innerText = totalGeralMetros.toFixed(2) + ' m';
        document.getElementById('totalBarras').innerText = totalBarras + ' barras (de 6m)';
        document.getElementById('totalPeso').innerText = peso1Suporte.toFixed(2) + ' kg';
        document.getElementById('totalPesoQtd').innerText = pesoTotal.toFixed(2) + ' kg';
        document.getElementById('totalCustoGalv').innerText = formatBRL(custoGalv);
        document.getElementById('maoObraUnit').innerText = formatBRL(maoObraUnit);
        document.getElementById('totalMaoObra').innerText = formatBRL(custoMaoObra);
        document.getElementById('totalCustoSuporte').innerText = formatBRL(custoTotal);
    }

    const listaInputs = ['compMastro', 'bitolaMastro', 'altExt', 'bitolaExt', 'altInt', 'bitolaInt', 'compDiag', 'bitolaDiag', 'qtdSuportes', 'paredeTubo', 'maoObra'];
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
            paredeTubo: document.getElementById('paredeTubo').value,
            maoObra: document.getElementById('maoObra').value,
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
        if (dados.paredeTubo !== undefined) document.getElementById('paredeTubo').value = dados.paredeTubo;
        if (dados.maoObra !== undefined) document.getElementById('maoObra').value = dados.maoObra;
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
