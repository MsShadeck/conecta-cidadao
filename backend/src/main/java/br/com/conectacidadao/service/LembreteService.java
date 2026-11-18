package br.com.conectacidadao.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.conectacidadao.dto.LembreteDTOs.LembreteDTO;
import br.com.conectacidadao.dto.LembreteDTOs.LembreteForm;
import br.com.conectacidadao.exception.NaoEncontradoException;
import br.com.conectacidadao.exception.RegraNegocioException;
import br.com.conectacidadao.model.Lembrete;
import br.com.conectacidadao.repository.LembreteRepository;
import br.com.conectacidadao.repository.LocalRepository;
import br.com.conectacidadao.repository.UsuarioRepository;

/** CRUD dos lembretes do usuário (UC08). Cada usuário só enxerga e altera os próprios. */
@Service
public class LembreteService {

	private final LembreteRepository lembretes;
	private final LocalRepository locais;
	private final UsuarioRepository usuarios;

	public LembreteService(LembreteRepository lembretes, LocalRepository locais, UsuarioRepository usuarios) {
		this.lembretes = lembretes;
		this.locais = locais;
		this.usuarios = usuarios;
	}

	@Transactional(readOnly = true)
	public List<LembreteDTO> listar(Long usuarioId) {
		return lembretes.listarDoUsuario(usuarioId).stream().map(LembreteDTO::de).toList();
	}

	@Transactional
	public LembreteDTO criar(Long usuarioId, LembreteForm form) {
		var lembrete = new Lembrete(usuarios.getReferenceById(usuarioId));
		aplicar(lembrete, form);
		return LembreteDTO.de(lembretes.save(lembrete));
	}

	@Transactional
	public LembreteDTO alterar(Long usuarioId, Long id, LembreteForm form) {
		var lembrete = obter(usuarioId, id);
		aplicar(lembrete, form);
		return LembreteDTO.de(lembrete);
	}

	@Transactional
	public void excluir(Long usuarioId, Long id) {
		lembretes.delete(obter(usuarioId, id));
	}

	@Transactional(readOnly = true)
	public String exportarIcs(Long usuarioId, Long id) {
		String ics = obter(usuarioId, id).exportarIcs();
		if (ics == null) throw new RegraNegocioException("Só lembretes com data podem ir para o calendário.");
		return ics;
	}

	/** Lembrete de outro usuário responde 404, como se não existisse (não revela que existe). */
	private Lembrete obter(Long usuarioId, Long id) {
		return lembretes.findByIdAndUsuarioId(id, usuarioId)
				.orElseThrow(() -> new NaoEncontradoException("Lembrete não encontrado."));
	}

	private void aplicar(Lembrete l, LembreteForm f) {
		// Mesma regra do CHECK ck_lembrete_hora do banco, com mensagem clara.
		if (f.hora() != null && f.data() == null)
			throw new RegraNegocioException("Para informar a hora, informe também a data.");
		l.setTexto(f.texto().trim());
		l.setData(f.data());
		l.setHora(f.hora());
		String localId = LocalService.vazioParaNulo(f.localId());
		l.setLocal(localId == null ? null
				: locais.findById(localId).orElseThrow(() -> new RegraNegocioException("Local não encontrado.")));
	}
}
