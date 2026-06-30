import { Badge } from '@/components/ui/badge'

const variantByTone = {
  default: 'secondary',
  danger: 'destructive',
  muted: 'outline',
  success: 'default',
  warning: 'secondary',
} as const

type StatusBadgeProps = {
  label: string
  tone?: keyof typeof variantByTone
}

export function StatusBadge({ label, tone = 'default' }: StatusBadgeProps) {
  return <Badge variant={variantByTone[tone]}>{label}</Badge>
}
