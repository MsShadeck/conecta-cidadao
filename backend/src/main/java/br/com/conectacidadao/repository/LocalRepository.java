package br.com.conectacidadao.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.conectacidadao.model.Local;

public interface LocalRepository extends JpaRepository<Local, String> {

	/**
	 * Busca com filtros opcionais (null = sem filtro). O "join fetch" traz tipo, categoria
	 * e bairro na mesma consulta; as listas (telefones, horários...) vêm em lote
	 * (hibernate.default_batch_fetch_size), sem uma consulta por local.
	 * No MySQL, a collation utf8mb4_unicode_ci já ignora acentos no LIKE.
	 * Bairro e texto usam "" (e não null) para "sem filtro": o PostgreSQL não consegue
	 * descobrir o tipo de um parâmetro nulo dentro de lower() e recusa a consulta.
	 */
	@Query("""
			select l from Local l
			  join fetch l.tipo t
			  join fetch t.categoria c
			  left join fetch l.bairro b
			 where (:categoria is null or c.slug = :categoria)
			   and (:tipo is null or t.nome = :tipo)
			   and (:bairro = '' or lower(coalesce(b.nome, l.bairroNome)) = lower(:bairro))
			   and (:texto = ''
			        or lower(l.nome) like lower(concat('%', :texto, '%'))
			        or lower(t.nome) like lower(concat('%', :texto, '%'))
			        or exists (select 1 from Local l2 join l2.palavrasChave p
			                    where l2 = l and lower(p) like lower(concat('%', :texto, '%'))))
			 order by l.nome
			""")
	List<Local> buscar(@Param("categoria") String categoria, @Param("tipo") String tipo,
			@Param("bairro") String bairro, @Param("texto") String texto);

	@Query("select max(l.atualizadoEm) from Local l")
	LocalDate ultimaAtualizacao();
}
