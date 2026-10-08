/**
 * Foto.jsx — Imagem otimizada de um local.
 *
 * Usa a tag <picture>, que deixa o navegador escolher o melhor arquivo:
 *   - <source type="image/webp">: o WebP é bem menor que o JPG. O srcset oferece
 *     duas larguras (480px e 900px) e o "sizes" diz quanto espaço a foto ocupa
 *     na tela; com isso o celular baixa a versão pequena.
 *   - <img>: alternativa em JPG para navegadores sem WebP.
 *
 * width e height reservam o espaço da foto antes do download, evitando que o
 * layout "pule" (CLS). As versões WebP são geradas por `npm run imagens`.
 *
 * @param {{src: string, alt: string, className?: string, sizes?: string,
 *          largura?: number, altura?: number, prioridade?: boolean}} props
 *   src        - caminho do JPG original, ex.: '/img/saude/ubs-cecap.jpg'
 *   sizes      - largura ocupada na tela (padrão: card da grade)
 *   prioridade - true para a foto principal da página (carrega sem lazy)
 */
export default function Foto({
  src,
  alt,
  className,
  sizes = '(max-width: 560px) 50vw, 260px',
  largura = 480,
  altura = 360,
  prioridade = false,
}) {
  // Sem foto cadastrada: um bloco neutro do mesmo tamanho, para a grade não desalinhar.
  if (!src) {
    return (
      <span className={`${className ?? ''} foto-vazia`} role="img" aria-label={alt || undefined} />
    );
  }

  // '/img/saude/ubs-cecap.jpg' → '/img/saude/ubs-cecap'
  const base = src.replace(/\.(jpe?g|png)$/i, '');
  return (
    <picture>
      <source type="image/webp" srcSet={`${base}-480.webp 480w, ${base}.webp 900w`} sizes={sizes} />
      <img
        className={className}
        src={src}
        alt={alt}
        width={largura}
        height={altura}
        loading={prioridade ? 'eager' : 'lazy'}
        decoding="async"
      />
    </picture>
  );
}
