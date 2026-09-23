/**
 * NaoEncontrada.jsx — Página 404.
 *
 * Desenhada pela rota curinga (path="*") do App.jsx quando o endereço digitado
 * não corresponde a nenhuma rota cadastrada.
 */

import { Link } from 'react-router-dom';
import useTituloPagina from '../hooks/useTituloPagina.js';
import './NaoEncontrada.css';

export default function NaoEncontrada() {
  useTituloPagina('Página não encontrada — Conecta Cidadão');

  return (
    <section className="container nao-encontrada">
      <h1 className="titulo-pagina">Esta página não existe</h1>
      <p className="texto-apoio">
        O endereço digitado não corresponde a nenhum serviço. Volte ao início para escolher
        entre saúde, segurança, educação e lazer.
      </p>
      {/* Saída clara para o usuário: um caminho de volta em vez de um beco sem saída. */}
      <Link to="/" className="nao-encontrada-botao">
        Voltar ao início
      </Link>
    </section>
  );
}
