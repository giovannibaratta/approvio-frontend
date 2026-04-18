import { type FrontendError } from "../services/api"
import React, {useState} from "react"
import {useNavigate} from "react-router-dom"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import SpaceDetailsForm from "../components/spaces/SpaceDetailsForm"
import ErrorList, {type ErrorEntry} from "../components/common/ErrorList"
import type {SpaceCreate} from "@approvio/api"
import {createSpace} from "../services/api"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Layers } from "lucide-react"

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
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel} disabled={loading} className="shrink-0">
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create Space</h1>
          <p className="text-sm text-muted-foreground">Establish a new isolated environment for workflows.</p>
        </div>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md border border-purple-500/20 bg-purple-500/10">
              <Layers className="size-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Space Details</CardTitle>
              <CardDescription>Configure the basic information for your new space.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
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
        </CardContent>
        <CardFooter className="flex justify-end gap-3 border-t border-border/40 bg-muted/20 py-4">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || !canCreateSpace} className="min-w-[120px]">
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {loading ? "Creating..." : "Create Space"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default CreateSpacePage
