package br.com.conectacidadao.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.conectacidadao.dto.VotosPaginaDTO;
import br.com.conectacidadao.service.InteracaoService;

/**
 * Checklist "Primeiros passos" e votos "Esta página foi útil?".
 *   GET    /api/checklist/progresso              itens feitos
 *   PUT    /api/checklist/progresso/{itemId}     marca como feito
 *   DELETE /api/checklist/progresso/{itemId}     desmarca
 *   GET    /api/avaliacoes                       páginas que votei
 *   PUT    /api/avaliacoes?pagina=saude/haoc     voto
 *   DELETE /api/avaliacoes?pagina=saude/haoc     retira o voto
 *   GET    /api/admin/avaliacoes                 ADMIN — votos por página
 */
@RestController
public class InteracaoController {

	private final InteracaoService servico;

	public InteracaoController(InteracaoService servico) {
		this.servico = servico;
	}

	@GetMapping("/api/checklist/progresso")
	public List<String> feitos(@AuthenticationPrincipal Jwt jwt) {
		return servico.itensFeitos(UsuarioLogado.id(jwt));
	}

	@PutMapping("/api/checklist/progresso/{itemId}")
	public ResponseEntity<Void> marcar(@AuthenticationPrincipal Jwt jwt, @PathVariable String itemId) {
		servico.marcarFeito(UsuarioLogado.id(jwt), itemId);
		return ResponseEntity.noContent().build();
	}

	@DeleteMapping("/api/checklist/progresso/{itemId}")
	public ResponseEntity<Void> desmarcar(@AuthenticationPrincipal Jwt jwt, @PathVariable String itemId) {
		servico.desmarcar(UsuarioLogado.id(jwt), itemId);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/api/avaliacoes")
	public List<String> votadas(@AuthenticationPrincipal Jwt jwt) {
		return servico.paginasVotadas(UsuarioLogado.id(jwt));
	}

	@PutMapping("/api/avaliacoes")
	public ResponseEntity<Void> votar(@AuthenticationPrincipal Jwt jwt, @RequestParam String pagina) {
		servico.votar(UsuarioLogado.id(jwt), pagina);
		return ResponseEntity.noContent().build();
	}

	@DeleteMapping("/api/avaliacoes")
	public ResponseEntity<Void> retirar(@AuthenticationPrincipal Jwt jwt, @RequestParam String pagina) {
		servico.retirarVoto(UsuarioLogado.id(jwt), pagina);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/api/admin/avaliacoes")
	public List<VotosPaginaDTO> relatorio() {
		return servico.relatorioVotos();
	}
}
