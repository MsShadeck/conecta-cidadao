/**
 * normalizadores.test.mjs — Testes dos normalizadores de dados (npm test).
 * Os textos de entrada foram copiados das fichas oficiais da Prefeitura e do CNES.
 */
import { describe, expect, it } from 'vitest';
import {
  dentroDoMunicipio,
  distanciaMetros,
  interpretarEndereco,
  interpretarHorario,
  interpretarHorarioOsm,
  normalizarCnes,
  normalizarOsm,
  normalizarTelefones,
  semelhancaNomes,
  titulo,
} from './normalizadores.mjs';
import { extrairFicha, extrairServicos } from './coletar-prefeitura.mjs';

describe('normalizarTelefones', () => {
  it('acrescenta o DDD 19 e reaproveita o prefixo depois da barra', () => {
    expect(normalizarTelefones('3894-5375/5345')).toEqual(['(19) 3894-5375', '(19) 3894-5345']);
  });
  it('separa dois números e ignora a palavra whatsapp', () => {
    expect(normalizarTelefones('(19) 3816-6961 / (19) 99906-9434 whatsapp')).toEqual([
      '(19) 3816-6961',
      '(19) 99906-9434',
    ]);
  });
  it('aceita pontos, hífens e DDD com zero', () => {
    expect(normalizarTelefones('19-3875.5501')).toEqual(['(19) 3875-5501']);
    expect(normalizarTelefones('(019) 3834-9000')).toEqual(['(19) 3834-9000']);
  });
  it('formata 0800 e números de 3 dígitos', () => {
    expect(normalizarTelefones('0800 77 22 195')).toEqual(['0800 772 2195']);
    expect(normalizarTelefones('153')).toEqual(['153']);
  });
  it('devolve lista vazia sem texto', () => {
    expect(normalizarTelefones(null)).toEqual([]);
  });
});

describe('interpretarEndereco', () => {
  it('separa logradouro, número e bairro', () => {
    expect(interpretarEndereco('Rua Basílio Martins, 830 - Jardim Califórnia')).toEqual({
      logradouro: 'Rua Basílio Martins',
      numero: '830',
      bairro: 'Jardim Califórnia',
    });
  });
  it('padroniza "Av." e "s/nº" e tira observações entre parênteses', () => {
    expect(
      interpretarEndereco('Av. Eng. Fábio Roberto Barnabé, s/nº (altura do Jd. Esplanada)')
    ).toEqual({
      logradouro: 'Avenida Eng. Fábio Roberto Barnabé',
      numero: 's/n',
      bairro: null,
    });
  });
  it('remove o ponto de milhar do número', () => {
    expect(interpretarEndereco('Avenida Angelo Bertelli Neto, 1.000').numero).toBe('1000');
  });
  it('corrige o "Rua :" digitado na ficha', () => {
    expect(
      interpretarEndereco('Rua : Zephiro Puccinelli, 1268 - Jardim Morada do Sol').logradouro
    ).toBe('Rua Zephiro Puccinelli');
  });
});

describe('interpretarHorario', () => {
  it('entende "De 2ª a 6ª feira, das 7:00 às 17:00 hs"', () => {
    expect(interpretarHorario('De 2ª a 6ª feira, das 7:00 às 17:00 hs').faixas).toEqual([
      { dias: ['seg', 'ter', 'qua', 'qui', 'sex'], abre: '07:00', fecha: '17:00' },
    ]);
  });
  it('entende dois turnos no mesmo dia', () => {
    const r = interpretarHorario('De 2ª a 6ª feira, das 8h às 12h e das 13h às 17h');
    expect(r.faixas.map((f) => `${f.abre}-${f.fecha}`)).toEqual(['08:00-12:00', '13:00-17:00']);
  });
  it('ignora o horário da sala de vacina', () => {
    const r = interpretarHorario('2ª a 6ª 7:00- 17:00 hs - vacina 07h30 as 16h30');
    expect(r.faixas).toEqual([
      { dias: ['seg', 'ter', 'qua', 'qui', 'sex'], abre: '07:00', fecha: '17:00' },
    ]);
  });
  it('separa dias com horários diferentes e marca feriados', () => {
    const r = interpretarHorario(
      'terça a sábado das 9:00 às 17:00h e aos domingos e feriados das 09:00 às 12:00h'
    );
    expect(r.faixas).toEqual([
      { dias: ['ter', 'qua', 'qui', 'sex', 'sab'], abre: '09:00', fecha: '17:00' },
      { dias: ['dom'], abre: '09:00', fecha: '12:00' },
    ]);
    expect(r.feriados).toBe('aberto');
  });
  it('respeita o dia fechado', () => {
    const r = interpretarHorario(
      'De terça a domingo e feriados das 9:00 às 16:00h. Permanência Máxima: até às 17:00h. Segunda-Feira: fechado'
    );
    expect(r.faixas).toEqual([
      { dias: ['ter', 'qua', 'qui', 'sex', 'sab', 'dom'], abre: '09:00', fecha: '16:00' },
    ]);
  });
  it('reconhece 24 horas', () => {
    expect(interpretarHorario('Aberto 24 horas').vinteQuatroHoras).toBe(true);
    expect(interpretarHorario('24h').faixas[0]).toEqual({
      dias: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'],
      abre: '00:00',
      fecha: '24:00',
    });
  });
  it('NÃO chuta os dias quando o texto não informa', () => {
    expect(interpretarHorario('das 7:00 às 17:00h sala de vacina 7:30 às 16:30h')).toBeNull();
    expect(interpretarHorario('Área pública aberta')).toBeNull();
    expect(interpretarHorario('Sob Consulta')).toBeNull();
  });
  it('não confunde "Dom Pedro" com domingo', () => {
    expect(interpretarHorario('Terminal Dom Pedro das 7 às 17h')).toBeNull();
  });
});

