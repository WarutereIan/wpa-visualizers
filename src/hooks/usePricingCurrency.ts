import { useCallback, useEffect, useState } from 'react'

/**
 * Pricing currency detection uses IP-based geolocation only.
 * We do not use device location, browser Geolocation API, or GPS.
 * The server (ipapi.co) resolves the request's IP address to country/currency.
 */

interface GeoResponse {
  country_code?: string
  country_name?: string
  currency?: string
}

interface OpenExchangeRatesResponse {
  base: string
  rates: Record<string, number>
  timestamp?: number
}

interface FrankfurterLatestResponse {
  base: string
  date: string
  rates: Record<string, number>
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CHF: 'CHF',
  CAD: 'C$',
  AUD: 'A$',
  INR: '₹',
  ZAR: 'R',
  KES: 'KSh',
  NGN: '₦',
  GHS: '₵',
  UGX: 'USh',
  TZS: 'TSh',
  RWF: 'FRw',
  ETB: 'Br',
}

const GEO_API = 'https://ipapi.co/json/'
const OPEN_EXCHANGE_RATES_URL = 'https://openexchangerates.org/api/latest.json'
const FRANKFURTER_BASE = 'https://api.frankfurter.dev/v1'
/** Broad coverage (KES, NGN, UGX, …) — Frankfurter only has ~30 currencies. */
const OPEN_ER_API = 'https://open.er-api.com/v6/latest/USD'
const FAWAZ_USD_RATES =
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json'

export interface PricingCurrencyState {
  currency: string
  rate: number
  country: string | null
  currencySymbol: string
  loading: boolean
  error: string | null
  isConverted: boolean
}

const DEFAULT_STATE: PricingCurrencyState = {
  currency: 'USD',
  rate: 1,
  country: null,
  currencySymbol: '$',
  loading: true,
  error: null,
  isConverted: false,
}

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] ?? code
}

function getOpenExchangeRatesAppId(): string | undefined {
  return typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPEN_EXCHANGE_RATES_APP_ID
    ? String(import.meta.env.VITE_OPEN_EXCHANGE_RATES_APP_ID).trim() || undefined
    : undefined
}

export async function fetchWithTimeout(url: string, ms = 5000): Promise<Response> {
  return Promise.race([
    fetch(url),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

/** USD → currency rate, trying sources that cover African currencies (KES, NGN, …). */
export async function fetchUsdRate(currency: string, appId?: string): Promise<number> {
  const code = currency.toUpperCase()
  if (code === 'USD') return 1

  if (appId) {
    try {
      const res = await fetchWithTimeout(
        `${OPEN_EXCHANGE_RATES_URL}?app_id=${encodeURIComponent(appId)}&symbols=${encodeURIComponent(code)}`,
      )
      if (res.ok) {
        const data = (await res.json()) as OpenExchangeRatesResponse
        const rate = data.rates?.[code]
        if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) return rate
      }
    } catch {
      /* try next source */
    }
  }

  try {
    const res = await fetchWithTimeout(
      `${FRANKFURTER_BASE}/latest?base=USD&symbols=${encodeURIComponent(code)}`,
    )
    if (res.ok) {
      const data = (await res.json()) as FrankfurterLatestResponse
      const rate = data.rates?.[code]
      if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) return rate
    }
  } catch {
    /* try next source */
  }

  try {
    const res = await fetchWithTimeout(OPEN_ER_API)
    if (res.ok) {
      const data = (await res.json()) as { result?: string; rates?: Record<string, number> }
      const rate = data.rates?.[code]
      if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) return rate
    }
  } catch {
    /* try next source */
  }

  const res = await fetchWithTimeout(FAWAZ_USD_RATES)
  if (!res.ok) throw new Error('Rates fetch failed')
  const data = (await res.json()) as { usd?: Record<string, number> }
  const rate = data.usd?.[code.toLowerCase()]
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    throw new Error(`No rate for ${code}`)
  }
  return rate
}

export function usePricingCurrency() {
  const [state, setState] = useState<PricingCurrencyState>(DEFAULT_STATE)

  useEffect(() => {
    let cancelled = false
    const appId = getOpenExchangeRatesAppId()

    async function detect() {
      try {
        const geoRes = await fetchWithTimeout(GEO_API)
        if (cancelled) return
        if (!geoRes.ok) throw new Error('Geo fetch failed')

        const geo = (await geoRes.json()) as GeoResponse
        const currency = (geo.currency || 'USD').toUpperCase()
        const country = geo.country_name ?? null

        if (currency === 'USD') {
          setState({
            currency: 'USD',
            rate: 1,
            country,
            currencySymbol: '$',
            loading: false,
            error: null,
            isConverted: false,
          })
          return
        }

        const rate = await fetchUsdRate(currency, appId)
        if (cancelled) return

        setState({
          currency,
          rate,
          country,
          currencySymbol: getCurrencySymbol(currency),
          loading: false,
          error: null,
          isConverted: true,
        })
      } catch (e) {
        if (cancelled) return
        setState({
          ...DEFAULT_STATE,
          loading: false,
          error: e instanceof Error ? e.message : 'Detection failed',
        })
      }
    }

    detect()
    return () => {
      cancelled = true
    }
  }, [])

  const formatPrice = useCallback(
    (usdAmount: number, options?: { showDecimals?: boolean }): string => {
      const { currency, rate, currencySymbol } = state
      const localAmount = usdAmount * rate
      const showDecimals = options?.showDecimals ?? localAmount % 1 !== 0
      const value = showDecimals
        ? localAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : Math.round(localAmount).toLocaleString()
      if (CURRENCY_SYMBOLS[currency]) {
        return `${currencySymbol}${value}`
      }
      return `${value} ${currency}`
    },
    [state.currency, state.rate, state.currencySymbol],
  )

  const convert = useCallback(
    (usdAmount: number): number => state.rate * usdAmount,
    [state.rate],
  )

  return {
    ...state,
    formatPrice,
    convert,
  }
}
