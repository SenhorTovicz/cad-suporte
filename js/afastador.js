(function () {
    const container = document.getElementById('canvas-afastador');

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f2f6);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.01, 100);
    camera.position.set(0.22, 0.27, 0.46);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0.05, 0.04, 0);

    const light1 = new THREE.DirectionalLight(0xffffff, 1.2);
    light1.position.set(3, 6, 5);
    scene.add(light1);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const grid = new THREE.GridHelper(2, 40, 0x7f8c8d, 0xbdc3c7);
    grid.position.y = -0.30;
    scene.add(grid);

    const materialAco = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.4, metalness: 0.8 });
    const materialChapa = new THREE.MeshStandardMaterial({ color: 0x95a5a6, roughness: 0.45, metalness: 0.7 });
    const materialPorca = new THREE.MeshStandardMaterial({ color: 0x34495e, roughness: 0.5, metalness: 0.6 });
    const materialRosca = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.5, metalness: 0.6 });
    const materialFuro = new THREE.MeshStandardMaterial({ color: 0xa8b0b6, roughness: 0.55, metalness: 0.4 });
    const materialConcreto = new THREE.MeshLambertMaterial({ color: 0xb8bfc4 });
    const materialSLQA = new THREE.MeshStandardMaterial({ color: 0x2e86c1, roughness: 0.5, metalness: 0.5, transparent: true, opacity: 0.55 });
    const materialVergalhao = new THREE.MeshStandardMaterial({ color: 0x6e4b3a, roughness: 0.85, metalness: 0.35 });
    const materialEpoxi = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.7, metalness: 0.1 });

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

        // ============ LAJE / PRÉDIO (onde a chapa redonda apoia) ============
        box(0.20, 0.50, 0.40, xLaje - 0.10, -0.05, 0, materialConcreto);

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

        // ============ SUPORTE SLQA (referência) encaixado no U ============
        const ladoSLQA = Math.min(0.05, abertU - 0.004, xFuro - 0.0055 - (xU0 + esp) - 0.002);
        box(ladoSLQA, 0.55, ladoSLQA, xU0 + esp + ladoSLQA / 2, 0.0, 0, materialSLQA);

        // ============ CARANGUEJO (só demonstração): vergalhão em U chumbado na laje ============
        // As duas pernas saem da face da laje, um pouco acima do afastador, e a curva
        // abraça o suporte SLQA, que passa por dentro do U.
        const rVerg = 0.00625;                                   // vergalhão 12,5 mm
        const rCurva = 0.016;
        const yCar = lerNumInput('alturaGanchoA') / 1000;   // altura do caranguejo acima do afastador
        const xS = xU0 + esp + ladoSLQA / 2;
        const zPerna = ladoSLQA / 2 + 0.012;
        const xFimU = xS + ladoSLQA / 2 + 0.012;
        const xIni = xLaje - 0.03;                               // trecho chumbado dentro da laje
        const compPerna = (xFimU - rCurva) - xIni;
        for (const sz of [-1, 1]) {
            cilindro(rVerg, compPerna, xIni + compPerna / 2, yCar, sz * zPerna, 'x', materialVergalhao, 10);
            cilindro(0.02, 0.006, xLaje + 0.003, yCar, sz * zPerna, 'x', materialEpoxi, 18);   // chumbamento
            const curva = new THREE.Mesh(new THREE.TorusGeometry(rCurva, rVerg, 8, 12, Math.PI / 2), materialVergalhao);
            curva.rotation.x = sz > 0 ? Math.PI / 2 : -Math.PI / 2;
            curva.position.set(xFimU - rCurva, yCar, sz * (zPerna - rCurva));
            grupo.add(curva);
        }
        cilindro(rVerg, 2 * (zPerna - rCurva), xFimU, yCar, 0, 'z', materialVergalhao, 10);

        // ============ GANCHOS Ø8 (2x): soldados nas laterais da haste, apoiam no caranguejo ============
        // Saem da lateral da haste, sobem por dentro da perna do caranguejo, passam
        // por cima dela e descem um pouco do lado de fora — só apoiam, não travam.
        const rF = 0.004;
        const xG = L * 0.55;
        const zIn = zPerna - rVerg - rF - 0.001;
        const zOut = zPerna + rVerg + rF + 0.001;
        const yTopoG = yCar + rVerg + rF + 0.001;
        const compStub = zIn - lado / 2;
        const compLabio = yTopoG - yCar;
        for (const sz of [-1, 1]) {
            cilindro(rF, compStub, xG, 0, sz * (lado / 2 + compStub / 2), 'z', materialAco, 10);   // sai da lateral
            cilindro(rF, yTopoG, xG, yTopoG / 2, sz * zIn, 'y', materialAco, 10);                  // sobe
            cilindro(rF, zOut - zIn, xG, yTopoG, sz * (zIn + zOut) / 2, 'z', materialAco, 10);      // passa por cima
            cilindro(rF, compLabio, xG, yTopoG - compLabio / 2, sz * zOut, 'y', materialAco, 10);   // desce do lado de fora
            for (const [cy, cz] of [[0, zIn], [yTopoG, zIn], [yTopoG, zOut]]) {
                const junta = new THREE.Mesh(new THREE.SphereGeometry(rF, 10, 8), materialAco);
                junta.position.set(xG, cy, sz * cz);
                grupo.add(junta);
            }
        }
        const compGancho = compStub + yTopoG + (zOut - zIn) + compLabio;   // por gancho (m)
        const pesoGanchos = 2 * compGancho * Math.PI * rF * rF * 7850;

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
        const peso1 = pesoHaste + pesoU + pesoDisco + pesoGanchos + 0.02;   // + porca soldada
        const pesoTotal = peso1 * qtd;

        const metros = L * qtd;
        const barras = Math.ceil(metros / 6);
        const custoTubo = barras * lerNumInput('precoBarra20A');
        const custoChapa = (pesoU + pesoDisco + pesoGanchos) * qtd * lerNumInput('precoChapaKgA');
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
        'espChapaA', 'diamDiscoA', 'compParafusoA', 'alturaGanchoA', 'avancoA', 'precoBarra20A', 'precoChapaKgA',
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
