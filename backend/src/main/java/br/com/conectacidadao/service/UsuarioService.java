package br.com.conectacidadao.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.conectacidadao.dto.UsuarioDTOs.CadastroForm;
import br.com.conectacidadao.dto.UsuarioDTOs.LoginForm;
import br.com.conectacidadao.dto.UsuarioDTOs.PreferenciasForm;
import br.com.conectacidadao.dto.UsuarioDTOs.TokenDTO;
import br.com.conectacidadao.dto.UsuarioDTOs.UsuarioDTO;
import br.com.conectacidadao.exception.NaoEncontradoException;
import br.com.conectacidadao.exception.RegraNegocioException;
import br.com.conectacidadao.model.Perfil;
import br.com.conectacidadao.model.Usuario;
import br.com.conectacidadao.repository.AvaliacaoPaginaRepository;
import br.com.conectacidadao.repository.BairroRepository;
import br.com.conectacidadao.repository.LembreteRepository;
import br.com.conectacidadao.repository.ProgressoChecklistRepository;
import br.com.conectacidadao.repository.SugestaoLocalRepository;
import br.com.conectacidadao.repository.UsuarioRepository;

/** Cadastro, login e conta do usuário (UC13). */
@Service
public class UsuarioService {


	private final UsuarioRepository usuarios;
	private final BairroRepository bairros;
	private final LembreteRepository lembretes;
	private final SugestaoLocalRepository sugestoes;
	private final ProgressoChecklistRepository progresso;
	private final AvaliacaoPaginaRepository avaliacoes;
	private final PasswordEncoder senhas;
	private final TokenService tokens;
	/** Hash de uma senha qualquer: o login compara mesmo quando o e-mail não existe (tempo parecido). */
	private final String hashFalso;

	public UsuarioService(UsuarioRepository usuarios, BairroRepository bairros, LembreteRepository lembretes,
			SugestaoLocalRepository sugestoes, ProgressoChecklistRepository progresso,
			AvaliacaoPaginaRepository avaliacoes, PasswordEncoder senhas, TokenService tokens) {
		this.usuarios = usuarios;
		this.bairros = bairros;
		this.lembretes = lembretes;
		this.sugestoes = sugestoes;
		this.progresso = progresso;
		this.avaliacoes = avaliacoes;
		this.senhas = senhas;
		this.tokens = tokens;
		this.hashFalso = senhas.encode(java.util.UUID.randomUUID().toString());
	}

	@Transactional
	public TokenDTO cadastrar(CadastroForm form) {
		String email = form.email().trim().toLowerCase();
		if (usuarios.existsByEmailIgnoreCase(email))
			throw new RegraNegocioException(HttpStatus.CONFLICT, "Este e-mail já está cadastrado.");
		var usuario = usuarios.save(new Usuario(form.nome().trim(), email, senhas.encode(form.senha()), Perfil.CIDADAO));
		return emitir(usuario);
	}

	@Transactional(readOnly = true)
	public TokenDTO entrar(LoginForm form) {
		var usuario = usuarios.findByEmailIgnoreCase(form.email().trim()).orElse(null);
		boolean senhaOk = senhas.matches(form.senha(), usuario == null ? hashFalso : usuario.getSenhaHash());
		// Mesma mensagem para e-mail ou senha errados: não revela quais e-mails existem.
		if (usuario == null || !senhaOk || !usuario.isAtivo())
			throw new RegraNegocioException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos.");
		return emitir(usuario);
	}

	@Transactional(readOnly = true)
	public UsuarioDTO buscar(Long id) {
		return UsuarioDTO.de(obter(id));
	}

	@Transactional
	public UsuarioDTO atualizarPreferencias(Long id, PreferenciasForm form) {
		var usuario = obter(id);
		usuario.setNome(form.nome().trim());
		if (form.bairroSlug() == null || form.bairroSlug().isBlank()) {
			usuario.setBairro(null);
		} else {
			usuario.setBairro(bairros.findBySlug(form.bairroSlug())
					.orElseThrow(() -> new RegraNegocioException("Bairro não encontrado.")));
		}
		if (form.tema() != null) usuario.setTema(form.tema());
		if (form.tamanhoFonte() != null) usuario.setTamanhoFonte(form.tamanhoFonte());
		if (form.libras() != null) usuario.setLibras(form.libras());
		return UsuarioDTO.de(usuario);
	}

	/** Exclui a conta e todos os dados dela (direito do titular, LGPD art. 18). */
	@Transactional
	public void excluirConta(Long id) {
		obter(id);
		lembretes.excluirDoUsuario(id);
		sugestoes.excluirDoUsuario(id);
		progresso.excluirDoUsuario(id);
		avaliacoes.excluirDoUsuario(id);
		usuarios.deleteById(id);
	}

	public Usuario obter(Long id) {
		return usuarios.findById(id).orElseThrow(() -> new NaoEncontradoException("Usuário não encontrado."));
	}

	private TokenDTO emitir(Usuario usuario) {
		var token = tokens.gerar(usuario);
		return new TokenDTO(token.valor(), token.expiraEm(), UsuarioDTO.de(usuario));
	}
}
