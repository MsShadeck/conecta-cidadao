package br.com.conectacidadao.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import br.com.conectacidadao.dto.ErroDTO;

/** Converte as exceções em respostas JSON com mensagem em português. */
@RestControllerAdvice
public class TratadorDeErros {

	private static final Logger log = LoggerFactory.getLogger(TratadorDeErros.class);

	@ExceptionHandler(NaoEncontradoException.class)
	ResponseEntity<ErroDTO> naoEncontrado(NaoEncontradoException e) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErroDTO(e.getMessage()));
	}

	@ExceptionHandler(RegraNegocioException.class)
	ResponseEntity<ErroDTO> regra(RegraNegocioException e) {
		return ResponseEntity.status(e.getStatus()).body(new ErroDTO(e.getMessage()));
	}

	/** @Valid falhou: devolve a mensagem de cada campo. */
	@ExceptionHandler(MethodArgumentNotValidException.class)
	ResponseEntity<ErroDTO> validacao(MethodArgumentNotValidException e) {
		Map<String, String> campos = new LinkedHashMap<>();
		e.getBindingResult().getFieldErrors()
				.forEach(f -> campos.putIfAbsent(f.getField(), f.getDefaultMessage()));
		return ResponseEntity.badRequest().body(new ErroDTO("Confira os campos destacados.", campos));
	}

	@ExceptionHandler({ HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class })
	ResponseEntity<ErroDTO> formato(Exception e) {
		return ResponseEntity.badRequest().body(new ErroDTO("Formato de dados inválido."));
	}

	/** O banco recusou (FK, UNIQUE, CHECK). Não expõe o SQL ao usuário; registra no log. */
	@ExceptionHandler(DataIntegrityViolationException.class)
	ResponseEntity<ErroDTO> integridade(DataIntegrityViolationException e) {
		log.warn("Violação de integridade: {}", e.getMostSpecificCause().getMessage());
		return ResponseEntity.status(HttpStatus.CONFLICT)
				.body(new ErroDTO("Os dados não respeitam uma regra do banco (valor duplicado ou referência inexistente)."));
	}
}
