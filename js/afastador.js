(function () {
    const container = document.getElementById('canvas-afastador');

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f2f6);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.01, 100);
    camera.position.set(0.20, 0.42, 0.85);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(-0.24, 0.0, 0);

    const light1 = new THREE.DirectionalLight(0xffffff, 1.2);
    light1.position.set(3, 6, 5);
    scene.add(light1);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const grid = new THREE.GridHelper(2, 40, 0x7f8c8d, 0xbdc3c7);
    grid.position.y = -0.46;
    scene.add(grid);

    const materialAco = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.4, metalness: 0.8 });
    const materialChapa = new THREE.MeshStandardMaterial({ color: 0x95a5a6, roughness: 0.45, metalness: 0.7 });
    const materialPorca = new THREE.MeshStandardMaterial({ color: 0x34495e, roughness: 0.5, metalness: 0.6 });
    const materialRosca = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.5, metalness: 0.6 });
    const materialFuro = new THREE.MeshStandardMaterial({ color: 0xa8b0b6, roughness: 0.55, metalness: 0.4 });
    const materialConcreto = new THREE.MeshLambertMaterial({ color: 0xb8bfc4 });
    const materialSLQA = new THREE.MeshStandardMaterial({ color: 0x2e86c1, roughness: 0.5, metalness: 0.5, transparent: true, opacity: 0.55 });
    const materialCaranguejo = new THREE.MeshStandardMaterial({ color: 0xd35400, roughness: 0.5, metalness: 0.6 });

    const grupo = new THREE.Group();
    scene.add(grupo);

    function limpar() {
        grupo.traverse((obj) => { if (obj.geometry) obj.geometry.dispose(); });
        while (grupo.children.length > 0) grupo.remove(grupo.children[0]);
    }

    function box(w, h, d, x, y, z, material) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
        mesh.position.set(x, y, z);
        grupo.add(mesh);
        return mesh;
    }

    // Cilindro deitado ao longo de X (parafusos, disco) ou de Z (parafuso de trás)
    function cilindro(r, comp, x, y, z, eixo, material, lados) {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, comp, lados || 20), material);
        if (eixo === 'x') mesh.rotation.z = Math.PI / 2;
        else if (eixo === 'z') mesh.rotation.x = Math.PI / 2;
        mesh.position.set(x, y, z);
        grupo.add(mesh);
        return mesh;
    }

    function atualizarModelo() {
        limpar();

        const L = lerNumInput('compHasteA') / 1000;
        const lado = lerNumInput('ladoHasteA') / 1000;
        const parede = lerNumInput('paredeHasteA');
        const abertU = lerNumInput('aberturaUA') / 1000;
        const pernaU = lerNumInput('pernaUA') / 1000;
        const altU = lerNumInput('alturaUA') / 1000;
        const esp = lerNumInput('espChapaA') / 1000;
        const dDisco = lerNumInput('diamDiscoA') / 1000;
        const compPar = lerNumInput('compParafusoA') / 1000;
        const qtd = lerIntInput('qtdAfast');

        const avancoMax = Math.max(compPar - 0.02, 0);   // sempre ficam 20 mm de rosca na porca
        const sliderAv = document.getElementById('avancoA');
        sliderAv.max = Math.round(avancoMax * 1000);
        const avanco = Math.min(lerNumInput('avancoA') / 1000, avancoMax);

        const hPorca = 0.011;                 // porca 1/2" (≈ 11 mm de altura)
        const sPorca = 0.019;                 // 19 mm entre faces (chave 19)
        const rPar = 0.00635;                 // parafuso 1/2" = 12,7 mm
        const espDisco = 0.00475;             // chapa redonda 3/16"

        // Afastamento: da face da laje até a face do suporte (dentro do U)
        const afastTotal = espDisco + avanco + hPorca + L + esp;
        const xLaje = -hPorca - avanco - espDisco;

        document.getElementById('lblAvancoA').innerText = (avanco * 1000).toFixed(0) + ' mm';
        document.getElementById('lblAfastA').innerText = (afastTotal * 1000).toFixed(0) + ' mm';

        // ============ LAJE (só demonstração): a chapa redonda apoia na borda dela ============
        const yTopoLaje = 0.12, espLajeD = 0.20, profLaje = 0.70;
        box(profLaje, espLajeD, 0.50, xLaje - profLaje / 2, yTopoLaje - espLajeD / 2, 0, materialConcreto);

        // ============ PEÇA 1 — HASTE 20×20 OCA (x de 0 até L) ============
        // Desenhada como tubo: 4 paredes, pra se ver que é oca e o parafuso entra nela
        const t = Math.max(parede / 1000, 0.001);
        box(L, t, lado, L / 2, lado / 2 - t / 2, 0, materialAco);
        box(L, t, lado, L / 2, -lado / 2 + t / 2, 0, materialAco);
        box(L, lado - 2 * t, t, L / 2, 0, lado / 2 - t / 2, materialAco);
        box(L, lado - 2 * t, t, L / 2, 0, -lado / 2 + t / 2, materialAco);

        // ============ PORCA 1/2" SOLDADA na ponta da haste ============
        cilindro(sPorca / Math.sqrt(3), hPorca, -hPorca / 2, 0, 0, 'x', materialPorca, 6);
        cilindro(rPar + 0.0005, hPorca + 0.0005, -hPorca / 2, 0, 0, 'x', materialFuro, 16);

        // ============ PARAFUSO 1/2" + CHAPA REDONDA Ø50 (regulável) ============
        // Sai da porca em direção à laje; o resto da rosca fica dentro da haste oca
        const xParIni = xLaje + espDisco;
        cilindro(rPar, compPar, xParIni + compPar / 2, 0, 0, 'x', materialRosca, 16);
        cilindro(dDisco / 2, espDisco, xLaje + espDisco / 2, 0, 0, 'x', materialChapa, 32);

        // ============ PEÇA 2 — CHAPA U 60×80 soldada na outra ponta ============
        const xU0 = L;                                   // face soldada na haste
        box(esp, altU, abertU + 2 * esp, xU0 + esp / 2, 0, 0, materialChapa);     // fundo do U
        for (const sz of [-1, 1]) {
            box(pernaU, altU, esp, xU0 + pernaU / 2, 0, sz * (abertU / 2 + esp / 2), materialChapa); // pernas
        }

        // Furos nas pontas do U + parafuso com porca passando POR TRÁS do suporte
        const xFuro = xU0 + pernaU - 0.012;
        for (const sz of [-1, 1]) {
            cilindro(0.005, esp + 0.002, xFuro, 0, sz * (abertU / 2 + esp / 2), 'z', materialFuro, 16);
        }
        const compTrava = abertU + 2 * esp + 0.025;
        cilindro(0.0045, compTrava, xFuro, 0, 0, 'z', materialRosca, 14);         // parafuso 3/8"
        cilindro(0.0095, 0.007, xFuro, 0, compTrava / 2 - 0.004, 'z', materialPorca, 6);   // porca
        cilindro(0.0095, 0.006, xFuro, 0, -compTrava / 2 + 0.003, 'z', materialPorca, 6);  // cabeça

        // ============ SUPORTE SLQA em L (só demonstração) ============
        // Braço deitado em cima da laje, preso pelos caranguejos; a parte vertical
        // desce por fora da borda e passa dentro do U do afastador.
        const ladoSLQA = Math.min(0.05, abertU - 0.004, xFuro - 0.0055 - (xU0 + esp) - 0.002);
        const xS = xU0 + esp + ladoSLQA / 2;
        const yBraco = yTopoLaje + ladoSLQA / 2;
        const yBaixo = -0.45;
        const yTopoS = yBraco + ladoSLQA / 2;
        box(ladoSLQA, yTopoS - yBaixo, ladoSLQA, xS, (yTopoS + yBaixo) / 2, 0, materialSLQA);
        const xFimBraco = xLaje - 0.55;
        const compBraco = (xS - ladoSLQA / 2) - xFimBraco;
        box(compBraco, ladoSLQA, ladoSLQA, xFimBraco + compBraco / 2, yBraco, 0, materialSLQA);

        // ============ CARANGUEJOS (só demonstração): abraçam o braço e são chumbados na laje ============
        const eC = 0.006, larC = 0.05, folgaC = 0.002;
        const meia = ladoSLQA / 2 + folgaC;
        const hLat = ladoSLQA + folgaC;
        for (const xC of [xLaje - 0.15, xLaje - 0.42]) {
            box(larC, eC, 2 * (meia + eC), xC, yTopoLaje + hLat + eC / 2, 0, materialCaranguejo);           // tampa por cima
            for (const sz of [-1, 1]) {
                box(larC, hLat + eC, eC, xC, yTopoLaje + (hLat + eC) / 2, sz * (meia + eC / 2), materialCaranguejo); // lateral
                const zAba = sz * (meia + eC + 0.025);
                box(larC, eC, 0.05, xC, yTopoLaje + eC / 2, zAba, materialCaranguejo);                         // aba na laje
                cilindro(0.005, 0.07, xC, yTopoLaje - 0.025, zAba, 'y', materialRosca, 12);                     // chumbador
                cilindro(0.009, 0.007, xC, yTopoLaje + eC + 0.0035, zAba, 'y', materialPorca, 6);              // porca
            }
        }

        // ---- Cálculo de material ----
        function pesoTubo(compM, ladoM) {
            const b = ladoM * 1000;
            const interno = Math.max(0, b - 2 * parede);
            return compM * (b * b - interno * interno) * 0.00785;
        }
        const desenvU = 2 * pernaU + abertU + 2 * esp;                   // chapa dobrada (desenvolvido)
        const pesoU = desenvU * altU * esp * 7850;
        const pesoDisco = Math.PI * (dDisco / 2) ** 2 * espDisco * 7850;
        const pesoHaste = pesoTubo(L, lado);
        const peso1 = pesoHaste + pesoU + pesoDisco + 0.02;               // + porca soldada
        const pesoTotal = peso1 * qtd;

        const metros = L * qtd;
        const barras = Math.ceil(metros / 6);
        const custoTubo = barras * lerNumInput('precoBarra20A');
        const custoChapa = (pesoU + pesoDisco) * qtd * lerNumInput('precoChapaKgA');
        const custoParaf = lerNumInput('parafusariaA') * qtd;
        const custoGalv = pesoTotal * getPrecoGalv();
        const maoObraUnit = lerNumInput('maoObraA');
        const custoMO = maoObraUnit * qtd;
        const custoTotal = custoTubo + custoChapa + custoParaf + custoGalv + custoMO;

        document.getElementById('aMetros').innerText = (L).toFixed(2) + ' m';
        document.getElementById('aMetrosQtd').innerText = metros.toFixed(2) + ' m';
        document.getElementById('aBarras').innerText = barras + ' barra(s) 20×20 (6m)';
        document.getElementById('aCustoTubo').innerText = formatBRL(custoTubo);
        document.getElementById('aCustoChapa').innerText = formatBRL(custoChapa);
        document.getElementById('aCustoParaf').innerText = formatBRL(custoParaf);
        document.getElementById('aPeso').innerText = peso1.toFixed(3) + ' kg';
        document.getElementById('aPesoQtd').innerText = pesoTotal.toFixed(2) + ' kg';
        document.getElementById('aCustoGalv').innerText = formatBRL(custoGalv);
        document.getElementById('aMaoObraUnit').innerText = formatBRL(maoObraUnit);
        document.getElementById('aTotalMaoObra').innerText = formatBRL(custoMO);
        document.getElementById('aCustoUnit').innerText = formatBRL(custoTotal / qtd);
        document.getElementById('aCustoTotal').innerText = formatBRL(custoTotal);
    }

    const listaInputs = ['compHasteA', 'ladoHasteA', 'paredeHasteA', 'aberturaUA', 'pernaUA', 'alturaUA',
        'espChapaA', 'diamDiscoA', 'compParafusoA', 'avancoA', 'precoBarra20A', 'precoChapaKgA',
        'parafusariaA', 'qtdAfast', 'maoObraA'];
    listaInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', atualizarModelo);
    });

    // Demonstração: gira o parafuso, afastando até o máximo e voltando
    let anim = null;
    document.getElementById('btnRegularA').addEventListener('click', () => {
        const slider = document.getElementById('avancoA');
        const de = parseFloat(slider.value);
        const max = parseFloat(slider.max);
        const para = de < max / 2 ? max : 0;
        if (anim) cancelAnimationFrame(anim);
        const inicio = performance.now(), dur = 1400;
        function passo(t) {
            const p = Math.min((t - inicio) / dur, 1);
            const suave = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
            slider.value = (de + (para - de) * suave).toFixed(0);
            atualizarModelo();
            if (p < 1) anim = requestAnimationFrame(passo);
        }
        anim = requestAnimationFrame(passo);
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
            totalGeral: document.getElementById('aMetrosQtd').innerText,
            totalBarras: document.getElementById('aBarras').innerText,
            custo: document.getElementById('aCustoTotal').innerText
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

    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(() => resize()).observe(container);
    }

    animate();
    atualizarModelo();

    window.AfastadorApp = { resize, coletarDados, aplicarDados };
})();
