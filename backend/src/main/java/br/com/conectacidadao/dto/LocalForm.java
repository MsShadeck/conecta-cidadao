package br.com.conectacidadao.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Dados que o administrador envia para incluir ou alterar um local (RF15).
 * As anotações validam antes de chegar ao banco; o banco ainda confere de novo
 * com as restrições CHECK, FK e NOT NULL.
 */
public record LocalForm(
		@Size(max = 80) @Pattern(regexp = "[a-z0-9-]*", message = "use só letras minúsculas, números e hífen") String id,
		@NotBlank @Size(max = 150) String nome,
		@NotNull(message = "escolha o tipo do local") Integer tipoLocalId,
		@Size(max = 150) String logradouro,
		@Size(max = 20) String numero,
		@Size(max = 100) String bairroNome,
		@Pattern(regexp = "\\d{5}-\\d{3}", message = "use o formato 00000-000") String cep,
		@DecimalMin("-90") @DecimalMax("90") Double latitude,
		@DecimalMin("-180") @DecimalMax("180") Double longitude,
		@Size(max = 255) String horarioTexto,
		Boolean vinteQuatroHoras,
		@Size(max = 255) @Pattern(regexp = "(https?://.*)?", message = "o site deve começar com http:// ou https://") String site,
		@Size(max = 2000) String observacao,
		List<@NotBlank @Size(max = 40) String> telefones,
		List<@Valid FaixaForm> horarios,
		@NotEmpty(message = "informe ao menos uma fonte oficial")
		List<@NotBlank @Size(max = 500) @Pattern(regexp = "https?://.+", message = "a fonte deve ser um link http(s)") String> fontes,
		List<@NotBlank @Size(max = 255) String> servicos,
		List<@NotBlank @Size(max = 80) String> palavrasChave) {

	public record FaixaForm(
			@NotNull @Pattern(regexp = "seg|ter|qua|qui|sex|sab|dom", message = "dia inválido") String dia,
			@NotNull @Pattern(regexp = "([01][0-9]|2[0-3]):[0-5][0-9]", message = "use HH:mm") String abre,
			@NotNull @Pattern(regexp = "([01][0-9]|2[0-3]):[0-5][0-9]|24:00", message = "use HH:mm (até 24:00)") String fecha) {
	}
}
