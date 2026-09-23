/**
 * BarraBusca.jsx — Campo de busca da página Telefones úteis.
 *
 * Aula "useEffect + Consumo de API" — Exemplo 5 (SearchBar do material).
 * Não guarda estado próprio: recebe o texto e a função que o altera do
 * componente pai (ListaContatos) via props.
 *
 * @param {{busca: string, setBusca: Function}} props
 */

import IconeLupa from './IconeLupa.jsx';

export default function BarraBusca({ busca, setBusca }) {
  return (
    <label className="campo contatos-busca">
      <IconeLupa />
      <input
        type="text"
        placeholder="Buscar pelo nome do serviço..."
        aria-label="Buscar telefone pelo nome do serviço"
        value={busca}
        onChange={(evento) => setBusca(evento.target.value)}
      />
    </label>
  );
}
