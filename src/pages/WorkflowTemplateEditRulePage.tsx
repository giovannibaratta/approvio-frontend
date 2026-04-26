import React, {useState, useEffect} from "react"
import {useParams, useNavigate} from "react-router-dom"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import ErrorList, {type ErrorEntry} from "../components/common/ErrorList"
import {getWorkflowTemplate, updateWorkflowTemplate, type FrontendError} from "../services/api"
import type {WorkflowTemplateUpdate, WorkflowTemplate} from "@approvio/api"

import TemplateRuleForm from "../components/workflow-templates/TemplateRuleForm"
import MultiStepFormLayout from "@/components/common/MultiStepFormLayout"
import { Loader2, Code } from "lucide-react"

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

  const handleCancelConfirm = () => {
    navigate(`/workflow-templates/${template?.id || templateIdentifier}`)
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
    <MultiStepFormLayout
      pageTitle="Edit Approval Rule"
      pageDescription={template?.name || ""}
      cardIcon={Code}
      cardIconColorClass="text-amber-500"
      cardIconBgClass="border-amber-500/20 bg-amber-500/10"
      cardTitle="Approval Rule Configuration"
      cardDescription="Update the JSON logic for approval conditions."
      onCancelConfirm={handleCancelConfirm}
      showCancelConfirmDialog={true}
      onPrimaryClick={handleUpdate}
      primaryButtonText="Update Rule"
      isPrimaryLoading={loading}
      isPrimaryDisabled={isNextDisabled()}
    >
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
    </MultiStepFormLayout>
  )
}

export default WorkflowTemplateEditRulePage
