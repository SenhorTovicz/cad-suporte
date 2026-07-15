const PRECO_KEY = 'cadSuporte.precoBarra6m';
const PRECO_PADRAO = 381.45;

function formatBRL(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

function salvarOrcamentoAtual(tipo) {
    const nomePadrao = tipo === 'suporte' ? 'Suporte de Tela' : 'Grade de Poço';
    const nome = window.prompt('Nome para este orçamento:', nomePadrao);
    if (!nome) return;

    const app = tipo === 'suporte' ? window.SuporteApp : window.GradeApp;
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

    const app = orcamento.tipo === 'suporte' ? window.SuporteApp : window.GradeApp;
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
        const tipoLabel = o.tipo === 'suporte' ? 'Suporte de Tela' : 'Grade de Poço';
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
