package br.com.conectacidadao.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.conectacidadao.model.Lembrete;

public interface LembreteRepository extends JpaRepository<Lembrete, Long> {

	/** Primeiro os que têm data (do mais próximo ao mais distante), depois os sem data. */
	@Query("""
			select l from Lembrete l left join fetch l.local
			 where l.usuario.id = :usuarioId
			 order by case when l.data is null then 1 else 0 end, l.data, l.hora, l.id
			""")
	List<Lembrete> listarDoUsuario(@Param("usuarioId") Long usuarioId);

	Optional<Lembrete> findByIdAndUsuarioId(Long id, Long usuarioId);

	/** Antes de excluir um local, solta os lembretes ligados a ele (ON DELETE SET NULL). */
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("update Lembrete l set l.local = null where l.local.id = :localId")
	int desvincularLocal(@Param("localId") String localId);

	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("delete from Lembrete l where l.usuario.id = :usuarioId")
	int excluirDoUsuario(@Param("usuarioId") Long usuarioId);
}
