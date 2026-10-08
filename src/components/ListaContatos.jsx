/**
 * ListaContatos.jsx — Lista de telefones úteis carregada com fetch.
 *
 * Aula "useEffect + Consumo de API" — Exemplos 2 a 5 adaptados ao tema.
 * No material a lista vinha de https://jsonplaceholder.typicode.com/users;
 * aqui ela vem de /api/contatos.json (arquivo em public/api/), com os
 * telefones de utilidade pública. O código de fetch é o mesmo.
 *
 * As etapas da prática ficaram comentadas, na ordem em que foram feitas.
 * A versão ativa está no fim do arquivo.
 */

/* EXEMPLO 2 — fetch simples (sem loading e sem tratamento de erro)
   Obs.: no material este exemplo não tinha "export default".

import { useState, useEffect } from 'react';

export default function ListaContatos() {
  const [contatos, setContatos] = useState([]);

  useEffect(() => {
    fetch('/api/contatos.json')
      .then((response) => response.json())
      .then((data) => setContatos(data));
  }, []);

  return (
    <ul>
      {contatos.map((contato) => (
        <li key={contato.id}>{contato.nome}</li>
      ))}
    </ul>
  );
}
*/

/* EXEMPLO 3 — loading + erro. Padrão: Loading → Erro → Dados

import { useState, useEffect } from 'react';

export default function ListaContatos() {
  const [contatos, setContatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    fetch('/api/contatos.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Erro ao buscar os telefones');
        }
        return response.json();
      })
      .then((data) => {
        setContatos(data);
        setLoading(false);
      })
      .catch((error) => {
        setErro(error.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Carregando...</p>;
  if (erro) return <p>Erro: {erro}</p>;

  return (
    <ul>
      {contatos.map((contato) => (
        <li key={contato.id}>{contato.nome}</li>
      ))}
    </ul>
  );
}
*/

/* EXEMPLO 4 — fetch + filtro por nome (toLowerCase + includes)

import { useState, useEffect } from 'react';

export default function ListaContatos() {
  const [contatos, setContatos] = useState([]);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    fetch('/api/contatos.json')
      .then((response) => response.json())
      .then((data) => setContatos(data));
  }, []);

  const contatosFiltrados = contatos.filter((contato) =>
    contato.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Digite um nome"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
      <ul>
        {contatosFiltrados.map((contato) => (
          <li key={contato.id}>{contato.nome}</li>
        ))}
      </ul>
    </div>
  );
}
*/

/* EXEMPLO 5 — versão original do material, componentizada com a BarraBusca

import { useState, useEffect } from 'react';
import BarraBusca from './BarraBusca.jsx';

export default function ListaContatos() {
  const [contatos, setContatos] = useState([]);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    fetch('/api/contatos.json')
      .then((response) => response.json())
      .then((data) => setContatos(data));
  }, []);

  const contatosFiltrados = contatos.filter((contato) =>
    contato.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div>
      <BarraBusca busca={busca} setBusca={setBusca} />
      <ul>
        {contatosFiltrados.map((contato) => (
          <li key={contato.id}>{contato.nome}</li>
        ))}
      </ul>
    </div>
  );
}
*/

