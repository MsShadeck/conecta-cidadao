/**
 * useDadosDoUsuario.js — Listas e marcações que ficam no navegador para visitantes
 * e no banco de dados (pela API) para quem entrou na conta.
 *
 * As páginas usam sempre a mesma interface, sem saber onde o dado mora:
 *   const { lista, adicionar, remover, online, carregando, erro } = useColecao({...});
 *   const { marcados, alternar } = useMarcacoes({...});
 */

import { useCallback, useEffect, useState } from 'react';
import { useSessao } from '../context/SessaoContext.jsx';
import useLocalStorage from './useLocalStorage.js';

/**
 * Lista de itens com id (lembretes, sugestões).
 * @param {{chaveLocal: string, caminho: string, criar?: (item) => object}} opcoes
 *   chaveLocal → chave do localStorage (visitante); caminho → recurso da API (ex.: '/lembretes').
 */
export function useColecao({ chaveLocal, caminho }) {
  const { usuario, requisicao } = useSessao();
  const online = Boolean(usuario);
  const [local, setLocal] = useLocalStorage(chaveLocal, []);
  const [remoto, setRemoto] = useState(null);
  const [erro, setErro] = useState(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!online) {
      setRemoto(null);
      return undefined;
    }
    const controle = new AbortController();
    setErro(null);
    requisicao(caminho, { signal: controle.signal })
      .then(setRemoto)
      .catch((e) => {
        if (e.name !== 'AbortError') setErro(e.message);
      });
    return () => controle.abort();
  }, [online, caminho, requisicao, tentativa]);

  const adicionar = useCallback(
    async (dados) => {
      if (!online) {
        // crypto.randomUUID() cria um id único no navegador.
        setLocal((anterior) => [...anterior, { id: crypto.randomUUID(), ...dados }]);
        return;
      }
      // O filtro (?categoria=...) serve só para listar; o POST vai para o recurso.
      const criado = await requisicao(caminho.split('?')[0], { metodo: 'POST', corpo: dados });
      setRemoto((anterior) => [...(anterior ?? []), criado]);
    },
    [online, requisicao, caminho, setLocal]
  );

  const remover = useCallback(
    async (id) => {
      if (!online) {
        setLocal((anterior) => anterior.filter((item) => item.id !== id));
        return;
      }
      await requisicao(`${caminho.split('?')[0]}/${id}`, { metodo: 'DELETE' });
      setRemoto((anterior) => (anterior ?? []).filter((item) => item.id !== id));
    },
    [online, requisicao, caminho, setLocal]
  );

  /** Leva para a conta o que estava salvo só neste navegador (e limpa o navegador). */
  const importarDoNavegador = useCallback(
    async (converter = (item) => item) => {
      for (const item of local) {
        // eslint-disable-next-line no-unused-vars
        const { id, ...dados } = converter(item);
        await requisicao(caminho.split('?')[0], { metodo: 'POST', corpo: dados });
      }
      setLocal([]);
      setTentativa((n) => n + 1);
    },
    [local, requisicao, caminho, setLocal]
  );

  return {
    lista: online ? (remoto ?? []) : local,
    adicionar,
    remover,
    online,
    carregando: online && remoto === null && !erro,
    erro,
    recarregar: () => setTentativa((n) => n + 1),
    noNavegador: online ? local.length : 0,
    importarDoNavegador,
  };
}

/**
 * Marcações liga/desliga por id (checklist feito, página votada).
 * Visitante: objeto { id: true } no localStorage. Logado: lista de ids na API.
 * A tela muda na hora (atualização otimista) e volta atrás se a API recusar.
 */
export function useMarcacoes({ chaveLocal, caminhoLista, caminhoItem }) {
  const { usuario, requisicao } = useSessao();
  const online = Boolean(usuario);
  const [local, setLocal] = useLocalStorage(chaveLocal, {});
  const [remoto, setRemoto] = useState({});

  useEffect(() => {
    if (!online) return undefined;
    const controle = new AbortController();
    requisicao(caminhoLista, { signal: controle.signal })
      .then((ids) => setRemoto(Object.fromEntries((ids ?? []).map((id) => [id, true]))))
      .catch(() => {});
    return () => controle.abort();
  }, [online, caminhoLista, requisicao]);

  const alternar = useCallback(
    async (id) => {
      if (!online) {
        setLocal((anterior) => ({ ...anterior, [id]: !anterior[id] }));
        return;
      }
      const marcar = !remoto[id];
      setRemoto((anterior) => ({ ...anterior, [id]: marcar }));
      try {
        await requisicao(caminhoItem(id), { metodo: marcar ? 'PUT' : 'DELETE' });
      } catch {
        setRemoto((anterior) => ({ ...anterior, [id]: !marcar }));
      }
    },
    [online, remoto, requisicao, caminhoItem, setLocal]
  );

  return { marcados: online ? remoto : local, alternar, online };
}
