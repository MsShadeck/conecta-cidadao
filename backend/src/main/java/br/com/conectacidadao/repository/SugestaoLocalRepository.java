package br.com.conectacidadao.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.conectacidadao.model.StatusSugestao;
import br.com.conectacidadao.model.SugestaoLocal;

public interface SugestaoLocalRepository extends JpaRepository<SugestaoLocal, Long> {

	@Query("""
			select s from SugestaoLocal s join fetch s.categoria
			 where s.usuario.id = :usuarioId and (:categoria is null or s.categoria.slug = :categoria)
			 order by s.criadoEm, s.id
			""")
	List<SugestaoLocal> listarDoUsuario(@Param("usuarioId") Long usuarioId, @Param("categoria") String categoria);

	@Query("""
			select s from SugestaoLocal s join fetch s.categoria join fetch s.usuario
			 where (:status is null or s.status = :status)
			 order by s.criadoEm desc, s.id desc
			""")
	List<SugestaoLocal> listarParaModeracao(@Param("status") StatusSugestao status);

	Optional<SugestaoLocal> findByIdAndUsuarioId(Long id, Long usuarioId);

	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("delete from SugestaoLocal s where s.usuario.id = :usuarioId")
	int excluirDoUsuario(@Param("usuarioId") Long usuarioId);
}
