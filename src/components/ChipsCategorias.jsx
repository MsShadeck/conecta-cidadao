/**
 * ChipsCategorias.jsx — Barra de atalhos ("chips") entre as categorias.
 *
 * Aparece no topo das páginas de categoria e permite trocar de serviço sem
 * voltar à Home. A lista sai direto de src/data/servicos.js.
 */

import { NavLink } from 'react-router-dom';
import { categorias } from '../data/servicos.js';
import './ChipsCategorias.css';

export default function ChipsCategorias() {
  return (
    <nav className="chips" aria-label="Trocar de serviço">
      {categorias.map((categoria) => (
        // NavLink é um <Link> que sabe se a rota dele é a rota atual —
        // por isso é usado aqui em vez do Link comum.
        <NavLink
          key={categoria.slug}
          to={categoria.rota}
          data-categoria={categoria.slug}
          // Quando className recebe uma função, o NavLink passa { isActive }.
          // O chip da página aberta ganha a classe extra e fica destacado.
          className={({ isActive }) => (isActive ? 'chip chip--ativo' : 'chip')}
        >
          <img src={categoria.icone} alt="" />
          {categoria.nome}
        </NavLink>
      ))}
    </nav>
  );
}
