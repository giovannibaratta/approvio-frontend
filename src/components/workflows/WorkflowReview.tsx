import React from "react"
import type { WorkflowTemplateSummary } from "@approvio/api"
import { FileText, AlignLeft, GitBranch } from "lucide-react"

interface WorkflowReviewProps {
  name: string
  description: string
  template: WorkflowTemplateSummary | null
}

export const WorkflowReview: React.FC<WorkflowReviewProps> = ({
  name,
  description,
  template
}) => {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
        <h3 className="mb-4 text-sm font-medium text-foreground">Workflow Summary</h3>

        <dl className="space-y-4 text-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
            <dt className="flex w-32 items-center gap-2 text-muted-foreground">
              <FileText className="size-4" />
              <span>Name</span>
            </dt>
            <dd className="flex-1 font-medium text-foreground">{name}</dd>
          </div>

          <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
            <dt className="flex w-32 items-center gap-2 text-muted-foreground">
              <AlignLeft className="size-4" />
              <span>Description</span>
            </dt>
            <dd className="flex-1 text-foreground">
              {description ? (
                <span className="whitespace-pre-wrap">{description}</span>
              ) : (
                <span className="italic text-muted-foreground">None provided</span>
              )}
            </dd>
          </div>

          <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
            <dt className="flex w-32 items-center gap-2 text-muted-foreground">
              <GitBranch className="size-4" />
              <span>Template</span>
            </dt>
            <dd className="flex-1">
              {template ? (
                <div className="rounded-md border border-border/50 bg-background p-3">
                  <div className="font-medium text-foreground">{template.name}</div>
                  {template.description && (
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {template.description}
                    </div>
                  )}
                </div>
              ) : (
                <span className="italic text-destructive">No template selected</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

export default WorkflowReview
