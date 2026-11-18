package br.com.conectacidadao.dto;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import br.com.conectacidadao.model.FaixaHorario;
import br.com.conectacidadao.model.Local;

/**
 * Um local no MESMO formato do public/api/locais.json. Assim o front-end troca o
 * arquivo estático pela API sem mudar nenhuma página.
 */
public record LocalDTO(
		String id,
		String nome,
		String categoria,
		String tipo,
		Endereco endereco,
		String enderecoTexto,
		Coordenadas coordenadas,
		List<String> telefones,
		Horarios horarios,
		String horarioTexto,
		List<String> servicos,
		List<String> palavrasChave,
		List<String> niveis,
		String site,
		String entrada,
		String imagem,
		String observacao,
		String cnes,
		Acessibilidade acessibilidade,
		List<String> fonte,
		String atualizadoEm) {

	public record Endereco(String logradouro, String numero, String bairro, String cep) {
	}

	public record Coordenadas(Double lat, Double lng, boolean aproximada, String fonte) {
	}

	public record Faixa(List<String> dias, String abre, String fecha) {
	}

	public record Horarios(List<Faixa> faixas, String feriados, boolean vinteQuatroHoras) {
	}

	public record Acessibilidade(Boolean rampa, Boolean banheiroAdaptado) {
	}

	private static final List<String> ORDEM_DIAS = List.of("seg", "ter", "qua", "qui", "sex", "sab", "dom");

	public static LocalDTO de(Local l) {
		var tipo = l.getTipo();
		// O bairro como a fonte oficial escreveu; o cadastro de bairros só completa quando falta.
		String bairro = l.getBairroNome() != null ? l.getBairroNome()
				: (l.getBairro() != null ? l.getBairro().getNome() : null);
		Endereco endereco = (l.getLogradouro() == null && l.getNumero() == null && bairro == null && l.getCep() == null)
				? null
				: new Endereco(l.getLogradouro(), l.getNumero(), bairro, l.getCep());
		Coordenadas coordenadas = (l.getLatitude() == null || l.getLongitude() == null)
				? null
				: new Coordenadas(l.getLatitude(), l.getLongitude(), l.isCoordenadaAproximada(), l.getCoordenadaFonte());
		return new LocalDTO(
				l.getId(), l.getNome(), tipo.getCategoria().getSlug(), tipo.getNome(),
				endereco, l.getEnderecoCompleto(), coordenadas,
				List.copyOf(l.getTelefones()), horarios(l), l.getHorarioTexto(),
				List.copyOf(l.getServicos()), List.copyOf(l.getPalavrasChave()), List.copyOf(l.getNiveis()),
				l.getSite(), l.getEntrada(), l.getImagem(), l.getObservacao(), l.getCnes(),
				new Acessibilidade(l.getTemRampa(), l.getTemBanheiroAdaptado()),
				List.copyOf(l.getFontes()), String.valueOf(l.getAtualizadoEm()));
	}

	/** Junta os dias com o mesmo horário: seg..sex 08:00–17:00 vira uma faixa só (como no JSON). */
	private static Horarios horarios(Local l) {
		if (l.getHorarios().isEmpty() && !l.isVinteQuatroHoras()) return null;
		Map<String, List<String>> porHorario = new LinkedHashMap<>();
		l.getHorarios().stream()
				.sorted((a, b) -> ORDEM_DIAS.indexOf(a.getDiaSemana()) - ORDEM_DIAS.indexOf(b.getDiaSemana()))
				.forEach(f -> porHorario.computeIfAbsent(chave(f), k -> new ArrayList<>()).add(f.getDiaSemana()));
		List<Faixa> faixas = porHorario.entrySet().stream().map(e -> {
			String[] h = e.getKey().split("\\|");
			return new Faixa(e.getValue(), h[0], h[1]);
		}).toList();
		return new Horarios(faixas, l.getAbreFeriados(), l.isVinteQuatroHoras());
	}

	private static String chave(FaixaHorario f) {
		return f.getAbre() + "|" + f.getFecha();
	}
}
