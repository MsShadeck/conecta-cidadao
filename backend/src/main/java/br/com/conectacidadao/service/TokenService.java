package br.com.conectacidadao.service;

import java.time.Duration;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import br.com.conectacidadao.model.Usuario;

/** Gera o token JWT do login: subject = id do usuário; claim "perfil" = CIDADAO ou ADMIN. */
@Service
public class TokenService {

	private final JwtEncoder encoder;
	private final Duration validade;

	public TokenService(JwtEncoder encoder, @Value("${app.jwt.validade-horas:8}") long horas) {
		this.encoder = encoder;
		this.validade = Duration.ofHours(horas);
	}

	public record Token(String valor, Instant expiraEm) {
	}

	public Token gerar(Usuario usuario) {
		Instant agora = Instant.now();
		Instant expira = agora.plus(validade);
		var claims = JwtClaimsSet.builder()
				.issuer("conecta-cidadao-api")
				.issuedAt(agora)
				.expiresAt(expira)
				.subject(String.valueOf(usuario.getId()))
				.claim("nome", usuario.getNome())
				.claim("perfil", usuario.getPerfil().name())
				.build();
		var cabecalho = JwsHeader.with(MacAlgorithm.HS256).build();
		return new Token(encoder.encode(JwtEncoderParameters.from(cabecalho, claims)).getTokenValue(), expira);
	}
}
