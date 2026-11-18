package br.com.conectacidadao.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.conectacidadao.dto.LembreteDTOs.LembreteDTO;
import br.com.conectacidadao.dto.LembreteDTOs.LembreteForm;
import br.com.conectacidadao.service.LembreteService;
import jakarta.validation.Valid;

/**
 * Lembretes do usuário logado (UC08) — CRUD completo.
 *   GET    /api/lembretes            lista
 *   POST   /api/lembretes            cria
 *   PUT    /api/lembretes/{id}       altera
 *   DELETE /api/lembretes/{id}       exclui
 *   GET    /api/lembretes/{id}/ics   arquivo de calendário
 */
@RestController
@RequestMapping("/api/lembretes")
public class LembreteController {

	private final LembreteService servico;

	public LembreteController(LembreteService servico) {
		this.servico = servico;
	}

	@GetMapping
	public List<LembreteDTO> listar(@AuthenticationPrincipal Jwt jwt) {
		return servico.listar(UsuarioLogado.id(jwt));
	}

	@PostMapping
	public ResponseEntity<LembreteDTO> criar(@AuthenticationPrincipal Jwt jwt, @RequestBody @Valid LembreteForm form) {
		var criado = servico.criar(UsuarioLogado.id(jwt), form);
		return ResponseEntity.created(URI.create("/api/lembretes/" + criado.id())).body(criado);
	}

	@PutMapping("/{id}")
	public LembreteDTO alterar(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
			@RequestBody @Valid LembreteForm form) {
		return servico.alterar(UsuarioLogado.id(jwt), id, form);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> excluir(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
		servico.excluir(UsuarioLogado.id(jwt), id);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/{id}/ics")
	public ResponseEntity<String> ics(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
		return ResponseEntity.ok()
				.contentType(MediaType.parseMediaType("text/calendar; charset=utf-8"))
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"lembrete.ics\"")
				.body(servico.exportarIcs(UsuarioLogado.id(jwt), id));
	}
}
