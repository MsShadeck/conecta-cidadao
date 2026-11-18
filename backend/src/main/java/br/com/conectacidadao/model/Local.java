package br.com.conectacidadao.model;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

/**
 * Local público (UBS, escola, CRAS, parque...): a entidade central do sistema.
 * O id é o mesmo slug usado na URL do site (ex.: /saude/ubs-jd-california).
 *
 * As listas (telefones, horários, serviços, palavras-chave, níveis e fontes) ficam em
 * tabelas próprias, ligadas por local_id (1ª Forma Normal). O @ElementCollection faz
 * o JPA ler e gravar essas tabelas junto com o local.
 */
@Entity
@Table(name = "local")
public class Local {

	private static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");
	private static final String[] DIAS = { "seg", "ter", "qua", "qui", "sex", "sab", "dom" };

	@Id
	private String id;

	@Column(nullable = false)
	private String nome;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "tipo_local_id")
	private TipoLocal tipo;

	private String logradouro;
	private String numero;
	private String bairroNome;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "bairro_id")
	private Bairro bairro;

	private String cep;
	private String enderecoCompleto;
	private Double latitude;
	private Double longitude;

	/** O ponto foi achado só pela rua (sem o número)? O site avisa "posição aproximada". */
	private boolean coordenadaAproximada;

	/** osm, nominatim, cnes ou manual (cadastrado pelo administrador). */
	@Column(length = 10)
	private String coordenadaFonte;
	private String horarioTexto;
	private boolean vinteQuatroHoras;

	/** "aberto" ou "fechado" em feriados, quando a fonte informa. */
	private String abreFeriados;

	private String site;
	private String entrada;
	private String imagem;

	@Column(length = 2000)
	private String observacao;

	private String cnes;
	private Boolean temRampa;
	private Boolean temBanheiroAdaptado;

	@Column(nullable = false)
	private LocalDate atualizadoEm;

	@ElementCollection
	@CollectionTable(name = "telefone_local", joinColumns = @JoinColumn(name = "local_id"))
	@OrderColumn(name = "ordem")
	@Column(name = "numero", length = 40)
	private List<String> telefones = new ArrayList<>();

	@ElementCollection
	@CollectionTable(name = "horario_funcionamento", joinColumns = @JoinColumn(name = "local_id"))
	private List<FaixaHorario> horarios = new ArrayList<>();

	@ElementCollection
	@CollectionTable(name = "servico_local", joinColumns = @JoinColumn(name = "local_id"))
	@OrderColumn(name = "ordem")
	@Column(name = "descricao")
	private List<String> servicos = new ArrayList<>();

	@ElementCollection
	@CollectionTable(name = "palavra_chave_local", joinColumns = @JoinColumn(name = "local_id"))
	@Column(name = "palavra", length = 80)
	private Set<String> palavrasChave = new LinkedHashSet<>();

	@ElementCollection
	@CollectionTable(name = "nivel_ensino_local", joinColumns = @JoinColumn(name = "local_id"))
	@Column(name = "nivel", length = 80)
	private Set<String> niveis = new LinkedHashSet<>();

	@ElementCollection
	@CollectionTable(name = "fonte_local", joinColumns = @JoinColumn(name = "local_id"))
	@OrderColumn(name = "ordem")
	@Column(name = "url", length = 500)
	private List<String> fontes = new ArrayList<>();

	protected Local() {
	}

	public Local(String id) {
		this.id = id;
	}

	/**
	 * Está aberto agora? Mesma regra de src/utils/horario.js no front-end:
	 * 24 horas → sempre; senão, procura uma faixa do dia de hoje que contenha a hora atual.
	 */
	public boolean estaAberto(java.time.ZonedDateTime agora, boolean hojeEFeriado) {
		if (vinteQuatroHoras) return true;
		if (hojeEFeriado && !"aberto".equals(abreFeriados)) return false;
		var local = agora.withZoneSameInstant(FUSO);
		String dia = DIAS[local.getDayOfWeek().getValue() - 1];
		String hora = String.format("%02d:%02d", local.getHour(), local.getMinute());
		return horarios.stream().anyMatch(f -> f.getDiaSemana().equals(dia) && f.contem(hora));
	}

	// Getters e setters
	public String getId() { return id; }
	public String getNome() { return nome; }
	public void setNome(String nome) { this.nome = nome; }
	public TipoLocal getTipo() { return tipo; }
	public void setTipo(TipoLocal tipo) { this.tipo = tipo; }
	public String getLogradouro() { return logradouro; }
	public void setLogradouro(String logradouro) { this.logradouro = logradouro; }
	public String getNumero() { return numero; }
	public void setNumero(String numero) { this.numero = numero; }
	public String getBairroNome() { return bairroNome; }
	public void setBairroNome(String bairroNome) { this.bairroNome = bairroNome; }
	public Bairro getBairro() { return bairro; }
	public void setBairro(Bairro bairro) { this.bairro = bairro; }
	public String getCep() { return cep; }
	public void setCep(String cep) { this.cep = cep; }
	public String getEnderecoCompleto() { return enderecoCompleto; }
	public void setEnderecoCompleto(String enderecoCompleto) { this.enderecoCompleto = enderecoCompleto; }
	public Double getLatitude() { return latitude; }
	public void setLatitude(Double latitude) { this.latitude = latitude; }
	public Double getLongitude() { return longitude; }
	public void setLongitude(Double longitude) { this.longitude = longitude; }
	public boolean isCoordenadaAproximada() { return coordenadaAproximada; }
	public void setCoordenadaAproximada(boolean v) { this.coordenadaAproximada = v; }
	public String getCoordenadaFonte() { return coordenadaFonte; }
	public void setCoordenadaFonte(String v) { this.coordenadaFonte = v; }
	public String getHorarioTexto() { return horarioTexto; }
	public void setHorarioTexto(String horarioTexto) { this.horarioTexto = horarioTexto; }
	public boolean isVinteQuatroHoras() { return vinteQuatroHoras; }
	public void setVinteQuatroHoras(boolean vinteQuatroHoras) { this.vinteQuatroHoras = vinteQuatroHoras; }
	public String getAbreFeriados() { return abreFeriados; }
	public String getSite() { return site; }
	public void setSite(String site) { this.site = site; }
	public String getEntrada() { return entrada; }
	public String getImagem() { return imagem; }
	public String getObservacao() { return observacao; }
	public void setObservacao(String observacao) { this.observacao = observacao; }
	public String getCnes() { return cnes; }
	public Boolean getTemRampa() { return temRampa; }
	public Boolean getTemBanheiroAdaptado() { return temBanheiroAdaptado; }
	public LocalDate getAtualizadoEm() { return atualizadoEm; }
	public void setAtualizadoEm(LocalDate atualizadoEm) { this.atualizadoEm = atualizadoEm; }
	public List<String> getTelefones() { return telefones; }
	public List<FaixaHorario> getHorarios() { return horarios; }
	public List<String> getServicos() { return servicos; }
	public Set<String> getPalavrasChave() { return palavrasChave; }
	public Set<String> getNiveis() { return niveis; }
	public List<String> getFontes() { return fontes; }
}
