/**
 * IconeLupa.jsx — Ícone de lupa (Search, da biblioteca Lucide).
 *
 * Continua como componente próprio porque é usado em vários lugares
 * (cabeçalho, Home, busca, campos de filtro). O SVG do Lucide herda a cor do
 * texto via "currentColor", e o tamanho vem do CSS de cada lugar.
 */

import { Search } from 'lucide-react';

export default function IconeLupa() {
  // Decorativo: o Lucide já marca o ícone com aria-hidden.
  return <Search strokeWidth={2} />;
}