/* VERSÃO DA AULA — Exemplo 5 com as ATIVIDADES PROPOSTAS (era a versão ativa):
    - exibir os dados de contato de cada item (telefone e descrição)
    - botão "Recarregar" que refaz o fetch
    - mensagem "Nenhum telefone encontrado" quando o filtro não retorna nada
    - tratamento de erro (loading + erro, como no Exemplo 3)
import { useState, useEffect } from 'react';
import BarraBusca from './BarraBusca.jsx';

export default function ListaContatos() {
  const [contatos, setContatos] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // Fetch extraído para uma função: usada no useEffect e no botão Recarregar.
  function carregarContatos() {
    fetch('/api/contatos.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Não foi possível carregar os telefones');
        }
        return response.json();
      })
      .then((data) => {
        setContatos(data);
        setLoading(false);
      })
      .catch((error) => {
        setErro(error.message);
        setLoading(false);
      });
  }

  // Botão Recarregar: reativa o loading, limpa o erro e busca de novo.
  function recarregar() {
    setLoading(true);
    setErro(null);
    carregarContatos();
  }

  // [] = busca os dados uma única vez, quando a página aparece.
  useEffect(() => {
    carregarContatos();
  }, []);

  const contatosFiltrados = contatos.filter((contato) =>
    contato.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="contatos">
      <div className="contatos-controles">
        <BarraBusca busca={busca} setBusca={setBusca} />
        <button type="button" className="botao-primario" onClick={recarregar}>
          Recarregar
        </button>
      </div>

      {/* Padrão Loading → Erro → Dados (e, dentro dos dados, a lista vazia) *\/}
      {loading ? (
        <p className="contatos-aviso">Carregando...</p>
      ) : erro ? (
        <p className="contatos-aviso contatos-aviso--erro">Erro: {erro}</p>
      ) : contatosFiltrados.length === 0 ? (
        <p className="contatos-aviso">Nenhum telefone encontrado para “{busca}”.</p>
      ) : (
        <ul className="contatos-lista">
          {contatosFiltrados.map((contato) => (
            // data-categoria pinta o número com a cor do serviço (saúde, segurança).
            <li key={contato.id} className="contato" data-categoria={contato.categoria}>
              {/* tel: abre o discador no celular *\/}
              <a className="contato-telefone" href={`tel:${contato.telefone}`}>
                {contato.telefone}
              </a>
              <div>
                <p className="contato-nome">{contato.nome}</p>
                <p className="contato-descricao">{contato.descricao}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
   (Nos comentários JSX deste bloco, o fechamento leva uma barra invertida extra
   para não encerrar o comentário de fora antes da hora.)
*/

// VERSÃO ATIVA — evolução da versão das atividades propostas:
//  - busca sem acento (reaproveita normalizar) no nome, na descrição e no número;
//  - o fetch fica DENTRO do useEffect e é cancelado com AbortController quando
//    a pessoa sai da página (sem aviso de exhaustive-deps no lint);
//  - "Recarregar" só incrementa um contador que está no array de dependências;
//  - chips para filtrar por categoria, números de emergência fixos no topo e
//    botão "Copiar" em cada número.
import { useEffect, useMemo, useState } from 'react';
import BarraBusca from './BarraBusca.jsx';
import { normalizar } from '../utils/texto.js';
import { useAviso } from '../context/AppContext.jsx';
import { formatarData } from '../utils/datas.js';
import './ChipsCategorias.css';

/** Rótulos dos chips; a ordem aqui é a ordem na tela. */
const CATEGORIAS_CONTATO = [
  { slug: 'todos', nome: 'Todos' },
  { slug: 'saude', nome: 'Saúde' },
  { slug: 'seguranca', nome: 'Segurança' },
  { slug: 'prefeitura', nome: 'Prefeitura' },
  { slug: 'mobilidade', nome: 'Mobilidade' },
  { slug: 'direitos', nome: 'Direitos e apoio' },
];

/**
 * Filtra os contatos pelo texto e pela categoria. Fica fora do componente
 * (função pura) para poder ser testada no Vitest.
 * @param {Array} contatos
 * @param {string} busca - texto digitado
 * @param {string} categoria - slug do chip ('todos' = sem filtro)
 */
export function filtrarContatos(contatos, busca, categoria = 'todos') {
  const alvo = normalizar(busca);
  // Para o número, compara só os dígitos: "38349000" encontra "(19) 3834-9000".
  const digitos = busca.replace(/\D/g, '');
  return contatos.filter((contato) => {
    if (categoria !== 'todos' && contato.categoria !== categoria) return false;
    if (!alvo) return true;
    return (
      normalizar(contato.nome).includes(alvo) ||
      normalizar(contato.descricao ?? '').includes(alvo) ||
      (digitos !== '' && contato.telefone.replace(/\D/g, '').includes(digitos))
    );
  });
}

/** Item da lista: número clicável (tel:), nome, descrição, botão copiar e fonte. */
function Contato({ contato, aoCopiar }) {
  return (
    <li className="contato" data-categoria={contato.categoria}>
      {/* tel: abre o discador no celular. Os espaços e traços saem do link. */}
      {/* Números curtos (190, 192) ficam grandes; os de 8+ dígitos usam fonte menor. */}
      <a
        className={`contato-telefone${contato.telefone.length > 5 ? ' contato-telefone--longo' : ''}`}
        href={`tel:${contato.telefone.replace(/[^\d+]/g, '')}`}
      >
        {contato.telefone}
      </a>
      <div className="contato-texto">
        <p className="contato-nome">{contato.nome}</p>
        {contato.descricao && <p className="contato-descricao">{contato.descricao}</p>}
        {contato.fonte && (
          <a className="contato-fonte" href={contato.fonte} target="_blank" rel="noreferrer">
            Fonte
          </a>
        )}
      </div>
      <button
        type="button"
        className="contato-copiar"
        onClick={() => aoCopiar(contato)}
        aria-label={`Copiar o número de ${contato.nome}`}
      >
        Copiar
      </button>
    </li>
  );
}

