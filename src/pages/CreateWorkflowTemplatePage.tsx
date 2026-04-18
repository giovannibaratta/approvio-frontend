import { type FrontendError } from "../services/api"
import React, {useState} from "react"
import {useNavigate} from "react-router-dom"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import ErrorList, {type ErrorEntry} from "../components/common/ErrorList"
import {createWorkflowTemplate} from "../services/api"
import type {WorkflowTemplateCreate} from "@approvio/api"

import TemplateDetailsForm from "../components/workflow-templates/TemplateDetailsForm"
import TemplateRuleForm from "../components/workflow-templates/TemplateRuleForm"
import TemplateReview from "../components/workflow-templates/TemplateReview"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, GitBranch, Settings2, Code, CheckCircle2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

enum CreateTemplateSteps {
  Details = 0,
  ApprovalRule = 1,
  Review = 2,
}

const steps = [
  { id: CreateTemplateSteps.Details, label: "Details", icon: Settings2 },
  { id: CreateTemplateSteps.ApprovalRule, label: "Approval Rule", icon: Code },
  { id: CreateTemplateSteps.Review, label: "Review", icon: CheckCircle2 }
]

const CreateWorkflowTemplatePage: React.FC = () => {
  const [activeStep, setActiveStep] = useState<CreateTemplateSteps>(CreateTemplateSteps.Details)

  // Form State
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [defaultExpiresInHours, setDefaultExpiresInHours] = useState<number | null>(null)
  const [spaceId, setSpaceId] = useState<string | null>(null)
  const [ruleJson, setRuleJson] = useState("{\n  \n}")

  // Validation State
  const [nameError, setNameError] = useState<string | null>(null)
  const [isValidJson, setIsValidJson] = useState(false)
  const [defaultExpireError, setDefaultExpireError] = useState<string | null>(null)

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
    if (activeStep === CreateTemplateSteps.Details) {
      if (!name.trim()) {
        setNameError("Name is required.")
        return
      }
      if (!spaceId) {
        // Validation for spaceId is already handled partially by the UI but just in case
        addError("Space is required.")
        return
      }
      clearApiErrors()
    }

    if (activeStep === CreateTemplateSteps.ApprovalRule) {
      if (!isValidJson) {
        addError("Invalid Approval Rule JSON.")
        return
      }
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

    let parsedRule
    try {
      parsedRule = JSON.parse(ruleJson)
    } catch {
      addError("Invalid Approval Rule JSON.")
      setLoading(false)
      return
    }

    if (!spaceId) {
       addError("Space ID is missing.")
       setLoading(false)
       return
    }

    const payload: WorkflowTemplateCreate = {
      name,
      description,
      spaceId,
      defaultExpiresInHours: defaultExpiresInHours ?? undefined,
      approvalRule: parsedRule,
    }

    const result = await createWorkflowTemplate(payload)

    handleEither(
      result,
      () => {
        notification.showSuccess("Workflow Template created successfully!")
        navigate("/workflow-templates")
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
    navigate("/workflow-templates")
  }

  const handleCancelClose = () => {
    setCancelDialogOpen(false)
  }

  const isNextDisabled = () => {
    if (activeStep === CreateTemplateSteps.Details) {
      return !name.trim() || !spaceId || loading
    }
    if (activeStep === CreateTemplateSteps.ApprovalRule) {
      return !isValidJson || loading
    }
    return loading
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case CreateTemplateSteps.Details:
        return (
          <TemplateDetailsForm
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            defaultExpiresInHours={defaultExpiresInHours}
            setDefaultExpiresInHours={setDefaultExpiresInHours}
            spaceId={spaceId}
            setSpaceId={setSpaceId}
            disableComponents={loading}
            nameError={nameError}
            setNameError={setNameError}
            defaultExpireError={defaultExpireError}
            setDefaultExpireError={setDefaultExpireError}
          />
        )
      case CreateTemplateSteps.ApprovalRule:
        return (
          <TemplateRuleForm
            ruleJson={ruleJson}
            setRuleJson={setRuleJson}
            disableComponents={loading}
            setIsValidJson={setIsValidJson}
          />
        )
      case CreateTemplateSteps.Review:
        return (
          <TemplateReview
            name={name}
            description={description}
            defaultExpiresInHours={defaultExpiresInHours}
            spaceId={spaceId}
            ruleJson={ruleJson}
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
          <h1 className="text-2xl font-semibold tracking-tight">Create Workflow Template</h1>
          <p className="text-sm text-muted-foreground">Design a new approval process and set its conditions.</p>
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
            <div className="flex size-10 items-center justify-center rounded-md border border-amber-500/20 bg-amber-500/10">
              <GitBranch className="size-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {steps[activeStep]?.label}
              </CardTitle>
              <CardDescription>
                {activeStep === CreateTemplateSteps.Details && "Configure basic information and defaults."}
                {activeStep === CreateTemplateSteps.ApprovalRule && "Define the JSON logic for approval conditions."}
                {activeStep === CreateTemplateSteps.Review && "Verify template configuration before creation."}
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
                {loading ? "Creating..." : "Create Template"}
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

export default CreateWorkflowTemplatePage
