/**
 * useDados.js — Carrega um arquivo JSON de /api com fetch, loading e erro.
 *
 * É o mesmo padrão da aula de useEffect (Loading → Erro → Dados), guardado num
 * hook para todas as páginas reaproveitarem:
 *
 *   const { dados, carregando, erro, recarregar } = useDados('/api/locais.json');
 *
 * Extras em relação à aula:
 *  - AbortController: se a pessoa sair da página antes da resposta, o fetch é
 *    cancelado no cleanup e nenhum setState roda "no vazio";
 *  - cache em memória: o locais.json é usado em várias páginas; depois da
 *    primeira vez, ele vem do cache e a troca de página é instantânea.
 */

import { useCallback, useEffect, useState } from 'react';

// Fica FORA do hook: é compartilhado por todos os componentes enquanto a aba
// estiver aberta. Guarda só respostas que deram certo.
const cache = new Map();

export default function useDados(url) {
  const [estado, setEstado] = useState(() => ({
    dados: cache.get(url) ?? null,
    carregando: Boolean(url) && !cache.has(url),
    erro: null,
  }));
  // Mudar a "tentativa" faz o efeito rodar de novo (botão "Tentar de novo").
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!url) return undefined;
    if (cache.has(url)) {
      setEstado({ dados: cache.get(url), carregando: false, erro: null });
      return undefined;
    }

    const controle = new AbortController();
    setEstado({ dados: null, carregando: true, erro: null });

    fetch(url, { signal: controle.signal })
      .then((resposta) => {
        if (!resposta.ok)
          throw new Error(`Não foi possível carregar os dados (${resposta.status}).`);
        return resposta.json();
      })
      .then((dados) => {
        cache.set(url, dados);
        setEstado({ dados, carregando: false, erro: null });
      })
      .catch((erro) => {
        // AbortError não é erro de verdade: foi o próprio cleanup que cancelou.
        if (erro.name === 'AbortError') return;
        setEstado({ dados: null, carregando: false, erro: erro.message });
      });

    return () => controle.abort();
  }, [url, tentativa]);

  const recarregar = useCallback(() => {
    cache.delete(url);
    setTentativa((n) => n + 1);
  }, [url]);

  return { ...estado, recarregar };
}
