'use client'

import { useState, useRef } from 'react'
import { UploadCloud, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  bucket?: string
  folder?: string
}

export function ImageUpload({ value, onChange, bucket = 'travel-media', folder = 'uploads' }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', bucket)
    formData.append('folder', folder)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Upload thất bại')
      }

      onChange(data.url)
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi upload')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-border h-48 bg-muted">
          <Image
            src={value}
            alt="Uploaded thumbnail"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onChange('')}
            >
              <X className="h-4 w-4 mr-2" />
              Xóa ảnh
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors ${
            isUploading ? 'bg-muted border-primary/50' : 'bg-background hover:bg-muted/50 border-border'
          }`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          {isUploading ? (
            <div className="flex flex-col items-center text-muted-foreground gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Đang tải lên...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-muted-foreground gap-2 cursor-pointer">
              <div className="p-3 bg-primary/10 rounded-full text-primary mb-2">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-foreground">Click để tải ảnh lên</p>
              <p className="text-xs">Hỗ trợ JPG, PNG, WebP (Tối đa 5MB)</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive mt-1 flex items-center gap-1">
          <X className="h-3.5 w-3.5" />
          {error}
        </p>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />
    </div>
  )
}
