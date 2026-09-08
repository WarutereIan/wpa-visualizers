import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchUsdRate, getCurrencySymbol } from '#/hooks/usePricingCurrency'

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 500): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('getCurrencySymbol', () => {
  it('returns known symbols for African and major currencies', () => {
    expect(getCurrencySymbol('KES')).toBe('KSh')
    expect(getCurrencySymbol('NGN')).toBe('₦')
    expect(getCurrencySymbol('UGX')).toBe('USh')
    expect(getCurrencySymbol('EUR')).toBe('€')
  })

  it('falls back to the currency code when unknown', () => {
    expect(getCurrencySymbol('XYZ')).toBe('XYZ')
  })
})

describe('fetchUsdRate', () => {
  it('returns 1 for USD without fetching', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchUsdRate('usd')).resolves.toBe(1)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('uses Open Exchange Rates when appId is provided', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        expect(String(url)).toContain('openexchangerates.org')
        expect(String(url)).toContain('app_id=test-key')
        return jsonResponse({ base: 'USD', rates: { KES: 129.5 } })
      }),
    )
    await expect(fetchUsdRate('KES', 'test-key')).resolves.toBe(129.5)
  })

  it('falls through to Frankfurter when Open Exchange Rates fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const href = String(url)
        if (href.includes('openexchangerates.org')) return jsonResponse({}, false, 401)
        if (href.includes('frankfurter')) {
          return jsonResponse({ base: 'USD', date: '2026-09-08', rates: { EUR: 0.92 } })
        }
        throw new Error(`unexpected url: ${href}`)
      }),
    )
    await expect(fetchUsdRate('EUR', 'bad-key')).resolves.toBe(0.92)
  })

  it('uses open.er-api when Frankfurter lacks the currency (e.g. KES)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const href = String(url)
        if (href.includes('frankfurter')) return jsonResponse({ message: 'not found' }, false, 404)
        if (href.includes('open.er-api.com')) {
          return jsonResponse({ result: 'success', rates: { KES: 130.1, NGN: 1600 } })
        }
        throw new Error(`unexpected url: ${href}`)
      }),
    )
    await expect(fetchUsdRate('KES')).resolves.toBe(130.1)
  })

  it('uses currency-api as the final fallback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const href = String(url)
        if (href.includes('frankfurter')) throw new Error('network')
        if (href.includes('open.er-api.com')) return jsonResponse({}, false, 503)
        if (href.includes('currency-api') || href.includes('fawazahmed0')) {
          return jsonResponse({ usd: { ugx: 3700.25, kes: 129 } })
        }
        throw new Error(`unexpected url: ${href}`)
      }),
    )
    await expect(fetchUsdRate('UGX')).resolves.toBe(3700.25)
  })

  it('throws when no source has the currency', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const href = String(url)
        if (href.includes('frankfurter')) return jsonResponse({ rates: {} })
        if (href.includes('open.er-api.com')) return jsonResponse({ rates: {} })
        if (href.includes('currency-api') || href.includes('fawazahmed0')) {
          return jsonResponse({ usd: {} })
        }
        throw new Error(`unexpected url: ${href}`)
      }),
    )
    await expect(fetchUsdRate('XYZ')).rejects.toThrow(/No rate for XYZ/)
  })
})
