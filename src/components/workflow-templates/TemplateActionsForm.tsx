import React, {useState} from "react"
import {type WorkflowAction} from "@approvio/api"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Button} from "@/components/ui/button"
import {Plus, Trash2, Info, Mail, Webhook, MessageSquare} from "lucide-react"

interface TemplateActionsFormProps {
  actions: WorkflowAction[]
  setActions: (actions: WorkflowAction[]) => void
  disableComponents: boolean
  setIsValid: (isValid: boolean) => void
}

const MAX_ACTIONS = 3
const MAX_EMAILS = 5

export const TemplateActionsForm: React.FC<TemplateActionsFormProps> = ({
  actions,
  setActions,
  disableComponents,
  setIsValid
}) => {
  const [newEmailStr, setNewEmailStr] = useState<Record<number, string>>({})

  // Update validation status based on current actions state
  React.useEffect(() => {
    let valid = true

    // Check for identical actions
    const seen = new Set<string>()
    for (const act of actions) {
      const actionStr = JSON.stringify(act)
      if (seen.has(actionStr)) {
        valid = false
        break
      }
      seen.add(actionStr)
    }

    if (valid) {
      for (const act of actions) {
        const action = act as any
        if (action.type === "EMAIL") {
          if (!action.recipients || action.recipients.length === 0) {
            valid = false
            break
          }
          // simplistic email check
          for (const r of action.recipients || []) {
            if (!r.includes("@")) {
              valid = false
              break
            }
          }
        } else if (action.type === "WEBHOOK") {
          if (!action.url || !action.url.startsWith("http")) {
            valid = false
            break
          }
        } else if (action.type === "SLACK") {
          if (!action.webhookUrl || !action.webhookUrl.startsWith("http")) {
            valid = false
            break
          }
        }
        if (!valid) break
      }
    }
    setIsValid(valid)
  }, [actions, setIsValid])

  const addAction = (type: "EMAIL" | "WEBHOOK" | "SLACK") => {
    if (actions.length >= MAX_ACTIONS) return

    let newAction: WorkflowAction

    if (type === "EMAIL") newAction = {type: "EMAIL", recipients: []}
    else if (type === "WEBHOOK") newAction = {type: "WEBHOOK", url: "", method: "POST"}
    else newAction = {type: "SLACK", webhookUrl: ""}

    setActions([...actions, newAction])
  }

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
    setNewEmailStr(prev => {
      const copy = {...prev}
      delete copy[index]
      return copy
    })
  }

  const updateEmailAction = (index: number, newRecipients: string[]) => {
    const newActions = [...actions]
    newActions[index] = {...newActions[index], type: "EMAIL", recipients: newRecipients}

    setActions(newActions)
  }

  const handleAddEmail = (index: number) => {
    const action = actions[index]
    if (!action) return
    if (action.type !== "EMAIL") return

    const emailToAdd = newEmailStr[index]?.trim()
    if (!emailToAdd || !emailToAdd.includes("@")) return
    if ((action.recipients?.length || 0) >= MAX_EMAILS) return

    // Deduplicate emails
    if (action.recipients?.includes(emailToAdd)) {
      setNewEmailStr({...newEmailStr, [index]: ""})
      return
    }

    updateEmailAction(index, [...(action.recipients || []), emailToAdd])
    setNewEmailStr({...newEmailStr, [index]: ""})
  }

  const handleRemoveEmail = (actionIndex: number, emailIndex: number) => {
    const action = actions[actionIndex]
    if (!action) return
    if (action.type !== "EMAIL") return
    const newRecipients = [...(action.recipients || [])]
    newRecipients.splice(emailIndex, 1)
    updateEmailAction(actionIndex, newRecipients)
  }

  const updateWebhookAction = (index: number, field: string, value: string) => {
    const newActions = [...actions]
    const action = newActions[index]
    if (!action) return
    if (action.type !== "WEBHOOK") return
    newActions[index] = {...action, [field]: value}
    setActions(newActions)
  }

  const updateSlackAction = (index: number, url: string) => {
    const newActions = [...actions]
    const action = newActions[index]
    if (!action) return
    if (action.type !== "SLACK") return
    newActions[index] = {...action, type: "SLACK", webhookUrl: url}
    setActions(newActions)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-border/50 bg-muted/50 p-4 text-sm">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 size-5 shrink-0 text-blue-500" />
          <div className="space-y-2">
            <p className="font-medium">Configure Post-Approval Actions (Optional)</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Define actions that will be automatically executed when a workflow is approved. You can add up to{" "}
              {MAX_ACTIONS} actions.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {actions.map((act, index) => {
          const action = act
          const isDuplicate = actions.some((a, i) => i !== index && JSON.stringify(a) === JSON.stringify(act))

          return (
            <div
              key={index}
              className={`relative rounded-md border p-4 pt-8 ${isDuplicate ? "border-destructive bg-destructive/5" : "border-border/50 bg-muted/20"}`}
            >
              {isDuplicate && (
                <div className="absolute right-12 top-3 flex items-center gap-1 text-[10px] font-bold uppercase text-destructive">
                  Duplicate Action
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 size-8 text-muted-foreground hover:text-destructive"
                onClick={() => removeAction(index)}
                disabled={disableComponents}
              >
                <Trash2 className="size-4" />
              </Button>

              <div className="absolute left-4 top-3 flex items-center gap-2">
                {action.type === "EMAIL" && (
                  <>
                    <Mail className="size-4 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase text-muted-foreground">Email Action</span>
                  </>
                )}
                {action.type === "WEBHOOK" && (
                  <>
                    <Webhook className="size-4 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase text-muted-foreground">Webhook Action</span>
                  </>
                )}
                {action.type === "SLACK" && (
                  <>
                    <MessageSquare className="size-4 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase text-muted-foreground">Slack Action</span>
                  </>
                )}
              </div>

              {action.type === "EMAIL" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Recipients (Max {MAX_EMAILS})</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="user@example.com"
                        value={newEmailStr[index] || ""}
                        onChange={e => setNewEmailStr({...newEmailStr, [index]: e.target.value})}
                        disabled={disableComponents || (action.recipients?.length || 0) >= MAX_EMAILS}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddEmail(index)
                          }
                        }}
                        maxLength={255}
                      />
                      <Button
                        type="button"
                        onClick={() => handleAddEmail(index)}
                        disabled={
                          disableComponents ||
                          !newEmailStr[index]?.includes("@") ||
                          (action.recipients?.length || 0) >= MAX_EMAILS
                        }
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                  {action.recipients && action.recipients.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {action.recipients.map((email: string, eIdx: number) => (
                        <div
                          key={eIdx}
                          className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
                        >
                          <span>{email}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEmail(index, eIdx)}
                            disabled={disableComponents}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {(!action.recipients || action.recipients.length === 0) && (
                    <p className="text-xs text-destructive">At least one recipient is required.</p>
                  )}
                </div>
              )}

              {action.type === "WEBHOOK" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-[1fr_120px] gap-4">
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <Input
                        placeholder="https://api.example.com/webhook"
                        value={action.url || ""}
                        onChange={e => updateWebhookAction(index, "url", e.target.value)}
                        disabled={disableComponents}
                        maxLength={2048}
                        className={!action.url || !action.url.startsWith("http") ? "border-destructive" : ""}
                      />
                      {(!action.url || !action.url.startsWith("http")) && (
                        <p className="text-xs text-destructive">Valid HTTP/HTTPS URL required.</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Method</Label>
                      <Select
                        value={action.method || "POST"}
                        onValueChange={val => updateWebhookAction(index, "method", val || "POST")}
                        disabled={disableComponents}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="GET">GET</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {action.type === "SLACK" && (
                <div className="space-y-2">
                  <Label>Slack Webhook URL</Label>
                  <Input
                    placeholder="https://hooks.slack.com/services/..."
                    value={action.webhookUrl || ""}
                    onChange={e => updateSlackAction(index, e.target.value)}
                    disabled={disableComponents}
                    maxLength={2048}
                    className={!action.webhookUrl || !action.webhookUrl.startsWith("http") ? "border-destructive" : ""}
                  />
                  {(!action.webhookUrl || !action.webhookUrl.startsWith("http")) && (
                    <p className="text-xs text-destructive">Valid Slack webhook URL required.</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {actions.length < MAX_ACTIONS && !disableComponents && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => addAction("EMAIL")}>
            <Plus className="mr-1 size-4" /> Email Action
          </Button>
          <Button variant="outline" size="sm" onClick={() => addAction("WEBHOOK")}>
            <Plus className="mr-1 size-4" /> Webhook Action
          </Button>
          <Button variant="outline" size="sm" onClick={() => addAction("SLACK")}>
            <Plus className="mr-1 size-4" /> Slack Action
          </Button>
        </div>
      )}
    </div>
  )
}

export default TemplateActionsForm
