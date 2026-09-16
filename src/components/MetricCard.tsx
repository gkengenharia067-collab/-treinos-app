import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function MetricCard({
  titulo,
  valor,
  unidade,
  descricao,
  badge,
  icone,
  className,
}: {
  titulo: string
  valor: ReactNode
  unidade?: string
  descricao?: string
  badge?: ReactNode
  icone?: ReactNode
  className?: string
}) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
        {icone}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tabular-nums">{valor}</span>
          {unidade ? <span className="text-sm text-muted-foreground">{unidade}</span> : null}
        </div>
        {descricao ? <p className="mt-1 text-xs text-muted-foreground">{descricao}</p> : null}
        {badge ? <div className="mt-2">{badge}</div> : null}
      </CardContent>
    </Card>
  )
}