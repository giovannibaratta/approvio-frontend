import React, {useState} from "react"
import type {ApprovalRule} from "@approvio/api"
import ApprovalRuleRenderer from "../shared/ApprovalRuleRenderer"
import {Switch} from "@/components/ui/switch"
import {Label} from "@/components/ui/label"
import {FileJson, GitBranch} from "lucide-react"

interface Props {
  rule: ApprovalRule
  title?: string
  /**
   * Additional content to be rendered in the header, next to the title.
   * Useful for badges, chips, or small status indicators.
   */
  extraHeaderContent?: React.ReactNode
}

/**
 * A viewer component that combines visual rendering and raw JSON preview.
 * It is suitable for pages that only need to display the rule without management capabilities.
 */
const ApprovalRuleViewer: React.FC<Props> = ({rule, title = "Approval Rule", extraHeaderContent}) => {
  const [showRaw, setShowRaw] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-md border border-amber-500/20 bg-amber-500/10">
            <GitBranch className="size-4 text-amber-500" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
            {extraHeaderContent}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-border/40 bg-muted/50 px-3 py-1.5">
          <FileJson className="size-4 text-muted-foreground" />
          <Label htmlFor="show-raw-json" className="cursor-pointer text-sm font-medium">
            Raw JSON
          </Label>
          <Switch
            id="show-raw-json"
            checked={showRaw}
            onCheckedChange={checked => setShowRaw(checked)}
            className="ml-2"
          />
        </div>
      </div>

      {showRaw ? (
        <div className="relative overflow-x-auto rounded-md border border-border/50 bg-muted/30 p-4">
          <div className="absolute right-0 top-0 select-none p-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground opacity-50">
            JSON
          </div>
          <pre className="font-mono text-xs text-muted-foreground">
            <code>{JSON.stringify(rule, null, 2)}</code>
          </pre>
        </div>
      ) : (
        <div className="rounded-md border border-border/50 bg-background/50 p-4">
          <ApprovalRuleRenderer rule={rule} />
        </div>
      )}
    </div>
  )
}

export default ApprovalRuleViewer
