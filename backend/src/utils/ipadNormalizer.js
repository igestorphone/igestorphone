/**
 * iPad base (11ª geração) = chip A16.
 * Fornecedores listam como "iPad A16", "iPad (A16)", "iPad 11", "iPad 11ª"...
 * — é o mesmo produto. Canonical: "iPad 11".
 *
 * NÃO confundir com:
 * - iPad Pro 11" (tamanho de tela)
 * - iPad Air 11" / Air M2/M3 11" (linha Air)
 * - iPad mini
 */

function textBlob(product = {}) {
  return [product?.name, product?.model, product?.condition_detail, product?.notes, product?.description]
    .filter((v) => typeof v === 'string' && v.trim())
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Pro / Air / mini / etc. — não é o iPad base. */
export function isOtherIPadLine(blob) {
  const b = typeof blob === 'string' ? blob : textBlob(blob);
  if (/\bipad\s*pro\b/.test(b) || /\bpro\s*11\b/.test(b)) return true;
  if (/\bipad\s*air\b/.test(b) || /\bair\s*m[23]\b/.test(b)) return true;
  if (/\bipad\s*mini\b/.test(b)) return true;
  return false;
}

/**
 * Detecta iPad base 11ª gen / A16 (não Pro/Air/mini).
 * @param {Record<string, unknown>} product
 * @returns {boolean}
 */
export function hasBaseIPad11Signal(product = {}) {
  const blob = textBlob(product);
  if (!blob.includes('ipad')) return false;
  if (isOtherIPadLine(blob)) return false;

  // Chip A16 (com ou sem parênteses / espaços)
  if (/\ba\s*16\b/.test(blob) || /\(a\s*16\)/.test(blob)) return true;

  // 11ª geração / iPad 11 (sem "pro"/"air" já filtrados)
  if (/\bipad\s*11\b/.test(blob)) return true;
  if (/\bipad\s*11(a|ª|th)?\b/.test(blob)) return true;
  if (/\b11(a|ª|\s*geracao|\s*generation|\s*gen)\b/.test(blob) && blob.includes('ipad')) return true;

  return false;
}

/**
 * Canonicaliza name/model para "iPad 11" (mantém storage/cor no name se existirem).
 * @param {Record<string, unknown>} product
 * @returns {Record<string, unknown>}
 */
export function normalizeIPadProduct(product) {
  if (!product || typeof product !== 'object') return product;
  if (!hasBaseIPad11Signal(product)) return product;

  const storage = (product.storage || '').toString().trim();
  const color = (product.color || '').toString().trim();

  const nameParts = ['iPad 11'];
  if (storage) nameParts.push(storage);
  if (color && !/^n\/?a$/i.test(color) && color.toLowerCase() !== 'não especificado') {
    nameParts.push(color);
  }

  return {
    ...product,
    name: nameParts.join(' ').replace(/\s+/g, ' ').trim(),
    model: 'iPad 11',
  };
}
