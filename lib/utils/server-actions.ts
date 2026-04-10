export type ServerActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

export const isNextRedirectError = (error: unknown): error is Error => {
  return (
    error instanceof Error &&
    (error.message === 'NEXT_REDIRECT' || error.message === 'NEXT_NOT_FOUND')
  )
}

export const createServerAction = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
): ((...args: T) => Promise<ServerActionResult<R>>) => {
  return async (...args: T): Promise<ServerActionResult<R>> => {
    try {
      const data = await fn(...args)

      return { success: true, data }
    } catch (error) {
      if (isNextRedirectError(error)) {
        throw error
      }

      // Đảm bảo lỗi được in ra Terminal để debug
      console.error('[ServerAction Error]:', error)

      return { success: false, error: getErrorMessage(error) }
    }
  }
}

export const getErrorMessage = (err: unknown, error?: string): string => {
  if (typeof err === 'string') {
    return err
  }

  if (err instanceof Error) {
    return err.message
  }

  return error ?? 'エラーが発生しました。'
}
