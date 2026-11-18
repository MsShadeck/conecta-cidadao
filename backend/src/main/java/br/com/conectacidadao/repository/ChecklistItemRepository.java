package br.com.conectacidadao.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.conectacidadao.model.ChecklistItem;

public interface ChecklistItemRepository extends JpaRepository<ChecklistItem, String> {
}
