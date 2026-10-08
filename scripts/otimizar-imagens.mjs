/**
 * otimizar-imagens.mjs — Gera as versões otimizadas das imagens do site.
 *
 * Rode com `npm run imagens` sempre que acrescentar uma foto em public/img/<categoria>/.
 *
 * O que ele faz:
 *  1. Para cada foto .jpg das categorias, cria:
 *       nome.webp      → até 900px de largura (telas grandes)
 *       nome-480.webp  → 480px de largura (celular), usada no srcset
 *     O .jpg original continua lá, como alternativa para navegadores sem WebP.
 *  2. A partir da logo, cria os ícones: favicon, apple-touch-icon e os do PWA.
 *  3. Cria a imagem de prévia para redes sociais (Open Graph, 1200x630).
 *
 * Usa a biblioteca sharp (só em desenvolvimento; nada disso vai para o navegador).
 */

import { readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const PUBLICO = path.resolve('public');
const PASTAS_FOTOS = ['saude', 'seguranca', 'educacao', 'lazer', 'mobilidade'];
const AZUL_NEVOA = '#eaf6fb';
const AZUL_MARCA = '#1a6faf';

async function otimizarFotos() {
  let total = 0;
  for (const pasta of PASTAS_FOTOS) {
    const dir = path.join(PUBLICO, 'img', pasta);
    if (!existsSync(dir)) continue;
    for (const arquivo of await readdir(dir)) {
      if (!/\.(jpe?g|png)$/i.test(arquivo)) continue;
      const origem = path.join(dir, arquivo);
      const base = path.join(dir, arquivo.replace(/\.(jpe?g|png)$/i, ''));
      // withoutEnlargement: nunca aumenta uma foto menor que o tamanho pedido.
      await sharp(origem)
        .resize({ width: 900, withoutEnlargement: true })
        .webp({ quality: 74 })
        .toFile(`${base}.webp`);
      await sharp(origem)
        .resize({ width: 480, withoutEnlargement: true })
        .webp({ quality: 70 })
        .toFile(`${base}-480.webp`);
      total += 1;
    }
  }
  console.log(`Fotos convertidas para WebP: ${total}`);
}

/** Logo centralizada num quadrado de fundo claro (com margem, para ícones "maskable"). */
async function icone(tamanho, margem, destino) {
  const logo = await sharp(path.join(PUBLICO, 'img/interface/logo.png'))
    .trim() // corta a borda transparente em volta do desenho
    .resize({
      width: Math.round(tamanho * (1 - margem * 2)),
      height: Math.round(tamanho * (1 - margem * 2)),
      fit: 'inside',
    })
    .toBuffer();
  await sharp({ create: { width: tamanho, height: tamanho, channels: 4, background: AZUL_NEVOA } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(destino);
}

async function gerarIcones() {
  const dir = path.join(PUBLICO, 'icones');
  await mkdir(dir, { recursive: true });
  await icone(32, 0.04, path.join(dir, 'favicon-32.png'));
  await icone(180, 0.1, path.join(dir, 'apple-touch-icon.png'));
  await icone(192, 0.08, path.join(dir, 'icone-192.png'));
  await icone(512, 0.08, path.join(dir, 'icone-512.png'));
  // "maskable": o Android pode recortar o ícone em círculo, então a logo fica
  // dentro da "zona segura" central (margem de 20%).
  await icone(512, 0.2, path.join(dir, 'icone-maskable-512.png'));
  console.log('Ícones gerados em public/icones/');
}

async function gerarOpenGraph() {
  const logo = await sharp(path.join(PUBLICO, 'img/interface/logo.png'))
    .trim()
    .resize({ height: 260 })
    .toBuffer();
  // Texto desenhado em SVG: o sharp converte o SVG em imagem e cola por cima.
  const texto = Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <text x="600" y="420" text-anchor="middle" font-family="Poppins, Arial, sans-serif"
            font-size="72" font-weight="700" fill="${AZUL_MARCA}">Conecta Cidadão</text>
      <text x="600" y="500" text-anchor="middle" font-family="Poppins, Arial, sans-serif"
            font-size="40" fill="#3a3a5c">Serviços públicos de Indaiatuba/SP</text>
    </svg>`);
  await sharp({ create: { width: 1200, height: 630, channels: 4, background: AZUL_NEVOA } })
    .composite([
      { input: logo, top: 60, left: Math.round(600 - 260 * 0.625) },
      { input: texto, top: 0, left: 0 },
    ])
    .png()
    .toFile(path.join(PUBLICO, 'img/interface/og-imagem.png'));
  console.log('Imagem de prévia gerada: public/img/interface/og-imagem.png');
}

/**
 * Ícones das categorias: os PNG originais têm 512px, mas aparecem com no
 * máximo 56px na tela. A versão de 128px (2x, para telas de alta densidade)
 * fica em img/interface/pequeno/ e é a que o site usa.
 */
async function reduzirIcones() {
  const dir = path.join(PUBLICO, 'img/interface');
  await mkdir(path.join(dir, 'pequeno'), { recursive: true });
  for (const nome of [
    'cuidados-de-saude',
    'universidade',
    'social-security',
    'bicicleta',
    'logo',
  ]) {
    await sharp(path.join(dir, `${nome}.png`))
      .resize({ width: 128 })
      .png({ compressionLevel: 9, palette: true })
      .toFile(path.join(dir, 'pequeno', `${nome}.png`));
  }
  console.log('Ícones de categoria reduzidos: public/img/interface/pequeno/');
}

await otimizarFotos();
await reduzirIcones();
await gerarIcones();
await gerarOpenGraph();
