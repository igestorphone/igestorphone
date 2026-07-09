/** Filtros SQL por modo de busca — alinhados a products.js (condition_type / product_type). */

const NON_APPLE_BLOB_RE =
  '(tecno|infinix|samsung|galaxy|xiaomi|redmi|poco|motorola|realme|oppo|vivo|huawei|nothing|oneplus|honor|zte|zenfone|pixel|nubia|meizu|black[[:space:]]*shark)'

function listingBlob(alias) {
  return `LOWER(COALESCE(${alias}.name, '') || ' ' || COALESCE(${alias}.model, '') || ' ' || COALESCE(${alias}.color, '') || ' ' || COALESCE(${alias}.storage, ''))`
}

function nameModelBlob(alias) {
  return `LOWER(COALESCE(${alias}.name, '') || ' ' || COALESCE(${alias}.model, ''))`
}

/** Lacrado / novo — condition_type lacrados_novos (inclui CPO = Novo) */
export function lacradoProductWhereSql(alias = 'p') {
  const blob = listingBlob(alias)
  const nm = nameModelBlob(alias)
  return `(
    ${alias}.condition = 'Novo'
    AND COALESCE(UPPER(TRIM(COALESCE(${alias}.condition_detail, ''))), '') IN ('LACRADO', 'NOVO', 'CPO')
    AND NOT (${blob} ~* '(seminovo|semi[[:space:]]*-?[[:space:]]*novo|recondicionado|vitrine|swap|open[[:space:]]*box|mostru[aá]rio|[[:<:]]usad[oa][[:>:]]|[[:<:]]used[[:>:]]|as[[:space:]._-]*is|asis|(^|[^0-9,.])(8[0-9]|9[0-9])\\s*%)')
    AND (COALESCE(TRIM(COALESCE(${alias}.variant, '')), '') = '' OR NOT (LOWER(TRIM(COALESCE(${alias}.variant, ''))) ~* '(swap|vitrine|seminovo|asis|as[[:space:]._-]*is|recondicionado)'))
    AND (${alias}.product_type = 'apple' OR ${alias}.product_type IS NULL)
    AND NOT (${nm} ~* '${NON_APPLE_BLOB_RE}')
  )`
}

/** Semi-novo — condition_type seminovos (CPO NÃO entra aqui) */
export function seminovoProductWhereSql(alias = 'p') {
  const nm = nameModelBlob(alias)
  return `(
    (
      ${alias}.condition_detail IN ('SWAP', 'VITRINE', 'SEMINOVO', 'SEMINOVO PREMIUM', 'SEMINOVO AMERICANO', 'NON ACTIVE', 'ASIS', 'ASIS+', 'AS IS PLUS')
      OR (${alias}.condition = 'Seminovo' AND (${alias}.condition_detail IS NULL OR ${alias}.condition_detail = ''))
    )
    AND COALESCE(UPPER(TRIM(COALESCE(${alias}.condition_detail, ''))), '') <> 'CPO'
    AND (${alias}.product_type = 'apple' OR ${alias}.product_type IS NULL)
    AND NOT (${nm} ~* '${NON_APPLE_BLOB_RE}')
  )`
}

/** Android — product_type android ou marcas não-Apple no nome/modelo */
export function androidProductWhereSql(alias = 'p') {
  const nm = nameModelBlob(alias)
  return `(
    ${alias}.product_type = 'android'
    OR (${nm} ~* '${NON_APPLE_BLOB_RE}')
  )`
}

/** Fragmento para WHERE: TRUE = sem filtro de categoria */
export function searchModeProductWhereSql(searchMode, alias = 'p') {
  const key = String(searchMode || '')
    .toLowerCase()
    .trim()
  if (key === 'novo' || key === 'lacrado' || key === 'lacrados_novos') {
    return lacradoProductWhereSql(alias)
  }
  if (key === 'seminovo' || key === 'seminovos') {
    return seminovoProductWhereSql(alias)
  }
  if (key === 'android') {
    return androidProductWhereSql(alias)
  }
  return 'TRUE'
}
