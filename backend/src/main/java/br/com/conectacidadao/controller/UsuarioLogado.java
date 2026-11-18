package br.com.conectacidadao.controller;

import org.springframework.security.oauth2.jwt.Jwt;

/** Lê o id do usuário do token (claim "sub"). O id nunca vem do corpo da requisição. */
final class UsuarioLogado {

	private UsuarioLogado() {
	}

	static Long id(Jwt jwt) {
		return Long.valueOf(jwt.getSubject());
	}
}
