/**
 * componentes.test.js — Testes das funções puras exportadas pelos componentes.
 */
import { describe, expect, it } from 'vitest';
import { textoCurtidas } from './BotaoUtil.jsx';
import { filtrarContatos } from './ListaContatos.jsx';

describe('textoCurtidas (BotaoUtil)', () => {
  it('corrige o plural', () => {
    expect(textoCurtidas(0)).toBe('0 curtidas');
    expect(textoCurtidas(1)).toBe('1 curtida');
    expect(textoCurtidas(2)).toBe('2 curtidas');
  });
});

describe('filtrarContatos (ListaContatos)', () => {
  const contatos = [
    { id: 1, nome: 'SAMU', telefone: '192', descricao: 'Urgência médica', categoria: 'saude' },
    {
      id: 2,
      nome: 'Disque Saúde',
      telefone: '136',
      descricao: 'Informações sobre o SUS',
      categoria: 'saude',
    },
    {
      id: 3,
      nome: 'Disque Prefeitura',
      telefone: '(19) 3834-9000',
      descricao: 'Central',
      categoria: 'prefeitura',
    },
  ];

  it('encontra "saude" sem acento', () => {
    expect(filtrarContatos(contatos, 'saude').map((c) => c.id)).toEqual([2]);
  });

  it('busca também na descrição', () => {
    expect(filtrarContatos(contatos, 'sus').map((c) => c.id)).toEqual([2]);
  });

  it('busca pelo número, ignorando parênteses e traço', () => {
    expect(filtrarContatos(contatos, '38349000').map((c) => c.id)).toEqual([3]);
    expect(filtrarContatos(contatos, '192').map((c) => c.id)).toEqual([1]);
  });

  it('filtra pela categoria do chip', () => {
    expect(filtrarContatos(contatos, '', 'saude').map((c) => c.id)).toEqual([1, 2]);
    expect(filtrarContatos(contatos, '', 'todos')).toHaveLength(3);
  });
});
