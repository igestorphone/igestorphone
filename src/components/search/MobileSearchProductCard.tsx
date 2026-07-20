import { MessageCircle, MapPin, type LucideIcon } from 'lucide-react'
import ProductColorSwatch from '@/components/ui/ProductColorSwatch'
import { SupplierAvatar } from '@/components/ui/SupplierAvatar'
import { normalizeColor } from '@/pages/colorNormalizer'
import { detectProductRegionIds, regionOptionById } from '@/lib/productRegions'

type SearchMode = 'novo' | 'seminovo' | 'android'

type MobileSearchProductCardProps = {
  product: any
  searchMode: SearchMode | null
  isCheapest: boolean
  formatPrice: (price: number) => string
  formatListedTime: (updatedAt?: string | null) => string
  normalizeStorage: (storage?: string | null) => string
  productListTitleShown: (product: any) => string
  productListIconSpec: (product: any) => { Icon: LucideIcon; wrap: string }
  productSwatchProps: (product: any, mode: SearchMode | null) => Record<string, unknown>
  onWhatsApp: (whatsapp: string, product: any) => void
}

export default function MobileSearchProductCard({
  product,
  searchMode,
  isCheapest,
  formatPrice,
  formatListedTime,
  normalizeStorage,
  productListTitleShown,
  productListIconSpec,
  productSwatchProps,
  onWhatsApp,
}: MobileSearchProductCardProps) {
  const listedTime = formatListedTime(product.updated_at)
  const storeAddress = (product.supplier_store_address || '').trim()
  const regionIds = detectProductRegionIds(product)
  const regionLabel =
    regionIds.length > 0
      ? regionIds.map((id) => regionOptionById(id)?.shortLabel || id).join(', ')
      : '—'
  const colorLabel = normalizeColor(product.color || '', product.model || product.name)
  const { Icon, wrap } = productListIconSpec(product)

  return (
    <article className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <div className={wrap} aria-hidden>
            <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </div>
          <h3 className="text-sm font-bold uppercase leading-snug tracking-tight text-gray-900 dark:text-white">
            {productListTitleShown(product).toUpperCase()}
          </h3>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(product.price || 0)}</p>
          {listedTime ? <p className="text-[10px] text-gray-400 dark:text-white/40">{listedTime}</p> : null}
          {isCheapest ? (
            <span className="mt-1 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
              Mais barato
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-white/45">Storage</p>
          <p className="mt-0.5 font-semibold text-gray-800 dark:text-white/90">{normalizeStorage(product.storage) || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-white/45">Cor</p>
          <div className="mt-1 flex items-center gap-1.5">
            <ProductColorSwatch size="sm" {...productSwatchProps(product, searchMode)} />
            <span className="truncate font-semibold text-gray-800 dark:text-white/90">{colorLabel || '—'}</span>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-white/45">Regiões</p>
          <p className="mt-0.5 font-semibold text-gray-800 dark:text-white/90">{regionLabel}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-white/45">Fornecedor</p>
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
            <SupplierAvatar name={product.supplier_name} photoUrl={product.supplier_photo_url} size="sm" />
            <p className="truncate font-semibold text-emerald-700 dark:text-emerald-400">
              {product.supplier_name || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {product.whatsapp ? (
        <button
          type="button"
          onClick={() => onWhatsApp(product.whatsapp, product)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-bold text-white shadow-md active:bg-[#20bd5a]"
        >
          <MessageCircle className="h-5 w-5" />
          WhatsApp
        </button>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-gray-200 py-3 text-center text-xs text-gray-400 dark:border-white/15">
          Sem WhatsApp
        </p>
      )}

      {storeAddress ? (
        <p className="mt-3 flex items-start gap-1.5 text-[11px] font-medium uppercase leading-snug tracking-wide text-gray-500 dark:text-white/50">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" aria-hidden />
          <span>{storeAddress}</span>
        </p>
      ) : null}
    </article>
  )
}
