package br.com.conectacidadao.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.conectacidadao.dto.VotosPaginaDTO;
import br.com.conectacidadao.exception.RegraNegocioException;
import br.com.conectacidadao.model.AvaliacaoPagina;
import br.com.conectacidadao.model.ProgressoChecklist;
import br.com.conectacidadao.repository.AvaliacaoPaginaRepository;
import br.com.conectacidadao.repository.ChecklistItemRepository;
import br.com.conectacidadao.repository.ProgressoChecklistRepository;

/** Progresso do checklist (UC07) e votos "Esta página foi útil?" (UC12). */
@Service
public class InteracaoService {

	private final ProgressoChecklistRepository progresso;
	private final ChecklistItemRepository itens;
	private final AvaliacaoPaginaRepository avaliacoes;

	public InteracaoService(ProgressoChecklistRepository progresso, ChecklistItemRepository itens,
			AvaliacaoPaginaRepository avaliacoes) {
		this.progresso = progresso;
		this.itens = itens;
		this.avaliacoes = avaliacoes;
	}

	@Transactional(readOnly = true)
	public List<String> itensFeitos(Long usuarioId) {
		return progresso.itensFeitos(usuarioId);
	}

	@Transactional
	public void marcarFeito(Long usuarioId, String itemId) {
		if (!itens.existsById(itemId)) throw new RegraNegocioException("Item do checklist inexistente.");
		var chave = new ProgressoChecklist.Chave(usuarioId, itemId);
		if (!progresso.existsById(chave)) progresso.save(new ProgressoChecklist(usuarioId, itemId));
	}

	@Transactional
	public void desmarcar(Long usuarioId, String itemId) {
		progresso.deleteById(new ProgressoChecklist.Chave(usuarioId, itemId));
	}

	@Transactional(readOnly = true)
	public List<String> paginasVotadas(Long usuarioId) {
		return avaliacoes.paginasDoUsuario(usuarioId);
	}

	@Transactional
	public void votar(Long usuarioId, String pagina) {
		String p = validarPagina(pagina);
		var chave = new AvaliacaoPagina.Chave(usuarioId, p);
		if (!avaliacoes.existsById(chave)) avaliacoes.save(new AvaliacaoPagina(usuarioId, p));
	}

	@Transactional
	public void retirarVoto(Long usuarioId, String pagina) {
		avaliacoes.deleteById(new AvaliacaoPagina.Chave(usuarioId, validarPagina(pagina)));
	}

	@Transactional(readOnly = true)
	public List<VotosPaginaDTO> relatorioVotos() {
		return avaliacoes.contarPorPagina();
	}

	private static String validarPagina(String pagina) {
		if (pagina == null || pagina.isBlank() || pagina.length() > 120 || !pagina.matches("[a-z0-9/_-]+"))
			throw new RegraNegocioException("Página inválida.");
		return pagina;
	}
}
