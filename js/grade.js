(function () {
    const container = document.getElementById('canvas-grade');

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f2f6);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.2, 4.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1, 0);

    const light1 = new THREE.DirectionalLight(0xffffff, 1.2);
    light1.position.set(5, 10, 7);
    scene.add(light1);
    const light2 = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(light2);

    const gridHelper = new THREE.GridHelper(10, 20, 0x7f8c8d, 0xbdc3c7);
    scene.add(gridHelper);

    const materialAco = new THREE.MeshStandardMaterial({ color: 0xe67e22, roughness: 0.4, metalness: 0.7 });

    const grupoGrade = new THREE.Group();
    scene.add(grupoGrade);

    function limparGrupo() {
        while (grupoGrade.children.length > 0) grupoGrade.remove(grupoGrade.children[0]);
    }

    function adicionarBarra(comprimento, bitola, x, y, z, vertical) {
        const largura = vertical ? bitola : comprimento;
        const altura = vertical ? comprimento : bitola;
        const geom = new THREE.BoxGeometry(largura, altura, bitola);
        const mesh = new THREE.Mesh(geom, materialAco);
        mesh.position.set(x, y, z);
        grupoGrade.add(mesh);
    }

    function atualizarModelo() {
        limparGrupo();

        const largura = parseFloat(document.getElementById('larguraVao').value) || 0;
        const altura = parseFloat(document.getElementById('alturaVao').value) || 0;
        const bitolaMoldura = (parseFloat(document.getElementById('bitolaMoldura').value) || 0) / 1000;
        const bitolaBarras = (parseFloat(document.getElementById('bitolaBarras').value) || 0) / 1000;
        const espacamento = (parseFloat(document.getElementById('espacamentoBarras').value) || 10) / 100;
        const qtdTravessas = parseInt(document.getElementById('qtdTravessas').value) || 0;
        const qtdVaos = parseInt(document.getElementById('qtdVaos').value) || 1;

        if (largura <= 0 || altura <= 0) return;

        adicionarBarra(largura, bitolaMoldura, 0, altura - bitolaMoldura / 2, 0, false);
        adicionarBarra(largura, bitolaMoldura, 0, bitolaMoldura / 2, 0, false);
        adicionarBarra(altura, bitolaMoldura, -largura / 2 + bitolaMoldura / 2, altura / 2, 0, true);
        adicionarBarra(altura, bitolaMoldura, largura / 2 - bitolaMoldura / 2, altura / 2, 0, true);

        const vaoUtilLargura = largura - 2 * bitolaMoldura;
        const numBarrasVerticais = Math.max(0, Math.floor(vaoUtilLargura / espacamento) - 1);
        const alturaBarraVertical = altura - 2 * bitolaMoldura;
        for (let i = 1; i <= numBarrasVerticais; i++) {
            const x = -vaoUtilLargura / 2 + i * (vaoUtilLargura / (numBarrasVerticais + 1));
            adicionarBarra(alturaBarraVertical, bitolaBarras, x, altura / 2, 0, true);
        }

        for (let i = 1; i <= qtdTravessas; i++) {
            const y = bitolaMoldura + i * ((altura - 2 * bitolaMoldura) / (qtdTravessas + 1));
            adicionarBarra(vaoUtilLargura, bitolaBarras, 0, y, 0, false);
        }

        grupoGrade.position.set(0, 0, 0);
        controls.target.set(0, altura / 2, 0);

        const perimetroMoldura = 2 * (largura + altura);
        const totalBarrasVerticais = numBarrasVerticais * alturaBarraVertical;
        const totalTravessas = qtdTravessas * vaoUtilLargura;
        const totalPorVao = perimetroMoldura + totalBarrasVerticais + totalTravessas;
        const totalGeral = totalPorVao * qtdVaos;
        const totalBarrasComerciais = Math.ceil(totalGeral / 6);
        const custoTotal = totalBarrasComerciais * getPrecoBarra();

        document.getElementById('numBarrasVerticais').innerText = numBarrasVerticais;
        document.getElementById('totalMoldura').innerText = perimetroMoldura.toFixed(2) + ' m';
        document.getElementById('totalBarrasInternas').innerText = (totalBarrasVerticais + totalTravessas).toFixed(2) + ' m';
        document.getElementById('totalPorVao').innerText = totalPorVao.toFixed(2) + ' m';
        document.getElementById('totalGeralGrade').innerText = totalGeral.toFixed(2) + ' m';
        document.getElementById('totalBarrasGrade').innerText = totalBarrasComerciais + ' barras (de 6m)';
        document.getElementById('totalCustoGrade').innerText = formatBRL(custoTotal);
    }

    const listaInputs = ['larguraVao', 'alturaVao', 'bitolaMoldura', 'bitolaBarras', 'espacamentoBarras', 'qtdTravessas', 'qtdVaos'];
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
        return {
            larguraVao: document.getElementById('larguraVao').value,
            alturaVao: document.getElementById('alturaVao').value,
            bitolaMoldura: document.getElementById('bitolaMoldura').value,
            bitolaBarras: document.getElementById('bitolaBarras').value,
            espacamentoBarras: document.getElementById('espacamentoBarras').value,
            qtdTravessas: document.getElementById('qtdTravessas').value,
            qtdVaos: document.getElementById('qtdVaos').value,
            resumo: {
                totalGeral: document.getElementById('totalGeralGrade').innerText,
                totalBarras: document.getElementById('totalBarrasGrade').innerText,
                custo: document.getElementById('totalCustoGrade').innerText
            }
        };
    }

    function aplicarDados(dados) {
        document.getElementById('larguraVao').value = dados.larguraVao;
        document.getElementById('alturaVao').value = dados.alturaVao;
        document.getElementById('bitolaMoldura').value = dados.bitolaMoldura;
        document.getElementById('bitolaBarras').value = dados.bitolaBarras;
        document.getElementById('espacamentoBarras').value = dados.espacamentoBarras;
        document.getElementById('qtdTravessas').value = dados.qtdTravessas;
        document.getElementById('qtdVaos').value = dados.qtdVaos;
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

    window.GradeApp = { resize, coletarDados, aplicarDados };
})();
