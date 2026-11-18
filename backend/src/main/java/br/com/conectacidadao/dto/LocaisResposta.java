package br.com.conectacidadao.dto;

import java.util.List;

/** Resposta de GET /api/locais: o mesmo envelope do locais.json ({ atualizadoEm, fontes, locais }). */
public record LocaisResposta(String atualizadoEm, List<Fonte> fontes, List<LocalDTO> locais) {

	public record Fonte(String nome, String url) {
	}

	/** Fontes gerais do catálogo (as fontes de cada local vêm em locais[].fonte). */
	public static final List<Fonte> FONTES_GERAIS = List.of(
			new Fonte("Prefeitura de Indaiatuba (fichas das unidades)", "https://www.indaiatuba.sp.gov.br/"),
			new Fonte("CNES – Ministério da Saúde", "https://apidadosabertos.saude.gov.br/"),
			new Fonte("© OpenStreetMap contributors (ODbL)", "https://www.openstreetmap.org/copyright"),
			new Fonte("Nominatim (geocodificação OSM)", "https://nominatim.org/"),
			new Fonte("Banco de dados Conecta Cidadão (curadoria do administrador)", "https://github.com/MsShadeck/conecta-cidadao"));
}
