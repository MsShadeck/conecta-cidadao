package br.com.conectacidadao.dto;

import java.util.Map;

/** Corpo das respostas de erro: { "mensagem": "...", "campos": { "cep": "use o formato 00000-000" } }. */
public record ErroDTO(String mensagem, Map<String, String> campos) {

	public ErroDTO(String mensagem) {
		this(mensagem, Map.of());
	}
}
