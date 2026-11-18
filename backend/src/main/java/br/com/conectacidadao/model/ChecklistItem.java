package br.com.conectacidadao.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Tarefa do checklist "Primeiros passos". A API só precisa do id e do título para
 * registrar o progresso; o texto completo continua no site (checklist.json).
 */
@Entity
@Table(name = "checklist_item")
public class ChecklistItem {

	@Id
	private String id;

	private String titulo;

	protected ChecklistItem() {
	}

	public ChecklistItem(String id, String titulo) {
		this.id = id;
		this.titulo = titulo;
	}

	public String getId() { return id; }
	public String getTitulo() { return titulo; }
}
