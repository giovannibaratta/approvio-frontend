import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface SpaceDetailsFormProps {
  spaceName: string
  setSpaceName: (name: string) => void
  spaceDescription: string
  setSpaceDescription: (description: string) => void
  disableComponents: boolean
  spaceNameError: string | null
  setSpaceNameError: (error: string | null) => void
}

const SpaceDetailsForm: React.FC<SpaceDetailsFormProps> = ({
  spaceName,
  setSpaceName,
  spaceDescription,
  setSpaceDescription,
  disableComponents,
  spaceNameError,
  setSpaceNameError
}) => {
  const handleSpaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSpaceName(value)

    if (value.trim() === "" && value.length > 0) setSpaceNameError("Space name cannot be just whitespace.")
    else if (value.length === 0) setSpaceNameError("Space name is required.")
    else setSpaceNameError(null)
  }

  return (
    <form noValidate autoComplete="off" className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="spaceName" className={spaceNameError ? "text-destructive" : ""}>Space Name <span className="text-destructive">*</span></Label>
        <Input
          id="spaceName"
          name="spaceName"
          placeholder="e.g. Engineering, Marketing"
          value={spaceName}
          onChange={handleSpaceNameChange}
          disabled={disableComponents}
          className={spaceNameError ? "border-destructive focus-visible:ring-destructive" : ""}
          maxLength={255}
        />
        {spaceNameError && (
          <p className="mt-1 text-xs font-medium text-destructive">{spaceNameError}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="spaceDescription">Space Description <span className="font-normal text-muted-foreground">(Optional)</span></Label>
        <Textarea
          id="spaceDescription"
          name="spaceDescription"
          placeholder="Briefly describe the purpose of this space..."
          rows={3}
          value={spaceDescription}
          onChange={e => setSpaceDescription(e.target.value)}
          disabled={disableComponents}
          maxLength={2048}
        />
      </div>
    </form>
  )
}

export default SpaceDetailsForm
