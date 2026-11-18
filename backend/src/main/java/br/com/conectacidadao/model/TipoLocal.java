package br.com.conectacidadao.model;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** Tipo de local (UBS, EMEB, CRAS, Parque...). Cada tipo pertence a uma categoria. */
@Entity
@Table(name = "tipo_local")
public class TipoLocal {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	private String nome;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "categoria_slug")
	private Categoria categoria;

	protected TipoLocal() {
	}

	public TipoLocal(String nome, Categoria categoria) {
		this.nome = nome;
		this.categoria = categoria;
	}

	public Integer getId() { return id; }
	public String getNome() { return nome; }
	public Categoria getCategoria() { return categoria; }
}
