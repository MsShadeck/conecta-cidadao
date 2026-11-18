package br.com.conectacidadao.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.conectacidadao.dto.VotosPaginaDTO;
import br.com.conectacidadao.model.AvaliacaoPagina;

public interface AvaliacaoPaginaRepository extends JpaRepository<AvaliacaoPagina, AvaliacaoPagina.Chave> {

	@Query("select a.chave.pagina from AvaliacaoPagina a where a.chave.usuarioId = :usuarioId")
	List<String> paginasDoUsuario(@Param("usuarioId") Long usuarioId);

	/** Relatório do administrador: páginas mais úteis primeiro. */
	@Query("""
			select new br.com.conectacidadao.dto.VotosPaginaDTO(a.chave.pagina, count(a))
			  from AvaliacaoPagina a group by a.chave.pagina order by count(a) desc, a.chave.pagina
			""")
	List<VotosPaginaDTO> contarPorPagina();

	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("delete from AvaliacaoPagina a where a.chave.usuarioId = :usuarioId")
	int excluirDoUsuario(@Param("usuarioId") Long usuarioId);
}
