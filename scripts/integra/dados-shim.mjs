/**
 * dados-shim.mjs — Substitui o server/src/dados.ts do Indaiatuba Integra no
 * empacotamento (ver scripts/sincronizar-integra.mjs).
 *
 * O dados.ts original também carrega linhas de ônibus, bicicletas e patinetes
 * SIMULADOS. O roteamento só precisa de DATA_DIR (onde está o viario.json) e
 * das zonas industriais; este arquivo entrega só isso.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Procura a pasta data/ ao lado do arquivo empacotado (local e na Vercel).
export const DATA_DIR = [
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'data'),
  path.resolve(process.cwd(), 'api/_integra/data'),
].find((d) => fs.existsSync(path.join(d, 'viario.json')));

export const config = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'config.json'), 'utf8'));
