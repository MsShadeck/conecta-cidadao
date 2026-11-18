package br.com.conectacidadao.repository;

import java.time.LocalDate;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.conectacidadao.model.Feriado;

public interface FeriadoRepository extends JpaRepository<Feriado, LocalDate> {
}
