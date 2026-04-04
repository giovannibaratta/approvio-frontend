import React from "react"
import {Box, TextField} from "@mui/material"

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
    <Box component="form" noValidate autoComplete="off">
      <TextField
        margin="normal"
        required
        fullWidth
        id="spaceName"
        label="Space Name"
        name="spaceName"
        value={spaceName}
        onChange={handleSpaceNameChange}
        disabled={disableComponents}
        error={!!spaceNameError}
        helperText={spaceNameError}
        slotProps={{
          htmlInput: {maxLength: 255}
        }}
      />
      <TextField
        margin="normal"
        fullWidth
        id="spaceDescription"
        label="Space Description (Optional)"
        name="spaceDescription"
        multiline
        rows={3}
        value={spaceDescription}
        onChange={e => setSpaceDescription(e.target.value)}
        disabled={disableComponents}
        slotProps={{
          htmlInput: {maxLength: 2048}
        }}
      />
    </Box>
  )
}

export default SpaceDetailsForm
