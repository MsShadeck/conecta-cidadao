package br.com.conectacidadao;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import com.jayway.jsonpath.JsonPath;

/**
 * Testes de ponta a ponta da API (requisição HTTP → controller → service → JPA → banco H2).
 * Cada teste roda numa transação desfeita no final, então um não interfere no outro.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ApiIntegracaoTest {

	@Autowired
	MockMvc mvc;

	// ------------------------------------------------------------------ apoio

	private String cadastrar(String email) throws Exception {
		var resposta = mvc.perform(post("/api/auth/cadastro").contentType(MediaType.APPLICATION_JSON)
				.content("{\"nome\":\"Maria\",\"email\":\"" + email + "\",\"senha\":\"senha-forte-1\"}"))
				.andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
		return JsonPath.read(resposta, "$.token");
	}

	private String tokenAdmin() throws Exception {
		var resposta = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"admin@conecta.test\",\"senha\":\"senha-do-admin-123\"}"))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
		return JsonPath.read(resposta, "$.token");
	}

	private static MockHttpServletRequestBuilder com(MockHttpServletRequestBuilder req, String token, String json) {
		req.header("Authorization", "Bearer " + token);
		if (json != null) req.contentType(MediaType.APPLICATION_JSON).content(json);
		return req;
	}

	private static final String LOCAL_VALIDO = """
			{"nome":"UBS Teste Nova","tipoLocalId":1,"logradouro":"Rua A","numero":"10","bairroNome":"Centro",
			 "cep":"13330-000","latitude":-23.09,"longitude":-47.21,"horarioTexto":"7h às 17h",
			 "telefones":["(19) 3000-0000"],
			 "horarios":[{"dia":"seg","abre":"07:00","fecha":"17:00"},{"dia":"ter","abre":"07:00","fecha":"17:00"}],
			 "fontes":["https://www.indaiatuba.sp.gov.br/saude/"],"palavrasChave":["Posto"]}
			""";

	// ------------------------------------------------------------------ consulta pública (UC01–UC03)

	@Test
	@DisplayName("GET /api/locais é público e devolve o mesmo formato do locais.json")
	void consultaPublica() throws Exception {
		mvc.perform(get("/api/locais"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.locais", hasSize(2)))
				.andExpect(jsonPath("$.fontes").isArray())
				.andExpect(jsonPath("$.locais[1].id").value("ubs-jd-california"))
				.andExpect(jsonPath("$.locais[1].categoria").value("saude"))
				.andExpect(jsonPath("$.locais[1].endereco.cep").value("13344-321"))
				.andExpect(jsonPath("$.locais[1].coordenadas.lat").value(-23.105477))
				.andExpect(jsonPath("$.locais[1].coordenadas.aproximada").value(true))
				.andExpect(jsonPath("$.locais[1].coordenadas.fonte").value("nominatim"))
				.andExpect(jsonPath("$.locais[1].telefones", contains("(19) 3894-5375", "(19) 3894-5345")))
				// seg e ter têm o mesmo horário → uma faixa só; sábado fica em outra
				.andExpect(jsonPath("$.locais[1].horarios.faixas", hasSize(3)))
				// "24:00" (até a meia-noite) existe nos dados reais e precisa voltar igual
				.andExpect(jsonPath("$.locais[1].horarios.faixas[*].fecha", hasItem("24:00")))
				.andExpect(jsonPath("$.locais[1].horarios.faixas[0].dias", contains("seg", "ter")))
				.andExpect(jsonPath("$.locais[1].horarios.faixas[0].abre").value("07:00"))
				.andExpect(jsonPath("$.locais[1].fonte", hasSize(1)))
				.andExpect(jsonPath("$.locais[0].horarios.vinteQuatroHoras").value(true));
	}

	@Test
	@DisplayName("Busca por palavra-chave e filtro por categoria")
	void buscaEFiltro() throws Exception {
		mvc.perform(get("/api/locais").param("q", "posto"))
				.andExpect(jsonPath("$.locais", hasSize(1)))
				.andExpect(jsonPath("$.locais[0].id").value("ubs-jd-california"));
		mvc.perform(get("/api/locais").param("categoria", "lazer"))
				.andExpect(jsonPath("$.locais", hasSize(1)))
				.andExpect(jsonPath("$.locais[0].id").value("parque-ecologico"));
		// O parque é 24 horas: sempre aparece no filtro "Aberto agora"
		mvc.perform(get("/api/locais").param("aberto", "true"))
				.andExpect(jsonPath("$.locais[*].id", hasItem("parque-ecologico")));
		mvc.perform(get("/api/locais/nao-existe")).andExpect(status().isNotFound());
	}

	// ------------------------------------------------------------------ conta (UC13)

	@Test
	@DisplayName("Cadastro, e-mail duplicado, login errado e login certo")
	void cadastroELogin() throws Exception {
		String token = cadastrar("maria@teste.com");
		mvc.perform(post("/api/auth/cadastro").contentType(MediaType.APPLICATION_JSON)
				.content("{\"nome\":\"Outra\",\"email\":\"MARIA@teste.com\",\"senha\":\"senha-forte-1\"}"))
				.andExpect(status().isConflict());
		mvc.perform(post("/api/auth/cadastro").contentType(MediaType.APPLICATION_JSON)
				.content("{\"nome\":\"Curta\",\"email\":\"curta@teste.com\",\"senha\":\"123\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.senha").exists());
		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"maria@teste.com\",\"senha\":\"errada-123\"}"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.mensagem").value("E-mail ou senha inválidos."));
		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"maria@teste.com\",\"senha\":\"senha-forte-1\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.usuario.perfil").value("CIDADAO"));
		mvc.perform(com(get("/api/auth/me"), token, null))
				.andExpect(jsonPath("$.email").value("maria@teste.com"));
		mvc.perform(com(put("/api/auth/me"), token, "{\"nome\":\"Maria S.\",\"bairroSlug\":\"centro\",\"tema\":\"escuro\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.bairroSlug").value("centro"))
				.andExpect(jsonPath("$.tema").value("escuro"));
	}

	@Test
	@DisplayName("Sem token ou com token falso, os dados do usuário são negados (401)")
	void semToken() throws Exception {
		mvc.perform(get("/api/lembretes")).andExpect(status().isUnauthorized());
		mvc.perform(get("/api/lembretes").header("Authorization", "Bearer abc.def.ghi"))
				.andExpect(status().isUnauthorized());
	}

	// ------------------------------------------------------------------ lembretes (UC08)

	@Test
	@DisplayName("CRUD de lembretes e isolamento entre usuários")
	void crudLembretes() throws Exception {
		String maria = cadastrar("maria2@teste.com");
		String joao = cadastrar("joao@teste.com");

		var criado = mvc.perform(com(post("/api/lembretes"), maria,
				"{\"texto\":\"Levar o cartão do SUS\",\"data\":\"2026-12-01\",\"hora\":\"09:30\",\"localId\":\"ubs-jd-california\"}"))
				.andExpect(status().isCreated())
				.andExpect(header().exists("Location"))
				.andExpect(jsonPath("$.hora").value("09:30"))
				.andReturn().getResponse().getContentAsString();
		String id = JsonPath.read(criado, "$.id");

		mvc.perform(com(post("/api/lembretes"), maria, "{\"texto\":\"Sem data\"}")).andExpect(status().isCreated());
		mvc.perform(com(get("/api/lembretes"), maria, null))
				.andExpect(jsonPath("$", hasSize(2)))
				.andExpect(jsonPath("$[0].id").value(id)); // com data vem primeiro

		mvc.perform(com(put("/api/lembretes/" + id), maria, "{\"texto\":\"Levar RG e cartão do SUS\",\"data\":\"2026-12-02\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.texto").value("Levar RG e cartão do SUS"))
				.andExpect(jsonPath("$.localId").doesNotExist());

		// Regras: hora sem data e local inexistente
		mvc.perform(com(post("/api/lembretes"), maria, "{\"texto\":\"x\",\"hora\":\"10:00\"}"))
				.andExpect(status().isBadRequest());
		mvc.perform(com(post("/api/lembretes"), maria, "{\"texto\":\"x\",\"localId\":\"nao-existe\"}"))
				.andExpect(status().isBadRequest());

		// João não vê nem apaga o lembrete da Maria
		mvc.perform(com(get("/api/lembretes"), joao, null)).andExpect(jsonPath("$", hasSize(0)));
		mvc.perform(com(delete("/api/lembretes/" + id), joao, null)).andExpect(status().isNotFound());

		mvc.perform(com(get("/api/lembretes/" + id + "/ics"), maria, null))
				.andExpect(status().isOk())
				.andExpect(header().string("Content-Type", org.hamcrest.Matchers.startsWith("text/calendar")));
		mvc.perform(com(delete("/api/lembretes/" + id), maria, null)).andExpect(status().isNoContent());
		mvc.perform(com(get("/api/lembretes"), maria, null)).andExpect(jsonPath("$", hasSize(1)));
	}

	// ------------------------------------------------------------------ manutenção de locais (UC14)

	@Test
	@DisplayName("Só o administrador inclui, altera e exclui locais; validações recusam dados inválidos")
	void crudLocaisAdmin() throws Exception {
		String cidadao = cadastrar("cidadao@teste.com");
		String admin = tokenAdmin();

		mvc.perform(com(post("/api/locais"), cidadao, LOCAL_VALIDO)).andExpect(status().isForbidden());

		mvc.perform(com(post("/api/locais"), admin, LOCAL_VALIDO.replace("\"fontes\":[\"https://www.indaiatuba.sp.gov.br/saude/\"]", "\"fontes\":[]")))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.fontes").value("informe ao menos uma fonte oficial"));
		mvc.perform(com(post("/api/locais"), admin, LOCAL_VALIDO.replace("13330-000", "1333")))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.cep").exists());
		mvc.perform(com(post("/api/locais"), admin, LOCAL_VALIDO.replace("\"fecha\":\"17:00\"},{", "\"fecha\":\"06:00\"},{")))
				.andExpect(status().isBadRequest());

		mvc.perform(com(post("/api/locais"), admin, LOCAL_VALIDO))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").value("ubs-teste-nova"))
				.andExpect(jsonPath("$.categoria").value("saude"))
				.andExpect(jsonPath("$.endereco.bairro").value("Centro"))
				.andExpect(jsonPath("$.enderecoTexto").value("Rua A, 10 - Centro"))
				.andExpect(jsonPath("$.palavrasChave", contains("posto")));
		mvc.perform(com(post("/api/locais"), admin, LOCAL_VALIDO)).andExpect(status().isConflict());

		mvc.perform(com(put("/api/locais/ubs-teste-nova"), admin, LOCAL_VALIDO.replace("(19) 3000-0000", "(19) 3000-1111")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.telefones", contains("(19) 3000-1111")));

		mvc.perform(com(delete("/api/locais/ubs-teste-nova"), cidadao, null)).andExpect(status().isForbidden());
		mvc.perform(com(delete("/api/locais/ubs-teste-nova"), admin, null)).andExpect(status().isNoContent());
		mvc.perform(get("/api/locais/ubs-teste-nova")).andExpect(status().isNotFound());
	}

	@Test
	@DisplayName("Excluir um local mantém o lembrete, sem o local (ON DELETE SET NULL)")
	void excluirLocalComLembrete() throws Exception {
		String maria = cadastrar("maria3@teste.com");
		mvc.perform(com(post("/api/lembretes"), maria, "{\"texto\":\"Ir ao parque\",\"localId\":\"parque-ecologico\"}"))
				.andExpect(status().isCreated());
		mvc.perform(com(delete("/api/locais/parque-ecologico"), tokenAdmin(), null)).andExpect(status().isNoContent());
		mvc.perform(com(get("/api/lembretes"), maria, null))
				.andExpect(jsonPath("$", hasSize(1)))
				.andExpect(jsonPath("$[0].localId").doesNotExist());
	}

	// ------------------------------------------------------------------ sugestões (UC11 e UC15)

	@Test
	@DisplayName("Cidadão sugere um local e o administrador aprova")
	void sugestaoEModeracao() throws Exception {
		String maria = cadastrar("maria4@teste.com");
		String admin = tokenAdmin();

		var criada = mvc.perform(com(post("/api/sugestoes"), maria, "{\"categoria\":\"lazer\",\"nome\":\"Praça da Fonte\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.status").value("PENDENTE"))
				.andReturn().getResponse().getContentAsString();
		String id = JsonPath.read(criada, "$.id");

		mvc.perform(com(post("/api/sugestoes"), maria, "{\"categoria\":\"inexistente\",\"nome\":\"X\"}"))
				.andExpect(status().isBadRequest());
		mvc.perform(com(get("/api/admin/sugestoes"), maria, null)).andExpect(status().isForbidden());

		mvc.perform(com(get("/api/admin/sugestoes").param("status", "PENDENTE"), admin, null))
				.andExpect(jsonPath("$[0].nome").value("Praça da Fonte"))
				.andExpect(jsonPath("$[0].autor").value("Maria"));
		mvc.perform(com(patch("/api/admin/sugestoes/" + id), admin, "{\"status\":\"APROVADA\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("APROVADA"));
		mvc.perform(com(get("/api/sugestoes").param("categoria", "lazer"), maria, null))
				.andExpect(jsonPath("$[0].status").value("APROVADA"));
	}

	// ------------------------------------------------------------------ checklist e votos (UC07 e UC12)

	@Test
	@DisplayName("Progresso do checklist e voto 'foi útil' são gravados por usuário")
	void checklistEVotos() throws Exception {
		String maria = cadastrar("maria5@teste.com");
		mvc.perform(com(put("/api/checklist/progresso/ubs-cartao-sus"), maria, null)).andExpect(status().isNoContent());
		mvc.perform(com(put("/api/checklist/progresso/ubs-cartao-sus"), maria, null)).andExpect(status().isNoContent());
		mvc.perform(com(put("/api/checklist/progresso/nao-existe"), maria, null)).andExpect(status().isBadRequest());
		mvc.perform(com(get("/api/checklist/progresso"), maria, null)).andExpect(jsonPath("$", contains("ubs-cartao-sus")));
		mvc.perform(com(delete("/api/checklist/progresso/ubs-cartao-sus"), maria, null)).andExpect(status().isNoContent());
		mvc.perform(com(get("/api/checklist/progresso"), maria, null)).andExpect(jsonPath("$", hasSize(0)));

		mvc.perform(com(put("/api/avaliacoes").param("pagina", "saude/ubs-jd-california"), maria, null))
				.andExpect(status().isNoContent());
		mvc.perform(com(put("/api/avaliacoes").param("pagina", "<script>"), maria, null)).andExpect(status().isBadRequest());
		mvc.perform(com(get("/api/admin/avaliacoes"), tokenAdmin(), null))
				.andExpect(jsonPath("$[0].pagina").value("saude/ubs-jd-california"))
				.andExpect(jsonPath("$[0].votos").value(1));
	}

	@Test
	@DisplayName("Excluir a conta apaga os dados do usuário e impede novo login")
	void excluirConta() throws Exception {
		String maria = cadastrar("maria6@teste.com");
		mvc.perform(com(post("/api/lembretes"), maria, "{\"texto\":\"Algo\"}")).andExpect(status().isCreated());
		mvc.perform(com(delete("/api/auth/me"), maria, null)).andExpect(status().isNoContent());
		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"maria6@teste.com\",\"senha\":\"senha-forte-1\"}"))
				.andExpect(status().isUnauthorized());
		mvc.perform(com(get("/api/admin/sugestoes"), tokenAdmin(), null))
				.andExpect(jsonPath("$[*].autor", not(hasItem("Maria"))));
	}
}
