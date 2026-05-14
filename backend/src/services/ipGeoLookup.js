/** Cache em memória (processo): IP público → geo aproximada (serviço externo). */
const cache = new Map();
const TTL_MS = parseInt(process.env.IP_GEO_CACHE_TTL_MS || `${30 * 60 * 1000}`, 10);

export function isPublicIpv4(ip) {
  if (!ip || typeof ip !== 'string') return false;
  const s = ip.trim();
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  const c = Number(m[3]);
  const d = Number(m[4]);
  if ([a, b, c, d].some((n) => n > 255)) return false;
  if (a === 10) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 127) return false;
  if (a === 0) return false;
  return true;
}

/**
 * Consulta em lote (IPv4 público). Usa ip-api.com (não comercial; limite de taxa).
 * @param {string[]} ips
 * @returns {Promise<Map<string, { lat: number; lng: number; city: string | null; region: string | null; country: string | null; countryCode: string | null }>>}
 */
export async function lookupIpv4GeoBatch(ips) {
  const out = new Map();
  if (!ips.length) return out;
  if (process.env.DISABLE_IP_GEO_LOOKUP === '1') return out;

  const unique = [...new Set(ips.map((x) => String(x || '').trim()).filter(isPublicIpv4))];
  const needFetch = [];
  const now = Date.now();
  for (const ip of unique) {
    const hit = cache.get(ip);
    if (hit && now - hit.ts < TTL_MS) {
      out.set(ip, hit.data);
    } else {
      needFetch.push(ip);
    }
  }
  if (!needFetch.length) return out;

  const chunkSize = 80;
  for (let i = 0; i < needFetch.length; i += chunkSize) {
    const chunk = needFetch.slice(i, i + chunkSize);
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(
        'http://ip-api.com/batch?fields=status,message,country,countryCode,regionName,city,lat,lon,query',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chunk),
          signal: controller.signal,
        }
      );
      if (!res.ok) continue;
      const rows = await res.json();
      if (!Array.isArray(rows)) continue;
      for (const row of rows) {
        if (!row || row.status !== 'success' || !row.query) continue;
        const lat = typeof row.lat === 'number' ? row.lat : null;
        const lng = typeof row.lon === 'number' ? row.lon : null;
        if (lat == null || lng == null) continue;
        const data = {
          lat,
          lng,
          city: row.city || null,
          region: row.regionName || null,
          country: row.country || null,
          countryCode: row.countryCode || null,
        };
        cache.set(row.query, { ts: now, data });
        out.set(row.query, data);
      }
    } catch (e) {
      console.warn('[ipGeoLookup] batch falhou:', e?.message || e);
    } finally {
      clearTimeout(t);
    }
  }
  return out;
}
