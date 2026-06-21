import React from "react"
import {Mail, Webhook, MessageSquare} from "lucide-react"
import type {WorkflowAction} from "@approvio/api"

interface TemplateActionsListProps {
  actions: WorkflowAction[]
}

const TemplateActionsList: React.FC<TemplateActionsListProps> = ({actions}) => {
  return (
    <div className="space-y-3">
      {actions.map((act, idx) => {
        const action = act
        return (
          <div key={idx} className="rounded-md border border-border/40 bg-background p-3">
            {action.type === "EMAIL" && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Email Action</span>
                </div>
                <div className="pl-6 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Recipients:</span> {action.recipients?.join(", ")}
                </div>
              </div>
            )}
            {action.type === "WEBHOOK" && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Webhook className="size-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Webhook Action</span>
                </div>
                <div className="space-y-1 pl-6 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">URL:</span> {action.url}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Method:</span> {action.method}
                  </div>
                </div>
              </div>
            )}
            {action.type === "SLACK" && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Slack Action</span>
                </div>
                <div className="pl-6 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Webhook URL:</span> {action.webhookUrl}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default TemplateActionsList
