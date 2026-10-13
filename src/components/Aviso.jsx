/**
 * Aviso.jsx — Mensagem temporária ("toast") exibida na parte de baixo da tela.
 *
 * O componente não decide o que mostrar nem por quanto tempo: apenas lê o
 * aviso atual do contexto global. Quem dispara a mensagem é o mostrarAviso()
 * do AppContext, chamado por CardLocal e pelo overlay de busca.
 *
 * O AnimatePresence (Motion) anima a entrada e também a SAÍDA: quando o aviso
 * volta a null, o elemento desce e some antes de sair da tela.
 */

import { AnimatePresence, motion } from 'motion/react';
import { CircleCheck } from 'lucide-react';
import { useAviso } from '../context/AppContext.jsx';
import './Aviso.css';

export default function Aviso() {
  const { aviso } = useAviso();

  return (
    // A área fica sempre montada, mesmo vazia.
    // role="status" + aria-live="polite" fazem o leitor de tela anunciar a
    // mensagem quando ela surge, sem interromper o que já estava sendo lido.
    <div className="aviso-area" role="status" aria-live="polite">
      <AnimatePresence>
        {aviso && (
          // key={aviso.id}: como o id muda a cada aviso, o Motion trata cada
          // mensagem como um elemento novo e a animação de entrada roda de novo.
          <motion.span
            className="aviso"
            key={aviso.id}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.22, ease: [0.2, 0.7, 0.3, 1] }}
          >
            <CircleCheck size={16} strokeWidth={2} />
            {aviso.texto}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
