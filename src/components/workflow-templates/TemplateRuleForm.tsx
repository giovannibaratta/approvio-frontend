import React, {useState, useEffect} from "react"
import {Box, Typography, Paper, Alert} from "@mui/material"
import Editor from "react-simple-code-editor"
import Prism from "prismjs"
import "prismjs/components/prism-json"
import "prismjs/themes/prism.css"
import {getGroup} from "../../services/api"
import {isLeft} from "fp-ts/Either"

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
          if (groupCache[id] === undefined) {
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
          } else if (groupCache[id] === false) {
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
  }, [groupCache, ruleJson, setIsValidJson])

  return (
    <Box>
      <Typography variant="body1" sx={{mb: 1}}>
        Provide the Approval Rule in JSON format.
      </Typography>
      <Typography variant="caption" color="textSecondary" sx={{mb: 2, display: "block"}}>
        Hint: You can use rules like: <code>{"{ \"type\": \"GROUP_REQUIREMENT\", \"minCount\": 1, \"groupId\": \"uuid\" }"}</code>
      </Typography>
      <Paper
        variant="outlined"
        sx={{
          borderColor: error ? "error.main" : "grey.400",
          p: 1,
          bgcolor: disableComponents ? "action.disabledBackground" : "background.paper",
          pointerEvents: disableComponents ? "none" : "auto",
          opacity: disableComponents ? 0.6 : 1
        }}
      >
        <Editor
          value={ruleJson}
          onValueChange={code => setRuleJson(code)}
          highlight={code => Prism.highlight(code, Prism.languages.json as Prism.Grammar, "json")}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 14,
            minHeight: "200px",
          }}
        />
      </Paper>
      {error && (
        <Typography color="error" variant="caption" sx={{mt: 1, display: "block"}}>
          {error}
        </Typography>
      )}
      {groupWarnings.length > 0 && !error && (
        <Box sx={{mt: 2}}>
          {groupWarnings.map((warn, idx) => (
            <Alert key={idx} severity="warning" sx={{mb: 1}}>
              {warn}
            </Alert>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default TemplateRuleForm
