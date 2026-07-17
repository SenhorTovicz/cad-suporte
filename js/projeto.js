// Gera o projeto técnico (prancha A4 paisagem, estilo ABNT) do guincho de coluna,
// com as medidas atuais da tabela. Desenha as peças cotadas, a vista do conjunto
// montado (sem a laje), lista de material com peso e o carimbo (legenda).
function exportarProjetoGuincho() {
    // ---- Medidas em mm, lidas dos inputs atuais ----
    const bit = Math.round(lerNumInput('bitolaTorre'));            // tubo do mastro (50)
    const ladoLuva = bit + 10;                                     // luva (60)
    const espLaje = Math.round(lerNumInput('espLaje') * 1000);     // 200
    const Lv = Math.round(lerNumInput('alturaTorre') * 1000 + espLaje + bit); // mastro vertical
    const Lpe = Math.round(lerNumInput('compPeL') * 1000);         // pé do L
    const hLuva = Math.round(lerNumInput('alturaMF') * 1000);      // altura da luva
    const Ldiag = Math.round(lerNumInput('compDiagG') * 1000);     // diagonal
    const base = Math.round(Math.sqrt(Math.max(Ldiag * Ldiag - hLuva * hLuva, 1)));
    const ang = Math.round(Math.atan2(hLuva, base) * 180 / Math.PI);
    const rosca = Math.round(lerNumInput('compRosca') * 1000);
    const s = 0.1; // escala 1:10

    // Pesos (aço 7,85 g/cm³; tubos c/ parede 3 mm)
    const kgm = (b) => (b * b - (b - 6) * (b - 6)) * 0.00785;
    const m50 = (Lv + Lpe + 3 * base + 3 * Ldiag) / 1000;
    const m60 = hLuva / 1000;
    const p50 = m50 * kgm(bit);
    const p60 = m60 * kgm(ladoLuva);
    const ptot = p50 + p60 + 1.2; // + chapa 250x100x6

    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const r1 = (v) => Math.round(v * 100) / 100;

    const svg = [];
    const ln = (x1, y1, x2, y2, w, dash) =>
        svg.push(`<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="#000" stroke-width="${w || 0.35}"${dash ? ' stroke-dasharray="1.2,1"' : ''}/>`);
    const rc = (x, y, w, h, sw) =>
        svg.push(`<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="none" stroke="#000" stroke-width="${sw || 0.35}"/>`);
    const ci = (x, y, r, sw) =>
        svg.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="none" stroke="#000" stroke-width="${sw || 0.25}"/>`);
    const tx = (x, y, t, size, anchor, bold, rot) =>
        svg.push(`<text x="${r1(x)}" y="${r1(y)}" font-size="${size || 2.8}" text-anchor="${anchor || 'middle'}" font-family="Arial, Helvetica, sans-serif"${bold ? ' font-weight="bold"' : ''}${rot ? ` transform="rotate(${rot} ${r1(x)} ${r1(y)})"` : ''}>${t}</text>`);
    const dimLine = (x1, y1, x2, y2) =>
        svg.push(`<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="#000" stroke-width="0.16" marker-start="url(#seta)" marker-end="url(#seta)"/>`);
    // Cota horizontal: linha em y, com extensões saindo de ey
    function dimH(x1, x2, y, label, ey) {
        const d = y >= ey ? 1 : -1;
        ln(x1, ey, x1, y + 1.2 * d, 0.16);
        ln(x2, ey, x2, y + 1.2 * d, 0.16);
        dimLine(x1, y, x2, y);
        tx((x1 + x2) / 2, y - 1, label, 2.6);
    }
    // Cota vertical: linha em x, com extensões saindo de ex
    function dimV(y1, y2, x, label, ex) {
        const d = x >= ex ? 1 : -1;
        ln(ex, y1, x + 1.2 * d, y1, 0.16);
        ln(ex, y2, x + 1.2 * d, y2, 0.16);
        dimLine(x, y1, x, y2);
        tx(x - 1, (y1 + y2) / 2, label, 2.6, 'middle', false, -90);
    }
    // Balão de identificação (número no círculo + linha de chamada)
    function balao(px, py, bx, by, n) {
        ln(px, py, bx, by, 0.16);
        ci(bx, by, 2.2, 0.3);
        tx(bx, by + 0.95, n, 2.7, 'middle', true);
    }
    // Campo de texto EDITÁVEL na folha (clicável na janela do projeto)
    function edit(x, y, w, h, html, size, bold, align, multi) {
        const just = align === 'center' ? 'center' : 'flex-start';
        const style = multi
            ? `font:${bold ? '700' : '400'} ${size}px Arial,sans-serif;line-height:1.62;`
            : `font:${bold ? '700' : '400'} ${size}px Arial,sans-serif;display:flex;align-items:center;justify-content:${just};${align === 'center' ? 'text-align:center;' : ''}`;
        svg.push(`<foreignObject x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}"><div xmlns="http://www.w3.org/1999/xhtml" contenteditable="true" class="ed" style="width:100%;height:100%;overflow:hidden;${style}">${html}</div></foreignObject>`);
    }

    // ================= FOLHA =================
    rc(4, 4, 289, 202, 0.7);      // margem externa
    rc(7, 7, 283, 196, 0.35);     // quadro interno

    // ================= PEÇA 1 — MASTRO EM L =================
    const v1x = 22, v1y = 16, v1h = Lv * s, v1w = bit * s;
    rc(v1x, v1y, v1w, v1h);
    rc(v1x + v1w, v1y + v1h - v1w, Lpe * s, v1w);                 // pé do L
    for (let y = v1y + v1h - 7; y > v1y + 6; y -= 10) ci(v1x + v1w / 2, y, 0.6); // furos c/ 100
    dimV(v1y, v1y + v1h, 15, Lv, v1x);
    dimH(v1x + v1w, v1x + v1w + Lpe * s, v1y + v1h + 6, Lpe, v1y + v1h);
    tx(v1x + v1w / 2, v1y - 2, bit, 2.4);
    ln(v1x + v1w / 2, v1y + 46, v1x + 12, v1y + 42, 0.16);
    tx(v1x + 13, v1y + 41.5, `Furos Ø12 c/ 100 (2 lados)`, 2.3, 'start');
    tx(v1x + 27, v1y + v1h + 13, 'PEÇA 1 — MASTRO EM L (1x)', 2.8, 'middle', true);
    tx(v1x + 27, v1y + v1h + 16.5, `Tubo ${bit}×${bit}×3 mm`, 2.5);

    // PEÇA 7 — PINO (abaixo do mastro)
    rc(28, 137, 1.6, 3.2, 0.3);
    rc(29.6, 137.8, 15, 1.6, 0.3);
    tx(38, 146, 'PEÇA 7 — PINO Ø12×150 (1x)', 2.6, 'middle', true);

    // ================= PEÇA 2 — LUVA =================
    const v2x = 95, v2y = 16, v2w = ladoLuva * s, v2h = hLuva * s;
    rc(v2x, v2y, v2w, v2h);
    ci(v2x + v2w / 2, v2y + v2h - 7, 0.6);
    ci(v2x + v2w / 2, v2y + 6, 0.6);
    rc(v2x - 3, v2y + v2h * 0.42, v2w + 6, 1.4, 0.25);            // pino atravessado
    tx(v2x - 4.5, v2y + v2h * 0.45 + 0.8, 'pino', 2.2, 'end');
    dimV(v2y, v2y + v2h, v2x + v2w + 11, hLuva, v2x + v2w);
    tx(v2x + v2w / 2, v2y - 2, ladoLuva, 2.4);
    tx(v2x + v2w / 2 + 2, v2y + v2h + 7, 'PEÇA 2 — LUVA (1x)', 2.8, 'middle', true);
    tx(v2x + v2w / 2 + 2, v2y + v2h + 10.5, `Tubo ${ladoLuva}×${ladoLuva}×3 mm`, 2.5);

    // ================= PEÇA 3 — DIAGONAL =================
    const v3x = 118, v3y = 46, dl = Ldiag * s;
    svg.push(`<g transform="translate(${v3x},${v3y}) rotate(${-ang})">`);
    rc(0, -bit * s / 2, dl, bit * s);
    dimH(0, dl, -8, Ldiag, -bit * s / 2);
    svg.push('</g>');
    ln(v3x, v3y, v3x + 15, v3y, 0.16, true);                      // referência horizontal
    const arc1 = { x1: v3x + 9, y1: v3y, x2: v3x + 9 * Math.cos(ang * Math.PI / 180), y2: v3y - 9 * Math.sin(ang * Math.PI / 180) };
    svg.push(`<path d="M${r1(arc1.x1)},${r1(arc1.y1)} A9,9 0 0 0 ${r1(arc1.x2)},${r1(arc1.y2)}" fill="none" stroke="#000" stroke-width="0.16"/>`);
    tx(v3x + 13.5, v3y - 3, `${ang}°`, 2.6, 'start');
    tx(142, 58, 'PEÇA 3 — DIAGONAL M. FRANCESA (3x)', 2.8, 'middle', true);
    tx(142, 61.5, `Tubo ${bit}×${bit}×3 mm • cortes ${ang}°/${90 - ang}°`, 2.5);

    // ================= PEÇA 4 — BASE =================
    rc(118, 68, base * s, bit * s);
    dimH(118, 118 + base * s, 79, base, 73);
    tx(118 + base * s / 2, 85.5, 'PEÇA 4 — BASE M. FRANCESA (3x)', 2.8, 'middle', true);
    tx(118 + base * s / 2, 89, `Tubo ${bit}×${bit}×3 mm`, 2.5);

    // ================= PEÇA 5 — CHAPA DO MOTOR =================
    rc(118, 94, 25, 10);
    ci(125.5, 99, 0.5); ci(135.5, 99, 0.5);
    dimH(125.5, 135.5, 91, 100, 99);
    dimH(118, 143, 110, 250, 104);
    tx(130.5, 116, 'PEÇA 5 — CHAPA MOTOR (1x)', 2.8, 'middle', true);
    tx(130.5, 119.5, '250×100×6 mm • 2 furos Ø10', 2.5);

    // ================= PEÇA 6 — BARRA ROSCADA =================
    ci(180, 95.5, 1.4, 0.35);
    rc(179.3, 97, 1.4, rosca * s);
    rc(174.5, 97 + rosca * s, 11, 3);
    dimV(97, 97 + rosca * s, 188.5, rosca, 180.7);
    tx(180, 116, 'PEÇA 6 — B. ROSCADA (3x)', 2.8, 'middle', true);
    tx(180, 119.5, 'c/ base de borracha', 2.5);

    // ================= PLANTA — ABERTURA DAS MÃOS FRANCESAS (esc. 1:20) =================
    const pcx = 208, pcy = 38, pr = base * 0.05; // 1:20
    for (const a of [180, 115, 245]) {
        svg.push(`<g transform="translate(${pcx},${pcy}) rotate(${a})">`);
        rc(0, -1.25, pr, 2.5, 0.3);
        svg.push('</g>');
    }
    rc(pcx - 1.5, pcy - 1.5, 3, 3, 0.4);                          // luva/mastro (centro)
    for (const [a1, a2, am] of [[115, 180, 147.5], [180, 245, 212.5]]) {
        const p = (a, r) => [pcx + r * Math.cos(a * Math.PI / 180), pcy + r * Math.sin(a * Math.PI / 180)];
        const [ax, ay] = p(a1, 8), [bx2, by2] = p(a2, 8), [mx2, my2] = p(am, 11.5);
        svg.push(`<path d="M${r1(ax)},${r1(ay)} A8,8 0 0 1 ${r1(bx2)},${r1(by2)}" fill="none" stroke="#000" stroke-width="0.16"/>`);
        tx(mx2, my2 + 0.9, '65°', 2.4);
    }
    dimLine(pcx + 6, pcy, pcx + 14, pcy);
    tx(pcx + 18.5, pcy + 0.8, 'vão', 2.3, 'start');
    tx(pcx, 62, 'PLANTA — 3 MÃOS FRANCESAS (esc. 1:20)', 2.7, 'middle', true);
    tx(pcx, 67.5, '1=Mastro L  2=Luva  3=Diagonal', 2.5);
    tx(pcx, 71, '4=Base  5=Chapa motor  6=B. roscada', 2.5);

    // ================= CONJUNTO — VISTA LATERAL =================
    const xM = 257.5;                    // centro do mastro
    const Y = (v) => 108 - v * s;        // y_real (mm) -> papel
    tx(250, 22, 'CONJUNTO — VISTA LATERAL (esc. 1:10)', 2.9, 'middle', true);
    const topo = Lv - espLaje - bit;     // altura acima do nível da laje
    rc(xM - v1w / 2, Y(topo), v1w, Lv * s);                                  // mastro
    rc(xM - v2w / 2, Y(hLuva), v2w, hLuva * s);                              // luva
    rc(xM - base * s, Y(bit), base * s, bit * s);                            // base
    svg.push(`<g transform="translate(${r1(xM - base * s + 1)},${r1(Y(bit / 2))}) rotate(${-ang})">`); // diagonal (contorno)
    rc(0, -bit * s / 2, Ldiag * s, bit * s);
    svg.push('</g>');
    rc(xM - Lpe * s, Y(-espLaje), Lpe * s, bit * s);                         // pé sob a laje
    // barra roscada + borracha na ponta da base
    const xR = xM - base * s - 1.2;
    rc(xR - 2, Y(30), 4, 3, 0.3);
    rc(xR - 0.7, Y(30) - rosca * s, 1.4, rosca * s, 0.3);
    ci(xR, Y(30) - rosca * s - 1.2, 1.3, 0.35);
    // chapa + motor (visto de topo do eixo: círculo) + cabo + gancho
    rc(xM + 3.5, Y(hLuva) - 5, 1.4, 10);
    ci(xM + 14, Y(hLuva), 5, 0.4);
    ln(xM + 14, Y(hLuva) + 5, xM + 14, 124, 0.3);
    svg.push(`<path d="M${r1(xM + 12)},126 A2,2 0 1 0 ${r1(xM + 16)},126" fill="none" stroke="#000" stroke-width="0.4"/>`);
    // cotas do conjunto
    dimV(Y(topo), Y(-espLaje - bit), 286, Lv, xM + v1w / 2);
    dimH(xM - base * s, xM, 139, base, Y(0));
    // ângulo da diagonal
    ln(xM - base * s + 2, Y(bit), xM - base * s + 14, Y(bit), 0.16, true);
    svg.push(`<path d="M${r1(xM - base * s + 10)},${r1(Y(bit))} A8,8 0 0 0 ${r1(xM - base * s + 2 + 8 * Math.cos(ang * Math.PI / 180))},${r1(Y(bit) - 8 * Math.sin(ang * Math.PI / 180))}" fill="none" stroke="#000" stroke-width="0.16"/>`);
    tx(xM - base * s + 18, Y(bit) - 2, `${ang}°`, 2.5, 'start');
    // balões
    balao(xM + 0.5, Y(topo) + 12, xM + 9, Y(topo) + 6, '1');
    balao(xM - v2w / 2, Y(hLuva) + 6, xM - 12, Y(hLuva) - 2, '2');
    balao((xM - base * s + xM) / 2 - 1.5, (Y(bit / 2) + Y(hLuva)) / 2 + 1, xM - base * s / 2 - 11, (Y(bit / 2) + Y(hLuva)) / 2 - 8, '3');
    balao(xM - base * s * 0.6, Y(0) + 2.5, xM - base * s * 0.6 - 6, Y(0) + 11, '4');
    balao(xM + 4.2, Y(hLuva) - 4, xM + 20, Y(hLuva) - 11, '5');
    balao(xR - 1, Y(30) - 4, xR - 7.5, Y(30) - 10, '6');
    tx(250, 146, `Vão p/ laje: ${espLaje} mm • folga frontal: 50 mm`, 2.4);

    // ============ PARTE DE BAIXO (toda EDITÁVEL na janela do projeto) ============

    // ================= OBS =================
    rc(7, 160, 90, 43);
    tx(10, 166, 'Obs:', 3.2, 'start', true);
    edit(9.5, 168, 85.5, 34,
        'Seguir NR-18 (Ind. da Construção) e NR-11 (movimentação de cargas) na montagem e uso.<br/>' +
        'Soldar todo o perímetro das juntas.<br/>' +
        'Galvanização a fogo após solda e furação.<br/>' +
        '3 mãos francesas iguais: 1 central + 2 laterais a 65°.<br/>' +
        'Regulagem de altura: pino Ø12 nos furos da luva.', 2.5, false, 'left', true);

    // ================= LISTA DE MATERIAL =================
    rc(97, 160, 70, 43);
    tx(100, 166, 'Lista de material:', 3.2, 'start', true);
    edit(99.5, 168, 65.5, 34,
        `Tubo ${bit}×${bit}×3 mm — ${m50.toFixed(2)} m (${p50.toFixed(1)} kg)<br/>` +
        `Tubo ${ladoLuva}×${ladoLuva}×3 mm — ${m60.toFixed(2)} m (${p60.toFixed(1)} kg)<br/>` +
        'Chapa aço 250×100×6 mm — 1 pç<br/>' +
        'Barra roscada c/ borracha — 3 pç<br/>' +
        'Pino Ø12 — 1 pç • Parafusos M10 — 2 pç<br/>' +
        'Motor guincho + fonte/bateria — 1 cj<br/>' +
        `<b>Peso do aço ≈ ${ptot.toFixed(1)} kg (p/ galvanização)</b>`, 2.4, false, 'left', true);

    // ================= TABELA (nomes/escala) =================
    rc(167, 160, 45, 43);
    ln(167, 166, 212, 166, 0.25); ln(167, 172, 212, 172, 0.25); ln(167, 178, 212, 178, 0.25); ln(167, 184, 212, 184, 0.25);
    ln(185, 160, 185, 184, 0.25); ln(199, 160, 199, 184, 0.25);
    tx(192, 164.4, 'Nome', 2.4); tx(205.5, 164.4, 'Data', 2.4);
    tx(169, 170.4, 'Desenho', 2.4, 'start');
    tx(169, 176.4, 'Checado', 2.4, 'start');
    tx(169, 182.4, 'Aprovado', 2.4, 'start');
    edit(185.5, 166.3, 13, 5.4, 'Lenon', 2.4, false, 'center');
    edit(199.5, 166.3, 12, 5.4, hoje, 2.2, false, 'center');
    edit(185.5, 172.3, 13, 5.4, '', 2.4, false, 'center');
    edit(199.5, 172.3, 12, 5.4, '', 2.2, false, 'center');
    edit(185.5, 178.3, 13, 5.4, '', 2.4, false, 'center');
    edit(199.5, 178.3, 12, 5.4, '', 2.2, false, 'center');
    ln(167, 190.5, 212, 190.5, 0.25); ln(167, 196.5, 212, 196.5, 0.25);
    edit(168.5, 184.5, 42, 5.6, 'Escala: 1:10', 2.5);
    edit(168.5, 190.8, 42, 5.4, 'Unidade: mm', 2.5);
    edit(168.5, 196.8, 42, 5.8, 'Ângulo: graus', 2.5);

    // ================= CARIMBO =================
    rc(212, 160, 78, 43);
    ln(212, 170, 290, 170, 0.35);
    ln(212, 178, 290, 178, 0.35);
    ln(212, 185, 290, 185, 0.35);
    ln(212, 190, 290, 190, 0.35);
    ln(212, 196, 290, 196, 0.35);
    ln(254, 196, 254, 203, 0.35);
    edit(213, 160.6, 76, 9, 'GVTECK', 6, true, 'center');
    edit(213.5, 170.4, 76, 7.2, 'Obra: Guincho de coluna p/ içamento', 3.1, true);
    edit(213.5, 178.3, 76, 6.4, 'Desenho: Guincho — fixação na laje', 2.8, true);
    edit(213.5, 185.2, 76, 4.6, 'Endereço obra:', 2.3);
    edit(213.5, 190.3, 76, 5.4, 'Engenheiro: ______________  CREA: ______', 2.5);
    edit(213.5, 196.4, 39.5, 6.2, 'CNO:', 2.5);
    edit(255, 196.4, 34, 6.2, 'Prancha: 1/1', 2.7, true, 'center');

    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 297 210" width="297mm" height="210mm">
