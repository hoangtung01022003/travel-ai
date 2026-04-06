'use client'

import { useState, useRef } from 'react'
import { UploadCloud, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

export interface UploadedImage {
  id: string
  url: string
  caption?: string
}

interface MultiImageUploadProps {
  value: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  maxFiles?: number
  bucket?: string
  folder?: string
}

export function MultiImageUpload({
  value = [],
  onChange,
  maxFiles = 5,
  bucket = 'travel-media',
  folder = 'uploads',
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Kiểm tra giới hạn số lượng file
    if (value.length + files.length > maxFiles) {
      toast.error(`Bạn chỉ được upload tối đa ${maxFiles} ảnh`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsUploading(true)

    // Upload từng file tuần tự hoặc song song (tuần tự chạy cho báo cáo error tốt hơn)
    const newImages: UploadedImage[] = []
    
    for (const file of files) {
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

        newImages.push({
          id: uuidv4(),
          url: data.url,
          caption: '', // Caption có thể sửa sau nếu muốn
        })
      } catch (err: any) {
        toast.error(`Lỗi khi tải lên ${file.name}: ${err.message}`)
      }
    }

    // Cập nhật mảng
    onChange([...value, ...newImages])
    
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (idToRemove: string) => {
    onChange(value.filter((img) => img.id !== idToRemove))
  }

  return (
    <div className="space-y-4">
      {/* Nút Upload */}
      {value.length < maxFiles && (
        <div
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors ${
            isUploading ? 'bg-muted border-primary/50' : 'bg-background hover:bg-muted/50 border-border'
          }`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          {isUploading ? (
            <div className="flex flex-col items-center text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm font-medium">Đang xử lý...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-muted-foreground gap-2 cursor-pointer">
              <div className="p-2 bg-primary/10 rounded-full text-primary mb-1">
                <UploadCloud className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground">Click để upload thêm ảnh ({value.length}/{maxFiles})</p>
              <p className="text-xs">Hỗ trợ chọn nhiều file JPG, PNG, WebP (Tối đa 5MB/file)</p>
            </div>
          )}
        </div>
      )}

      {/* Danh sách ảnh đã upload */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {value.map((image) => (
            <div key={image.id} className="relative group rounded-xl overflow-hidden border border-border aspect-square bg-muted">
              <Image
                src={image.url}
                alt={image.caption || "Gallery image"}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 rounded-full shadow-sm"
                  onClick={() => removeImage(image.id)}
                  title="Xóa ảnh"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Inpput */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
      />
    </div>
  )
}
