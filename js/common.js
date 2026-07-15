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
