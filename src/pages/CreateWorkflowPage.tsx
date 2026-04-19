import React, {useState} from "react"
import {useNavigate} from "react-router-dom"
import {useNotification} from "@/providers/notification/NotificationContext"
import {handleEither} from "@/utils/either"
import ErrorList, {type ErrorEntry} from "@/components/common/ErrorList"
import {createWorkflow, type FrontendError} from "@/services/api"
import type {WorkflowCreate, WorkflowTemplateSummary} from "@approvio/api"

import WorkflowDetailsForm from "@/components/workflows/WorkflowDetailsForm"
import WorkflowReview from "@/components/workflows/WorkflowReview"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, GitBranch, Settings2, CheckCircle2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

enum CreateWorkflowSteps {
  Details = 0,
  Review = 1,
}

const steps = [
  { id: CreateWorkflowSteps.Details, label: "Details", icon: Settings2 },
  { id: CreateWorkflowSteps.Review, label: "Review", icon: CheckCircle2 }
]

const CreateWorkflowPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState<CreateWorkflowSteps>(CreateWorkflowSteps.Details)

  // Form State
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [template, setTemplate] = useState<WorkflowTemplateSummary | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [metadata] = useState<Record<string, string>>({}) // Metadata is not implemented in UI yet per requirements

  // Validation State
  const [nameError, setNameError] = useState<string | null>(null)
  const [templateError, setTemplateError] = useState<string | null>(null)

  // Execution State
  const [loading, setLoading] = useState(false)
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

  const handleNext = () => {
    if (activeStep === CreateWorkflowSteps.Details) {
      let hasError = false
      if (!templateId) {
        setTemplateError("Please select a workflow template.")
        hasError = true
      }
      if (!name.trim()) {
        setNameError("Name is required.")
        hasError = true
      }
      if (hasError) return

      clearApiErrors()
    }

    setActiveStep(prev => prev + 1)
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
  }

  const handleCreate = async () => {
    setLoading(true)
    clearApiErrors()

    if (!templateId) {
       addError("Template ID is missing.")
       setLoading(false)
       return
    }

    const payload: WorkflowCreate = {
      name,
      description,
      workflowTemplateId: templateId,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    }

    const result = await createWorkflow(payload)

    handleEither(
      result,
      () => {
        notification.showSuccess("Workflow created successfully!")
        navigate("/workflows")
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
    navigate("/workflows")
  }

  const handleCancelClose = () => {
    setCancelDialogOpen(false)
  }

  const isNextDisabled = () => {
    if (activeStep === CreateWorkflowSteps.Details) {
      return !name.trim() || !templateId || loading
    }
    return loading
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case CreateWorkflowSteps.Details:
        return (
          <WorkflowDetailsForm
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            templateId={templateId}
            setTemplateId={setTemplateId}
            setTemplate={setTemplate}
            disabled={loading}
            nameError={nameError}
            setNameError={setNameError}
            templateError={templateError}
            setTemplateError={setTemplateError}
          />
        )
      case CreateWorkflowSteps.Review:
        return (
          <WorkflowReview
            name={name}
            description={description}
            template={template}
          />
        )
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancelClick} disabled={loading} className="shrink-0">
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create Workflow</h1>
          <p className="text-sm text-muted-foreground">Start a new approval workflow from a template.</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="relative mb-8 flex items-center justify-between px-4 md:px-8">
        <div className="absolute inset-x-0 top-1/2 -z-10 h-0.5 -translate-y-1/2 bg-muted/50" />
        {steps.map((step) => {
          const isActive = activeStep === step.id
          const isCompleted = activeStep > step.id
          const Icon = step.icon

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
              <div
                className={`flex size-10 items-center justify-center rounded-full border-2 transition-colors
                  ${isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCompleted
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-muted bg-background text-muted-foreground"
                  }`}
              >
                <Icon className="size-5" />
              </div>
              <span className={`text-xs font-medium uppercase tracking-wider ${isActive || isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/10">
              <GitBranch className="size-5 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {steps[activeStep]?.label}
              </CardTitle>
              <CardDescription>
                {activeStep === CreateWorkflowSteps.Details && "Select a template and configure basic information."}
                {activeStep === CreateWorkflowSteps.Review && "Verify workflow configuration before creation."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {getStepContent(activeStep)}
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

          <div className="flex gap-3">
            {activeStep > 0 && (
              <Button variant="outline" onClick={handleBack} disabled={loading}>
                Back
              </Button>
            )}

            {activeStep === steps.length - 1 ? (
              <Button onClick={handleCreate} disabled={loading} className="min-w-[140px]">
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {loading ? "Creating..." : "Create Workflow"}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={isNextDisabled()}>
                Next Step
              </Button>
            )}
          </div>
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

export default CreateWorkflowPage