export default function ListaContatos() {
  const [dados, setDados] = useState({ contatos: [], atualizadoEm: null });
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  // Cada clique em "Recarregar" soma 1; como a tentativa está nas dependências
  // do useEffect, o efeito roda de novo e refaz o fetch.
  const [tentativa, setTentativa] = useState(0);
  const { mostrarAviso } = useAviso();

  useEffect(() => {
    // AbortController: permite cancelar o fetch. Se a pessoa sair da página antes
    // de a resposta chegar, o cleanup aborta e nenhum setState roda "no vazio".
    const controle = new AbortController();
    setLoading(true);
    setErro(null);

    fetch('/api/contatos.json', { signal: controle.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Não foi possível carregar os telefones');
        return response.json();
      })
      .then((data) => {
        // Aceita os dois formatos: a lista pura (aula) ou { atualizadoEm, contatos }.
        setDados(Array.isArray(data) ? { contatos: data, atualizadoEm: null } : data);
        setLoading(false);
      })
      .catch((error) => {
        // AbortError não é erro de verdade: foi o próprio cleanup que cancelou.
        if (error.name === 'AbortError') return;
        setErro(error.message);
        setLoading(false);
      });

    return () => controle.abort();
  }, [tentativa]);

  // useMemo: só refiltra quando a lista, a busca ou o chip mudam.
  const filtrados = useMemo(
    () => filtrarContatos(dados.contatos, busca, categoria),
    [dados.contatos, busca, categoria]
  );
  const emergencias = dados.contatos.filter((contato) => contato.emergencia);

  /** Copia o número para a área de transferência (pode falhar sem HTTPS). */
  function copiar(contato) {
    navigator.clipboard
      ?.writeText(contato.telefone)
      .then(() => mostrarAviso(`Número de ${contato.nome} copiado`))
      .catch(() => mostrarAviso('Não foi possível copiar. Selecione o número e copie.'));
  }

  return (
    <div className="contatos">
      {/* Emergências sempre visíveis, sem depender da busca nem do chip. */}
      {emergencias.length > 0 && (
        <section aria-labelledby="titulo-emergencias" className="contatos-emergencia">
          <h2 id="titulo-emergencias" className="contatos-subtitulo">
            Emergência — ligação gratuita
          </h2>
          <ul className="contatos-emergencia-lista">
            {emergencias.map((contato) => (
              <li key={contato.id} data-categoria={contato.categoria}>
                <a
                  className="contatos-emergencia-numero"
                  href={`tel:${contato.telefone.replace(/[^\d+]/g, '')}`}
                >
                  <strong>{contato.telefone}</strong>
                  <span>{contato.nome}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="contatos-controles">
        <BarraBusca busca={busca} setBusca={setBusca} />
        <button type="button" className="botao-primario" onClick={() => setTentativa((n) => n + 1)}>
          Recarregar
        </button>
      </div>

      <div className="chips" role="group" aria-label="Filtrar por categoria">
        {CATEGORIAS_CONTATO.map((item) => (
          <button
            key={item.slug}
            type="button"
            data-categoria={item.slug}
            className={item.slug === categoria ? 'chip chip--ativo' : 'chip'}
            aria-pressed={item.slug === categoria}
            onClick={() => setCategoria(item.slug)}
          >
            {item.nome}
          </button>
        ))}
      </div>

      {/* Padrão Loading → Erro → Dados (e, dentro dos dados, a lista vazia) */}
      {loading ? (
        <p className="contatos-aviso">Carregando...</p>
      ) : erro ? (
        <p className="contatos-aviso contatos-aviso--erro">Erro: {erro}</p>
      ) : filtrados.length === 0 ? (
        <p className="contatos-aviso">
          Nenhum telefone encontrado{busca ? ` para “${busca}”` : ''}.
        </p>
      ) : (
        <ul className="contatos-lista">
          {filtrados.map((contato) => (
            <Contato key={contato.id} contato={contato} aoCopiar={copiar} />
          ))}
        </ul>
      )}

      {dados.atualizadoEm && (
        <p className="atualizado-em">Atualizado em {formatarData(dados.atualizadoEm)}</p>
      )}
    </div>
  );
}
