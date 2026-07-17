const PRECO_KEY = 'cadSuporte.precoBarra6m';
const PRECO_PADRAO = 175.27;
const GALV_KEY = 'cadSuporte.precoGalvKg';
const GALV_PADRAO = 2.50;

function formatBRL(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Lê um input numérico já protegido contra vazio/NaN e valores negativos.
function lerNumInput(id, min = 0) {
    const v = parseFloat(document.getElementById(id).value);
    return Math.max(min, isNaN(v) ? 0 : v);
}

// Lê um input inteiro (quantidades) com mínimo (1 por padrão).
function lerIntInput(id, min = 1) {
    const v = parseInt(document.getElementById(id).value, 10);
    return Math.max(min, isNaN(v) ? min : v);
}

function getPrecoBarra() {
    const input = document.getElementById('precoBarra');
    const valor = parseFloat(input.value);
    return isNaN(valor) ? 0 : valor;
}

function initPrecoBarra(onChange) {
    const input = document.getElementById('precoBarra');
    const salvo = localStorage.getItem(PRECO_KEY);
    input.value = salvo ? salvo : PRECO_PADRAO;
    input.addEventListener('input', () => {
        localStorage.setItem(PRECO_KEY, input.value);
        onChange();
    });
}

function getPrecoGalv() {
    const input = document.getElementById('precoGalv');
    const valor = parseFloat(input.value);
    return isNaN(valor) ? 0 : Math.max(0, valor);
}

function initPrecoGalv(onChange) {
    const input = document.getElementById('precoGalv');
    const salvo = localStorage.getItem(GALV_KEY);
    input.value = salvo ? salvo : GALV_PADRAO;
    input.addEventListener('input', () => {
        localStorage.setItem(GALV_KEY, input.value);
        onChange();
    });
}

// Campo numérico com valor lembrado entre sessões (ex.: mão de obra)
function initCampoPersistente(id, key, padrao) {
    const input = document.getElementById(id);
    const salvo = localStorage.getItem(key);
    input.value = salvo ? salvo : padrao;
    input.addEventListener('input', () => localStorage.setItem(key, input.value));
}

function initTabs(onShow) {
    const botoes = document.querySelectorAll('.tab-btn');
    const views = document.querySelectorAll('.view');

    botoes.forEach(botao => {
        botao.addEventListener('click', () => {
            const alvo = botao.dataset.tab;

            botoes.forEach(b => b.classList.toggle('active', b === botao));
            views.forEach(v => v.classList.toggle('active', v.id === `view-${alvo}`));

            document.querySelectorAll('.painel').forEach(p => p.classList.remove('open'));

            if (onShow) onShow(alvo);
        });
    });
}

function initPainelToggle() {
    document.querySelectorAll('[data-painel-toggle]').forEach(botao => {
        botao.addEventListener('click', () => {
            const painel = document.getElementById(botao.dataset.painelToggle);
            painel.classList.toggle('open');
        });
    });
}

const ORCAMENTOS_KEY = 'cadSuporte.orcamentos';

function listarOrcamentos() {
    try {
        return JSON.parse(localStorage.getItem(ORCAMENTOS_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function salvarListaOrcamentos(lista) {
    localStorage.setItem(ORCAMENTOS_KEY, JSON.stringify(lista));
}

const TIPO_LABELS = {
    suporte: 'Suporte de Tela',
    grade: 'Grade de Poço',
    guincho: 'Guincho'
};

function getApp(tipo) {
    return {
        suporte: window.SuporteApp,
        grade: window.GradeApp,
        guincho: window.GuinchoApp
    }[tipo];
}

function salvarOrcamentoAtual(tipo) {
    const nomePadrao = TIPO_LABELS[tipo] || 'Orçamento';
    const nome = window.prompt('Nome para este orçamento:', nomePadrao);
    if (!nome) return;

    const app = getApp(tipo);
    const dados = app.coletarDados();

    const orcamento = {
        id: 'orc_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        tipo,
        nome,
        data: new Date().toLocaleString('pt-BR'),
        dados
    };

    const lista = listarOrcamentos();
    lista.unshift(orcamento);
    salvarListaOrcamentos(lista);
    renderHistorico();
    window.alert('Orçamento "' + nome + '" salvo no histórico.');
}

function excluirOrcamento(id) {
    if (!window.confirm('Excluir este orçamento salvo?')) return;
    salvarListaOrcamentos(listarOrcamentos().filter(o => o.id !== id));
    renderHistorico();
}

function carregarOrcamento(id) {
    const orcamento = listarOrcamentos().find(o => o.id === id);
    if (!orcamento) return;

    document.querySelector(`.tab-btn[data-tab="${orcamento.tipo}"]`).click();

    const app = getApp(orcamento.tipo);
    app.aplicarDados(orcamento.dados);
}

function renderHistorico() {
    const corpo = document.getElementById('tabela-historico-body');
    if (!corpo) return;

    const lista = listarOrcamentos();
    corpo.innerHTML = '';

    if (lista.length === 0) {
        corpo.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#7f8c8d;">Nenhum orçamento salvo ainda.</td></tr>';
        return;
    }

    lista.forEach(o => {
        const tipoLabel = TIPO_LABELS[o.tipo] || o.tipo;
        const tr = document.createElement('tr');

        const tdNome = document.createElement('td');
        tdNome.textContent = o.nome;
        const tdTipo = document.createElement('td');
        tdTipo.textContent = tipoLabel;
        const tdData = document.createElement('td');
        tdData.textContent = o.data;
        const tdMetros = document.createElement('td');
        tdMetros.textContent = o.dados.resumo.totalGeral;
        const tdCusto = document.createElement('td');
        tdCusto.textContent = o.dados.resumo.custo;
        const tdAcoes = document.createElement('td');

        const btnCarregar = document.createElement('button');
        btnCarregar.textContent = 'Carregar';
        btnCarregar.className = 'btn-acao btn-carregar';
        btnCarregar.addEventListener('click', () => carregarOrcamento(o.id));

        const btnExcluir = document.createElement('button');
        btnExcluir.textContent = 'Excluir';
        btnExcluir.className = 'btn-acao btn-excluir';
        btnExcluir.addEventListener('click', () => excluirOrcamento(o.id));

        tdAcoes.appendChild(btnCarregar);
        tdAcoes.appendChild(btnExcluir);

        tr.appendChild(tdNome);
        tr.appendChild(tdTipo);
        tr.appendChild(tdData);
        tr.appendChild(tdMetros);
        tr.appendChild(tdCusto);
        tr.appendChild(tdAcoes);
        corpo.appendChild(tr);
    });
}
