import crypto from 'crypto'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CreatePaymentUrlParams {
  bookingId: string
  amount: number       // VND (sẽ × 100 khi gửi VNPay)
  orderDesc: string
  clientIp: string
  locale?: 'vn' | 'en'
  baseUrl?: string
}

export interface VNPayCallbackResult {
  isValid: boolean
  responseCode: string  // '00' = success
  transactionRef: string
  amount: number        // VND (đã ÷ 100)
  rawQuery: Record<string, string>
}

// ── Core helpers ───────────────────────────────────────────────────────────────

/**
 * Sort object keys alphabetically and encode as URL query string (VNPay spec).
 * Keys and values are NOT double-encoded — qs.stringify handles encoding.
 */
function buildSignatureData(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
    .join('&')
  return sorted
}

function hmacSha512(secretKey: string, data: string): string {
  return crypto.createHmac('sha512', secretKey).update(Buffer.from(data, 'utf-8')).digest('hex')
}

function getVNPayDate(date: Date = new Date()): string {
  // Format: yyyyMMddHHmmss in GMT+7
  const tz = new Date(date.getTime() + 7 * 60 * 60 * 1000)
  return tz.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14)
}

// ── createPaymentUrl ───────────────────────────────────────────────────────────

export function createPaymentUrl(params: CreatePaymentUrlParams): string {
  const tmnCode   = process.env.VNPAY_TMN_CODE!
  const secretKey = process.env.VNPAY_HASH_SECRET!
  const vnpayUrl  = process.env.VNPAY_URL!
  const baseUrl   = params.baseUrl || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const returnUrl = `${baseUrl}/api/payment/vnpay-callback`

  const vnpParams: Record<string, string> = {
    vnp_Version:   '2.1.0',
    vnp_Command:   'pay',
    vnp_TmnCode:   tmnCode,
    vnp_Amount:    String(params.amount * 100),     // VNPay dùng VND × 100
    vnp_CurrCode:  'VND',
    vnp_TxnRef:    params.bookingId,
    vnp_OrderInfo: params.orderDesc,
    vnp_OrderType: 'other',
    vnp_Locale:    params.locale ?? 'vn',
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr:    params.clientIp,
    vnp_CreateDate: getVNPayDate(),
  }

  // Sign
  const sigData = buildSignatureData(vnpParams)
  const signature = hmacSha512(secretKey, sigData)

  // Build final URL — params must be sorted same way
  const sortedKeys = Object.keys(vnpParams).sort()
  const query = sortedKeys
    .map((k) => `${k}=${encodeURIComponent(vnpParams[k]).replace(/%20/g, '+')}`)
    .join('&')

  return `${vnpayUrl}?${query}&vnp_SecureHash=${signature}`
}

// ── verifyCallback ─────────────────────────────────────────────────────────────

export function verifyCallback(
  query: Record<string, string>
): VNPayCallbackResult {
  const secretKey    = process.env.VNPAY_HASH_SECRET!
  const receivedHash = query.vnp_SecureHash ?? ''

  // Extract params without signature fields
  const { vnp_SecureHash: _, vnp_SecureHashType: __, ...rest } = query

  const sigData   = buildSignatureData(rest)
  const computed  = hmacSha512(secretKey, sigData)

  const isValid =
    computed.toLowerCase() === receivedHash.toLowerCase()

  return {
    isValid,
    responseCode:   query.vnp_ResponseCode ?? '',
    transactionRef: query.vnp_TxnRef      ?? '',
    amount:         Number(query.vnp_Amount ?? 0) / 100,  // convert back to VND
    rawQuery:       query,
  }
}
