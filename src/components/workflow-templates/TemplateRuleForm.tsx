import React, {useState, useEffect} from "react"
import Editor from "react-simple-code-editor"
import Prism from "prismjs"
import "prismjs/components/prism-json"
import "prismjs/themes/prism.css"
import {getGroup} from "../../services/api"
import {isLeft} from "fp-ts/Either"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Info, FileJson } from "lucide-react"

interface TemplateRuleFormProps {
  ruleJson: string
  setRuleJson: (json: string) => void
  disableComponents: boolean
  setIsValidJson: (isValid: boolean) => void
}

// Limit the number of groups to fetch to avoid performance issues
// and to protect the backend in case of trivial errors
const MAX_GROUP_TO_FETCH = 10

const TemplateRuleForm: React.FC<TemplateRuleFormProps> = ({
  ruleJson,
  setRuleJson,
  disableComponents,
  setIsValidJson
}) => {
  const [error, setError] = useState<string | null>(null)
  const [groupWarnings, setGroupWarnings] = useState<string[]>([])

  // Cache to avoid refetching the same group ID
  const [groupCache, setGroupCache] = useState<Record<string, boolean>>({})
  const groupCacheRef = React.useRef(groupCache)

  useEffect(() => {
    groupCacheRef.current = groupCache
  }, [groupCache])

  useEffect(() => {
    try {
      if (ruleJson.trim() === "") {
        setIsValidJson(false)
        setError("Approval rule is required.")
        return
      }
      const parsed = JSON.parse(ruleJson)
      setIsValidJson(true)
      setError(null)

      // Best-effort check for groupId
      // We look for any property named 'groupId' recursively.
      const foundGroupIds: string[] = []

      const findGroupIds = (obj: any) => {
        if (typeof obj !== "object" || obj === null) return

        if (obj.groupId && typeof obj.groupId === "string") {
          foundGroupIds.push(obj.groupId)
        }

        Object.values(obj).forEach(val => findGroupIds(val))
      }

      findGroupIds(parsed)

      // Perform validation of found groupIds
      const checkGroups = async () => {
        const warnings: string[] = []
        for (const id of foundGroupIds.slice(0, MAX_GROUP_TO_FETCH)) {
          // If we haven't checked this ID yet
          if (groupCacheRef.current[id] === undefined) {
            const result = await getGroup(id)
            if (isLeft(result)) {
              if (result.left.code === "GROUP_NOT_FOUND") {
                // Group does not exist
                setGroupCache(prev => ({...prev, [id]: false}))
                warnings.push(`Group ID not found: ${id}`)
              }
            } else {
              // Group exists
              setGroupCache(prev => ({...prev, [id]: true}))
            }
          } else if (groupCacheRef.current[id] === false) {
            warnings.push(`Group ID not found: ${id}`)
          }
        }
        setGroupWarnings(warnings)
      }

      // Debounce the check slightly so we don't spam as they type
      const timer = setTimeout(() => {
        checkGroups()
      }, 1000)

      return () => clearTimeout(timer)

    } catch (e) {
      setIsValidJson(false)
      if (e instanceof Error) {
        setError("Invalid JSON: " + e.message)
      } else {
        setError("Invalid JSON")
      }
    }
  }, [ruleJson, setIsValidJson])

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border/50 bg-muted/50 p-4 text-sm">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 size-5 shrink-0 text-blue-500" />
          <div className="space-y-2">
            <p className="font-medium">Provide the Approval Rule in JSON format.</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Define the conditions that must be met for a workflow to be approved. Example:
            </p>
            <pre className="overflow-x-auto rounded-md border border-border/40 bg-background p-2 font-mono text-[11px] text-muted-foreground">
{`{
  "type": "GROUP_REQUIREMENT",
  "minCount": 1,
  "groupId": "uuid-of-group"
}`}
            </pre>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="mb-1 flex items-center gap-2">
          <FileJson className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Rule Configuration</span>
        </div>
        <div
          className={`rounded-md border ${
            error ? "border-destructive" : "border-border/50"
          } relative overflow-hidden bg-muted/20 ${
            disableComponents ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <div className="absolute right-0 top-0 select-none p-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground opacity-50">
            JSON
          </div>
          <Editor
            value={ruleJson}
            onValueChange={code => setRuleJson(code)}
            highlight={code => (Prism.languages.json ? Prism.highlight(code, Prism.languages.json, "json") : code)}
            padding={16}
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: 13,
              minHeight: "250px",
              backgroundColor: "transparent",
            }}
            textareaClassName="focus:outline-none"
          />
        </div>
        {error && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive">
            <AlertTriangle className="size-3" />
            {error}
          </p>
        )}
      </div>

      {groupWarnings.length > 0 && !error && (
        <div className="mt-4 space-y-2">
          {groupWarnings.map((warn, idx) => (
            <Alert key={idx} variant="destructive" className="border-amber-500/30 bg-amber-500/10 text-amber-600">
              <AlertTriangle className="size-4 text-amber-600" />
              <AlertDescription>{warn}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  )
}

export default TemplateRuleForm
