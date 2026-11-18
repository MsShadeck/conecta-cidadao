package br.com.conectacidadao.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import br.com.conectacidadao.model.Lembrete;

/** Lembretes do usuário (RF08). */
public final class LembreteDTOs {

	private LembreteDTOs() {
	}

	public record LembreteForm(
			@NotBlank @Size(max = 200) String texto,
			LocalDate data,
			LocalTime hora,
			@Size(max = 80) String localId) {
	}

	/** Mesmo formato do localStorage do site: { id, texto, data?, hora?, localId? }. */
	public record LembreteDTO(String id, String texto, String data, String hora, String localId) {
		public static LembreteDTO de(Lembrete l) {
			return new LembreteDTO(String.valueOf(l.getId()), l.getTexto(),
					l.getData() == null ? null : l.getData().toString(),
					l.getHora() == null ? null : l.getHora().format(DateTimeFormatter.ofPattern("HH:mm")),
					l.getLocal() == null ? null : l.getLocal().getId());
		}
	}
}
