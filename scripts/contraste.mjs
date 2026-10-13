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
    ['#101828', '#f6f7f9', 'tinta sobre fundo da página'],
    ['#475467', '#f6f7f9', 'tinta-media sobre fundo'],
    ['#475467', '#ffffff', 'tinta-media sobre branco'],
    ['#5d6b82', '#ffffff', 'tinta-fraca sobre branco'],
    ['#5d6b82', '#f6f7f9', 'tinta-fraca sobre fundo'],
    ['#5d6b82', '#f0f3f7', 'tinta-fraca sobre névoa'],
    ['#1a6faf', '#ffffff', 'azul da marca (links) sobre branco'],
    ['#1a6faf', '#f0f3f7', 'azul da marca sobre névoa'],
    ['#ffffff', '#1a6faf', 'texto branco no botão azul'],
    ['#ffffff', '#145a8f', 'texto branco no botão azul (hover)'],
    ['#5b4bc9', '#ffffff', 'fim do degradê do título'],
    ['#f6f7f9', '#101828', 'texto do aviso (toast)'],
    ['#1a6f3a', '#dcf2e3', 'saúde'],
    ['#a0460a', '#fdeadd', 'segurança'],
    ['#1a4faf', '#e0edfd', 'educação'],
    ['#6a1aaf', '#eee3fd', 'lazer'],
    ['#0b6158', '#d9f2ee', 'cidadania'],
    ['#855400', '#fdf0cf', 'mobilidade'],
    ['#0b5a8a', '#e1f0fa', 'primeiros passos'],
    ['#9c1f55', '#fbe5ee', 'meu bairro'],
    ['#49650f', '#ebf3da', 'dia a dia'],
    ['#3b3bb0', '#e8e8fc', 'conheça'],
    ['#2c5470', '#e5edf3', 'serviços públicos'],
    ['#0b5a8a', '#ffffff', 'ícone passos sobre branco'],
    ['#49650f', '#ffffff', 'ícone dia a dia sobre branco'],
    ['#145a2e', '#e3f6e9', 'selo aberto'],
    ['#9b2617', '#fdecea', 'selo fechado'],
    ['#6e4600', '#fdf3d7', 'selo feriado'],
    ['#6e4600', '#fef6e0', 'aviso de atenção (clima, planejador)'],
    ['#a0460a', '#ffffff', 'mensagem de erro sobre branco'],
    ['#8c1d18', '#fef3f2', 'título de emergência'],
  ],
  escuro: [
    ['#e8ecf1', '#0b0e13', 'tinta sobre fundo'],
    ['#aeb8c6', '#13171e', 'tinta-media sobre superfície'],
    ['#8f9aab', '#13171e', 'tinta-fraca sobre superfície'],
    ['#8f9aab', '#1b212b', 'tinta-fraca sobre névoa'],
    ['#7fbaf0', '#13171e', 'azul (links) sobre superfície'],
    ['#7fbaf0', '#1b212b', 'azul sobre névoa'],
    ['#08111c', '#7fbaf0', 'texto escuro no botão azul'],
    ['#b9adff', '#0b0e13', 'fim do degradê do título'],
    ['#0b0e13', '#e8ecf1', 'texto do aviso (toast)'],
    ['#8fdca8', '#15301f', 'saúde'],
    ['#f6b48a', '#362215', 'segurança'],
    ['#9cc2fb', '#16273f', 'educação'],
    ['#d1b3fb', '#291c40', 'lazer'],
    ['#86ddd2', '#11302c', 'cidadania'],
    ['#f2c96b', '#35290f', 'mobilidade'],
    ['#8ccaf5', '#122536', 'primeiros passos'],
    ['#f5a8c6', '#361524', 'meu bairro'],
    ['#bfe08a', '#1f2c18', 'dia a dia'],
    ['#b9b9ff', '#1d1d40', 'conheça'],
    ['#a9c8de', '#182532', 'serviços públicos'],
    ['#8fdca8', '#13171e', 'ícone saúde sobre superfície escura'],
    ['#f6aea8', '#3a1a17', 'selo fechado'],
    ['#f2c96b', '#33270f', 'aviso de atenção'],
    ['#f6aea8', '#2d1715', 'título de emergência'],
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
