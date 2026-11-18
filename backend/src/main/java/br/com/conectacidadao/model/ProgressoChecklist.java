package br.com.conectacidadao.model;

import java.io.Serializable;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/** Tarefa do checklist marcada como feita por um usuário (chave composta usuário + item). */
@Entity
@Table(name = "progresso_checklist")
public class ProgressoChecklist {

	@EmbeddedId
	private Chave chave;

	@Column(nullable = false)
	private LocalDateTime feitoEm;

	protected ProgressoChecklist() {
	}

	public ProgressoChecklist(Long usuarioId, String itemId) {
		this.chave = new Chave(usuarioId, itemId);
		this.feitoEm = LocalDateTime.now();
	}

	public Chave getChave() { return chave; }
	public LocalDateTime getFeitoEm() { return feitoEm; }

	@Embeddable
	public record Chave(@Column(name = "usuario_id") Long usuarioId,
			@Column(name = "item_id", length = 60) String itemId) implements Serializable {
	}
}
