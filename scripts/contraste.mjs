/**
 * contraste.mjs — Confere o contraste das cores do site (WCAG 2.1).
 *
 * Rode com `node scripts/contraste.mjs`. Texto normal precisa de 4,5:1 e
 * texto grande (≥ 24px ou ≥ 18,66px em negrito) de 3:1 (nível AA).
 */

/** "#1a6faf" → luminância relativa (fórmula da WCAG). */
function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const canal = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

export function contraste(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Pares [texto, fundo, descrição] usados no site. */
const PARES = {
  claro: [
    ['#1a1a2e', '#c9e8f5', 'tinta sobre fundo da página'],
    ['#3a3a5c', '#c9e8f5', 'tinta-media sobre fundo'],
    ['#3a3a5c', '#ffffff', 'tinta-media sobre branco'],
    ['#5b6585', '#ffffff', 'tinta-fraca (nova) sobre branco'],
    ['#5b6585', '#eaf6fb', 'tinta-fraca (nova) sobre névoa'],
    ['#7c86a3', '#ffffff', 'tinta-fraca (antiga) sobre branco'],
    ['#1a6faf', '#ffffff', 'azul da marca (links) sobre branco'],
    ['#1a6faf', '#eaf6fb', 'azul da marca sobre névoa'],
    ['#ffffff', '#1a6faf', 'texto branco no botão azul'],
    ['#1a6f3a', '#d4edda', 'saúde'],
    ['#a0460a', '#fde8d8', 'segurança'],
    ['#1a4faf', '#d8eafd', 'educação'],
    ['#6a1aaf', '#e8d8fd', 'lazer'],
    ['#0b6158', '#d3f0ec', 'cidadania'],
    ['#855400', '#fdefc8', 'mobilidade'],
    ['#0b5a8a', '#dceffa', 'primeiros passos'],
    ['#9c1f55', '#fbe0ea', 'meu bairro'],
    ['#49650f', '#e7f1d3', 'dia a dia'],
    ['#3b3bb0', '#e3e3fb', 'conheça'],
    ['#2c5470', '#e2ecf3', 'serviços públicos'],
    ['#0b5a8a', '#ffffff', 'ícone passos sobre branco'],
    ['#49650f', '#ffffff', 'ícone dia a dia sobre branco'],
    ['#145a2e', '#d4edda', 'selo aberto'],
    ['#9b2617', '#fde2df', 'selo fechado'],
    ['#6e4600', '#fdefc8', 'selo feriado'],
    ['#a0460a', '#ffffff', 'mensagem de erro sobre branco'],
    ['#8c1d18', '#ffffff', 'título de emergência'],
  ],
  escuro: [
    ['#e6edf3', '#0e1621', 'tinta sobre fundo'],
    ['#b6c3d1', '#17212d', 'tinta-media sobre superfície'],
    ['#93a3b5', '#17212d', 'tinta-fraca sobre superfície'],
    ['#8cc8f2', '#17212d', 'azul (links) sobre superfície'],
    ['#8cc8f2', '#1d2a38', 'azul sobre névoa'],
    ['#0b1622', '#8cc8f2', 'texto escuro no botão azul'],
    ['#8fdca8', '#173323', 'saúde'],
    ['#f6b48a', '#3a2417', 'segurança'],
    ['#9cc2fb', '#172a45', 'educação'],
    ['#d1b3fb', '#2c1d45', 'lazer'],
    ['#86ddd2', '#123430', 'cidadania'],
    ['#f2c96b', '#3a2c10', 'mobilidade'],
    ['#8ccaf5', '#13283a', 'primeiros passos'],
    ['#f5a8c6', '#3a1626', 'meu bairro'],
    ['#bfe08a', '#22301a', 'dia a dia'],
    ['#b9b9ff', '#1f1f45', 'conheça'],
    ['#a9c8de', '#1a2836', 'serviços públicos'],
    ['#8fdca8', '#17212d', 'ícone saúde sobre superfície escura'],
    ['#f6b48a', '#17212d', 'ícone segurança sobre superfície escura'],
  ],
};

let falhas = 0;
for (const [tema, pares] of Object.entries(PARES)) {
  console.log(`\nTema ${tema}`);
  for (const [texto, fundo, nome] of pares) {
    const valor = contraste(texto, fundo);
    const ok = valor >= 4.5;
    if (!ok && !nome.includes('antiga')) falhas += 1;
    console.log(`${ok ? 'OK   ' : 'FALHA'} ${valor.toFixed(2)}:1  ${nome}`);
  }
}
console.log(
  falhas ? `\n${falhas} par(es) abaixo de 4,5:1` : '\nTodos os pares passam no AA (4,5:1).'
);
process.exitCode = falhas ? 1 : 0;
