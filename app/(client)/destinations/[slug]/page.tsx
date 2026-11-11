import { getDestinationBySlug } from '@/components/destination/actions/destination-actions'
import { DestinationDetailPageClient } from '@/components/destination/destination-detail-page-client'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function DestinationDetailPage({ params }: PageProps) {
  const { slug } = await params

  const result = await getDestinationBySlug(slug)

  if (!result.success || !result.data) {
    notFound()
  }

  return <DestinationDetailPageClient destination={result.data} />
}
