package br.com.conectacidadao.model;

import java.io.Serializable;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/** Voto "Esta página foi útil?": no máximo um por usuário e página (chave composta). */
@Entity
@Table(name = "avaliacao_pagina")
public class AvaliacaoPagina {

	@EmbeddedId
	private Chave chave;

	@Column(nullable = false)
	private LocalDateTime criadoEm;

	protected AvaliacaoPagina() {
	}

	public AvaliacaoPagina(Long usuarioId, String pagina) {
		this.chave = new Chave(usuarioId, pagina);
		this.criadoEm = LocalDateTime.now();
	}

	public Chave getChave() { return chave; }
	public LocalDateTime getCriadoEm() { return criadoEm; }

	@Embeddable
	public record Chave(@Column(name = "usuario_id") Long usuarioId,
			@Column(name = "pagina", length = 120) String pagina) implements Serializable {
	}
}
