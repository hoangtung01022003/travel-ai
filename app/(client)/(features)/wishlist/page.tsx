import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getMyWishlist } from '@/components/wishlist/actions/wishlist-actions'
import WishlistClient from '@/components/wishlist/wishlist-client'

export const metadata: Metadata = {
  title: 'Yêu thích của tôi — VietTravel',
  description: 'Các điểm đến và khách sạn bạn đã lưu',
}

export default async function WishlistPage() {
  const items = await getMyWishlist()
  if (items === null) redirect('/login')
  return <WishlistClient initialItems={items} />
}
