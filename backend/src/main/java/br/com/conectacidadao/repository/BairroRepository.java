package br.com.conectacidadao.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.conectacidadao.model.Bairro;

public interface BairroRepository extends JpaRepository<Bairro, Integer> {

	Optional<Bairro> findFirstByNomeIgnoreCase(String nome);

	Optional<Bairro> findBySlug(String slug);

	List<Bairro> findAllByOrderByNomeAsc();
}
