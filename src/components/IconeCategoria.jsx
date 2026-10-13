/**
 * IconeCategoria.jsx — Ícone de cada seção do site (biblioteca Lucide).
 *
 * Na v1 os ícones eram PNG azuis; na v3, SVGs desenhados à mão. Na v4 eles
 * vêm do Lucide (lucide-react): um conjunto único de ícones "outline", com a
 * mesma espessura de traço em todo o site. Cada ícone é um componente React
 * que desenha um <svg> com stroke="currentColor", então ele usa a cor do texto
 * de onde está — a cor da categoria (--cat-tinta) nos chips e cards — e tem o
 * mesmo contraste do texto nos dois temas.
 *
 * Só os ícones importados aqui entram no pacote final (tree-shaking).
 *
 * @param {{slug: string, tamanho?: number}} props - slug da seção, ex.: 'saude'
 */

import {
  Bus,
  Compass,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  LayoutGrid,
  ListChecks,
  ShieldCheck,
  ShoppingBag,
  Trees,
} from 'lucide-react';

const ICONES = {
  saude: HeartPulse, // Saúde: coração com batimento
  educacao: GraduationCap, // Educação: capelo de formatura
  seguranca: ShieldCheck, // Segurança: escudo
  lazer: Trees, // Lazer e cultura: árvores
  cidadania: Landmark, // Cidadania: prédio público com colunas
  mobilidade: Bus, // Transporte: ônibus
  passos: ListChecks, // Primeiros passos: lista com marcação
  bairro: House, // Meu bairro: casa
  'dia-a-dia': ShoppingBag, // Dia a dia: sacola de compras
  conheca: Compass, // Conheça Indaiatuba: bússola
  servicos: LayoutGrid, // Serviços públicos (agrupador): grade
};

export default function IconeCategoria({ slug, tamanho = 24 }) {
  const Icone = ICONES[slug];
  if (!Icone) return null;
  // Decorativo: o nome da seção sempre aparece em texto ao lado.
  // O Lucide já coloca aria-hidden="true" nos ícones.
  return <Icone className="icone-categoria" size={tamanho} strokeWidth={1.75} />;
}
