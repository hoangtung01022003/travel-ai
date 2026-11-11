import { getDestinations } from '@/components/destination/actions/destination-actions'
import { HomePageClient } from '@/components/home/home-page-client'
import { getHotels } from '@/components/hotel/actions/hotel-actions'

export default async function Home() {
  const [destinationResult, hotelResult] = await Promise.all([
    getDestinations({ featured: true, limit: 4 }),
    getHotels({ featured: true, limit: 4 }),
  ])

  const destinations =
    destinationResult.success && destinationResult.data
      ? destinationResult.data.destinations
      : []

  const hotels =
    hotelResult.success && hotelResult.data ? hotelResult.data.hotels : []

  return <HomePageClient destinations={destinations} hotels={hotels} />
}
