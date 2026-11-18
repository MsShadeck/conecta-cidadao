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

/** Conta do cidadão ou do administrador, com as preferências de tela. */
@Entity
@Table(name = "usuario")
public class Usuario {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 120)
	private String nome;

	@Column(nullable = false, unique = true, length = 160)
	private String email;

	/** Hash BCrypt (60 caracteres). A senha nunca é gravada em texto. */
	@Column(nullable = false, length = 60)
	private String senhaHash;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private Perfil perfil = Perfil.CIDADAO;

	/** "Meu bairro" (no navegador: cc:meu-bairro). */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "bairro_id")
	private Bairro bairro;

	/** auto, claro ou escuro. */
	@Column(nullable = false, length = 6)
	private String tema = "auto";

	/** normal, grande ou maior. */
	@Column(nullable = false, length = 6)
	private String tamanhoFonte = "normal";

	private boolean libras;

	private boolean ativo = true;

	@Column(nullable = false, updatable = false)
	private LocalDateTime criadoEm;

	protected Usuario() {
	}

	public Usuario(String nome, String email, String senhaHash, Perfil perfil) {
		this.nome = nome;
		this.email = email;
		this.senhaHash = senhaHash;
		this.perfil = perfil;
	}

	@PrePersist
	void aoCriar() {
		if (criadoEm == null) criadoEm = LocalDateTime.now();
	}

	public boolean isAdmin() {
		return perfil == Perfil.ADMIN;
	}

	public Long getId() { return id; }
	public String getNome() { return nome; }
	public void setNome(String nome) { this.nome = nome; }
	public String getEmail() { return email; }
	public String getSenhaHash() { return senhaHash; }
	public Perfil getPerfil() { return perfil; }
	public Bairro getBairro() { return bairro; }
	public void setBairro(Bairro bairro) { this.bairro = bairro; }
	public String getTema() { return tema; }
	public void setTema(String tema) { this.tema = tema; }
	public String getTamanhoFonte() { return tamanhoFonte; }
	public void setTamanhoFonte(String tamanhoFonte) { this.tamanhoFonte = tamanhoFonte; }
	public boolean isLibras() { return libras; }
	public void setLibras(boolean libras) { this.libras = libras; }
	public boolean isAtivo() { return ativo; }
	public LocalDateTime getCriadoEm() { return criadoEm; }
}
