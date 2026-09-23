/**
 * IconeLupa.jsx — Ícone de lupa desenhado em SVG.
 *
 * Feito em SVG (e não em imagem) por três motivos: não gera requisição extra,
 * não perde qualidade ao ampliar e herda a cor do texto via "currentColor" —
 * assim o mesmo ícone se adapta ao cabeçalho, à Home e ao overlay de busca.
 */

export default function IconeLupa() {
  return (
    // viewBox define o sistema de coordenadas interno (24x24); o tamanho real
    // vem do CSS de cada lugar onde o ícone é usado.
    // aria-hidden + focusable: é decorativo, então leitores de tela o ignoram
    // e ele não entra na navegação por Tab.
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      {/* Corpo da lupa */}
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" />
      {/* Cabo, saindo na diagonal a partir da borda do círculo */}
      <line
        x1="15.5"
        y1="15.5"
        x2="21"
        y2="21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
