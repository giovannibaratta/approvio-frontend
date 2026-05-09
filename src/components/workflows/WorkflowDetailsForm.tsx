import React from "react"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea"
import type {WorkflowTemplateSummary} from "@approvio/api"
import WorkflowTemplateSelector from "./WorkflowTemplateSelector"

const WORKFLOW_NAME_MAX_LENGTH = 255
const WORKFLOW_DESCRIPTION_MAX_LENGTH = 2048

interface WorkflowDetailsFormProps {
  name: string
  setName: (val: string) => void
  description: string
  setDescription: (val: string) => void
  templateId: string | null
  setTemplateId: (val: string | null) => void
  setTemplate: (val: WorkflowTemplateSummary | null) => void
  disabled?: boolean
  nameError?: string | null
  setNameError?: (val: string | null) => void
  templateError?: string | null
  setTemplateError?: (val: string | null) => void
}

export const WorkflowDetailsForm: React.FC<WorkflowDetailsFormProps> = ({
  name,
  setName,
  description,
  setDescription,
  templateId,
  setTemplateId,
  setTemplate,
  disabled = false,
  nameError,
  setNameError,
  templateError,
  setTemplateError
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="template" className="flex items-center gap-1">
          Template <span className="text-destructive">*</span>
        </Label>
        <p className="mb-2 text-xs text-muted-foreground">
          Select the approval workflow template to base this workflow on.
        </p>
        <WorkflowTemplateSelector
          value={templateId}
          onChange={(id, template) => {
            setTemplateId(id)
            setTemplate(template)
            if (setTemplateError) setTemplateError(null)
          }}
          disabled={disabled}
          error={templateError}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-1">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="e.g. Q3 Server Upgrade Request"
          value={name}
          maxLength={WORKFLOW_NAME_MAX_LENGTH}
          onChange={e => {
            setName(e.target.value)
            if (setNameError) setNameError(null)
          }}
          disabled={disabled}
          className={nameError ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {nameError && <p className="text-sm font-medium text-destructive">{nameError}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Optional context or purpose for this workflow..."
          value={description}
          maxLength={WORKFLOW_DESCRIPTION_MAX_LENGTH}
          onChange={e => setDescription(e.target.value)}
          disabled={disabled}
          className="min-h-[100px] resize-none"
        />
      </div>
    </div>
  )
}

export default WorkflowDetailsForm
