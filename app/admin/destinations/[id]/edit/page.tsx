import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import DestinationEditClient from './destination-edit-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminDestinationEditPage({ params }: Props) {
  const { id } = await params
  const supabase = createAdminClient()

  const [
    { data: destination, error },
    { data: attractions },
    { data: allAttractions },
    { data: destImages },
    { data: tags },
    { data: destTags },
  ] = await Promise.all([
    supabase.from('destinations').select('*').eq('id', id).single(),
    // Current linked attractions
    supabase.from('attractions').select('*').eq('destination_id', id).order('sort_order', { ascending: true }),
    // All attractions in DB (for link mode)
    supabase.from('attractions').select('id, name, description, image_url, entry_fee, destination_id').order('name', { ascending: true }),
    supabase.from('destination_images').select('*').eq('destination_id', id).order('sort_order', { ascending: true }),
    supabase.from('tags').select('id, name, slug').order('name', { ascending: true }),
    supabase.from('destination_tags').select('tag_id').eq('destination_id', id),
  ])

  if (error || !destination) {
    notFound()
  }

  return (
    <div className="space-y-6 animate-fade-in mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Chỉnh sửa Điểm đến</h1>
        <p className="text-sm text-muted-foreground">{destination.name}</p>
      </div>

      <DestinationEditClient
        destination={destination}
        attractions={(attractions ?? []).map((a) => ({
          ...a,
          description: a.description ?? '',
          image_url: a.image_url ?? '',
          entry_fee: a.entry_fee ?? 0,
          sort_order: a.sort_order ?? undefined,
        }))}
        allAttractions={(allAttractions ?? []).map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description ?? '',
          image_url: a.image_url ?? '',
          entry_fee: a.entry_fee ?? 0,
          destination_id: a.destination_id ?? null,
        }))}
        destImages={(destImages ?? []).map((img) => ({
          id: img.id,
          image_url: img.image_url ?? '',
          caption: img.caption ?? '',
          sort_order: img.sort_order ?? undefined,
        }))}
        allTags={tags ?? []}
        selectedTagIds={(destTags ?? []).map((t: { tag_id: string }) => t.tag_id)}
      />
    </div>
  )
}
