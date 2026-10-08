/**
 * SeloAberto.jsx — Selo "Aberto agora / Fechado" de um local.
 *
 * O cálculo usa o fuso de Indaiatuba (America/Sao_Paulo) e a lista de feriados
 * de /api/feriados.json. Sem horário estruturado na fonte, o selo não aparece
 * (ou mostra "Horário não informado", se completo = true).
 */

import { useEffect, useState } from 'react';
import useDados from '../hooks/useDados.js';
import { situacaoAgora } from '../utils/horario.js';
import './SeloAberto.css';

export default function SeloAberto({ horarios, completo = false }) {
  const { dados } = useDados('/api/feriados.json');
  // Recalcula a cada minuto: quem deixa a página aberta vê o selo mudar.
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setAgora(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);

  const situacao = situacaoAgora(horarios, dados?.feriados ?? [], agora);
  if (situacao.estado === 'desconhecido' && !completo) return null;

  return (
    <span className={`selo-aberto selo-aberto--${situacao.estado}`}>
      {/* O ponto colorido é decorativo: o texto já diz se está aberto. */}
      <span className="selo-aberto-ponto" aria-hidden="true" />
      {completo ? situacao.texto : situacao.texto.split(' · ')[0]}
    </span>
  );
}
