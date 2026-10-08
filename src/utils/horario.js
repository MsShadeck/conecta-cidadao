/**
 * horario.js — "Aberto agora / Fechado" calculado no fuso de Indaiatuba.
 *
 * Os horários vêm de public/api/locais.json no formato:
 *   horarios: { faixas: [{ dias: ['seg', ...], abre: '07:00', fecha: '17:00' }],
 *               feriados: 'aberto' | 'fechado' | null, vinteQuatroHoras: bool }
 * ou horarios: null quando a fonte não informa os dias (aí não há selo).
 */

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const NOMES_DIA = {
  dom: 'domingo',
  seg: 'segunda',
  ter: 'terça',
  qua: 'quarta',
  qui: 'quinta',
  sex: 'sexta',
  sab: 'sábado',
};

/**
 * Data e hora de agora em America/Sao_Paulo, independente do fuso do aparelho.
 * Intl.DateTimeFormat com timeZone converte o horário; formatToParts separa as partes.
 */
export function agoraEmIndaiatuba(data = new Date()) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
      hourCycle: 'h23',
    })
      .formatToParts(data)
      .map((p) => [p.type, p.value])
  );
  const semana = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[partes.weekday];
  return {
    iso: `${partes.year}-${partes.month}-${partes.day}`,
    dia: DIAS[semana],
    minutos: Number(partes.hour) * 60 + Number(partes.minute),
  };
}

const paraMinutos = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Diz se o local está aberto agora.
 * @param {object|null} horarios - campo "horarios" do local
 * @param {Array} feriados - lista de public/api/feriados.json
 * @param {Date} data - momento a verificar (padrão: agora)
 * @returns {{ estado: 'aberto'|'fechado'|'feriado'|'desconhecido', texto: string }}
 */
export function situacaoAgora(horarios, feriados = [], data = new Date()) {
  if (!horarios?.faixas?.length) {
    return { estado: 'desconhecido', texto: 'Horário não informado pela fonte' };
  }
  const agora = agoraEmIndaiatuba(data);
  if (horarios.vinteQuatroHoras) return { estado: 'aberto', texto: 'Aberto 24 horas' };

  // Feriado (nacional ou municipal; ponto facultativo não conta) e o local não
  // diz que abre em feriados: não dá para afirmar nada.
  const feriado = feriados.find((f) => f.data === agora.iso && f.tipo !== 'ponto facultativo');
  if (feriado && horarios.feriados !== 'aberto') {
    return {
      estado: 'feriado',
      texto: `Hoje é feriado (${feriado.nome}): ${horarios.feriados === 'fechado' ? 'fechado' : 'confirme se está aberto'}`,
    };
  }

  const deHoje = horarios.faixas
    .filter((f) => f.dias.includes(agora.dia))
    .sort((a, b) => a.abre.localeCompare(b.abre));
  const atual = deHoje.find(
    (f) => agora.minutos >= paraMinutos(f.abre) && agora.minutos < paraMinutos(f.fecha)
  );
  if (atual)
    return {
      estado: 'aberto',
      texto: `Aberto agora · fecha às ${atual.fecha.replace(':00', 'h')}`,
    };

  const maisTarde = deHoje.find((f) => paraMinutos(f.abre) > agora.minutos);
  if (maisTarde)
    return {
      estado: 'fechado',
      texto: `Fechado agora · abre hoje às ${maisTarde.abre.replace(':00', 'h')}`,
    };

  // Procura o próximo dia com atendimento (até uma semana à frente).
  const indiceHoje = DIAS.indexOf(agora.dia);
  for (let i = 1; i <= 7; i += 1) {
    const dia = DIAS[(indiceHoje + i) % 7];
    const proxima = horarios.faixas
      .filter((f) => f.dias.includes(dia))
      .sort((a, b) => a.abre.localeCompare(b.abre))[0];
    if (proxima) {
      const quando = i === 1 ? 'amanhã' : NOMES_DIA[dia];
      return {
        estado: 'fechado',
        texto: `Fechado agora · abre ${quando} às ${proxima.abre.replace(':00', 'h')}`,
      };
    }
  }
  return { estado: 'fechado', texto: 'Fechado agora' };
}

/** Texto curto dos dias: ['seg','ter','qua','qui','sex'] → "seg. a sex." */
export function textoDias(dias) {
  const indices = dias.map((d) => DIAS.indexOf(d));
  const seguidos = indices.every((v, i) => i === 0 || v === (indices[i - 1] + 1) % 7);
  if (dias.length === 7) return 'todos os dias';
  if (dias.length > 2 && seguidos) return `${dias[0]}. a ${dias[dias.length - 1]}.`;
  return dias.map((d) => `${d}.`).join(', ');
}

/**
 * Horário estruturado → texto curto em português.
 * Ex.: "qua. a dom. 18:30 às 22:30". Sem faixas, devolve null.
 */
export function textoHorario(horarios) {
  if (horarios?.vinteQuatroHoras) return 'Aberto 24 horas';
  if (!horarios?.faixas?.length) return null;
  return horarios.faixas.map((f) => `${textoDias(f.dias)} ${f.abre} às ${f.fecha}`).join('; ');
}
