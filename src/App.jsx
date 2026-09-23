/**
 * App.jsx — Componente raiz da aplicação.
 *
 * Responsabilidades:
 *  1. Ligar o roteador (BrowserRouter), que troca a página sem recarregar o navegador;
 *  2. Disponibilizar o estado global (AppProvider) para todos os componentes;
 *  3. Declarar o mapa de rotas: qual URL desenha qual página.
 */

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Categoria from './pages/Categoria.jsx';
import Sobre from './pages/Sobre.jsx';
import Contatos from './pages/Contatos.jsx';
import Lembretes from './pages/Lembretes.jsx';
import NaoEncontrada from './pages/NaoEncontrada.jsx';

export default function App() {
  return (
    // BrowserRouter usa URLs limpas (/saude em vez de /#/saude).
    // Por isso o projeto precisa do vercel.json, que redireciona qualquer
    // endereço para o index.html.
    <BrowserRouter>
      {/* AppProvider fica dentro do roteador porque o overlay de busca,
          que vive nesse contexto, precisa navegar entre as rotas. */}
      <AppProvider>
        <Routes>
          {/* Rota "pai" sem path: serve apenas para aplicar o Layout
              (cabeçalho, rodapé, busca e aviso) em todas as páginas filhas.
              Cada filha é desenhada no <Outlet /> que existe dentro do Layout. */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />

            {/* As quatro categorias reaproveitam o MESMO componente Categoria.
                O que muda é a prop "slug", usada para buscar os dados certos
                no arquivo src/data/servicos.js. */}
            <Route path="/saude" element={<Categoria slug="saude" />} />
            <Route path="/seguranca" element={<Categoria slug="seguranca" />} />
            <Route path="/educacao" element={<Categoria slug="educacao" />} />
            <Route path="/lazer" element={<Categoria slug="lazer" />} />

            <Route path="/sobre" element={<Sobre />} />

            {/* Páginas da aula "useEffect + Consumo de API":
                /contatos usa fetch (Exemplos 2 a 5) e /lembretes é o Exemplo 6. */}
            <Route path="/contatos" element={<Contatos />} />
            <Route path="/lembretes" element={<Lembretes />} />

            {/* path="*" = curinga. Qualquer endereço não listado acima cai aqui
                (página 404). Precisa ser sempre a última rota. */}
            <Route path="*" element={<NaoEncontrada />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
