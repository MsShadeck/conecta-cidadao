package br.com.conectacidadao.dto;

import java.time.Instant;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import br.com.conectacidadao.model.Usuario;

/** Cadastro, login e dados da conta (RF14). */
public final class UsuarioDTOs {

	private UsuarioDTOs() {
	}

	public record CadastroForm(
			@NotBlank @Size(max = 120) String nome,
			@NotBlank @Email @Size(max = 160) String email,
			@NotBlank @Size(min = 8, max = 72, message = "a senha deve ter de 8 a 72 caracteres") String senha) {
	}

	public record LoginForm(@NotBlank @Email String email, @NotBlank String senha) {
	}

	/** Preferências da conta: substituem cc:meu-bairro, cc:tema, cc:fonte e cc:libras do navegador. */
	public record PreferenciasForm(
			@NotBlank @Size(max = 120) String nome,
			@Size(max = 80) String bairroSlug,
			@Pattern(regexp = "auto|claro|escuro") String tema,
			@Pattern(regexp = "normal|grande|maior") String tamanhoFonte,
			Boolean libras) {
	}

	public record UsuarioDTO(Long id, String nome, String email, String perfil, String bairroSlug,
			String tema, String tamanhoFonte, boolean libras) {
		public static UsuarioDTO de(Usuario u) {
			return new UsuarioDTO(u.getId(), u.getNome(), u.getEmail(), u.getPerfil().name(),
					u.getBairro() == null ? null : u.getBairro().getSlug(), u.getTema(), u.getTamanhoFonte(),
					u.isLibras());
		}
	}

	/** Resposta do login/cadastro: o token vai no cabeçalho Authorization: Bearer ... */
	public record TokenDTO(String token, Instant expiraEm, UsuarioDTO usuario) {
	}
}
