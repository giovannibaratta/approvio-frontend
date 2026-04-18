import React, {useState, useEffect} from "react"
import {listSpaces} from "../../services/api"
import {handleEither} from "../../utils/either"
import type {Space} from "@approvio/api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"

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

  return (
    <form noValidate autoComplete="off" className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="templateName" className={nameError ? "text-destructive" : ""}>Template Name <span className="text-destructive">*</span></Label>
        <Input
          id="templateName"
          name="templateName"
          placeholder="e.g. Production Deployment Approval"
          value={name}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          disabled={disableComponents}
          className={nameError ? "border-destructive focus-visible:ring-destructive" : ""}
          maxLength={255}
        />
        {nameError && (
          <p className="mt-1 text-xs font-medium text-destructive">{nameError}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="templateDescription">Description <span className="font-normal text-muted-foreground">(Optional)</span></Label>
        <Textarea
          id="templateDescription"
          name="templateDescription"
          placeholder="Briefly describe what this template is used for..."
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
          disabled={disableComponents}
          maxLength={2048}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="defaultExpiresInHours" className={defaultExpireError ? "text-destructive" : ""}>
              Default Expiry (Hours)
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <button type="button" className="text-muted-foreground hover:text-foreground focus:outline-none">
                    <Info className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Default expiry time for workflows created from this template (in hours, max 1 year).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="defaultExpiresInHours"
            type="number"
            value={defaultExpiresInHours ?? ""}
            onChange={handleExpiresChange}
            disabled={disableComponents}
            className={defaultExpireError ? "border-destructive focus-visible:ring-destructive" : ""}
            min={1}
            max={8760}
          />
          {defaultExpireError && (
            <p className="mt-1 text-xs font-medium text-destructive">{defaultExpireError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="space-select" className={(!spaceId && !disableComponents) ? "text-destructive" : ""}>
            Space <span className="text-destructive">*</span>
          </Label>
          <Select
            value={spaceId || ""}
            onValueChange={(value) => setSpaceId(value)}
            disabled={disableComponents || loadingSpaces}
          >
            <SelectTrigger id="space-select" className={(!spaceId && !disableComponents) ? "border-destructive focus:ring-destructive" : ""}>
              <SelectValue placeholder={loadingSpaces ? "Loading spaces..." : "Select a space"} />
            </SelectTrigger>
            <SelectContent>
              {spaces.map((space) => (
                <SelectItem key={space.id} value={space.id}>
                  {space.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!spaceId && !disableComponents && (
            <p className="mt-1 text-xs font-medium text-destructive">Space is required</p>
          )}
        </div>
      </div>
    </form>
  )
}

export default TemplateDetailsForm
