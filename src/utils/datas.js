/**
 * datas.js — Formatação de datas no padrão brasileiro.
 */

/** '2026-10-08' (ou '2026-10-08T12:00:00Z') → '08/10/2026'. Devolve '' se vier vazio. */
export function formatarData(iso) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}
