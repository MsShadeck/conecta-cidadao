package br.com.conectacidadao.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.conectacidadao.dto.SugestaoDTOs.SugestaoDTO;
import br.com.conectacidadao.dto.SugestaoDTOs.SugestaoForm;
import br.com.conectacidadao.exception.NaoEncontradoException;
import br.com.conectacidadao.exception.RegraNegocioException;
import br.com.conectacidadao.model.StatusSugestao;
import br.com.conectacidadao.model.SugestaoLocal;
import br.com.conectacidadao.repository.CategoriaRepository;
import br.com.conectacidadao.repository.SugestaoLocalRepository;
import br.com.conectacidadao.repository.UsuarioRepository;

/** Sugestões de locais (UC11) e moderação pelo administrador (UC15). */
@Service
public class SugestaoService {

	private final SugestaoLocalRepository sugestoes;
	private final CategoriaRepository categorias;
	private final UsuarioRepository usuarios;

	public SugestaoService(SugestaoLocalRepository sugestoes, CategoriaRepository categorias,
			UsuarioRepository usuarios) {
		this.sugestoes = sugestoes;
		this.categorias = categorias;
		this.usuarios = usuarios;
	}

	@Transactional(readOnly = true)
	public List<SugestaoDTO> listarMinhas(Long usuarioId, String categoria) {
		return sugestoes.listarDoUsuario(usuarioId, LocalService.vazioParaNulo(categoria)).stream()
				.map(s -> SugestaoDTO.de(s, false)).toList();
	}

	@Transactional
	public SugestaoDTO criar(Long usuarioId, SugestaoForm form) {
		var categoria = categorias.findById(form.categoria())
				.orElseThrow(() -> new RegraNegocioException("Categoria inexistente."));
		var s = sugestoes.save(new SugestaoLocal(usuarios.getReferenceById(usuarioId), categoria, form.nome().trim()));
		return SugestaoDTO.de(s, false);
	}

	@Transactional
	public void excluir(Long usuarioId, Long id) {
		var s = sugestoes.findByIdAndUsuarioId(id, usuarioId)
				.orElseThrow(() -> new NaoEncontradoException("Sugestão não encontrada."));
		sugestoes.delete(s);
	}

	@Transactional(readOnly = true)
	public List<SugestaoDTO> listarParaModeracao(StatusSugestao status) {
		return sugestoes.listarParaModeracao(status).stream().map(s -> SugestaoDTO.de(s, true)).toList();
	}

	@Transactional
	public SugestaoDTO moderar(Long id, StatusSugestao status) {
		var s = sugestoes.findById(id).orElseThrow(() -> new NaoEncontradoException("Sugestão não encontrada."));
		switch (status) {
			case APROVADA -> s.aprovar();
			case RECUSADA -> s.recusar();
			case PENDENTE -> throw new RegraNegocioException("Escolha aprovar ou recusar.");
		}
		return SugestaoDTO.de(s, true);
	}
}
