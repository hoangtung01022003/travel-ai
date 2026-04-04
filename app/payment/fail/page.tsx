import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Thanh toán thất bại — VietTravel' }

const VNPAY_ERROR_CODES: Record<string, string> = {
  '07': 'Trừ tiền thành công nhưng giao dịch bị nghi ngờ gian lận.',
  '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking.',
  '10': 'Xác thực thông tin thẻ/tài khoản sai quá 3 lần.',
  '11': 'Đã hết hạn chờ thanh toán.',
  '12': 'Thẻ/Tài khoản bị khóa.',
  '13': 'Sai OTP. Vui lòng thực hiện lại.',
  '24': 'Bạn đã hủy giao dịch.',
  '51': 'Tài khoản không đủ số dư.',
  '65': 'Vượt quá hạn mức giao dịch trong ngày.',
  '75': 'Ngân hàng đang bảo trì.',
  '79': 'Nhập sai mật khẩu quá số lần quy định.',
  '99': 'Giao dịch thất bại.',
  invalid_signature: 'Chữ ký không hợp lệ.',
  booking_not_found: 'Không tìm thấy thông tin booking.',
}

export default function PaymentFailPage({
  searchParams,
}: {
  searchParams: { ref?: string; code?: string; reason?: string }
}) {
  const code    = searchParams.reason ?? searchParams.code ?? '99'
  const message = VNPAY_ERROR_CODES[code] ?? 'Giao dịch không thành công.'

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
        <XCircle className="h-12 w-12 text-destructive" />
      </div>
      <h1 className="mb-2 text-2xl font-bold">Thanh toán thất bại</h1>
      <p className="mb-1 max-w-sm text-muted-foreground">{message}</p>
      {searchParams.ref && (
        <p className="mb-6 text-sm text-muted-foreground">
          Mã tham chiếu: <span className="font-mono font-medium">{searchParams.ref}</span>
        </p>
      )}
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/my-tours">Thử lại</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Về trang chủ</Link>
        </Button>
      </div>
    </div>
  )
}
