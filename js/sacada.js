(function () {
    const container = document.getElementById('canvas-sacada');

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f2f6);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(2.6, 2.0, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1.3, 0.3);

    const light1 = new THREE.DirectionalLight(0xffffff, 1.2);
    light1.position.set(5, 10, 7);
    scene.add(light1);
    const light2 = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(light2);

    const grid = new THREE.GridHelper(10, 20, 0x7f8c8d, 0xbdc3c7);
    scene.add(grid);

    const materialAco = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.4, metalness: 0.8 });
    const materialConcreto = new THREE.MeshLambertMaterial({ color: 0xb8bfc4 });
    const materialColar = new THREE.MeshStandardMaterial({ color: 0x34495e, roughness: 0.5, metalness: 0.6 });
    const materialPino = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.5, metalness: 0.6 });
    const materialFuro = new THREE.MeshStandardMaterial({ color: 0xa8b0b6, roughness: 0.55, metalness: 0.4 });
    const materialRede = new THREE.MeshBasicMaterial({ color: 0x8ea6bd, wireframe: true, transparent: true, opacity: 0.85 });
    const materialTapume = new THREE.MeshLambertMaterial({ color: 0xeef2f5, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    const materialFaixa = new THREE.MeshLambertMaterial({ color: 0x29b6f6, side: THREE.DoubleSide });

    const grupo = new THREE.Group();       // tudo do modelo (limpo a cada update)
    scene.add(grupo);
    let painelMovel = null;                // parte que gira na dobradiça

    function limpar() {
        grupo.traverse((obj) => { if (obj.geometry) obj.geometry.dispose(); });
        while (grupo.children.length > 0) grupo.remove(grupo.children[0]);
        painelMovel = null;
    }

    function box(w, h, d, x, y, z, material, parent) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
        mesh.position.set(x, y, z);
        (parent || grupo).add(mesh);
        return mesh;
    }

    function atualizarModelo() {
        limpar();

        const altura = lerNumInput('alturaHasteS');
        const dist = lerNumInput('distHastesS');
        const afast = lerNumInput('afastParedeS');
        const bitola = lerNumInput('bitolaHasteS') / 1000;
        const nGanchos = lerIntInput('ganchosHasteS', 2);
        const abertura = lerNumInput('aberturaS');
        const qtd = lerIntInput('qtdSacadas');

        document.getElementById('lblAlturaS').innerText = altura.toFixed(2) + ' m';
        document.getElementById('lblAberturaS').innerText = abertura.toFixed(0) + '°';

        // ============ PAREDE com o vão da porta da sacada (referência da foto) ============
        const vaoW = 1.2, vaoH = 2.2;
        const paredeW = dist + 1.6;
        const paredeH = Math.max(altura + 0.4, 2.6);
        const espParede = 0.12;
        // Segmentos em volta do vão (esq., dir., verga)
        box((paredeW - vaoW) / 2, paredeH, espParede, -(vaoW / 2 + (paredeW - vaoW) / 4), paredeH / 2, -espParede / 2, materialConcreto);
        box((paredeW - vaoW) / 2, paredeH, espParede, (vaoW / 2 + (paredeW - vaoW) / 4), paredeH / 2, -espParede / 2, materialConcreto);
        box(vaoW, paredeH - vaoH, espParede, 0, vaoH + (paredeH - vaoH) / 2, -espParede / 2, materialConcreto);

        // ============ FIXAÇÃO NA PAREDE (fica parada quando abre) ============
        const ladoBucha = bitola + 0.010;   // bucha = tubo 1 bitola acima, p/ haste encaixar
        for (const sx of [-dist / 2, dist / 2]) {
            // ---- Em cima: sapata na parede + braço até a DOBRADIÇA ----
            box(0.10, 0.10, 0.008, sx, altura, 0.004, materialAco);
            box(bitola, bitola * 0.7, afast, sx, altura, afast / 2, materialAco);
            const dobr = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.09, 14), materialColar);
            dobr.rotation.z = Math.PI / 2;
            dobr.position.set(sx, altura, afast);
            grupo.add(dobr);

            // ---- Embaixo: sapata RETA na parede com BUCHA horizontal — o pé em L
            // da haste desliza pra dentro dela e trava com o pino removível ----
            box(0.10, 0.12, 0.008, sx, 0.06, 0.004, materialAco);
            box(ladoBucha, ladoBucha, 0.09, sx, 0.045, 0.053, materialColar);

            // Pino removível descendo pela bucha (some quando a proteção abre)
            const pino = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, ladoBucha + 0.07, 10), materialPino);
            pino.position.set(sx, 0.045 + 0.03, 0.053);
            pino.visible = abertura < 5;
            grupo.add(pino);
        }

        // ============ PAINEL MÓVEL (gira na dobradiça do topo, tipo basculante) ============
        // Pivô no eixo da dobradiça: y = altura, z = afast. Coordenadas locais: topo em 0,
        // painel desce até -altura. Abrir = girar levantando a base p/ dentro do ambiente.
        painelMovel = new THREE.Group();
        painelMovel.position.set(0, altura, afast);
        painelMovel.rotation.x = -THREE.MathUtils.degToRad(abertura);
        grupo.add(painelMovel);

        // Haste TELESCÓPICA: a base (tubo de baixo, 1,5 m) é o tubo mais grosso;
        // a parte de cima é um tubo mais fino que ENTRA por dentro da base.
        // Furos nas duas partes: alinha o furo e trava com o pino.
        const hasteLen = altura - 0.06;                              // total vertical; o pé em L completa
        const baseLen = Math.min(lerNumInput('compBaseS'), hasteLen - 0.2);
        const bitInt = bitola - 0.008;                               // tubo de cima (interno)
        const topoBase = -hasteLen + baseLen;                        // topo do tubo de baixo (local)
        const internoLen = (hasteLen - baseLen) + Math.min(0.40, baseLen * 0.5); // sobra + trecho dentro da base

        for (const sx of [-dist / 2, dist / 2]) {
            // Tubo de BAIXO (base 1,5 m, mais grosso), do pé em L até o topo da base
            box(bitola, baseLen, bitola, sx, -hasteLen + baseLen / 2, 0, materialAco, painelMovel);

            // Tubo de CIMA (mais fino), da dobradiça descendo pra dentro da base
            box(bitInt, internoLen, bitInt, sx, -internoLen / 2, 0, materialAco, painelMovel);

            // Pé em L na base: horizontal em direção à parede, encaixa na bucha da sapata
            box(bitola, bitola, afast, sx, -hasteLen - bitola / 2, -afast / 2 + bitola / 2, materialAco, painelMovel);

            // Furos de regulagem no tubo de CIMA (trecho exposto acima da base)
            const nFurosTopo = 6;
            const trechoExposto = Math.max(hasteLen - baseLen - 0.10, 0.05);
            for (let i = 0; i < nFurosTopo; i++) {
                const fy = -0.06 - i * (trechoExposto / (nFurosTopo - 1));
                const furo = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.012, 10), materialFuro);
                furo.rotation.x = Math.PI / 2;
                furo.position.set(sx, fy, bitInt / 2 + 0.002);
                painelMovel.add(furo);
            }

            // Furos de regulagem no tubo de BAIXO (perto do topo da base)
            for (let i = 0; i < 3; i++) {
                const fy = topoBase - 0.05 - i * 0.10;
                const furo = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.012, 10), materialFuro);
                furo.rotation.x = Math.PI / 2;
                furo.position.set(sx, fy, bitola / 2 + 0.002);
                painelMovel.add(furo);
            }

            // Pino da regulagem: atravessa o tubo de baixo E o de cima no furo alinhado,
            // igual ao pino da parte de baixo (trava a altura da proteção)
            const pinoReg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, bitola + 0.07, 10), materialPino);
            pinoReg.rotation.x = Math.PI / 2;
            pinoReg.position.set(sx, topoBase - 0.05, 0);
            painelMovel.add(pinoReg);

            // Ganchos da rede (lado de dentro da haste, voltados pro vão)
            for (let i = 0; i < nGanchos; i++) {
                const gy = -0.12 - i * ((altura - 0.30) / Math.max(nGanchos - 1, 1));
                const gancho = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.005, 8, 14, Math.PI * 1.4), materialAco);
                gancho.position.set(sx - Math.sign(sx) * (bitola / 2 + 0.012), gy, bitola / 2);
                gancho.rotation.y = Math.PI / 2;
                painelMovel.add(gancho);
            }
        }

        // Rede de proteção (malha em toda a altura, presa nos ganchos)
        const rede = new THREE.Mesh(new THREE.PlaneGeometry(dist - bitola, altura - 0.08, 16, 22), materialRede);
        rede.position.set(0, -altura / 2, bitola / 2 + 0.004);
        painelMovel.add(rede);

        // Tela tapume da metade pra baixo (com as faixas azuis, como no desenho)
        const hTap = altura / 2;
        const tapume = new THREE.Mesh(new THREE.PlaneGeometry(dist - bitola - 0.04, hTap - 0.06), materialTapume);
        tapume.position.set(0, -altura + hTap / 2, bitola / 2 + 0.008);
        painelMovel.add(tapume);
        for (const fy of [-altura + hTap * 0.35, -altura + hTap * 0.7]) {
            const faixa = new THREE.Mesh(new THREE.PlaneGeometry(dist - bitola - 0.04, 0.05), materialFaixa);
            faixa.position.set(0, fy, bitola / 2 + 0.010);
            painelMovel.add(faixa);
        }

        // ---- Cálculo de material ----
        // Por haste: base 1,5 m + tubo interno (sobra + trecho dentro) + pé em L; + buchas
        const metrosTubo = 2 * (baseLen + internoLen + afast) + 2 * 0.09;
        const totalMetros = metrosTubo * qtd;
        const totalBarras = Math.ceil(totalMetros / 6);
        const custoMaterial = totalBarras * getPrecoBarra();

        // Peso do aço (parede 2 mm, metalon leve) p/ galvanização
        const parede = 2.0;
        function pesoTubo(compM, bitolaM) {
            const b = bitolaM * 1000;
            const interno = Math.max(0, b - 2 * parede);
            return compM * (b * b - interno * interno) * 0.00785;
        }
        const pesoChapas = 4 * (0.10 * 0.10 * 0.003 * 7850);   // 4 sapatas 100×100×3
        const peso1 = pesoTubo(2 * (baseLen + afast), bitola)      // tubo de baixo + pé em L
            + pesoTubo(2 * internoLen, bitInt)                     // tubo de cima (mais fino)
            + pesoTubo(2 * 0.09, ladoBucha) + pesoChapas + 0.3;    // buchas, sapatas e dobradiças
        const pesoTotal = peso1 * qtd;
        const custoGalv = pesoTotal * getPrecoGalv();

        // Rede e tapume (por m², preço editável)
        const areaRede = dist * altura;
        const areaTapume = dist * (altura / 2);
        const custoRede = areaRede * lerNumInput('precoRedeS') * qtd;
        const custoTapume = areaTapume * lerNumInput('precoTapumeS') * qtd;

        const maoObraUnit = lerNumInput('maoObraS');
        const custoMaoObra = maoObraUnit * qtd;
        const custoTotal = custoMaterial + custoGalv + custoRede + custoTapume + custoMaoObra;

        document.getElementById('sTotalTubos').innerText = metrosTubo.toFixed(2) + ' m';
        document.getElementById('sTotalTubosQtd').innerText = totalMetros.toFixed(2) + ' m';
        document.getElementById('sTotalBarras').innerText = totalBarras + ' barras (de 6m)';
        document.getElementById('sTotalPeso').innerText = peso1.toFixed(2) + ' kg';
        document.getElementById('sTotalPesoQtd').innerText = pesoTotal.toFixed(2) + ' kg';
        document.getElementById('sTotalCustoGalv').innerText = formatBRL(custoGalv);
        document.getElementById('sAreaRede').innerText = areaRede.toFixed(2) + ' m²';
        document.getElementById('sCustoRede').innerText = formatBRL(custoRede);
        document.getElementById('sAreaTapume').innerText = areaTapume.toFixed(2) + ' m²';
        document.getElementById('sCustoTapume').innerText = formatBRL(custoTapume);
        document.getElementById('sMaoObraUnit').innerText = formatBRL(maoObraUnit);
        document.getElementById('sTotalMaoObra').innerText = formatBRL(custoMaoObra);
        document.getElementById('sTotalCusto').innerText = formatBRL(custoTotal);
    }

    const listaInputs = ['alturaHasteS', 'compBaseS', 'distHastesS', 'afastParedeS', 'bitolaHasteS', 'ganchosHasteS',
        'aberturaS', 'precoRedeS', 'precoTapumeS', 'qtdSacadas', 'maoObraS'];
    listaInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', atualizarModelo);
    });

    // Botão de demonstração: abre/fecha a proteção com animação suave
    let anim = null;
    document.getElementById('btnAbrirSacada').addEventListener('click', () => {
        const slider = document.getElementById('aberturaS');
        const de = parseFloat(slider.value);
        const para = de < 45 ? 80 : 0;
        document.getElementById('btnAbrirSacada').innerText = para > 0 ? '⬇ Fechar proteção' : '⬆ Abrir proteção';
        if (anim) cancelAnimationFrame(anim);
        const inicio = performance.now(), dur = 900;
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
            totalGeral: document.getElementById('sTotalTubosQtd').innerText,
            totalBarras: document.getElementById('sTotalBarras').innerText,
            custo: document.getElementById('sTotalCusto').innerText
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

    window.SacadaApp = { resize, coletarDados, aplicarDados };
})();
