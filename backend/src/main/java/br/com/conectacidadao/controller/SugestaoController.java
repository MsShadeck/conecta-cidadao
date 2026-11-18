package br.com.conectacidadao.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.conectacidadao.dto.SugestaoDTOs.ModeracaoForm;
import br.com.conectacidadao.dto.SugestaoDTOs.SugestaoDTO;
import br.com.conectacidadao.dto.SugestaoDTOs.SugestaoForm;
import br.com.conectacidadao.model.StatusSugestao;
import br.com.conectacidadao.service.SugestaoService;
import jakarta.validation.Valid;

/**
 * Sugestões de locais.
 *   GET    /api/sugestoes?categoria=      logado — minhas sugestões
 *   POST   /api/sugestoes                 logado — sugere um local
 *   DELETE /api/sugestoes/{id}            logado — remove a minha sugestão
 *   GET    /api/admin/sugestoes?status=   ADMIN  — fila de moderação
 *   PATCH  /api/admin/sugestoes/{id}      ADMIN  — aprova ou recusa
 */
@RestController
public class SugestaoController {

	private final SugestaoService servico;

	public SugestaoController(SugestaoService servico) {
		this.servico = servico;
	}

	@GetMapping("/api/sugestoes")
	public List<SugestaoDTO> minhas(@AuthenticationPrincipal Jwt jwt, @RequestParam(required = false) String categoria) {
		return servico.listarMinhas(UsuarioLogado.id(jwt), categoria);
	}

	@PostMapping("/api/sugestoes")
	public ResponseEntity<SugestaoDTO> criar(@AuthenticationPrincipal Jwt jwt, @RequestBody @Valid SugestaoForm form) {
		return ResponseEntity.status(HttpStatus.CREATED).body(servico.criar(UsuarioLogado.id(jwt), form));
	}

	@DeleteMapping("/api/sugestoes/{id}")
	public ResponseEntity<Void> excluir(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
		servico.excluir(UsuarioLogado.id(jwt), id);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/api/admin/sugestoes")
	public List<SugestaoDTO> fila(@RequestParam(required = false) StatusSugestao status) {
		return servico.listarParaModeracao(status);
	}

	@PatchMapping("/api/admin/sugestoes/{id}")
	public SugestaoDTO moderar(@PathVariable Long id, @RequestBody @Valid ModeracaoForm form) {
		return servico.moderar(id, form.status());
	}
}
