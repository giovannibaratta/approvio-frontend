import { type FrontendError } from "../services/api"
import React, {useState} from "react"
import {useNavigate} from "react-router-dom"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import SpaceDetailsForm from "../components/spaces/SpaceDetailsForm"
import ErrorList, {type ErrorEntry} from "../components/common/ErrorList"
import type {SpaceCreate} from "@approvio/api"
import {createSpace} from "../services/api"
import MultiStepFormLayout from "@/components/common/MultiStepFormLayout"
import { Layers } from "lucide-react"

const CreateSpacePage: React.FC = () => {
  const [spaceName, setSpaceName] = useState("")
  const [spaceDescription, setSpaceDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ErrorEntry[]>([])
  const [spaceNameError, setSpaceNameError] = useState<string | null>(null)

  const navigate = useNavigate()
  const notification = useNotification()

  const canCreateSpace = spaceNameError === null && spaceName.trim() !== ""

  const addError = (message: string) => {
    const now = new Date()
    const timestamp = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`
    setErrors(prevErrors => [{message, timestamp}, ...prevErrors])
  }

  const clearApiErrors = () => {
    setErrors([])
  }

  const clearValidationErrors = () => {
    setSpaceNameError(null)
  }

  const handleCreate = async () => {
    if (!spaceName.trim()) {
      setSpaceNameError("Space name is required.")
      return
    }
    setLoading(true)

    clearValidationErrors()
    clearApiErrors()

    const payload: SpaceCreate = {name: spaceName, description: spaceDescription}
    const result = await createSpace(payload)

    handleEither(
      result,
      () => {
        notification.showSuccess("Space created successfully!")
        navigate("/spaces")
      },
      (error: FrontendError) => {
        addError(error.message)
      }
    )

    setLoading(false)
  }

  const handleCancel = () => {
    navigate("/spaces")
  }

  return (
    <MultiStepFormLayout
      pageTitle="Create Space"
      pageDescription="Create a logical space to group Workflow templates"
      cardIcon={Layers}
      cardIconColorClass="text-purple-500"
      cardIconBgClass="border-purple-500/20 bg-purple-500/10"
      cardTitle="Space Details"
      cardDescription="Configure the basic information for your new space."
      onCancelClick={handleCancel}
      showCancelConfirmDialog={false}
      onPrimaryClick={handleCreate}
      primaryButtonText="Create Space"
      isPrimaryLoading={loading}
      isPrimaryDisabled={!canCreateSpace}
    >
      <SpaceDetailsForm
        spaceName={spaceName}
        setSpaceName={setSpaceName}
        spaceDescription={spaceDescription}
        setSpaceDescription={setSpaceDescription}
        disableComponents={loading}
        spaceNameError={spaceNameError}
        setSpaceNameError={setSpaceNameError}
      />
      {errors.length > 0 && (
        <div className="mt-6">
          <ErrorList errors={errors} />
        </div>
      )}
    </MultiStepFormLayout>
  )
}

export default CreateSpacePage
