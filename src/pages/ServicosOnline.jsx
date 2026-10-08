/**
 * ServicosOnline.jsx — Página "/servicos-online": links oficiais para resolver
 * as coisas pela internet (IPTU, vacina, multas, iluminação pública...).
 *
 * Os links vêm de /api/servicos-online.json, conferidos um a um (ver a data
 * de atualização no fim da página). Busca sem acento e chips por categoria.
 */

import { useMemo, useState } from 'react';
import useDados from '../hooks/useDados.js';
import useTituloPagina from '../hooks/useTituloPagina.js';
import { normalizar } from '../utils/texto.js';
import EstadoDados from '../components/EstadoDados.jsx';
import InfoFonte from '../components/InfoFonte.jsx';
import IconeLupa from '../components/IconeLupa.jsx';
import '../components/ChipsCategorias.css';
import './Contatos.css'; // aviso de lista vazia (.contatos-aviso)
import './ServicosOnline.css';

export default function ServicosOnline() {
  useTituloPagina(
    'Serviços online da Prefeitura — Conecta Cidadão',
    'Links oficiais de Indaiatuba: IPTU, Minha Vacina, resultados de exames, multas, iluminação pública e mais.'
  );
  const { dados, carregando, erro, recarregar } = useDados('/api/servicos-online.json');
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('todos');

  const visiveis = useMemo(() => {
    const alvo = normalizar(busca);
    return (dados?.servicos ?? []).filter(
      (s) =>
        (categoria === 'todos' || s.categoria === categoria) &&
        (!alvo ||
          normalizar(`${s.nome} ${s.descricao} ${s.palavrasChave.join(' ')}`).includes(alvo))
    );
  }, [dados, busca, categoria]);

  return (
    <>
      <section className="container pagina-topo">
        <h1 className="titulo-pagina">Serviços online</h1>
        <p className="texto-apoio">
          Links oficiais para resolver pela internet: IPTU, vacina, resultados de exames, multas,
          iluminação pública, boletim de ocorrência e mais. Todos abrem no site do órgão
          responsável.
        </p>
      </section>

      <section className="container">
        <EstadoDados carregando={carregando} erro={erro} recarregar={recarregar}>
          {dados && (
            <div className="painel servicos-online">
              <label className="campo campo-busca">
                <IconeLupa />
                <input
                  type="search"
                  placeholder="O que você quer resolver? (ex.: IPTU, multa, vacina)"
                  aria-label="Buscar serviço online"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </label>

              <div className="chips" role="group" aria-label="Filtrar por assunto">
                {[{ slug: 'todos', nome: 'Todos' }, ...dados.categorias].map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    className={c.slug === categoria ? 'chip chip--ativo' : 'chip'}
                    aria-pressed={c.slug === categoria}
                    onClick={() => setCategoria(c.slug)}
                  >
                    {c.nome}
                  </button>
                ))}
              </div>

              {visiveis.length === 0 ? (
                <p className="contatos-aviso" role="status">
                  Nenhum serviço encontrado{busca ? ` para “${busca}”` : ''}.
                </p>
              ) : (
                <ul className="servicos-online-lista">
                  {visiveis.map((s) => (
                    <li key={s.id}>
                      {/* target="_blank" abre em nova aba; rel="noreferrer" é a
                          proteção padrão para links externos. */}
                      <a href={s.url} target="_blank" rel="noreferrer" className="servico-online">
                        <strong>{s.nome}</strong>
                        <span>{s.descricao}</span>
                        <span className="servico-online-site">
                          {new URL(s.url).hostname.replace(/^www\./, '')} ↗
                          <span className="somente-leitor"> (abre em nova aba)</span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <InfoFonte atualizadoEm={dados.atualizadoEm} />
            </div>
          )}
        </EstadoDados>
      </section>
    </>
  );
}
