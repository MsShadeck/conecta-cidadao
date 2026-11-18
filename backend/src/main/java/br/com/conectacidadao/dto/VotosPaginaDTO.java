package br.com.conectacidadao.dto;

/** Relatório "Esta página foi útil?": quantos votos cada página recebeu. */
public record VotosPaginaDTO(String pagina, long votos) {
}
