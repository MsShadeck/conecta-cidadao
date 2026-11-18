package br.com.conectacidadao.exception;

/** Recurso inexistente (ou de outro usuário) → HTTP 404. */
public class NaoEncontradoException extends RuntimeException {

	public NaoEncontradoException(String mensagem) {
		super(mensagem);
	}
}
