import React from "react"
import {Link as RouterLink} from "react-router-dom"
import type {ApprovalRule} from "@approvio/api"
import ApprovalRuleViewer from "./ApprovalRuleViewer"
import {Button} from "@/components/ui/button"
import {Edit} from "lucide-react"

/**
 * Props for the TemplateDetailsRule component.
 */
interface Props {
  /** The nested approval rule structure to be displayed. */
  rule: ApprovalRule
  /** The unique identifier of the workflow template, used for navigation to the edit page. */
  templateId: string
}

/**
 * A management-focused component for workflow template approval rules.
 *
 * This component acts as a high-level wrapper that:
 * 1. Leverages `ApprovalRuleViewer` for the visual rendering and JSON toggle.
 * 2. Injects management features, specifically an edit icon that links to the rule modification page.
 *
 * It is intended for use in "Details" pages where the user has administrative privileges
 * and may need to navigate to editing workflows.
 */
const TemplateDetailsRule: React.FC<Props> = ({rule, templateId}) => {
  const editIconButton = (
    <Button asChild variant="outline" size="sm" className="h-8 border-primary/20 text-primary hover:bg-primary/10">
      <RouterLink to={`/workflow-templates/${templateId}/edit-approval-rule`} aria-label="Edit Approval Rule">
        <Edit className="mr-1.5 size-3.5" />
        Edit Rule
      </RouterLink>
    </Button>
  )

  return <ApprovalRuleViewer rule={rule} extraHeaderContent={editIconButton} />
}

export default TemplateDetailsRule
