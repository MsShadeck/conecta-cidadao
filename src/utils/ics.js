/**
 * ics.js — Gera um arquivo de calendário (.ics) com os lembretes.
 *
 * O formato iCalendar (RFC 5545) é aceito pelo Google Agenda, Outlook e pelo
 * calendário do celular: basta abrir o arquivo baixado.
 *
 * Regras do formato usadas aqui:
 *  - linhas terminam com \r\n (CRLF);
 *  - vírgula, ponto e vírgula e barra invertida no texto levam "\" antes;
 *  - lembrete só com data vira evento de dia inteiro (VALUE=DATE);
 *  - com horário, vira evento de 1 hora no horário local do aparelho.
 */

/** Protege os caracteres especiais do formato. */
function escapar(texto) {
  return String(texto ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** '2026-10-12' → '20261012'; '09:30' → '093000'. */
const dataIcs = (iso) => iso.replace(/-/g, '');
const horaIcs = (hhmm) => `${hhmm.replace(':', '')}00`;

/** Soma 1 dia a uma data ISO (o fim de um evento de dia inteiro é o dia seguinte). */
function diaSeguinte(iso) {
  const data = new Date(`${iso}T12:00:00Z`);
  data.setUTCDate(data.getUTCDate() + 1);
  return data.toISOString().slice(0, 10);
}

/** Soma 1 hora a 'HH:MM' (até 23:59, sem virar o dia). */
function maisUmaHora(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${String(Math.min(h + 1, 23)).padStart(2, '0')}:${String(h + 1 > 23 ? 59 : m).padStart(2, '0')}`;
}

/**
 * @param {Array} lembretes - [{ id, texto, data?, hora?, local? }] (local = { nome, enderecoTexto })
 * @param {Date} agora - usado no carimbo DTSTAMP (parâmetro para facilitar o teste)
 * @returns {string} conteúdo do arquivo .ics (só com os lembretes que têm data)
 */
export function gerarIcs(lembretes, agora = new Date()) {
  const carimbo = agora
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
  const linhas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Conecta Cidadao Indaiatuba//Lembretes//PT-BR',
    'CALSCALE:GREGORIAN',
  ];
  for (const lembrete of lembretes.filter((l) => l.data)) {
    linhas.push('BEGIN:VEVENT', `UID:${lembrete.id}@conecta-cidadao`, `DTSTAMP:${carimbo}`);
    if (lembrete.hora) {
      linhas.push(
        `DTSTART:${dataIcs(lembrete.data)}T${horaIcs(lembrete.hora)}`,
        `DTEND:${dataIcs(lembrete.data)}T${horaIcs(maisUmaHora(lembrete.hora))}`
      );
    } else {
      linhas.push(
        `DTSTART;VALUE=DATE:${dataIcs(lembrete.data)}`,
        `DTEND;VALUE=DATE:${dataIcs(diaSeguinte(lembrete.data))}`
      );
    }
    linhas.push(`SUMMARY:${escapar(lembrete.texto)}`);
    if (lembrete.local) {
      linhas.push(
        `LOCATION:${escapar([lembrete.local.nome, lembrete.local.enderecoTexto].filter(Boolean).join(' - '))}`
      );
    }
    linhas.push('END:VEVENT');
  }
  linhas.push('END:VCALENDAR');
  return `${linhas.join('\r\n')}\r\n`;
}

/** Faz o navegador baixar o texto como arquivo (sem servidor). */
export function baixarArquivo(conteudo, nome, tipo = 'text/calendar;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
