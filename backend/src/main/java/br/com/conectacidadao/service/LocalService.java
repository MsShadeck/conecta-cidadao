package br.com.conectacidadao.service;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.conectacidadao.dto.LocaisResposta;
import br.com.conectacidadao.dto.LocalDTO;
import br.com.conectacidadao.dto.LocalForm;
import br.com.conectacidadao.exception.NaoEncontradoException;
import br.com.conectacidadao.exception.RegraNegocioException;
import br.com.conectacidadao.model.FaixaHorario;
import br.com.conectacidadao.model.Local;
import br.com.conectacidadao.repository.BairroRepository;
import br.com.conectacidadao.repository.FeriadoRepository;
import br.com.conectacidadao.repository.LembreteRepository;
import br.com.conectacidadao.repository.LocalRepository;
import br.com.conectacidadao.repository.TipoLocalRepository;

/** Consulta pública dos locais (UC01–UC03) e manutenção pelo administrador (UC14). */
@Service
public class LocalService {

	private static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");

	private final LocalRepository locais;
	private final TipoLocalRepository tipos;
	private final BairroRepository bairros;
	private final FeriadoRepository feriados;
	private final LembreteRepository lembretes;

	public LocalService(LocalRepository locais, TipoLocalRepository tipos, BairroRepository bairros,
			FeriadoRepository feriados, LembreteRepository lembretes) {
		this.locais = locais;
		this.tipos = tipos;
		this.bairros = bairros;
		this.feriados = feriados;
		this.lembretes = lembretes;
	}

	public record Filtro(String categoria, String tipo, String bairro, String texto, boolean abertoAgora) {
	}

	@Transactional(readOnly = true)
	public LocaisResposta listar(Filtro f) {
		var encontrados = locais.buscar(vazioParaNulo(f.categoria()), vazioParaNulo(f.tipo()),
				vazioParaNulo(f.bairro()), vazioParaNulo(f.texto()));
		if (f.abertoAgora()) {
			var agora = ZonedDateTime.now(FUSO);
			boolean feriado = feriados.findById(agora.toLocalDate()).map(x -> x.fechaServicos()).orElse(false);
			encontrados = encontrados.stream().filter(l -> l.estaAberto(agora, feriado)).toList();
		}
		LocalDate ultima = locais.ultimaAtualizacao();
		return new LocaisResposta(String.valueOf(ultima), LocaisResposta.FONTES_GERAIS,
				encontrados.stream().map(LocalDTO::de).toList());
	}

	@Transactional(readOnly = true)
	public LocalDTO buscar(String id) {
		return LocalDTO.de(obter(id));
	}

	@Transactional
	public LocalDTO incluir(LocalForm form) {
		String id = vazioParaNulo(form.id()) != null ? form.id() : slug(form.nome());
		if (locais.existsById(id))
			throw new RegraNegocioException(HttpStatus.CONFLICT, "Já existe um local com o identificador \"" + id + "\".");
		var local = new Local(id);
		aplicar(local, form);
		return LocalDTO.de(locais.save(local));
	}

	@Transactional
	public LocalDTO alterar(String id, LocalForm form) {
		var local = obter(id);
		aplicar(local, form);
		return LocalDTO.de(local);
	}

	/** Exclui o local; telefones, horários e fontes saem juntos e os lembretes ficam sem local. */
	@Transactional
	public void excluir(String id) {
		obter(id);
		lembretes.desvincularLocal(id);
		locais.deleteById(id);
	}

	private Local obter(String id) {
		return locais.findById(id).orElseThrow(() -> new NaoEncontradoException("Local não encontrado."));
	}

	private void aplicar(Local l, LocalForm f) {
		l.setNome(f.nome().trim());
		l.setTipo(tipos.findById(f.tipoLocalId())
				.orElseThrow(() -> new RegraNegocioException("Tipo de local inexistente.")));
		l.setLogradouro(vazioParaNulo(f.logradouro()));
		l.setNumero(vazioParaNulo(f.numero()));
		l.setBairroNome(vazioParaNulo(f.bairroNome()));
		l.setBairro(l.getBairroNome() == null ? null : bairros.findFirstByNomeIgnoreCase(l.getBairroNome()).orElse(null));
		l.setCep(vazioParaNulo(f.cep()));
		if ((f.latitude() == null) != (f.longitude() == null))
			throw new RegraNegocioException("Informe latitude e longitude juntas (ou nenhuma).");
		l.setLatitude(f.latitude());
		l.setLongitude(f.longitude());
		// Ponto digitado pelo administrador: exato e com origem "manual".
		l.setCoordenadaAproximada(false);
		l.setCoordenadaFonte(f.latitude() == null ? null : "manual");
		l.setEnderecoCompleto(montarEndereco(l));
		l.setHorarioTexto(vazioParaNulo(f.horarioTexto()));
		l.setVinteQuatroHoras(Boolean.TRUE.equals(f.vinteQuatroHoras()));
		l.setSite(vazioParaNulo(f.site()));
		l.setObservacao(vazioParaNulo(f.observacao()));
		l.setAtualizadoEm(LocalDate.now(FUSO));

		substituir(l.getTelefones(), semRepetir(f.telefones()));
		substituir(l.getServicos(), semRepetir(f.servicos()));
		substituir(l.getFontes(), semRepetir(f.fontes()));
		l.getPalavrasChave().clear();
		semRepetir(f.palavrasChave()).forEach(p -> l.getPalavrasChave().add(p.toLowerCase()));

		l.getHorarios().clear();
		var dias = new HashSet<String>();
		for (var faixa : f.horarios() == null ? List.<LocalForm.FaixaForm>of() : f.horarios()) {
			if (faixa.fecha().compareTo(faixa.abre()) <= 0)
				throw new RegraNegocioException("O horário de fechar deve ser depois do de abrir (" + faixa.dia() + ").");
			if (!dias.add(faixa.dia() + faixa.abre()))
				throw new RegraNegocioException("Faixa de horário repetida em " + faixa.dia() + ".");
			l.getHorarios().add(new FaixaHorario(faixa.dia(), faixa.abre(), faixa.fecha()));
		}
	}

	private static String montarEndereco(Local l) {
		if (l.getLogradouro() == null) return null;
		var sb = new StringBuilder(l.getLogradouro());
		if (l.getNumero() != null) sb.append(", ").append(l.getNumero());
		if (l.getBairroNome() != null) sb.append(" - ").append(l.getBairroNome());
		return sb.toString();
	}

	private static <T> void substituir(List<T> destino, List<T> novos) {
		destino.clear();
		destino.addAll(novos);
	}

	private static List<String> semRepetir(List<String> lista) {
		if (lista == null) return List.of();
		return lista.stream().filter(Objects::nonNull).map(String::trim).filter(s -> !s.isEmpty()).distinct().toList();
	}

	static String vazioParaNulo(String s) {
		return s == null || s.isBlank() ? null : s.trim();
	}

	/** "UBS Jardim Brasil" → "ubs-jardim-brasil" (o mesmo padrão dos ids do site). */
	static String slug(String nome) {
		String semAcento = Normalizer.normalize(nome, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
		String s = semAcento.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
		return s.length() > 80 ? s.substring(0, 80).replaceAll("-$", "") : s;
	}
}
