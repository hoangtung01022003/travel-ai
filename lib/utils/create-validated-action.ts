import { z } from 'zod'
import type { ActionResult } from '@/types/common'
import { isNextRedirectError } from '@/lib/utils/server-actions'

type TypeMap = Record<
  string,
  'string' | 'boolean' | 'number' | 'array' | 'json' | 'file'
>

const parseValueByType = (
  value: string,
  fieldType?: TypeMap[string],
  fieldSchema?: z.ZodTypeAny
): unknown => {
  if (value === '__NULL__') {
    return null
  }
  if (value === '' || value === null) {
    if (fieldType === 'boolean') return false
    if (fieldType === 'number' || fieldType === 'json') return undefined

    return ''
  }

  const trimmed = value.trim()

  if (fieldType) {
    switch (fieldType) {
      case 'boolean':
        return trimmed === 'true' || trimmed === '1'
      case 'number':
        if (trimmed === '') return undefined

        const num = Number(trimmed)

        return isNaN(num) || !isFinite(num) ? undefined : num
      case 'array':
        return trimmed ? trimmed.split(',').map((s) => s.trim()) : []
      case 'json':
        try {
          return trimmed === '' ? undefined : JSON.parse(trimmed)
        } catch {
          return undefined
        }
      case 'file':
        return value
      default:
        return trimmed
    }
  }

  if (trimmed === 'true' || trimmed === '1') {
    if (!fieldSchema || fieldSchema.safeParse(true).success) return true
  }

  if (trimmed === 'false' || trimmed === '0') {
    if (!fieldSchema || fieldSchema.safeParse(false).success) return false
  }

  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      const parsed = JSON.parse(trimmed)
      if (!fieldSchema || fieldSchema.safeParse(parsed).success) {
        return parsed
      }
    } catch {}
  }

  return trimmed
}

export const validateFormData = <T extends z.ZodTypeAny>(
  schema: T,
  formData: FormData,
  typeMap?: TypeMap
) => {
  const data: Record<string, unknown> = {}
  const schemaShape = schema instanceof z.ZodObject ? schema.shape : undefined

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      const files = formData
        .getAll(key)
        .filter((v): v is File => v instanceof File)
      const fieldType = typeMap?.[key]

      if (fieldType === 'file') {
        data[key] = files.length > 1 ? files : files[0] || undefined
      } else {
        data[key] = files.length > 1 ? files : files[0]
      }
      continue
    }

    const fieldType = typeMap?.[key]
    const fieldSchema = schemaShape?.[key]

    const parsed = parseValueByType(value, fieldType, fieldSchema)

    if (parsed !== undefined) {
      data[key] = parsed
    }
  }

  const parsed = schema.safeParse(data)

  if (!parsed.success) {
    const errors: Record<string, string> = {}

    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() ?? 'root'
      errors[field] = issue.message
    }

    return { success: false as const, errors }
  }

  return { success: true as const, data: parsed.data }
}

export const createValidatedAction =
  <TSchema extends z.ZodTypeAny, TResult = void>(
    schema: TSchema,
    handler: (data: z.infer<TSchema>) => Promise<TResult>,
    typeMap?: TypeMap
  ) =>
  async (
    _prev: ActionResult<TResult> | undefined,
    formData: FormData
  ): Promise<ActionResult<TResult>> => {
    try {
      const validation = validateFormData(schema, formData, typeMap)

      if (!validation.success) {
        return {
          success: false,
          errors: validation.errors,
        }
      }

      const result = await handler(validation.data)

      return result === undefined
        ? { success: true }
        : { success: true, data: result }
    } catch (err) {
      if (isNextRedirectError(err)) {
        throw err
      }

      // Đảm bảo in lỗi ra Terminal để debug
      console.error('[ValidatedAction Error]:', err)

      return {
        success: false,
        errors: {
          root: err instanceof Error ? err.message : 'エラーが発生しました',
        },
      }
    }
  }
