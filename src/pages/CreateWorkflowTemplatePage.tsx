import React, {useState} from "react"
import {useNavigate} from "react-router-dom"
import {useNotification} from "@/providers/notification/NotificationContext"
import {handleEither} from "@/utils/either"
import ErrorList, {type ErrorEntry} from "@/components/common/ErrorList"
import {createWorkflowTemplate, type FrontendError} from "@/services/api"
import type {WorkflowTemplateCreate} from "@approvio/api"

import TemplateDetailsForm from "@/components/workflow-templates/TemplateDetailsForm"
import TemplateRuleForm from "@/components/workflow-templates/TemplateRuleForm"
import TemplateReview from "@/components/workflow-templates/TemplateReview"

import MultiStepFormLayout, { type StepDefinition } from "@/components/common/MultiStepFormLayout"
import { GitBranch, Settings2, Code, CheckCircle2 } from "lucide-react"

enum CreateTemplateSteps {
  Details = 0,
  ApprovalRule = 1,
  Review = 2,
}

const steps: StepDefinition[] = [
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

  const handleCancelConfirm = () => {
    navigate("/workflow-templates")
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
    <MultiStepFormLayout
      pageTitle="Create Workflow Template"
      pageDescription="Design a new approval process and set its conditions."
      cardIcon={GitBranch}
      cardIconColorClass="text-amber-500"
      cardIconBgClass="border-amber-500/20 bg-amber-500/10"
      cardTitle={steps[activeStep]?.label || ""}
      cardDescription={
        activeStep === CreateTemplateSteps.Details ? "Configure basic information and defaults." :
        activeStep === CreateTemplateSteps.ApprovalRule ? "Define the JSON logic for approval conditions." :
        "Verify template configuration before creation."
      }
      steps={steps}
      activeStepIndex={activeStep}
      onCancelConfirm={handleCancelConfirm}
      showCancelConfirmDialog={true}
      showBackButton={activeStep > 0}
      onBackClick={handleBack}
      onPrimaryClick={activeStep === steps.length - 1 ? handleCreate : handleNext}
      primaryButtonText={activeStep === steps.length - 1 ? "Create Template" : "Next Step"}
      isPrimaryLoading={loading}
      isPrimaryDisabled={isNextDisabled()}
    >
      {getStepContent(activeStep)}
      {errors.length > 0 && (
        <div className="mt-6">
          <ErrorList errors={errors} />
        </div>
      )}
    </MultiStepFormLayout>
  )
}

export default CreateWorkflowTemplatePage
