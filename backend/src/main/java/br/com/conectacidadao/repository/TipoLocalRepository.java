package br.com.conectacidadao.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import br.com.conectacidadao.model.TipoLocal;

public interface TipoLocalRepository extends JpaRepository<TipoLocal, Integer> {

	@Query("select t from TipoLocal t join fetch t.categoria c order by c.nome, t.nome")
	List<TipoLocal> listarComCategoria();
}
