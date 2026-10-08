/**
 * App.jsx — Componente raiz da aplicação.
 *
 * Responsabilidades:
 *  1. Ligar o roteador (BrowserRouter), que troca a página sem recarregar o navegador;
 *  2. Disponibilizar o estado global (AppProvider) para todos os componentes;
 *  3. Declarar o mapa de rotas: qual URL desenha qual página.
 *
 * Code-splitting: as páginas são carregadas com React.lazy. Cada uma vira um
 * arquivo JavaScript separado, baixado só quando a pessoa abre aquela rota.
 * Assim a primeira visita (a Home) fica bem mais leve.
 */

import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';

// lazy(() => import(...)): o import só acontece na primeira vez que a rota abre.
const Categoria = lazy(() => import('./pages/Categoria.jsx'));
const Local = lazy(() => import('./pages/Local.jsx'));
const Sobre = lazy(() => import('./pages/Sobre.jsx'));
const Contatos = lazy(() => import('./pages/Contatos.jsx'));
const Lembretes = lazy(() => import('./pages/Lembretes.jsx'));
const NaoEncontrada = lazy(() => import('./pages/NaoEncontrada.jsx'));
const Mobilidade = lazy(() => import('./pages/Mobilidade.jsx'));
const ComoChegar = lazy(() => import('./pages/ComoChegar.jsx'));
const MapaGeral = lazy(() => import('./pages/MapaGeral.jsx'));
const PertoDeMim = lazy(() => import('./pages/PertoDeMim.jsx'));
const ServicosOnline = lazy(() => import('./pages/ServicosOnline.jsx'));
const PrimeirosPassos = lazy(() => import('./pages/PrimeirosPassos.jsx'));
const ServicosPublicos = lazy(() => import('./pages/ServicosPublicos.jsx'));

/** Mensagem exibida enquanto o arquivo da página chega. */
function CarregandoPagina() {
  return (
    <p className="container estado-dados" role="status">
      Carregando...
    </p>
  );
}

export default function App() {
  return (
    // BrowserRouter usa URLs limpas (/saude em vez de /#/saude).
    // Por isso o projeto precisa do vercel.json, que redireciona qualquer
    // endereço para o index.html.
    <BrowserRouter>
      {/* AppProvider fica dentro do roteador porque o overlay de busca,
          que vive nesse contexto, precisa navegar entre as rotas. */}
      <AppProvider>
        <Suspense fallback={<CarregandoPagina />}>
          <Routes>
            {/* Rota "pai" sem path: serve apenas para aplicar o Layout
                (cabeçalho, rodapé, busca e aviso) em todas as páginas filhas.
                Cada filha é desenhada no <Outlet /> que existe dentro do Layout. */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />

              {/* Serviços públicos: agrupa as categorias abaixo (que continuam
                  com os mesmos endereços, para não quebrar links antigos). */}
              <Route path="/servicos" element={<ServicosPublicos />} />

              {/* As categorias reaproveitam o MESMO componente Categoria.
                  O que muda é a prop "slug", usada para filtrar os locais. */}
              <Route path="/saude" element={<Categoria slug="saude" />} />
              <Route path="/educacao" element={<Categoria slug="educacao" />} />
              <Route path="/seguranca" element={<Categoria slug="seguranca" />} />
              <Route path="/lazer" element={<Categoria slug="lazer" />} />
              <Route path="/cidadania" element={<Categoria slug="cidadania" />} />

              {/* Mobilidade tem página própria: além dos terminais, mostra ônibus,
                  cartão SOU, Ecobike e ciclovias. */}
              <Route path="/mobilidade" element={<Mobilidade />} />
              <Route path="/como-chegar" element={<ComoChegar />} />

              {/* Recursos para quem mora ou acabou de chegar na cidade. */}
              <Route path="/mapa" element={<MapaGeral />} />
              <Route path="/perto-de-mim" element={<PertoDeMim />} />
              <Route path="/servicos-online" element={<ServicosOnline />} />
              <Route path="/primeiros-passos" element={<PrimeirosPassos />} />

              <Route path="/sobre" element={<Sobre />} />

              {/* Páginas da aula "useEffect + Consumo de API":
                  /contatos usa fetch (Exemplos 2 a 5) e /lembretes é o Exemplo 6. */}
              <Route path="/contatos" element={<Contatos />} />
              <Route path="/lembretes" element={<Lembretes />} />

              {/* Detalhe de um local: /saude/ubs-jd-california.
                  Os dois pedaços da URL chegam pelo useParams() na página.
                  As rotas fixas acima têm prioridade sobre esta. */}
              <Route path="/:categoria/:id" element={<Local />} />

              {/* path="*" = curinga. Qualquer endereço não listado acima cai aqui
                  (página 404). Precisa ser sempre a última rota. */}
              <Route path="*" element={<NaoEncontrada />} />
            </Route>
          </Routes>
        </Suspense>
      </AppProvider>
    </BrowserRouter>
  );
}
