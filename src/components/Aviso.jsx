/**
 * Aviso.jsx — Mensagem temporária ("toast") exibida na parte de baixo da tela.
 *
 * O componente não decide o que mostrar nem por quanto tempo: apenas lê o
 * aviso atual do contexto global. Quem dispara a mensagem é o mostrarAviso()
 * do AppContext, chamado por CardLocal e pelo overlay de busca.
 */

import { useAviso } from '../context/AppContext.jsx';
import './Aviso.css';

export default function Aviso() {
  const { aviso } = useAviso();

  return (
    // A área fica sempre montada, mesmo vazia.
    // role="status" + aria-live="polite" fazem o leitor de tela anunciar a
    // mensagem quando ela surge, sem interromper o que já estava sendo lido.
    <div className="aviso-area" role="status" aria-live="polite">
      {aviso && (
        // key={aviso.id}: como o id muda a cada aviso, o React recria o <span>
        // e a animação de entrada do CSS roda novamente.
        <span className="aviso" key={aviso.id}>
          {aviso.texto}
        </span>
      )}
    </div>
  );
}
