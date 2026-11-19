package br.com.conectacidadao.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import org.hibernate.annotations.ColumnTransformer;

/**
 * Uma linha da tabela horario_funcionamento: um dia da semana com o horário de abrir e fechar.
 * "seg a sex, 8h às 17h" vira cinco faixas, o que permite calcular o "Aberto agora".
 *
 * Os horários ficam como texto "HH:mm" no Java porque a fonte usa "24:00" para "até a
 * meia-noite", e o java.time.LocalTime não aceita 24:00 (o TIME do MySQL aceita).
 * Como o formato tem dois dígitos, comparar o texto é o mesmo que comparar o horário.
 * O CAST na gravação converte o texto para TIME (o PostgreSQL não faz isso sozinho).
 */
@Embeddable
public class FaixaHorario {

	/** seg, ter, qua, qui, sex, sab ou dom (ENUM no banco). */
	@Column(name = "dia_semana", length = 3, nullable = false)
	private String diaSemana;

	@Column(nullable = false, length = 8)
	@ColumnTransformer(write = "cast(? as time)")
	private String abre;

	@Column(nullable = false, length = 8)
	@ColumnTransformer(write = "cast(? as time)")
	private String fecha;

	protected FaixaHorario() {
	}

	public FaixaHorario(String diaSemana, String abre, String fecha) {
		this.diaSemana = diaSemana;
		this.abre = abre;
		this.fecha = fecha;
	}

	/** O banco devolve "07:00:00"; o site usa "07:00". */
	private static String hhmm(String hora) {
		return hora == null || hora.length() < 5 ? hora : hora.substring(0, 5);
	}

	/** A hora "HH:mm" está dentro da faixa? (abre ≤ hora < fecha) */
	public boolean contem(String hora) {
		return hora.compareTo(getAbre()) >= 0 && hora.compareTo(getFecha()) < 0;
	}

	public String getDiaSemana() { return diaSemana; }
	public String getAbre() { return hhmm(abre); }
	public String getFecha() { return hhmm(fecha); }
}
