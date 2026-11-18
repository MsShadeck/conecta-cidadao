package br.com.conectacidadao.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Bairro de Indaiatuba com um ponto de referência no mapa. */
@Entity
@Table(name = "bairro")
public class Bairro {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	private String slug;

	private String nome;

	private Double latitude;

	private Double longitude;

	protected Bairro() {
	}

	public Bairro(String slug, String nome) {
		this.slug = slug;
		this.nome = nome;
	}

	public Integer getId() { return id; }
	public String getSlug() { return slug; }
	public String getNome() { return nome; }
	public Double getLatitude() { return latitude; }
	public Double getLongitude() { return longitude; }
}
