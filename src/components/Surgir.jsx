/**
 * Surgir.jsx — Faz um bloco aparecer com um fade curto, subindo 10px (Motion).
 *
 * Usado na Home para as seções entrarem uma depois da outra (prop "atraso").
 * A animação roda uma vez, ao montar. Não usa "aparecer ao rolar" de propósito:
 * assim nada fica invisível na impressão, em capturas de tela ou para quem
 * pula direto para o fim da página.
 *
 * Quem pediu ao sistema para reduzir movimento vê o conteúdo direto, sem
 * deslocamento (MotionConfig reducedMotion="user", no Layout).
 *
 * @param {{como?: string, atraso?: number, className?: string, children: any}} props
 *   como   - tag HTML a desenhar ('div', 'section', 'li'...)
 *   atraso - em segundos, para escalonar vários blocos
 */

import { motion } from 'motion/react';

export default function Surgir({ como = 'div', atraso = 0, children, ...resto }) {
  // motion.div, motion.section, motion.li... são as tags HTML com animação.
  const Tag = motion[como];
  return (
    <Tag
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: atraso, ease: [0.2, 0.7, 0.3, 1] }}
      {...resto}
    >
      {children}
    </Tag>
  );
}
