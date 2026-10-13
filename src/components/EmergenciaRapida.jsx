/**
 * EmergenciaRapida.jsx — Faixa com os números de emergência (toque para ligar).
 *
 * Lê os mesmos dados da página Telefones úteis (/api/contatos.json) e mostra
 * só os marcados com "emergencia: true". Se o arquivo não carregar, a faixa
 * não aparece (os números continuam na página /contatos).
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Phone, Siren } from 'lucide-react';
import useDados from '../hooks/useDados.js';
import './EmergenciaRapida.css';

export default function EmergenciaRapida() {
  const { dados } = useDados('/api/contatos.json');
  const emergencias = (dados?.contatos ?? []).filter((c) => c.emergencia);
  if (emergencias.length === 0) return null;

  return (
    <aside className="emergencia" aria-labelledby="titulo-emergencia-rapida">
      <h2 id="titulo-emergencia-rapida" className="emergencia-titulo">
        <Siren size={18} strokeWidth={2} />
        Emergência? Ligue grátis
      </h2>
      <ul className="emergencia-lista">
        {emergencias.map((c) => (
          <li key={c.id}>
            <a
              href={`tel:${c.telefone}`}
              className="emergencia-numero"
              data-categoria={c.categoria}
            >
              <Phone size={14} strokeWidth={2.25} />
              <strong>{c.telefone}</strong> {c.nome}
            </a>
          </li>
        ))}
      </ul>
      <Link to="/contatos" className="emergencia-mais">
        Todos os telefones úteis <ArrowRight size={14} />
      </Link>
    </aside>
  );
}
