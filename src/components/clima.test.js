/**
 * clima.test.js — Avisos de chuva forte e calor do widget de clima.
 */
import { describe, expect, it } from 'vitest';
import { avisosDoDia } from './Clima.jsx';

const dia = (chuva, chance, maxima, codigo = 3) => ({
  precipitation_sum: [chuva],
  precipitation_probability_max: [chance],
  temperature_2m_max: [maxima],
  weather_code: [codigo],
});

describe('avisosDoDia', () => {
  it('sem aviso num dia comum', () => {
    expect(avisosDoDia(dia(2, 30, 28))).toEqual([]);
  });
  it('avisa chuva forte por volume, por chance + volume ou por tempestade', () => {
    expect(avisosDoDia(dia(35, 50, 25))).toHaveLength(1);
    expect(avisosDoDia(dia(12, 85, 25))).toHaveLength(1);
    expect(avisosDoDia(dia(1, 40, 25, 95))).toHaveLength(1);
  });
  it('avisa calor forte', () => {
    expect(avisosDoDia(dia(0, 0, 35))[0]).toMatch(/Calor forte/);
  });
});
