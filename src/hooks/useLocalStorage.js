/**
 * useLocalStorage.js — useState que sobrevive ao F5.
 *
 * Funciona igual ao useState ([valor, setValor]), mas grava cada mudança no
 * localStorage do navegador e lê o valor salvo quando a página abre de novo.
 *
 * O localStorage pode falhar: aba anônima com cota zero, armazenamento cheio,
 * site bloqueado nas configurações ou JSON corrompido. Por isso toda leitura e
 * escrita fica dentro de try/catch. Se der erro, o site continua funcionando,
 * só não lembra o valor da próxima vez.
 *
 * Uso: const [lista, setLista] = useLocalStorage('cc:lembretes', []);
 */

import { useEffect, useState } from 'react';

/** Lê e converte o valor salvo; devolve o padrão se não houver nada ou se falhar. */
export function lerDoArmazenamento(chave, valorPadrao) {
  try {
    const salvo = window.localStorage.getItem(chave);
    return salvo === null ? valorPadrao : JSON.parse(salvo);
  } catch {
    return valorPadrao;
  }
}

export default function useLocalStorage(chave, valorPadrao) {
  // Função no useState = "inicialização preguiçosa": o localStorage é lido só
  // na primeira renderização, e não a cada uma.
  const [valor, setValor] = useState(() => lerDoArmazenamento(chave, valorPadrao));

  // Toda vez que o valor (ou a chave) muda, grava a nova versão.
  useEffect(() => {
    try {
      window.localStorage.setItem(chave, JSON.stringify(valor));
    } catch {
      // Sem espaço ou sem permissão: ignora em silêncio, o estado em memória continua valendo.
    }
  }, [chave, valor]);

  return [valor, setValor];
}
