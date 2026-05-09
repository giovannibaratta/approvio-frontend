import React from "react"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea"

const GROUP_NAME_MAX_LENGTH = 255
const GROUP_DESCRIPTION_MAX_LENGTH = 2048

interface GroupDetailsFormProps {
  groupName: string
  setGroupName: (name: string) => void
  groupDescription: string
  setGroupDescription: (description: string) => void
  disableComponents: boolean
  groupNameError: string | null
  setGroupNameError: (error: string | null) => void
}

const GroupDetailsForm: React.FC<GroupDetailsFormProps> = ({
  groupName,
  setGroupName,
  groupDescription,
  setGroupDescription,
  disableComponents,
  groupNameError,
  setGroupNameError
}) => {
  const handleGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGroupName(e.target.value)
    if (groupNameError) {
      setGroupNameError(null)
    }
  }

  return (
    <form noValidate autoComplete="off" className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="groupName" className={groupNameError ? "text-destructive" : ""}>
          Group Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="groupName"
          name="groupName"
          placeholder="e.g. Engineering Leadership"
          value={groupName}
          maxLength={GROUP_NAME_MAX_LENGTH}
          onChange={handleGroupNameChange}
          disabled={disableComponents}
          className={groupNameError ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {groupNameError && <p className="mt-1 text-xs font-medium text-destructive">{groupNameError}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="groupDescription">
          Group Description <span className="font-normal text-muted-foreground">(Optional)</span>
        </Label>
        <Textarea
          id="groupDescription"
          name="groupDescription"
          placeholder="Briefly describe the responsibilities of this group..."
          rows={3}
          value={groupDescription}
          maxLength={GROUP_DESCRIPTION_MAX_LENGTH}
          onChange={e => setGroupDescription(e.target.value)}
          disabled={disableComponents}
        />
      </div>
    </form>
  )
}

export default GroupDetailsForm
