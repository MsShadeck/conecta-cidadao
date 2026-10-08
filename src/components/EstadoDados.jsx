/**
 * EstadoDados.jsx — Mensagens de "Carregando..." e de erro com "Tentar de novo".
 *
 * Mesmo padrão Loading → Erro → Dados da aula de useEffect, num componente
 * para não repetir o JSX em todas as páginas.
 */
export default function EstadoDados({ carregando, erro, recarregar, children }) {
  if (carregando) {
    return (
      <p className="estado-dados" role="status">
        Carregando...
      </p>
    );
  }
  if (erro) {
    return (
      <div className="estado-dados estado-dados--erro" role="alert">
        <p>Não foi possível carregar as informações. {erro}</p>
        {recarregar && (
          <button type="button" className="botao-secundario" onClick={recarregar}>
            Tentar de novo
          </button>
        )}
      </div>
    );
  }
  return children;
}
