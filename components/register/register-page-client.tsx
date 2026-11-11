'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

import { registerAction } from '@/components/register/actions/register-action'
import { registerSchema } from '@/lib/schema/auth'

import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { ControlledInput } from '@/components/ui/controlled-input'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useFormWithServerAction } from '@/hooks/use-form-with-server-action'
import { useToast } from '@/hooks/use-toast-notifications'
import { Eye, EyeOff, Loader2, Lock, Mail, MapPin, User, Compass } from 'lucide-react'
import { APP_NAME } from '@/lib/constants/common'
import { Label } from '../ui/label'
import { useState } from 'react'

export const RegisterPageClient = () => {
  const router = useRouter()
  const { error, success } = useToast()
  const [showPassword, setShowPassword] = useState(false)

  const { form, handleSubmit, isPending, canSubmit } = useFormWithServerAction({
    schema: registerSchema,
    action: registerAction,
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      password_confirm: '',
    },
    onSuccess: () => {
      success('Registered successfully')
      router.replace('/')
    },
    onError: (errors) => {
      if (errors.root) {
        error(errors.root)
      }
    },
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <Card className="border-accent border-t-4 shadow-2xl">
        <CardHeader className="pb-2 text-center">
          <Link
            href="/"
            className="mb-4 inline-flex items-center justify-center gap-2"
          >
            <div className="bg-primary text-accent flex h-10 w-10 rotate-45 items-center justify-center rounded-md">
              <Compass className="h-5 w-5 -rotate-45" />
            </div>
            <span className="font-display text-primary ml-1 text-2xl font-semibold">{APP_NAME}</span>
          </Link>
          <h1 className="text-xl font-semibold">Tạo tài khoản mới</h1>
          <p className="text-muted-foreground text-sm">
            Bắt đầu hành trình khám phá Việt Nam
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <div className="space-y-2">
                <Label htmlFor="full_name">Họ và tên</Label>
                <ControlledInput
                  control={form.control}
                  name="full_name"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  disabled={isPending}
                  inputClassName="pl-10"
                  prefix={
                    <User className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <ControlledInput
                  control={form.control}
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  disabled={isPending}
                  inputClassName="pl-10"
                  prefix={
                    <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <ControlledInput
                  control={form.control}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  disabled={isPending}
                  inputClassName="pl-10"
                  prefix={
                    <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  }
                  suffix={
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password_confirm">Xác nhận mật khẩu</Label>
                <ControlledInput
                  control={form.control}
                  name="password_confirm"
                  type="password"
                  placeholder="••••••••"
                  disabled={isPending}
                  inputClassName="pl-10"
                  prefix={
                    <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  }
                />
              </div>
            </FieldGroup>
            <Button
              type="submit"
              className="h-11 w-full"
              disabled={isPending || !canSubmit}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Đăng ký
            </Button>
          </form>

          <p className="text-muted-foreground text-center text-sm">
            Đã có tài khoản?
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
