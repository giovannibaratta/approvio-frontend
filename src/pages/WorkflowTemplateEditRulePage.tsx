import React, {useState, useEffect} from "react"
import {useParams, useNavigate} from "react-router-dom"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import ErrorList, {type ErrorEntry} from "../components/common/ErrorList"
import {getWorkflowTemplate, updateWorkflowTemplate, type FrontendError} from "../services/api"
import type {WorkflowTemplateUpdate, WorkflowTemplate} from "@approvio/api"

import TemplateRuleForm from "../components/workflow-templates/TemplateRuleForm"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Code } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

const WorkflowTemplateEditRulePage: React.FC = () => {
  const {templateIdentifier} = useParams<{templateIdentifier: string}>()
  const [template, setTemplate] = useState<WorkflowTemplate | null>(null)

  // Form State
  const [ruleJson, setRuleJson] = useState("{\n  \n}")

  // Validation State
  const [isValidJson, setIsValidJson] = useState(false)

  // Execution State
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<ErrorEntry[]>([])
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  const navigate = useNavigate()
  const notification = useNotification()

  const addError = (message: string) => {
    const now = new Date()
    const timestamp = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`
    setErrors(prevErrors => [{message, timestamp}, ...prevErrors])
  }

  const clearApiErrors = () => {
    setErrors([])
  }

  useEffect(() => {
    const fetchTemplateDetails = async () => {
      if (!templateIdentifier) return

      setLoading(true)
      clearApiErrors()

      const result = await getWorkflowTemplate(templateIdentifier)

      handleEither(
        result,
        (templateData: WorkflowTemplate) => {
          setTemplate(templateData)
          setRuleJson(JSON.stringify(templateData.approvalRule, null, 2))
          setIsValidJson(true)
        },
        (errorMessage: FrontendError) => {
          addError(errorMessage.message)
          notification.showError(errorMessage.message)
        }
      )

      setLoading(false)
    }

    fetchTemplateDetails()
  }, [templateIdentifier, notification])

  const handleUpdate = async () => {
    setLoading(true)
    clearApiErrors()

    let parsedRule
    try {
      parsedRule = JSON.parse(ruleJson)
    } catch {
      addError("Invalid Approval Rule JSON.")
      setLoading(false)
      return
    }

    if (!templateIdentifier || !template) {
      addError("Template identifier or template details are missing.")
      setLoading(false)
      return
    }

    const payload: WorkflowTemplateUpdate = {
      approvalRule: parsedRule,
      concurrencyControl: template.concurrencyControl,
      cancelWorkflows: false
    }

    const result = await updateWorkflowTemplate(template.name, payload)

    handleEither(
      result,
      () => {
        notification.showSuccess("Workflow Template Approval Rule updated successfully!")
        navigate(`/workflow-templates/${template.id}`)
      },
      (error: FrontendError) => {
        addError(error.message)
      }
    )

    setLoading(false)
  }

  const handleCancelClick = () => {
    setCancelDialogOpen(true)
  }

  const handleCancelConfirm = () => {
    setCancelDialogOpen(false)
    navigate(`/workflow-templates/${template?.id || templateIdentifier}`)
  }

  const handleCancelClose = () => {
    setCancelDialogOpen(false)
  }

  const isNextDisabled = () => {
    return !isValidJson || loading
  }

  if (loading && !template) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancelClick} disabled={loading} className="shrink-0">
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="edit-rule-header">Edit Approval Rule</h1>
          <p className="text-sm text-muted-foreground">{template?.name}</p>
        </div>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md border border-amber-500/20 bg-amber-500/10">
              <Code className="size-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Approval Rule Configuration</CardTitle>
              <CardDescription>Update the JSON logic for approval conditions.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <TemplateRuleForm
            ruleJson={ruleJson}
            setRuleJson={setRuleJson}
            disableComponents={loading}
            setIsValidJson={setIsValidJson}
          />
          {errors.length > 0 && (
            <div className="mt-6">
              <ErrorList errors={errors} />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-border/40 bg-muted/20 py-4">
          <Button variant="ghost" onClick={handleCancelClick} disabled={loading} className="text-muted-foreground hover:text-foreground">
            Cancel
          </Button>

          <Button onClick={handleUpdate} disabled={isNextDisabled()} className="min-w-[140px]">
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {loading ? "Updating..." : "Update Rule"}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={cancelDialogOpen} onOpenChange={(open) => !open && handleCancelClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel? Any unsaved changes you have made will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={handleCancelClose}>
              Keep Editing
            </Button>
            <Button variant="destructive" onClick={handleCancelConfirm}>
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default WorkflowTemplateEditRulePage
