# API do Conecta Cidadão (back-end)

API REST em **Java 21 + Spring Boot 4.1 + Spring Data JPA**, ligada ao banco **MySQL/MariaDB**
`conecta_cidadao` (scripts em [`../database`](../database/README.md)). Segue o mesmo padrão das
atividades do semestre: `controller → service → repository → model`.

## Como rodar (com o XAMPP)

1. Ligue o **MySQL** no painel do XAMPP.
2. Crie o banco: no phpMyAdmin, aba **Importar**, importe `database/01-criacao.sql` e depois
   `database/02-carga-dados.sql`. Pelo terminal:

   ```bash
   mysql -u root < ../database/01-criacao.sql
   mysql -u root < ../database/02-carga-dados.sql
   ```

3. Defina as variáveis e suba a API (Windows PowerShell):

   ```powershell
   $env:DB_USUARIO = "root"; $env:DB_SENHA = ""
   $env:JWT_SEGREDO = "troque-por-uma-frase-longa-com-32-caracteres-ou-mais"
   $env:ADMIN_EMAIL = "admin@exemplo.com"; $env:ADMIN_SENHA = "uma-senha-forte"
   .\mvnw.cmd spring-boot:run
   ```

   A API sobe em `http://localhost:8080`. O primeiro administrador é criado a partir de
   `ADMIN_EMAIL`/`ADMIN_SENHA`; não existe senha padrão no código.

4. No site (pasta raiz), crie `.env.local` com `VITE_API_URL=http://localhost:8080` e rode `npm run dev`.
   O menu ganha **Entrar** e, para o administrador, **Administração**.

| Variável       | Padrão                                         | Para quê                                            |
| -------------- | ---------------------------------------------- | --------------------------------------------------- |
| `DB_URL`       | `jdbc:mysql://localhost:3306/conecta_cidadao…` | Endereço do banco                                   |
| `DB_USUARIO`   | `root`                                         | Usuário do banco                                    |
| `DB_SENHA`     | vazio                                          | Senha do banco (XAMPP vem sem senha)                |
| `JWT_SEGREDO`  | aleatório a cada início                        | Chave dos tokens (mín. 32 caracteres)               |
| `ADMIN_EMAIL`  | —                                              | E-mail do primeiro administrador                    |
| `ADMIN_SENHA`  | —                                              | Senha do primeiro administrador (mín. 8 caracteres) |
| `CORS_ORIGENS` | `http://localhost:5173,http://localhost:4173`  | Endereços do site que podem chamar a API            |
| `PORT`         | `8080`                                         | Porta da API                                        |

## Endpoints

| Método e rota                                                                                        | Acesso  | O que faz                                             |
| ---------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------- |
| `GET /api/locais?categoria=&tipo=&bairro=&q=&aberto=`                                                | público | Lista e busca locais (mesmo formato do `locais.json`) |
| `GET /api/locais/{id}`                                                                               | público | Um local                                              |
| `POST /api/locais` · `PUT /api/locais/{id}` · `DELETE /api/locais/{id}`                              | ADMIN   | CRUD do catálogo                                      |
| `GET /api/categorias` · `/api/tipos` · `/api/bairros`                                                | público | Listas para os formulários                            |
| `POST /api/auth/cadastro` · `POST /api/auth/login`                                                   | público | Cria conta / entra (devolve o token JWT)              |
| `GET` · `PUT` · `DELETE /api/auth/me`                                                                | logado  | Dados, preferências e exclusão da conta               |
| `GET` · `POST /api/lembretes` · `PUT` · `DELETE /api/lembretes/{id}` · `GET /api/lembretes/{id}/ics` | logado  | CRUD de lembretes                                     |
| `GET` · `POST /api/sugestoes` · `DELETE /api/sugestoes/{id}`                                         | logado  | Sugestões de locais                                   |
| `GET /api/admin/sugestoes?status=` · `PATCH /api/admin/sugestoes/{id}`                               | ADMIN   | Moderação                                             |
| `GET /api/checklist/progresso` · `PUT` · `DELETE /api/checklist/progresso/{item}`                    | logado  | Checklist                                             |
| `GET` · `PUT` · `DELETE /api/avaliacoes?pagina=`                                                     | logado  | Voto "Esta página foi útil?"                          |
| `GET /api/admin/avaliacoes`                                                                          | ADMIN   | Votos por página                                      |

Erros voltam como `{ "mensagem": "...", "campos": { "cep": "use o formato 00000-000" } }`.

## Segurança

- Senhas com **BCrypt**; login devolve **JWT HS256** com validade de 8 h (id e perfil no token).
- O id do usuário vem sempre do token, nunca do corpo da requisição; lembrete ou sugestão de outra
  pessoa responde 404.
- Rotas de manutenção exigem o perfil `ADMIN` na própria API (o menu só esconde o link).
- CORS restrito às origens do site; consultas parametrizadas pelo JPA (sem SQL montado com texto).
- Excluir a conta apaga lembretes, sugestões, checklist e votos (LGPD, art. 18).

## Testes

```bash
.\mvnw.cmd test
```

10 testes de integração (`ApiIntegracaoTest`) percorrem HTTP → controller → service → JPA → banco
(H2 em memória no modo MySQL): consulta pública, busca, cadastro e login, CRUD de lembretes com
isolamento entre usuários, CRUD de locais só para ADMIN com validações, moderação de sugestões,
checklist, votos e exclusão de conta.
