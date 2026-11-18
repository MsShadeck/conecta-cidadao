package br.com.conectacidadao.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/** Lembrete do usuário (página /lembretes), opcionalmente ligado a um local. */
@Entity
@Table(name = "lembrete")
public class Lembrete {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "usuario_id")
	private Usuario usuario;

	@Column(nullable = false, length = 200)
	private String texto;

	private LocalDate data;

	private LocalTime hora;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "local_id")
	private Local local;

	@Column(nullable = false, updatable = false)
	private LocalDateTime criadoEm;

	protected Lembrete() {
	}

	public Lembrete(Usuario usuario) {
		this.usuario = usuario;
	}

	@PrePersist
	void aoCriar() {
		if (criadoEm == null) criadoEm = LocalDateTime.now();
	}

	/** Conteúdo do arquivo .ics (calendário), como o botão "Calendário" do site. */
	public String exportarIcs() {
		if (data == null) return null;
		String inicio = data.toString().replace("-", "")
				+ (hora == null ? "" : "T" + hora.toString().replace(":", "") + "00");
		return "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:lembrete-" + id + "@conecta-cidadao\r\n"
				+ "DTSTART" + (hora == null ? ";VALUE=DATE:" : ":") + inicio + "\r\nSUMMARY:" + texto
				+ (local == null ? "" : "\r\nLOCATION:" + local.getNome()) + "\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n";
	}

	public Long getId() { return id; }
	public Usuario getUsuario() { return usuario; }
	public String getTexto() { return texto; }
	public void setTexto(String texto) { this.texto = texto; }
	public LocalDate getData() { return data; }
	public void setData(LocalDate data) { this.data = data; }
	public LocalTime getHora() { return hora; }
	public void setHora(LocalTime hora) { this.hora = hora; }
	public Local getLocal() { return local; }
	public void setLocal(Local local) { this.local = local; }
	public LocalDateTime getCriadoEm() { return criadoEm; }
}
