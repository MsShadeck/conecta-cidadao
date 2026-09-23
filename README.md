# Conecta Cidadão

Plataforma que reúne os serviços públicos da cidade — Saúde, Segurança, Educação e Lazer —
em uma única interface. Versão em React do Projeto Integrador.

## Como rodar

Você precisa do [Node.js](https://nodejs.org) 18 ou superior instalado.

```bash
npm install     # instala as dependências (só na primeira vez)
npm run dev     # abre em http://localhost:5173
```

Para gerar a versão de produção (pasta `dist/`):

```bash
npm run build
npm run preview   # serve a pasta dist para conferir antes de publicar
```

## Estrutura

```
vercel.json            manda todas as rotas para o index.html (necessário na Vercel)
public/img/            imagens (mesmas do projeto original, otimizadas)
  interface/           logo e ícones
  saude/ seguranca/ educacao/ lazer/
src/
  data/servicos.js     ← todo o conteúdo do site fica aqui
  context/AppContext.jsx   estado global: busca e avisos (toast)
  hooks/               useTituloPagina
  components/          Cabecalho, BuscaOverlay, CardLocal, CardServico,
                       ChipsCategorias, Aviso, Rodape, Layout
  pages/               Home, Categoria, Sobre, NaoEncontrada
  styles/global.css    tokens de cor, reset e classes compartilhadas
  App.jsx              rotas
  main.jsx             ponto de entrada
```

## Rotas

| Página    | Endereço      |
| --------- | ------------- |
| Início    | `/`           |
| Saúde     | `/saude`      |
| Segurança | `/seguranca`  |
| Educação  | `/educacao`   |
| Lazer     | `/lazer`      |
| Sobre     | `/sobre`      |
| Telefones úteis | `/contatos` |
| Lembretes | `/lembretes`  |

As quatro páginas de categoria usam o mesmo componente (`pages/Categoria.jsx`), que recebe
o `slug` pela rota e monta a tela a partir do arquivo de dados.

O projeto usa `BrowserRouter`, então os endereços são limpos, sem `#`.

## Atividades das aulas de React

O código praticado nas aulas **"Review + Rotas"** e **"useEffect + Consumo de API"** foi
aplicado ao tema do Conecta Cidadão. Como a professora pediu, as versões intermediárias
não foram apagadas: ficam comentadas com `/* */` ou `{/* */}` acima da versão ativa.

| Exemplo do material | Onde está no projeto |
| ------------------- | -------------------- |
| Rotas (`BrowserRouter`, `Routes`, `Link`) | `App.jsx`, `Cabecalho.jsx`, `Rodape.jsx` |
| LikeButton (useState) | `components/BotaoUtil.jsx`: "Esta página foi útil?" nas páginas de categoria |
| ListaAlunos (3 etapas: lista fixa, lista vazia com `&&`, input + ternário) | `components/SugestaoLocais.jsx`: "Sugira um local" nas páginas de categoria |
| Exemplo 1: useEffect sem array, com `[]` e com dependência | `hooks/useTituloPagina.js` (título da aba) |
| Tecla: addEventListener + cleanup | `context/AppContext.jsx` (atalho Ctrl + K) |
| Exemplos 2 a 5: fetch, loading e erro, filtro, SearchBar | `components/ListaContatos.jsx` e `components/BarraBusca.jsx`, página `/contatos` |
| Atividades propostas: exibir contato, recarregar, "nenhum encontrado", erro | Versão ativa de `ListaContatos.jsx` |
| Exemplo 6: lista de tarefas | `pages/Lembretes.jsx`, página `/lembretes` |

A página Telefones úteis busca os dados com `fetch('/api/contatos.json')`, arquivo que fica
em `public/api/`. É o mesmo código usado com a API JSONPlaceholder no material, mas com os
telefones de utilidade pública (SAMU, Polícia Militar, Bombeiros etc.).

## Publicar na Vercel

1. Suba o projeto para um repositório no GitHub.
2. Na Vercel, clique em **Add New… → Project** e importe esse repositório.
3. A Vercel reconhece o Vite sozinha. Se pedir para confirmar, use:

   | Campo            | Valor           |
   | ---------------- | --------------- |
   | Framework Preset | Vite            |
   | Build Command    | `npm run build` |
   | Output Directory | `dist`          |
   | Install Command  | `npm install`   |

4. Clique em **Deploy**. Cada `git push` na branch principal gera um novo deploy.

O arquivo `vercel.json` já vai junto e é o que faz as rotas funcionarem. Sem ele, abrir
`seusite.vercel.app/saude` direto na barra de endereços ou atualizar a página com F5
retornaria erro 404: o servidor procuraria um arquivo `saude` que não existe. A regra de
rewrite entrega sempre o `index.html`, e o React Router decide qual página mostrar.

Se um dia trocar a hospedagem para o GitHub Pages, que não aceita esse tipo de regra,
volte para `HashRouter` em `src/App.jsx` e use `base: './'` em `vite.config.js`.

## Como adicionar um local novo

1. Coloque a imagem em `public/img/<categoria>/nome-do-local.jpg`
   (nome em minúsculo, sem acento e sem espaço).
2. Abra `src/data/servicos.js` e adicione um item na lista `locais` da categoria:

```js
{ nome: 'UBS Jardim Morada do Sol', imagem: '/img/saude/ubs-jd-morada-do-sol.jpg' },
```

A contagem de locais, a busca e a página da categoria se atualizam sozinhas.

## Paleta

| Uso              | Cor                                         |
| ---------------- | ------------------------------------------- |
| Fundo            | `#c9e8f5`                                   |
| Fundo claro      | `#eaf6fb`                                   |
| Azul da marca    | `#1a6faf`                                   |
| Azul de destaque | `#3a8fd4`                                   |
| Texto            | `#1a1a2e` / `#3a3a5c`                       |
| Saúde            | `#d4edda` / `#1a6f3a`                       |
| Segurança        | `#fde8d8` / `#a0460a`                       |
| Educação         | `#d8eafd` / `#1a4faf`                       |
| Lazer            | `#e8d8fd` / `#6a1aaf`                       |

Todas ficam em `src/styles/global.css`, no bloco `:root`. Trocar uma cor lá muda o site inteiro.

## Detalhes da migração

- A busca passou a funcionar: filtra os locais das quatro categorias ignorando acento e
  maiúscula, navega com as setas, confirma com Enter, fecha com Esc e abre com `Ctrl + K`
  (`Cmd + K` no Mac).
- Arquivos e pastas foram renomeados sem acento nem espaço, evitando erro 404 em servidor
  Linux e no GitHub Pages.
- As imagens foram redimensionadas para no máximo 900px de largura: 63 MB → 2,7 MB.
- O grid fixo de 4 colunas virou grid responsivo, sem os ajustes manuais de `nth-child`.
- A navegação usa `BrowserRouter`, com o `vercel.json` cuidando do redirecionamento das
  rotas para o `index.html`.

## Equipe

Moisés Globekener de Almeida Shadeck · Homer Betinatti Gomes
