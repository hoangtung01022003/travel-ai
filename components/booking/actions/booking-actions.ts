'use server'

import { createClient } from '@/lib/supabase/server'
import { createPaymentUrl } from '@/lib/payment/vnpay'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

interface CreateBookingParams {
  itemId: string
  itemName: string
  type: 'tour' | 'hotel'
  people: number
  date: string
  pricePerUnit: number
  totalPrice: number
  contactInfo: {
    name: string
    phone: string
    email: string
    note: string
  }
}

/**
 * Atomic Booking Action
 * Xử lý cả việc tạo booking và tạo link thanh toán trong 1 lần gọi duy nhất.
 * Triệt tiêu hoàn toàn xung đột session ở client-side.
 */
export async function createBookingAction(params: CreateBookingParams) {
  try {
    const supabase = await createClient()
    
    // 1. Kiểm tra xác thực ở Server
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' }
    }

    // 2. Chuẩn bị payload
    const bookingPayload: any = {
      user_id: user.id,
      booking_type: params.type,
      num_people: params.people,
      travel_date: params.date,
      total_price: params.totalPrice,
      item_name: params.itemName,
      item_price_snapshot: params.pricePerUnit,
      payment_method: 'vnpay',
      note: [
        params.contactInfo.name ? `Tên: ${params.contactInfo.name}` : '',
        params.contactInfo.phone ? `SĐT: ${params.contactInfo.phone}` : '',
        params.contactInfo.email ? `Email: ${params.contactInfo.email}` : '',
        params.contactInfo.note ? `Ghi chú: ${params.contactInfo.note}` : '',
      ].filter(Boolean).join(' | ') || null,
    }

    if (params.type === 'tour') {
      bookingPayload.tour_id = params.itemId
    } else {
      bookingPayload.hotel_id = params.itemId
    }

    // 3. Insert Booking
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .insert(bookingPayload)
      .select('id')
      .single()

    if (bookingErr || !booking) {
      console.error('[BookingAction] Insert error:', bookingErr)
      return { success: false, error: 'Không thể tạo đặt chỗ. Vui lòng thử lại sau.' }
    }

    // 4. Lấy thông tin Header để tạo Link VNPay chính xác (Support Ngrok/Localhost)
    const headerList = await headers()
    const forwarded = headerList.get('x-forwarded-for')
    const clientIp = forwarded?.split(',')[0]?.trim() ?? '127.0.0.1'
    
    const host = headerList.get('x-forwarded-host') || headerList.get('host')
    const protocol = headerList.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')
    const baseUrl = host ? `${protocol}://${host}` : ''

    // 5. Tạo Payment URL
    const paymentUrl = createPaymentUrl({
      bookingId: booking.id,
      amount: params.totalPrice,
      orderDesc: `Dat ${params.type === 'tour' ? 'tour' : 'ks'} - ${params.itemName} - ${params.date}`,
      clientIp,
      baseUrl
    })

    // 6. Revalidate cache
    revalidatePath('/my-tours')
    revalidatePath('/admin/bookings')

    return { 
      success: true, 
      bookingId: booking.id, 
      paymentUrl 
    }

  } catch (err: any) {
    console.error('[BookingAction] Unexpected error:', err)
    return { success: false, error: err.message || 'Lỗi hệ thống' }
  }
}