<defs><marker id="seta" viewBox="0 0 6 6" refX="5.5" refY="3" markerWidth="3.4" markerHeight="3.4" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M0,0.7 L5.5,3 L0,5.3 Z"/></marker></defs>
<rect x="0" y="0" width="297" height="210" fill="#fff"/>${svg.join('\n')}</svg>`;

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Projeto Técnico — Guincho de Coluna</title>
<style>@page{size:A4 landscape;margin:0}body{margin:0;background:#7f8c8d}
.folha{width:297mm;height:210mm;background:#fff;margin:0 auto;box-shadow:0 2px 14px rgba(0,0,0,.45)}
.folha svg{display:block}
.no-print{position:fixed;top:12px;right:14px;padding:11px 18px;background:#27ae60;color:#fff;border:none;border-radius:6px;font:600 14px Arial;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.35)}
.dica{position:fixed;top:12px;left:14px;padding:9px 14px;background:#2c3e50;color:#fff;border-radius:6px;font:600 12px Arial;box-shadow:0 2px 8px rgba(0,0,0,.35)}
.ed{outline:none;cursor:text}
.ed:hover{background:rgba(41,128,185,.12)}
.ed:focus{background:rgba(241,196,15,.18)}
@media print{body{background:#fff}.folha{box-shadow:none}.no-print,.dica{display:none}.ed:hover,.ed:focus{background:none}}</style></head>
<body><button class="no-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
<div class="dica no-print">✏️ A parte de baixo é editável: clique no texto e digite</div>
<div class="folha">${svgStr}</div></body></html>`;

    const win = window.open('', '_blank');
    if (!win) { window.alert('O navegador bloqueou a janela do projeto. Permita pop-ups para este site.'); return; }
    win.document.write(html);
    win.document.close();
}
