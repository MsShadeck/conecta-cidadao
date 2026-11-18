package br.com.conectacidadao.dto;

import br.com.conectacidadao.model.Bairro;
import br.com.conectacidadao.model.Categoria;
import br.com.conectacidadao.model.TipoLocal;

/** DTOs pequenos das listas de apoio (categorias, tipos e bairros), usados nos formulários. */
public final class CatalogoDTOs {

	private CatalogoDTOs() {
	}

	public record CategoriaDTO(String slug, String nome, String rota) {
		public static CategoriaDTO de(Categoria c) {
			return new CategoriaDTO(c.getSlug(), c.getNome(), c.getRota());
		}
	}

	public record TipoDTO(Integer id, String nome, String categoria) {
		public static TipoDTO de(TipoLocal t) {
			return new TipoDTO(t.getId(), t.getNome(), t.getCategoria().getSlug());
		}
	}

	public record BairroDTO(Integer id, String slug, String nome) {
		public static BairroDTO de(Bairro b) {
			return new BairroDTO(b.getId(), b.getSlug(), b.getNome());
		}
	}
}
