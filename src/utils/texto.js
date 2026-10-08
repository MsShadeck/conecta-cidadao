/**
 * texto.js — Funções de texto usadas pela busca e pelos filtros.
 */

/**
 * Remove acentos e caixa para a busca não depender de digitação exata.
 * Assim "saude", "SAÚDE" e "Saúde" viram todos "saude".
 *
 * normalize('NFD') separa a letra do acento (ç → c + ̧ ) e o replace apaga
 * os sinais soltos usando o intervalo Unicode dos acentos combinantes.
 * O "?? ''" protege contra campos vazios (null/undefined) vindos dos dados.
 */
export function normalizar(texto) {
  return (texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); // tira espaços sobrando nas pontas
}

/**
 * Transforma um nome em identificador para URL: "UBS Jd. Califórnia" → "ubs-jd-california".
 */
export function criarSlug(texto) {
  // NFKD também desfaz símbolos de compatibilidade: "1º" vira "1o".
  return normalizar((texto ?? '').normalize('NFKD'))
    .replace(/[^a-z0-9]+/g, '-') // tudo que não é letra/número vira hífen
    .replace(/^-+|-+$/g, ''); // tira hífens das pontas
}

/** Escolhe singular ou plural: plural(1, 'local', 'locais') → '1 local'. */
export function plural(quantidade, singular, pluralTexto) {
  return `${quantidade} ${quantidade === 1 ? singular : pluralTexto}`;
}
