import { Bot, Clock } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { timeAgo } from '@/lib/utils/common'

export default async function AdminAiLogsPage() {
  const supabase = createAdminClient()

  const { data: logs, error } = await supabase
    .from('ai_prompt_logs')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(50)

  const { count: totalTokens } = await supabase
    .from('ai_prompt_logs')
    .select('tokens_used', { count: 'exact', head: false })

  if (error) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Không thể tải AI logs: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Prompt Logs</h1>
          <p className="text-sm text-muted-foreground">
            {logs?.length ?? 0} requests gần đây
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-primary">{logs?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">Tổng requests</p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4 text-accent" />
            Lịch sử AI requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(logs ?? []).length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Chưa có AI request nào
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(logs ?? []).map((log) => {
                const profile = log.profiles as
                  | { full_name: string | null; email: string | null }
                  | null
                return (
                  <div key={log.id} className="px-5 py-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                          {(profile?.full_name || profile?.email || 'U')
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">
                          {profile?.full_name ||
                            profile?.email ||
                            'Người dùng ẩn danh'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {log.model && (
                          <Badge variant="accent">{log.model}</Badge>
                        )}
                        {log.tokens_used != null && (
                          <Badge variant="muted">
                            {log.tokens_used.toLocaleString('vi-VN')} tokens
                          </Badge>
                        )}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {timeAgo(log.created_at ?? '')}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="line-clamp-2 text-xs text-muted-foreground font-mono">
                        {log.prompt}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
