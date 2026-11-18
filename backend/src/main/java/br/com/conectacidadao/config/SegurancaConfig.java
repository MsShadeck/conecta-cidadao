package br.com.conectacidadao.config;

import java.security.SecureRandom;
import java.util.Arrays;
import java.util.List;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.nimbusds.jose.jwk.source.ImmutableSecret;

/**
 * Segurança da API:
 *  - senha com hash BCrypt;
 *  - login devolve um token JWT assinado (HS256) com o id e o perfil do usuário;
 *  - sem sessão no servidor (stateless), por isso o CSRF fica desligado: o token vai no
 *    cabeçalho Authorization, que o navegador não envia sozinho;
 *  - consultas públicas liberadas; dados do usuário exigem login; manutenção exige ADMIN.
 */
@Configuration
public class SegurancaConfig {

	private static final Logger log = LoggerFactory.getLogger(SegurancaConfig.class);

	@Bean
	SecurityFilterChain filtros(HttpSecurity http, CorsConfigurationSource cors) throws Exception {
		http
				.cors(c -> c.configurationSource(cors))
				.csrf(c -> c.disable())
				.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(a -> a
						// Página de erro interna do Spring: sem isso, um erro 500 viraria 401
						.requestMatchers("/error").permitAll()
						// Consultas públicas (o site funciona sem login)
						.requestMatchers(HttpMethod.GET, "/api/locais/**", "/api/categorias", "/api/tipos",
								"/api/bairros")
						.permitAll()
						.requestMatchers(HttpMethod.POST, "/api/auth/cadastro", "/api/auth/login").permitAll()
						// Manutenção do catálogo e moderação: só administrador
						.requestMatchers("/api/admin/**").hasRole("ADMIN")
						.requestMatchers(HttpMethod.POST, "/api/locais/**").hasRole("ADMIN")
						.requestMatchers(HttpMethod.PUT, "/api/locais/**").hasRole("ADMIN")
						.requestMatchers(HttpMethod.DELETE, "/api/locais/**").hasRole("ADMIN")
						// O resto (lembretes, sugestões, checklist, votos, conta) exige login
						.anyRequest().authenticated())
				.oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(conversorDePerfil())));
		return http.build();
	}

	/** O claim "perfil" do token (CIDADAO ou ADMIN) vira a autoridade ROLE_CIDADAO / ROLE_ADMIN. */
	private JwtAuthenticationConverter conversorDePerfil() {
		var autoridades = new JwtGrantedAuthoritiesConverter();
		autoridades.setAuthoritiesClaimName("perfil");
		autoridades.setAuthorityPrefix("ROLE_");
		var conversor = new JwtAuthenticationConverter();
		conversor.setJwtGrantedAuthoritiesConverter(autoridades);
		return conversor;
	}

	@Bean
	PasswordEncoder codificadorDeSenha() {
		return new BCryptPasswordEncoder();
	}

	/**
	 * Chave de assinatura dos tokens. Vem da variável JWT_SEGREDO (mínimo 32 caracteres).
	 * Sem ela, gera uma chave aleatória a cada inicialização (os logins anteriores expiram):
	 * nunca existe uma chave padrão fixa no código.
	 */
	@Bean
	SecretKey chaveJwt(@Value("${app.jwt.segredo:}") String segredo) {
		byte[] bytes;
		if (segredo == null || segredo.isBlank()) {
			bytes = new byte[32];
			new SecureRandom().nextBytes(bytes);
			log.warn("JWT_SEGREDO não definido: usando chave aleatória (os tokens valem só até reiniciar a API).");
		} else {
			bytes = segredo.getBytes(java.nio.charset.StandardCharsets.UTF_8);
			if (bytes.length < 32) throw new IllegalStateException("JWT_SEGREDO precisa ter pelo menos 32 caracteres.");
		}
		return new SecretKeySpec(bytes, "HmacSHA256");
	}

	@Bean
	JwtEncoder codificadorJwt(SecretKey chave) {
		return new NimbusJwtEncoder(new ImmutableSecret<>(chave));
	}

	@Bean
	JwtDecoder decodificadorJwt(SecretKey chave) {
		return NimbusJwtDecoder.withSecretKey(chave).macAlgorithm(MacAlgorithm.HS256).build();
	}

	/** Só as origens do site (Vite em desenvolvimento e o domínio publicado) podem chamar a API. */
	@Bean
	CorsConfigurationSource cors(@Value("${app.cors.origens}") String origens) {
		var config = new CorsConfiguration();
		config.setAllowedOrigins(Arrays.stream(origens.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList());
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
		config.setMaxAge(3600L);
		var fonte = new UrlBasedCorsConfigurationSource();
		fonte.registerCorsConfiguration("/api/**", config);
		return fonte;
	}
}
