/**
 * esquema.test.js — Garante que os dados publicados seguem o modelo único.
 *
 * Lê os arquivos que o site realmente usa (public/api/*.json) e FALHA se algum
 * registro estiver sem campo obrigatório ou sem fonte. É a trava da regra
 * "não inventar dados": todo dado precisa dizer de onde veio.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { categorias } from './servicos.js';

const ler = (arquivo) =>
  JSON.parse(readFileSync(new URL(`../../public/api/${arquivo}`, import.meta.url), 'utf8'));
const ehUrl = (texto) => /^https?:\/\/\S+$/.test(texto);
const ehData = (texto) => /^\d{4}-\d{2}-\d{2}$/.test(texto);
const SLUGS = new Set(categorias.map((c) => c.slug));

describe('locais.json', () => {
  const { locais, atualizadoEm, fontes } = ler('locais.json');

  it('tem data de atualização e lista de fontes', () => {
    expect(ehData(atualizadoEm)).toBe(true);
    expect(fontes.length).toBeGreaterThan(0);
  });

  it('cada local tem os campos obrigatórios, fonte e data', () => {
    const problemas = [];
    for (const local of locais) {
      const falta = [];
      if (!/^[a-z0-9-]+$/.test(local.id ?? '')) falta.push('id');
      if (!local.nome) falta.push('nome');
      if (!SLUGS.has(local.categoria)) falta.push('categoria');
      if (!local.tipo) falta.push('tipo');
      if (!Array.isArray(local.fonte) || local.fonte.length === 0 || !local.fonte.every(ehUrl))
        falta.push('fonte');
      if (!ehData(local.atualizadoEm ?? '')) falta.push('atualizadoEm');
      if (!Array.isArray(local.telefones)) falta.push('telefones');
      if (!Array.isArray(local.servicos)) falta.push('servicos');
      if (!Array.isArray(local.palavrasChave)) falta.push('palavrasChave');
      if (!('coordenadas' in local) || !('horarios' in local) || !('endereco' in local))
        falta.push('campos anuláveis');
      if (local.coordenadas) {
        const { lat, lng } = local.coordenadas;
        // Retângulo do município (IBGE).
        if (!(lat > -23.226 && lat < -22.997 && lng > -47.306 && lng < -47.083))
          falta.push('coordenadas fora');
      }
      if (
        local.horarios &&
        !local.horarios.faixas?.every((f) => f.dias.length && f.abre < f.fecha)
      ) {
        falta.push('horarios');
      }
      if (falta.length) problemas.push(`${local.id ?? local.nome}: ${falta.join(', ')}`);
    }
    expect(problemas).toEqual([]);
  });

  it('não tem ids repetidos', () => {
    const ids = locais.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('mantém os locais do projeto original que têm fonte', () => {
    const ids = new Set(locais.map((l) => l.id));
    for (const id of [
      'ubs-jd-california',
      'ubs-cecap',
      'haoc',
      'hospital-dia',
      'guarda-municipal',
      'parque-ecologico',
      'museu-da-agua',
      'emeb-yolanda-steffen',
    ]) {
      expect(ids.has(id), id).toBe(true);
    }
  });
});

describe('checklist.json (Primeiros passos)', () => {
  const { grupos, itens } = ler('checklist.json');
  const idsGrupos = new Set(grupos.map((g) => g.id));

  it('todo item tem título, explicação, grupo válido e fonte', () => {
    for (const item of itens) {
      expect(item.titulo, item.id).toBeTruthy();
      expect(item.oQueE && item.porQue && item.comoFazer, item.id).toBeTruthy();
      expect(idsGrupos.has(item.grupo), item.id).toBe(true);
      expect(item.fonte.length > 0 && item.fonte.every(ehUrl), item.id).toBe(true);
      expect(
        item.links.every((l) => ehUrl(l.url)),
        item.id
      ).toBe(true);
    }
  });

  it('documentos só como lista (com fonte) ou null; perfil conhecido', () => {
    for (const item of itens) {
      expect(item.documentos === null || Array.isArray(item.documentos), item.id).toBe(true);
      expect([null, 'criancas', 'carro', 'pet'].includes(item.perfil), item.id).toBe(true);
    }
  });
});

describe('contatos.json, servicos-online.json e feriados.json', () => {
  it('todo telefone tem fonte', () => {
    for (const contato of ler('contatos.json').contatos) {
      expect(ehUrl(contato.fonte), contato.id).toBe(true);
      expect(contato.telefone, contato.id).toMatch(/\d/);
    }
  });
  it('todo serviço online é um link https ou http oficial', () => {
    for (const servico of ler('servicos-online.json').servicos) {
      expect(ehUrl(servico.url), servico.id).toBe(true);
    }
  });
  it('todo feriado tem data e fonte', () => {
    for (const feriado of ler('feriados.json').feriados) {
      expect(ehData(feriado.data)).toBe(true);
      expect(ehUrl(feriado.fonte)).toBe(true);
    }
  });
});
