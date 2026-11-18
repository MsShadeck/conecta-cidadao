package br.com.conectacidadao.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.conectacidadao.dto.CatalogoDTOs.BairroDTO;
import br.com.conectacidadao.dto.CatalogoDTOs.CategoriaDTO;
import br.com.conectacidadao.dto.CatalogoDTOs.TipoDTO;
import br.com.conectacidadao.dto.LocaisResposta;
import br.com.conectacidadao.dto.LocalDTO;
import br.com.conectacidadao.dto.LocalForm;
import br.com.conectacidadao.repository.BairroRepository;
import br.com.conectacidadao.repository.CategoriaRepository;
import br.com.conectacidadao.repository.TipoLocalRepository;
import br.com.conectacidadao.service.LocalService;
import jakarta.validation.Valid;

/**
 * Catálogo de locais.
 *   GET    /api/locais            público — lista com filtros (?categoria, ?tipo, ?bairro, ?q, ?aberto)
 *   GET    /api/locais/{id}       público — um local
 *   POST   /api/locais            ADMIN   — inclui
 *   PUT    /api/locais/{id}       ADMIN   — altera
 *   DELETE /api/locais/{id}       ADMIN   — exclui
 *   GET    /api/categorias, /api/tipos, /api/bairros — listas para os formulários
 */
@RestController
@RequestMapping("/api")
public class LocalController {

	private final LocalService servico;
	private final CategoriaRepository categorias;
	private final TipoLocalRepository tipos;
	private final BairroRepository bairros;

	public LocalController(LocalService servico, CategoriaRepository categorias, TipoLocalRepository tipos,
			BairroRepository bairros) {
		this.servico = servico;
		this.categorias = categorias;
		this.tipos = tipos;
		this.bairros = bairros;
	}

	@GetMapping("/locais")
	public LocaisResposta listar(@RequestParam(required = false) String categoria,
			@RequestParam(required = false) String tipo, @RequestParam(required = false) String bairro,
			@RequestParam(required = false) String q, @RequestParam(defaultValue = "false") boolean aberto) {
		return servico.listar(new LocalService.Filtro(categoria, tipo, bairro, q, aberto));
	}

	@GetMapping("/locais/{id}")
	public LocalDTO buscar(@PathVariable String id) {
		return servico.buscar(id);
	}

	@PostMapping("/locais")
	public ResponseEntity<LocalDTO> incluir(@RequestBody @Valid LocalForm form) {
		var criado = servico.incluir(form);
		return ResponseEntity.created(URI.create("/api/locais/" + criado.id())).body(criado);
	}

	@PutMapping("/locais/{id}")
	public LocalDTO alterar(@PathVariable String id, @RequestBody @Valid LocalForm form) {
		return servico.alterar(id, form);
	}

	@DeleteMapping("/locais/{id}")
	public ResponseEntity<Void> excluir(@PathVariable String id) {
		servico.excluir(id);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/categorias")
	public List<CategoriaDTO> categorias() {
		return categorias.findAll().stream().map(CategoriaDTO::de).toList();
	}

	@GetMapping("/tipos")
	public List<TipoDTO> tipos() {
		return tipos.listarComCategoria().stream().map(TipoDTO::de).toList();
	}

	@GetMapping("/bairros")
	public List<BairroDTO> bairros() {
		return bairros.findAllByOrderByNomeAsc().stream().map(BairroDTO::de).toList();
	}
}
