import React from "react"
import {Box, TextField} from "@mui/material"

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
    <Box component="form" noValidate autoComplete="off">
      <TextField
        margin="normal"
        required
        fullWidth
        id="groupName"
        label="Group Name"
        name="groupName"
        value={groupName}
        onChange={handleGroupNameChange}
        disabled={disableComponents}
        error={!!groupNameError}
        helperText={groupNameError}
      />
      <TextField
        margin="normal"
        fullWidth
        id="groupDescription"
        label="Group Description (Optional)"
        name="groupDescription"
        multiline
        rows={3}
        value={groupDescription}
        onChange={e => setGroupDescription(e.target.value)}
        disabled={disableComponents}
      />
    </Box>
  )
}

export default GroupDetailsForm