describe('interpretarHorarioOsm', () => {
  it('lê o formato simples do OpenStreetMap', () => {
    expect(interpretarHorarioOsm('Mo-Fr 08:00-17:00; Sa 08:00-12:00; PH off')).toEqual({
      faixas: [
        { dias: ['seg', 'ter', 'qua', 'qui', 'sex'], abre: '08:00', fecha: '17:00' },
        { dias: ['sab'], abre: '08:00', fecha: '12:00' },
      ],
      feriados: 'fechado',
      vinteQuatroHoras: false,
    });
  });
  it('desiste (null) de formatos que não entende', () => {
    expect(interpretarHorarioOsm('Mo-Fr 08:00-17:00 "com agendamento"')).toBeNull();
  });
});

describe('semelhancaNomes', () => {
  it('ignora EMEB, Prof.ª e acentos', () => {
    expect(semelhancaNomes('EMEB Prof.ª Yolanda Steffen', 'Yolanda Steffen')).toBe(1);
    expect(
      semelhancaNomes(
        'Escola Municipal de Educação Básica Professora Maria José Ambiel Marachini',
        'Maria José Ambiel Marachini'
      )
    ).toBe(1);
  });
  it('dá nota baixa para nomes diferentes', () => {
    expect(semelhancaNomes('Maria José de Campos', 'Maria José Ambiel Marachini')).toBeLessThan(
      0.8
    );
  });
});

describe('geografia', () => {
  const quadrado = {
    type: 'Polygon',
    coordinates: [
      [
        [-47.3, -23.2],
        [-47.1, -23.2],
        [-47.1, -23.0],
        [-47.3, -23.0],
        [-47.3, -23.2],
      ],
    ],
  };
  it('sabe se o ponto está dentro do polígono', () => {
    expect(dentroDoMunicipio({ lat: -23.09, lng: -47.22 }, quadrado)).toBe(true);
    expect(dentroDoMunicipio({ lat: -22.9, lng: -47.06 }, quadrado)).toBe(false);
  });
  it('calcula distância em metros', () => {
    const d = distanciaMetros({ lat: -23.088, lng: -47.2092 }, { lat: -23.1099, lng: -47.2095 });
    expect(d).toBeGreaterThan(2400);
    expect(d).toBeLessThan(2450);
  });
});

describe('normalizarCnes e normalizarOsm', () => {
  it('converte um registro do CNES', () => {
    const r = normalizarCnes({
      codigo_cnes: 5704979,
      nome_fantasia: 'UBS X',
      codigo_tipo_unidade: 2,
      endereco_estabelecimento: 'RUA BASILIO MARTINS',
      numero_estabelecimento: '830',
      bairro_estabelecimento: 'JARDIM CALIFORNIA',
      codigo_cep_estabelecimento: '13334170',
      latitude_estabelecimento_decimo_grau: -23.1054772,
      longitude_estabelecimento_decimo_grau: -47.2,
      numero_telefone_estabelecimento: '3894-5375',
      descricao_natureza_juridica_estabelecimento: '1244',
      codigo_motivo_desabilitacao_estabelecimento: null,
    });
    expect(r).toMatchObject({
      cnes: '5704979',
      nome: 'UBS X',
      tipo: 'UBS',
      endereco: { logradouro: 'Rua Basilio Martins', numero: '830', cep: '13334-170' },
      coordenadas: { lat: -23.1054772, lng: -47.2 },
      telefones: ['(19) 3894-5375'],
      ativo: true,
      publico: true,
    });
  });
  it('marca unidade desabilitada e privada', () => {
    const r = normalizarCnes({
      codigo_cnes: 1,
      nome_fantasia: 'X',
      descricao_natureza_juridica_estabelecimento: '2062',
      codigo_motivo_desabilitacao_estabelecimento: '04',
    });
    expect(r.ativo).toBe(false);
    expect(r.publico).toBe(false);
    expect(r.coordenadas).toBeNull();
  });
  it('converte um elemento do OpenStreetMap (way com center)', () => {
    const r = normalizarOsm({
      type: 'way',
      id: 10,
      center: { lat: -23.1, lon: -47.2 },
      tags: { name: 'Corpo de Bombeiros', phone: '+55 19 3825 3785' },
    });
    expect(r).toMatchObject({
      osm: 'way/10',
      nome: 'Corpo de Bombeiros',
      coordenadas: { lat: -23.1, lng: -47.2 },
      telefones: ['(19) 3825-3785'],
    });
  });
  it('titulo() deixa siglas em maiúsculas', () => {
    expect(titulo('UBS JD JOAO PIOLI')).toBe('UBS Jd Joao Pioli');
  });
});

describe('coletor da Prefeitura', () => {
  it('lê a ficha com valor na mesma linha ou na seguinte', () => {
    expect(
      extrairFicha([
        'Endereço:',
        'Rua do Museu, 205 - Bairro Tombadouro',
        'Telefone: 3834-9433',
        'Horário:',
        'Site:',
      ])
    ).toEqual({ endereco: 'Rua do Museu, 205 - Bairro Tombadouro', telefone: '3834-9433' });
  });
  it('usa os itens de lista como serviços', () => {
    expect(extrairServicos(['* Vacinas', '- Emissão do Cartão SUS;', 'texto comum'])).toEqual([
      'Vacinas',
      'Emissão do Cartão SUS',
    ]);
  });
});
