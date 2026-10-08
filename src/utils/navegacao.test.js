/**
 * navegacao.test.js — Links do Waze e do Google Maps.
 */
import { describe, expect, it } from 'vitest';
import { linkGoogleMaps, linkWaze, linkWazeIframe, podeNavegar } from './navegacao.js';

const comCoordenada = {
  nome: 'UBS X',
  coordenadas: { lat: -23.1054772, lng: -47.2205 },
  enderecoTexto: 'Rua Basílio Martins, 830',
};
const soEndereco = {
  nome: 'Local de exemplo',
  coordenadas: null,
  enderecoTexto: 'Rua Dom Pedro I, 65 - Cidade Nova',
};
const semNada = { nome: 'X', coordenadas: null, enderecoTexto: null };

describe('linkWaze', () => {
  it('usa a coordenada quando existe', () => {
    expect(linkWaze(comCoordenada)).toBe(
      'https://waze.com/ul?ll=-23.1054772,-47.2205&navigate=yes&utm_source=conecta-cidadao'
    );
  });
  it('sem coordenada, busca pelo endereço codificado e com a cidade', () => {
    expect(linkWaze(soEndereco)).toBe(
      'https://waze.com/ul?q=Rua%20Dom%20Pedro%20I%2C%2065%20-%20Cidade%20Nova%2C%20Indaiatuba%20-%20SP&navigate=yes&utm_source=conecta-cidadao'
    );
  });
  it('sem coordenada nem endereço, não há link', () => {
    expect(linkWaze(semNada)).toBeNull();
    expect(linkWaze(undefined)).toBeNull();
  });
});

describe('linkGoogleMaps', () => {
  it('monta a rota com o modo pedido', () => {
    expect(linkGoogleMaps(comCoordenada, 'walking')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=-23.1054772%2C-47.2205&travelmode=walking'
    );
  });
  it('usa transporte público como padrão e aceita origem', () => {
    expect(linkGoogleMaps(comCoordenada, undefined, { lat: -23.08, lng: -47.2 })).toBe(
      'https://www.google.com/maps/dir/?api=1&origin=-23.08,-47.2&destination=-23.1054772%2C-47.2205&travelmode=transit'
    );
  });
  it('troca modo inválido por transporte público', () => {
    expect(linkGoogleMaps(comCoordenada, 'teletransporte')).toContain('travelmode=transit');
  });
  it('sem coordenada, usa o endereço; sem nada, null', () => {
    expect(linkGoogleMaps(soEndereco, 'driving')).toContain(
      'destination=Rua%20Dom%20Pedro%20I%2C%2065%20-%20Cidade%20Nova%2C%20Indaiatuba%20-%20SP'
    );
    expect(linkGoogleMaps(semNada)).toBeNull();
  });
  it('não repete a cidade quando o endereço já tem', () => {
    expect(linkGoogleMaps({ enderecoTexto: 'Rua A, 1, Indaiatuba' })).toContain(
      'Rua%20A%2C%201%2C%20Indaiatuba&'
    );
  });
});

describe('linkWazeIframe e podeNavegar', () => {
  it('limita o zoom entre 3 e 17 e liga o pin', () => {
    expect(linkWazeIframe({ lat: -23.09, lng: -47.22, zoom: 20 })).toBe(
      'https://embed.waze.com/pt-BR/iframe?zoom=17&lat=-23.09&lon=-47.22&pin=1'
    );
    expect(linkWazeIframe({ lat: -23.09, lng: -47.22, zoom: 1, pin: false })).toBe(
      'https://embed.waze.com/pt-BR/iframe?zoom=3&lat=-23.09&lon=-47.22'
    );
  });
  it('sabe quando dá para navegar', () => {
    expect(podeNavegar(comCoordenada)).toBe(true);
    expect(podeNavegar(soEndereco)).toBe(true);
    expect(podeNavegar(semNada)).toBe(false);
  });
});
