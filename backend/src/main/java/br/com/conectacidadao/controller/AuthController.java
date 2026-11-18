package br.com.conectacidadao.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.conectacidadao.dto.UsuarioDTOs.CadastroForm;
import br.com.conectacidadao.dto.UsuarioDTOs.LoginForm;
import br.com.conectacidadao.dto.UsuarioDTOs.PreferenciasForm;
import br.com.conectacidadao.dto.UsuarioDTOs.TokenDTO;
import br.com.conectacidadao.dto.UsuarioDTOs.UsuarioDTO;
import br.com.conectacidadao.service.UsuarioService;
import jakarta.validation.Valid;

/**
 * Conta do usuário (UC13).
 *   POST   /api/auth/cadastro   público — cria a conta e já devolve o token
 *   POST   /api/auth/login      público — e-mail e senha → token
 *   GET    /api/auth/me         logado  — dados da conta
 *   PUT    /api/auth/me         logado  — nome, bairro e preferências de tela
 *   DELETE /api/auth/me         logado  — exclui a conta e os dados dela
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final UsuarioService servico;

	public AuthController(UsuarioService servico) {
		this.servico = servico;
	}

	@PostMapping("/cadastro")
	public ResponseEntity<TokenDTO> cadastrar(@RequestBody @Valid CadastroForm form) {
		return ResponseEntity.status(HttpStatus.CREATED).body(servico.cadastrar(form));
	}

	@PostMapping("/login")
	public TokenDTO entrar(@RequestBody @Valid LoginForm form) {
		return servico.entrar(form);
	}

	@GetMapping("/me")
	public UsuarioDTO eu(@AuthenticationPrincipal Jwt jwt) {
		return servico.buscar(UsuarioLogado.id(jwt));
	}

	@PutMapping("/me")
	public UsuarioDTO atualizar(@AuthenticationPrincipal Jwt jwt, @RequestBody @Valid PreferenciasForm form) {
		return servico.atualizarPreferencias(UsuarioLogado.id(jwt), form);
	}

	@DeleteMapping("/me")
	public ResponseEntity<Void> excluir(@AuthenticationPrincipal Jwt jwt) {
		servico.excluirConta(UsuarioLogado.id(jwt));
		return ResponseEntity.noContent().build();
	}
}
