/**
 * Contatos.jsx — Página "/contatos": telefones de utilidade pública.
 *
 * Aula "useEffect + Consumo de API". A lista é carregada com fetch pelo
 * componente ListaContatos, que traz as etapas da prática comentadas.
 */

import ListaContatos from '../components/ListaContatos.jsx';
import useTituloPagina from '../hooks/useTituloPagina.js';
import './Contatos.css';

export default function Contatos() {
  useTituloPagina('Telefones úteis — Conecta Cidadão');

  return (
    <>
      <section className="container pagina-topo">
        <h1 className="titulo-pagina">Telefones úteis</h1>
        <p className="texto-apoio">
          Números de emergência e de atendimento ao cidadão. Toque no número para ligar.
        </p>
      </section>

      <section className="container">
        <div className="painel">
          <ListaContatos />
        </div>
      </section>
    </>
  );
}
