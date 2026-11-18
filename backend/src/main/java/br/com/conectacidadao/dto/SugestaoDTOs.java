package br.com.conectacidadao.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import br.com.conectacidadao.model.StatusSugestao;
import br.com.conectacidadao.model.SugestaoLocal;

/** Sugestões de locais (RF11) e moderação pelo administrador (RF15). */
public final class SugestaoDTOs {

	private SugestaoDTOs() {
	}

	public record SugestaoForm(@NotBlank @Size(max = 20) String categoria, @NotBlank @Size(max = 150) String nome) {
	}

	public record ModeracaoForm(@NotNull StatusSugestao status) {
	}

	public record SugestaoDTO(String id, String categoria, String nome, String status, String criadoEm, String autor) {
		public static SugestaoDTO de(SugestaoLocal s, boolean comAutor) {
			return new SugestaoDTO(String.valueOf(s.getId()), s.getCategoria().getSlug(), s.getNome(),
					s.getStatus().name(), String.valueOf(s.getCriadoEm()),
					comAutor ? s.getUsuario().getNome() : null);
		}
	}
}
