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

// VERSÃO ATIVA — Exemplo 5 com as ATIVIDADES PROPOSTAS:
//  - exibir os dados de contato de cada item (telefone e descrição)
//  - botão "Recarregar" que refaz o fetch
//  - mensagem "Nenhum telefone encontrado" quando o filtro não retorna nada
//  - tratamento de erro (loading + erro, como no Exemplo 3)
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

      {/* Padrão Loading → Erro → Dados (e, dentro dos dados, a lista vazia) */}
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
              {/* tel: abre o discador no celular */}
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
