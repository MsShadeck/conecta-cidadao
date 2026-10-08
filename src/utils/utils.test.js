/**
 * utils.test.js — Testes do "aberto agora", das distâncias e da busca global.
 */
import { describe, expect, it } from 'vitest';
import { agoraEmIndaiatuba, situacaoAgora, textoDias } from './horario.js';
import { distanciaMetros, formatarDistancia, ordenarPorDistancia } from './geo.js';
import { buscarTudo } from './busca.js';

const SEG_SEX_7_17 = {
  faixas: [{ dias: ['seg', 'ter', 'qua', 'qui', 'sex'], abre: '07:00', fecha: '17:00' }],
  feriados: null,
  vinteQuatroHoras: false,
};
// Datas em UTC: Indaiatuba fica em UTC-3 (sem horário de verão desde 2019).
const quartaAs10 = new Date('2026-10-07T13:00:00Z'); // qua 10h00 em Indaiatuba
const quartaAs18 = new Date('2026-10-07T21:00:00Z'); // qua 18h00
const sextaAs20 = new Date('2026-10-09T23:00:00Z'); // sex 20h00
const quartaAs5 = new Date('2026-10-07T08:00:00Z'); // qua 05h00

describe('agoraEmIndaiatuba', () => {
  it('converte para o fuso de São Paulo', () => {
    expect(agoraEmIndaiatuba(quartaAs10)).toEqual({ iso: '2026-10-07', dia: 'qua', minutos: 600 });
  });
});

describe('situacaoAgora', () => {
  it('aberto dentro do horário', () => {
    expect(situacaoAgora(SEG_SEX_7_17, [], quartaAs10)).toEqual({
      estado: 'aberto',
      texto: 'Aberto agora · fecha às 17h',
    });
  });
  it('fechado depois do horário, abre amanhã', () => {
    expect(situacaoAgora(SEG_SEX_7_17, [], quartaAs18).texto).toBe(
      'Fechado agora · abre amanhã às 07h'
    );
  });
  it('fechado antes de abrir no mesmo dia', () => {
    expect(situacaoAgora(SEG_SEX_7_17, [], quartaAs5).texto).toBe(
      'Fechado agora · abre hoje às 07h'
    );
  });
  it('sexta à noite: próxima abertura é segunda', () => {
    expect(situacaoAgora(SEG_SEX_7_17, [], sextaAs20).texto).toBe(
      'Fechado agora · abre segunda às 07h'
    );
  });
  it('em feriado não afirma que está aberto', () => {
    const feriados = [{ data: '2026-10-07', nome: 'Teste', tipo: 'municipal' }];
    expect(situacaoAgora(SEG_SEX_7_17, feriados, quartaAs10).estado).toBe('feriado');
  });
  it('ponto facultativo não muda o resultado', () => {
    const feriados = [{ data: '2026-10-07', nome: 'Carnaval', tipo: 'ponto facultativo' }];
    expect(situacaoAgora(SEG_SEX_7_17, feriados, quartaAs10).estado).toBe('aberto');
  });
  it('sem horário estruturado: desconhecido', () => {
    expect(situacaoAgora(null).estado).toBe('desconhecido');
  });
  it('24 horas', () => {
    expect(
      situacaoAgora({
        faixas: [{ dias: [], abre: '00:00', fecha: '24:00' }],
        vinteQuatroHoras: true,
      }).estado
    ).toBe('aberto');
  });
});

describe('textoDias', () => {
  it('resume intervalos', () => {
    expect(textoDias(['seg', 'ter', 'qua', 'qui', 'sex'])).toBe('seg. a sex.');
    expect(textoDias(['sab', 'dom'])).toBe('sab., dom.');
    expect(textoDias(['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'])).toBe('todos os dias');
  });
});

describe('distâncias', () => {
  it('calcula e formata', () => {
    const d = distanciaMetros({ lat: -23.088, lng: -47.2092 }, { lat: -23.1099, lng: -47.2095 });
    expect(Math.round(d / 100)).toBe(24);
    expect(formatarDistancia(d)).toBe('2,4 km');
    expect(formatarDistancia(853)).toBe('850 m');
  });
  it('ordena do mais perto e ignora locais sem coordenadas', () => {
    const locais = [
      { id: 'longe', coordenadas: { lat: -23.2, lng: -47.2 } },
      { id: 'sem', coordenadas: null },
      { id: 'perto', coordenadas: { lat: -23.09, lng: -47.21 } },
    ];
    expect(ordenarPorDistancia(locais, { lat: -23.088, lng: -47.209 }).map((l) => l.id)).toEqual([
      'perto',
      'longe',
    ]);
  });
});

describe('buscarTudo', () => {
  const locais = [
    {
      id: 'ubs-x',
      nome: 'UBS X – Jardim Califórnia',
      categoria: 'saude',
      tipo: 'UBS',
      endereco: { bairro: 'Jardim Califórnia' },
      palavrasChave: ['vacina', 'posto de saúde'],
    },
    {
      id: 'emeb-y',
      nome: 'EMEB Prof.ª Yolanda Steffen',
      categoria: 'educacao',
      tipo: 'EMEB',
      endereco: { bairro: 'Jardim Tropical' },
      palavrasChave: ['matrícula', 'escola'],
    },
  ];
  const contatos = [
    { id: 'samu', nome: 'SAMU', telefone: '192', descricao: 'Urgência', categoria: 'saude' },
  ];
  const servicos = [
    {
      id: 'iptu',
      nome: 'IPTU',
      descricao: 'Segunda via',
      url: 'https://x',
      palavrasChave: ['imposto'],
    },
  ];

  const titulos = (grupos) =>
    grupos.map((g) => `${g.titulo}:${g.itens.map((i) => i.chave).join(',')}`);

  it('"vacina" encontra a UBS pela palavra-chave', () => {
    expect(titulos(buscarTudo('vacina', { locais }))).toEqual(['Locais:local-ubs-x']);
  });
  it('"matricula" (sem acento) encontra a escola', () => {
    expect(buscarTudo('matricula', { locais })[0].itens[0].rota).toBe('/educacao/emeb-y');
  });
  it('encontra bairro e leva ao mapa filtrado', () => {
    const grupo = buscarTudo('tropical', { locais }).find((g) => g.titulo === 'Bairros');
    expect(grupo.itens[0].rota).toBe('/mapa?bairro=Jardim%20Tropical');
  });
  it('encontra telefone pelo número e serviço online pela palavra-chave', () => {
    expect(buscarTudo('192', { contatos })[0].itens[0].href).toBe('tel:192');
    expect(buscarTudo('imposto', { servicos })[0].itens[0].chave).toBe('online-iptu');
  });
  it('"onibus" encontra a categoria de mobilidade', () => {
    expect(buscarTudo('onibus', {})[0].itens[0].rota).toBe('/mobilidade');
  });
  it('termo vazio não devolve nada', () => {
    expect(buscarTudo('  ', { locais })).toEqual([]);
  });
});
