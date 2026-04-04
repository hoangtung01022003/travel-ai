import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Thanh toán thành công — VietTravel' }

export default function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { ref?: string }
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
      </div>
      <h1 className="mb-2 text-2xl font-bold">Thanh toán thành công!</h1>
      <p className="mb-1 text-muted-foreground">
        Booking của bạn đã được xác nhận.
      </p>
      {searchParams.ref && (
        <p className="mb-6 text-sm text-muted-foreground">
          Mã giao dịch: <span className="font-mono font-medium">{searchParams.ref}</span>
        </p>
      )}
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/my-tours">Xem các tour đã đặt</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Về trang chủ</Link>
        </Button>
      </div>
    </div>
  )
}
