/**
 * PreferenciasTela.jsx — Acessibilidade: tamanho da letra, tema e Libras.
 *
 *  - A- / A / A+: muda o font-size do <html> (as fontes do site usam rem);
 *  - Tema: automático (segue o sistema), claro ou escuro;
 *  - Libras: carrega o VLibras, tradutor oficial do Governo Federal, SÓ quando a
 *    pessoa pede. Assim o site não baixa um script externo de quem não usa.
 *
 * As escolhas ficam no localStorage e são aplicadas como atributos no <html>
 * (data-fonte e data-tema), que o global.css usa. O index.html aplica as
 * mesmas escolhas antes do React carregar, para a tela não "piscar".
 */

import { useEffect, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage.js';
import './PreferenciasTela.css';

const TAMANHOS = [
  { valor: 'normal', rotulo: 'A', descricao: 'Letra normal' },
  { valor: 'grande', rotulo: 'A+', descricao: 'Letra grande' },
  { valor: 'maior', rotulo: 'A++', descricao: 'Letra maior' },
];

const TEMAS = [
  { valor: 'auto', rotulo: 'Automático' },
  { valor: 'claro', rotulo: 'Claro' },
  { valor: 'escuro', rotulo: 'Escuro' },
];

const URL_VLIBRAS = 'https://vlibras.gov.br/app/vlibras-plugin.js';

/** Insere o VLibras na página (uma vez só). */
function carregarVLibras() {
  if (document.querySelector('[vw]')) return;
  // Estrutura de HTML exigida pelo plugin (documentação do VLibras).
  const caixa = document.createElement('div');
  caixa.setAttribute('vw', '');
  caixa.className = 'enabled';
  caixa.innerHTML =
    '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
  document.body.append(caixa);
  const script = document.createElement('script');
  script.src = URL_VLIBRAS;
  script.onload = () => new window.VLibras.Widget('https://vlibras.gov.br/app');
  document.body.append(script);
}

export default function PreferenciasTela() {
  const [fonte, setFonte] = useLocalStorage('cc:fonte', 'normal');
  const [tema, setTema] = useLocalStorage('cc:tema', 'auto');
  const [libras, setLibras] = useLocalStorage('cc:libras', false);
  const [librasCarregado, setLibrasCarregado] = useState(false);

  // Aplica as escolhas no <html> sempre que mudam.
  useEffect(() => {
    const html = document.documentElement;
    if (fonte === 'normal') delete html.dataset.fonte;
    else html.dataset.fonte = fonte;
  }, [fonte]);

  useEffect(() => {
    const html = document.documentElement;
    if (tema === 'auto') delete html.dataset.tema;
    else html.dataset.tema = tema;
  }, [tema]);

  useEffect(() => {
    if (libras && !librasCarregado) {
      carregarVLibras();
      setLibrasCarregado(true);
    }
  }, [libras, librasCarregado]);

  return (
    <div className="preferencias">
      <div className="preferencias-grupo" role="group" aria-label="Tamanho da letra">
        <span className="preferencias-rotulo" aria-hidden="true">
          Letra
        </span>
        {TAMANHOS.map((t) => (
          <button
            key={t.valor}
            type="button"
            className="preferencias-botao"
            aria-pressed={fonte === t.valor}
            aria-label={t.descricao}
            onClick={() => setFonte(t.valor)}
          >
            {t.rotulo}
          </button>
        ))}
      </div>

      <label className="preferencias-grupo">
        <span className="preferencias-rotulo">Tema</span>
        <select
          className="preferencias-select"
          value={tema}
          onChange={(e) => setTema(e.target.value)}
        >
          {TEMAS.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.rotulo}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="preferencias-botao preferencias-libras"
        aria-pressed={libras}
        onClick={() => setLibras(true)}
        disabled={libras}
      >
        {libras
          ? 'VLibras ativado (botão azul na lateral)'
          : 'Ativar tradução para Libras (VLibras)'}
      </button>
    </div>
  );
}
