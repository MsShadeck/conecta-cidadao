/**
 * texto.test.js — Testes das funções de texto (rode com `npm test`).
 *
 * Cada it() descreve um comportamento esperado; o expect() compara o resultado
 * real com o esperado e o teste falha se forem diferentes.
 */
import { describe, expect, it } from 'vitest';
import { criarSlug, normalizar, plural } from './texto.js';
import { normalizar as normalizarDeServicos } from '../data/servicos.js';

describe('normalizar', () => {
  it('tira acentos e deixa tudo minúsculo', () => {
    expect(normalizar('SAÚDE')).toBe('saude');
    expect(normalizar('Educação')).toBe('educacao');
  });

  it('tira espaços das pontas', () => {
    expect(normalizar('  Lazer ')).toBe('lazer');
  });

  it('aceita null e undefined sem quebrar', () => {
    expect(normalizar(null)).toBe('');
    expect(normalizar(undefined)).toBe('');
  });

  it('continua disponível em servicos.js', () => {
    expect(normalizarDeServicos('Segurança')).toBe('seguranca');
  });
});

describe('criarSlug', () => {
  it('gera identificador para URL', () => {
    expect(criarSlug('UBS Jd. Califórnia')).toBe('ubs-jd-california');
    expect(criarSlug('1º Distrito Policial')).toBe('1o-distrito-policial');
  });
});

describe('plural', () => {
  it('usa singular só para 1', () => {
    expect(plural(1, 'local', 'locais')).toBe('1 local');
    expect(plural(0, 'local', 'locais')).toBe('0 locais');
    expect(plural(6, 'local', 'locais')).toBe('6 locais');
  });
});
