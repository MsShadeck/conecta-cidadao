package br.com.conectacidadao.exception;

import org.springframework.http.HttpStatus;

/** Dado válido no formato, mas que quebra uma regra do sistema → 400 (ou 409 em conflito). */
public class RegraNegocioException extends RuntimeException {

	private final HttpStatus status;

	public RegraNegocioException(String mensagem) {
		this(HttpStatus.BAD_REQUEST, mensagem);
	}

	public RegraNegocioException(HttpStatus status, String mensagem) {
		super(mensagem);
		this.status = status;
	}

	public HttpStatus getStatus() {
		return status;
	}
}
