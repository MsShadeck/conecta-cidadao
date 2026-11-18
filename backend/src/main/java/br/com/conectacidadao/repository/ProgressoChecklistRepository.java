package br.com.conectacidadao.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.conectacidadao.model.ProgressoChecklist;

public interface ProgressoChecklistRepository extends JpaRepository<ProgressoChecklist, ProgressoChecklist.Chave> {

	@Query("select p.chave.itemId from ProgressoChecklist p where p.chave.usuarioId = :usuarioId order by p.feitoEm")
	List<String> itensFeitos(@Param("usuarioId") Long usuarioId);

	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("delete from ProgressoChecklist p where p.chave.usuarioId = :usuarioId")
	int excluirDoUsuario(@Param("usuarioId") Long usuarioId);
}
