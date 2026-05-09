import React, {useEffect, useState} from "react"
import {useParams, Link as RouterLink} from "react-router-dom"
import {getWorkflowTemplate, listWorkflowTemplates} from "../services/api"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import type {WorkflowTemplate, WorkflowTemplateSummary} from "@approvio/api"
import ApprovalRuleViewer from "../components/workflow-templates/ApprovalRuleViewer"
import {Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {Loader2, ArrowLeft, ArrowLeftRight, Clock, AlignLeft} from "lucide-react"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"

/**
 * A page component that allows users to compare different versions of a workflow template.
 *
 * Features:
 * - Displays the current version of a template alongside a selected version for comparison.
 * - Fetches and displays metadata (description, expiry) and the approval rule for both versions.
 * - Provides a dropdown to select and compare against other available versions of the same template.
 * - Handles loading states and errors gracefully.
 */
const CompareWorkflowTemplatePage: React.FC = () => {
  const {templateIdentifier} = useParams<{templateIdentifier: string}>()
  const [currentTemplate, setCurrentTemplate] = useState<WorkflowTemplate | null>(null)
  const [otherVersions, setOtherVersions] = useState<WorkflowTemplateSummary[]>([])

  const [selectedVersionId, setSelectedVersionId] = useState<string>("")
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null)

  const [loadingInitial, setLoadingInitial] = useState<boolean>(true)
  const [loadingCompare, setLoadingCompare] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const notification = useNotification()

  // Initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!templateIdentifier) return
      setLoadingInitial(true)
      setError(null)

      const result = await getWorkflowTemplate(templateIdentifier)
      await handleEither(
        result,
        async (templateData: WorkflowTemplate) => {
          setCurrentTemplate(templateData)

          // Fetch other versions
          const versionsResult = await listWorkflowTemplates({
            search: templateData.name,
            searchMode: "EXACT",
            status: ["ACTIVE", "PENDING_DEPRECATION", "DEPRECATED"],
            limit: 100
          })

          handleEither(
            versionsResult,
            res => {
              setOtherVersions(res.data.filter(t => t.id !== templateData.id))
            },
            err => {
              notification.showError(`Failed to load other versions: ${err.message}`)
            }
          )
        },
        err => {
          setError(err.message)
          notification.showError(err.message)
        }
      )

      setLoadingInitial(false)
    }

    fetchInitialData()
  }, [templateIdentifier, notification])

  // Fetch selected template
  useEffect(() => {
    const fetchSelectedTemplate = async () => {
      if (!selectedVersionId) {
        setSelectedTemplate(null)
        return
      }
      setLoadingCompare(true)
      const result = await getWorkflowTemplate(selectedVersionId)
      handleEither(
        result,
        data => setSelectedTemplate(data),
        err => notification.showError(`Failed to load selected template: ${err.message}`)
      )
      setLoadingCompare(false)
    }
    fetchSelectedTemplate()
  }, [selectedVersionId, notification])

  if (loadingInitial) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !currentTemplate) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertDescription>{error || "Template not found"}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <RouterLink to={`/workflow-templates/${currentTemplate.id}`}>
            <ArrowLeft className="size-5" />
          </RouterLink>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Compare Versions</h1>
          <p className="text-sm text-muted-foreground">{currentTemplate.name}</p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-4 rounded-md border border-border/50 bg-muted/30 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Comparing Version</span>
          <span className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-sm font-semibold text-primary">
            v{currentTemplate.version}
          </span>
          <span className="mx-2 text-sm text-muted-foreground">with</span>
        </div>

        <div className="w-[280px]">
          <Select value={selectedVersionId} onValueChange={val => setSelectedVersionId(val || "")}>
            <SelectTrigger>
              <SelectValue placeholder="Select a version to compare">
                {selectedVersionId
                  ? otherVersions.find(v => v.id === selectedVersionId)
                    ? `v${otherVersions.find(v => v.id === selectedVersionId)?.version} - ${new Date(otherVersions.find(v => v.id === selectedVersionId)!.createdAt).toLocaleDateString()}`
                    : null
                  : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {otherVersions.length === 0 ? (
                <SelectItem value="none" disabled>
                  No other versions available
                </SelectItem>
              ) : (
                otherVersions.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    v{v.version} - {new Date(v.createdAt).toLocaleDateString()}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${selectedTemplate ? "lg:grid-cols-2" : ""} gap-6`}>
        {/* Current Version */}
        <Card className="h-fit border-primary/20 bg-background/50 shadow-sm backdrop-blur-sm">
          <CardHeader className="border-b border-border/40 bg-primary/5 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary" />
                <CardTitle className="text-lg">Current Version</CardTitle>
              </div>
              <span className="font-mono text-sm font-semibold text-primary">v{currentTemplate.version}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wider">Default Expiry</span>
                </div>
                <p className="font-mono text-sm font-medium">
                  {currentTemplate.defaultExpiresInHours
                    ? `${currentTemplate.defaultExpiresInHours}h`
                    : "System Default"}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
                <AlignLeft className="size-3.5" />
                <span className="text-xs font-medium uppercase tracking-wider">Description</span>
              </div>
              <p className="text-sm leading-relaxed">
                {currentTemplate.description || <span className="italic opacity-50">N/A</span>}
              </p>
            </div>

            <div className="border-t border-border/40 pt-4">
              <ApprovalRuleViewer rule={currentTemplate.approvalRule} title="Approval Rule" />
            </div>
          </CardContent>
        </Card>

        {/* Selected Version */}
        {selectedTemplate && (
          <Card
            className={`h-fit border-border/50 bg-background/50 shadow-sm backdrop-blur-sm transition-opacity duration-200 ${loadingCompare ? "opacity-50" : "opacity-100"}`}
          >
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="size-4 text-muted-foreground" />
                  <CardTitle className="text-lg text-muted-foreground">Compared Version</CardTitle>
                </div>
                <span className="font-mono text-sm font-semibold text-muted-foreground">
                  v{selectedTemplate.version}
                </span>
              </div>
            </CardHeader>
            <CardContent className="relative min-h-[200px] pt-6">
              {loadingCompare ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="size-3.5" />
                        <span className="text-xs font-medium uppercase tracking-wider">Default Expiry</span>
                      </div>
                      <p className="font-mono text-sm font-medium">
                        {selectedTemplate.defaultExpiresInHours
                          ? `${selectedTemplate.defaultExpiresInHours}h`
                          : "System Default"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
                      <AlignLeft className="size-3.5" />
                      <span className="text-xs font-medium uppercase tracking-wider">Description</span>
                    </div>
                    <p className="text-sm leading-relaxed">
                      {selectedTemplate.description || <span className="italic opacity-50">N/A</span>}
                    </p>
                  </div>

                  <div className="border-t border-border/40 pt-4">
                    <ApprovalRuleViewer rule={selectedTemplate.approvalRule} title="Approval Rule" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default CompareWorkflowTemplatePage
