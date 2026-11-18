package br.com.conectacidadao.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import br.com.conectacidadao.model.Perfil;
import br.com.conectacidadao.model.Usuario;
import br.com.conectacidadao.repository.UsuarioRepository;

/**
 * Cria o primeiro administrador ao iniciar, a partir das variáveis ADMIN_EMAIL e ADMIN_SENHA.
 * Não existe senha de administrador fixa no código nem nos scripts SQL.
 */
@Component
public class AdminInicial implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(AdminInicial.class);

	private final UsuarioRepository usuarios;
	private final PasswordEncoder senhas;
	private final String email;
	private final String senha;

	public AdminInicial(UsuarioRepository usuarios, PasswordEncoder senhas,
			@Value("${app.admin.email:}") String email, @Value("${app.admin.senha:}") String senha) {
		this.usuarios = usuarios;
		this.senhas = senhas;
		this.email = email;
		this.senha = senha;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (email.isBlank() || senha.isBlank()) return;
		if (senha.length() < 8) {
			log.warn("ADMIN_SENHA tem menos de 8 caracteres: administrador não criado.");
			return;
		}
		if (usuarios.existsByEmailIgnoreCase(email)) return;
		usuarios.save(new Usuario("Administrador", email.trim().toLowerCase(), senhas.encode(senha), Perfil.ADMIN));
		log.info("Administrador inicial criado: {}", email);
	}
}
