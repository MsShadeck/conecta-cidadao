/**
 * IconeCategoria.jsx — Ícone de cada seção do site, desenhado em SVG.
 *
 * Na v1 os ícones eram PNG azuis: no tema escuro eles quase sumiam (azul sobre
 * fundo escuro). Em SVG com stroke="currentColor", o ícone usa a cor do texto
 * de onde está — a cor da categoria (--cat-tinta) nos chips e cards —, então
 * tem o mesmo contraste do texto nos dois temas.
 *
 * Os desenhos são linhas simples de 24x24, no estilo dos ícones "outline".
 *
 * @param {{slug: string, tamanho?: number}} props - slug da seção, ex.: 'saude'
 */

const DESENHOS = {
  // Saúde: cruz dentro de um coração
  saude: (
    <>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
      <path d="M12 9v5M9.5 11.5h5" />
    </>
  ),
  // Educação: capelo de formatura
  educacao: (
    <>
      <path d="m3 9 9-4 9 4-9 4-9-4Z" />
      <path d="M7 11v4c0 1.5 2.2 3 5 3s5-1.5 5-3v-4M21 9v5" />
    </>
  ),
  // Segurança: escudo
  seguranca: (
    <>
      <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  // Lazer e cultura: árvore
  lazer: (
    <>
      <path d="M12 3a5 5 0 0 0-4.6 7A4 4 0 0 0 8 18h8a4 4 0 0 0 .6-8A5 5 0 0 0 12 3Z" />
      <path d="M12 12v9" />
    </>
  ),
  // Cidadania: prédio público com colunas
  cidadania: (
    <>
      <path d="m3 9 9-5 9 5H3ZM5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 20h18" />
    </>
  ),
  // Transporte: ônibus de frente
  mobilidade: (
    <>
      <rect x="5" y="3" width="14" height="15" rx="3" />
      <path d="M5 11h14M8 21v-3M16 21v-3" />
      <circle cx="8.5" cy="14.5" r="0.6" />
      <circle cx="15.5" cy="14.5" r="0.6" />
    </>
  ),
  // Primeiros passos: lista com marcação
  passos: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="m8 9 1.5 1.5L12 8M8 15l1.5 1.5L12 14M14 9.5h3M14 15.5h3" />
    </>
  ),
  // Meu bairro: casa com alfinete
  bairro: (
    <>
      <path d="M4 11 12 4l8 7v9H4v-9Z" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  // Dia a dia: sacola de compras
  'dia-a-dia': (
    <>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  // Conheça Indaiatuba: bússola
  conheca: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  // Serviços públicos (agrupador): grade de quatro quadrados
  servicos: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
};

export default function IconeCategoria({ slug, tamanho = 24 }) {
  const desenho = DESENHOS[slug];
  if (!desenho) return null;
  return (
    // Decorativo: o nome da seção sempre aparece em texto ao lado.
    <svg
      className="icone-categoria"
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {desenho}
    </svg>
  );
}
