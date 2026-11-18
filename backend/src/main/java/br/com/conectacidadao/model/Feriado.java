package br.com.conectacidadao.model;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Feriado nacional, municipal ou ponto facultativo (usado no filtro "Aberto agora"). */
@Entity
@Table(name = "feriado")
public class Feriado {

	@Id
	private LocalDate data;

	private String nome;

	/** nacional, municipal ou ponto facultativo. */
	private String tipo;

	private String fonteUrl;

	protected Feriado() {
	}

	public Feriado(LocalDate data, String nome, String tipo, String fonteUrl) {
		this.data = data;
		this.nome = nome;
		this.tipo = tipo;
		this.fonteUrl = fonteUrl;
	}

	/** Ponto facultativo não fecha os serviços. */
	public boolean fechaServicos() {
		return !"ponto facultativo".equals(tipo);
	}

	public LocalDate getData() { return data; }
	public String getNome() { return nome; }
	public String getTipo() { return tipo; }
}
