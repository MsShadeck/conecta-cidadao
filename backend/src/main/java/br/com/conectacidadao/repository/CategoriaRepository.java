package br.com.conectacidadao.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.conectacidadao.model.Categoria;

public interface CategoriaRepository extends JpaRepository<Categoria, String> {
}
