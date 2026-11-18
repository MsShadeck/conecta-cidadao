package br.com.conectacidadao.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/** Local sugerido por um usuário, moderado pelo administrador. */
@Entity
@Table(name = "sugestao_local")
public class SugestaoLocal {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "usuario_id")
	private Usuario usuario;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "categoria_slug")
	private Categoria categoria;

	@Column(nullable = false, length = 150)
	private String nome;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private StatusSugestao status = StatusSugestao.PENDENTE;

	@Column(nullable = false, updatable = false)
	private LocalDateTime criadoEm;

	protected SugestaoLocal() {
	}

	public SugestaoLocal(Usuario usuario, Categoria categoria, String nome) {
		this.usuario = usuario;
		this.categoria = categoria;
		this.nome = nome;
	}

	@PrePersist
	void aoCriar() {
		if (criadoEm == null) criadoEm = LocalDateTime.now();
	}

	public void aprovar() { this.status = StatusSugestao.APROVADA; }

	public void recusar() { this.status = StatusSugestao.RECUSADA; }

	public Long getId() { return id; }
	public Usuario getUsuario() { return usuario; }
	public Categoria getCategoria() { return categoria; }
	public String getNome() { return nome; }
	public StatusSugestao getStatus() { return status; }
	public LocalDateTime getCriadoEm() { return criadoEm; }
}
