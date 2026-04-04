import React, {useState, useEffect} from "react"
import {Box, TextField, Autocomplete, Tooltip, IconButton} from "@mui/material"
import InfoIcon from "@mui/icons-material/Info"
import {listSpaces} from "../../services/api"
import {handleEither} from "../../utils/either"
import type {Space} from "@approvio/api"

interface TemplateDetailsFormProps {
  name: string
  setName: (name: string) => void
  description: string
  setDescription: (description: string) => void
  defaultExpiresInHours: number | null
  setDefaultExpiresInHours: (hours: number | null) => void
  spaceId: string | null
  setSpaceId: (spaceId: string | null) => void
  disableComponents: boolean
  nameError: string | null
  setNameError: (error: string | null) => void
  defaultExpireError: string | null
  setDefaultExpireError: (error: string | null) => void
}

const TemplateDetailsForm: React.FC<TemplateDetailsFormProps> = ({
  name,
  setName,
  description,
  setDescription,
  defaultExpiresInHours,
  setDefaultExpiresInHours,
  spaceId,
  setSpaceId,
  disableComponents,
  nameError,
  setNameError,
  defaultExpireError,
  setDefaultExpireError
}) => {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loadingSpaces, setLoadingSpaces] = useState(false)

  useEffect(() => {
    const fetchSpaces = async () => {
      setLoadingSpaces(true)
      const result = await listSpaces(1, 100) // Fetches up to 100 spaces
      handleEither(
        result,
        (response) => {
          setSpaces(response.data)
        },
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {}
      )
      setLoadingSpaces(false)
    }
    fetchSpaces()
  }, [])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setName(value)

    if (value.trim() === "" && value.length > 0) setNameError("Name cannot be just whitespace.")
    else if (value.length === 0) setNameError("Name is required.")
    else setNameError(null)
  }

  const handleNameBlur = () => {
    if (name.length === 0) setNameError("Name is required.")
  }

  const handleExpiresChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === ""){
      setDefaultExpiresInHours(null)
      return
    }

    const value = parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      setDefaultExpiresInHours(value)
    }

    if (value < 1) {
      setDefaultExpireError("Default expires in must be at least 1 hour.")
    } else {
      setDefaultExpireError(null)
    }
  }

  const selectedSpace = spaces.find(space => space.id === spaceId) || null

  return (
    <Box component="form" noValidate autoComplete="off">
      <TextField
        margin="normal"
        required
        fullWidth
        id="templateName"
        label="Template Name"
        name="templateName"
        value={name}
        onChange={handleNameChange}
        onBlur={handleNameBlur}
        disabled={disableComponents}
        error={!!nameError}
        helperText={nameError}
        slotProps={{
          htmlInput: {maxLength: 255}
        }}
      />
      <TextField
        margin="normal"
        fullWidth
        id="templateDescription"
        label="Description (Optional)"
        name="templateDescription"
        multiline
        rows={3}
        value={description}
        onChange={e => setDescription(e.target.value)}
        disabled={disableComponents}
        slotProps={{
          htmlInput: {maxLength: 2048}
        }}
      />
      <Box sx={{display: "flex", alignItems: "center", mt: 2, mb: 1}}>
        <TextField
          id="defaultExpiresInHours"
          label="Default Expires In (Hours)"
          type="number"
          value={defaultExpiresInHours ?? ""}
          onChange={handleExpiresChange}
          disabled={disableComponents}
          error={!!defaultExpireError}
          helperText={defaultExpireError}
          slotProps={{
            htmlInput: {min: 1, max: 8760}
          }}
          sx={{ flexGrow: 1 }}
        />
        <Tooltip title="Default expiry time for workflows created from this template (in hours, max 1 year)">
          <IconButton sx={{ml: 1}}>
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Autocomplete
        id="space-select"
        options={spaces}
        getOptionLabel={(option) => option.name}
        value={selectedSpace}
        onChange={(_event, newValue) => {
          setSpaceId(newValue ? newValue.id : null)
        }}
        disabled={disableComponents}
        loading={loadingSpaces}
        renderInput={(params) => (
          <TextField
            {...params}
            margin="normal"
            label="Space"
            required
            error={!spaceId && !disableComponents}
            helperText={!spaceId && !disableComponents ? "Space is required" : ""}
          />
        )}
      />
    </Box>
  )
}

export default TemplateDetailsForm
