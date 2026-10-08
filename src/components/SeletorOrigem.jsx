/**
 * SeletorOrigem.jsx — "De onde você sai?": localização do aparelho ou CEP.
 *
 * O ponto escolhido vai para o estado global (useOrigem) e passa a valer nas
 * outras páginas: distâncias, "Perto de mim" e "Como chegar".
 *
 * Geolocation API: o navegador pede permissão à pessoa. Só funciona em HTTPS
 * (ou localhost). Se ela negar ou o aparelho não tiver GPS, o CEP resolve.
 */

import { useEffect, useRef, useState } from 'react';
import { useOrigem } from '../context/AppContext.jsx';
import { localizarCep } from '../utils/cep.js';
import './SeletorOrigem.css';

// Retângulo do município (IBGE): fora dele, as rotas não funcionam.
const LIMITES = { oeste: -47.3056, sul: -23.226, leste: -47.0836, norte: -22.9979 };
const dentroDeIndaiatuba = ({ lat, lng }) =>
  lat > LIMITES.sul && lat < LIMITES.norte && lng > LIMITES.oeste && lng < LIMITES.leste;

export default function SeletorOrigem({ titulo = 'De onde você sai?' }) {
  const { origem, setOrigem } = useOrigem();
  const [cep, setCep] = useState('');
  const [status, setStatus] = useState(null); // { tipo: 'carregando'|'erro', texto }
  const controleRef = useRef(null);

  // Cancela a busca de CEP pendente se o componente sair da tela.
  useEffect(() => () => controleRef.current?.abort(), []);

  function usarLocalizacao() {
    if (!('geolocation' in navigator)) {
      setStatus({ tipo: 'erro', texto: 'Este navegador não informa a localização. Use o CEP.' });
      return;
    }
    setStatus({ tipo: 'carregando', texto: 'Pedindo a sua localização ao navegador...' });
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        const ponto = { lat: posicao.coords.latitude, lng: posicao.coords.longitude };
        if (!dentroDeIndaiatuba(ponto)) {
          setStatus({
            tipo: 'erro',
            texto: 'Você parece estar fora de Indaiatuba. Digite um CEP da cidade.',
          });
          return;
        }
        setOrigem({
          ...ponto,
          rotulo: 'Sua localização atual',
          aproximada: posicao.coords.accuracy > 200,
        });
        setStatus(null);
      },
      (erro) => {
        const textos = {
          1: 'Você não permitiu o acesso à localização. Use o CEP.',
          2: 'Não foi possível descobrir a localização agora. Use o CEP.',
          3: 'A localização demorou demais. Tente de novo ou use o CEP.',
        };
        setStatus({ tipo: 'erro', texto: textos[erro.code] ?? textos[2] });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  async function usarCep(evento) {
    evento.preventDefault();
    controleRef.current?.abort();
    const controle = new AbortController();
    controleRef.current = controle;
    setStatus({ tipo: 'carregando', texto: 'Procurando o CEP...' });
    try {
      const ponto = await localizarCep(cep, controle.signal);
      setOrigem({ ...ponto, rotulo: `CEP ${cep} — ${ponto.rotulo}` });
      setStatus(null);
    } catch (erro) {
      if (erro.name !== 'AbortError') setStatus({ tipo: 'erro', texto: erro.message });
    }
  }

  return (
    <section className="origem" aria-label={titulo}>
      <h2 className="origem-titulo">{titulo}</h2>

      {origem && (
        <p className="origem-atual">
          <span aria-hidden="true">📍</span> {origem.rotulo}
          {origem.aproximada && <span className="origem-aproximada"> (posição aproximada)</span>}
          <button type="button" className="origem-limpar" onClick={() => setOrigem(null)}>
            Trocar
          </button>
        </p>
      )}

      {!origem && (
        <div className="origem-opcoes">
          <button type="button" className="botao-primario" onClick={usarLocalizacao}>
            Usar minha localização
          </button>
          <span className="origem-ou">ou</span>
          <form className="origem-cep" onSubmit={usarCep}>
            <label className="somente-leitor" htmlFor="campo-cep">
              CEP de partida
            </label>
            <input
              id="campo-cep"
              className="campo"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="CEP (ex.: 13334-100)"
              value={cep}
              onChange={(evento) => setCep(evento.target.value)}
              maxLength={9}
            />
            <button type="submit" className="botao-secundario">
              Usar CEP
            </button>
          </form>
        </div>
      )}

      {/* role="status"/"alert": o leitor de tela anuncia o andamento e os erros. */}
      {status && (
        <p
          className={`origem-status origem-status--${status.tipo}`}
          role={status.tipo === 'erro' ? 'alert' : 'status'}
        >
          {status.texto}
        </p>
      )}
    </section>
  );
}
