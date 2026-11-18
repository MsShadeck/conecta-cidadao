package br.com.conectacidadao.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Categoria fixa do site (Saúde, Educação, Segurança, Lazer e cultura, Cidadania, Transporte). */
@Entity
@Table(name = "categoria")
public class Categoria {

	@Id
	private String slug;

	private String nome;

	private String rota;

	private String resumo;

	protected Categoria() {
	}

	public Categoria(String slug, String nome, String rota) {
		this.slug = slug;
		this.nome = nome;
		this.rota = rota;
	}

	public String getSlug() { return slug; }
	public String getNome() { return nome; }
	public String getRota() { return rota; }
	public String getResumo() { return resumo; }
}
