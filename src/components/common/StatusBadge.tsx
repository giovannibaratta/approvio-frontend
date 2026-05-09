import React from "react"
import {cva, type VariantProps} from "class-variance-authority"
import {cn} from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
  {
    variants: {
      status: {
        APPROVED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
        REJECTED: "border-destructive/20 bg-destructive/10 text-destructive",
        CANCELED: "border-muted/20 bg-muted/10 text-muted-foreground",
        EVALUATION_IN_PROGRESS: "border-blue-500/20 bg-blue-500/10 text-blue-600",
        EXPIRED: "border-amber-500/20 bg-amber-500/10 text-amber-600",
        DEFAULT: "border-border bg-muted/50 text-muted-foreground"
      }
    },
    defaultVariants: {
      status: "DEFAULT"
    }
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  label?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({status, label, className, ...props}) => {
  const displayLabel = label || (status ? (status as string).replace(/_/g, " ") : "")

  // Normalize status for the variant matcher
  // Valid statuses as defined in statusBadgeVariants
  const validStatuses = ["APPROVED", "REJECTED", "CANCELED", "EVALUATION_IN_PROGRESS", "EXPIRED"] as const
  const variant =
    status && (validStatuses as readonly string[]).includes(status as string) ? (status as any) : "DEFAULT"

  return (
    <span className={cn(statusBadgeVariants({status: variant}), className)} {...props}>
      {displayLabel}
    </span>
  )
}
