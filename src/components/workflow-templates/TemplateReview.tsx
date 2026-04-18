import React, {useEffect, useState} from "react"
import {listSpaces} from "../../services/api"
import {handleEither} from "../../utils/either"
import { FileJson, Layers, Settings2, Clock, AlignLeft } from "lucide-react"

interface TemplateReviewProps {
  name: string
  description: string
  defaultExpiresInHours: number | null
  spaceId: string | null
  ruleJson: string
}

const TemplateReview: React.FC<TemplateReviewProps> = ({
  name,
  description,
  defaultExpiresInHours,
  spaceId,
  ruleJson
}) => {
  const [spaceName, setSpaceName] = useState<string>("Loading...")

  useEffect(() => {
    const fetchSpaces = async () => {
      if (!spaceId) {
        setSpaceName("None")
        return
      }

      const result = await listSpaces(1, 100)
      handleEither(
        result,
        (response) => {
          const space = response.data.find(s => s.id === spaceId)
          setSpaceName(space ? space.name : "Unknown Space")
        },
        () => {
          setSpaceName("Error loading space")
        }
      )
    }
    fetchSpaces()
  }, [spaceId])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-md border border-border/40 bg-muted/20 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Settings2 className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Template Name</p>
            </div>
            <p className="text-base font-semibold">{name}</p>
          </div>

          <div className="rounded-md border border-border/40 bg-muted/20 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Layers className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Space</p>
            </div>
            <p className="text-base font-medium">{spaceName}</p>
          </div>

          <div className="rounded-md border border-border/40 bg-muted/20 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Default Expiry</p>
            </div>
            <p className="font-mono text-base font-medium">
              {defaultExpiresInHours !== null ? `${defaultExpiresInHours}h` : "System Default"}
            </p>
          </div>
        </div>

        <div className="flex flex-col rounded-md border border-border/40 bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlignLeft className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Description</p>
          </div>
          <p className="flex-1 text-sm leading-relaxed text-foreground/80">
            {description || <span className="italic opacity-50">No description provided.</span>}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="mb-2 flex items-center gap-2">
          <FileJson className="size-4 text-muted-foreground" />
          <h4 className="text-sm font-medium text-muted-foreground">Approval Rule Configuration</h4>
        </div>
        <div className="relative overflow-x-auto rounded-md border border-border/50 bg-muted/30 p-4">
          <div className="absolute right-0 top-0 select-none p-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground opacity-50">
            JSON
          </div>
          <pre className="font-mono text-xs text-muted-foreground">
            <code>{ruleJson}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}

export default TemplateReview
