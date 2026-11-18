package br.com.conectacidadao;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * API REST do Conecta Cidadão.
 *
 * Camadas (o mesmo padrão das atividades do semestre):
 *   controller → recebe a requisição HTTP e devolve JSON
 *   service    → regras de negócio e transações
 *   repository → acesso ao banco com Spring Data JPA
 *   model      → entidades JPA, uma por tabela do banco conecta_cidadao
 *
 * O banco é criado pelos scripts de ../database (01-criacao.sql e 02-carga-dados.sql).
 */
@SpringBootApplication
public class ConectaCidadaoApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(ConectaCidadaoApiApplication.class, args);
	}
}
