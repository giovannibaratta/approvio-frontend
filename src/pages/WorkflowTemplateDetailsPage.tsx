import React, {useEffect, useState} from "react"
import {useParams, Link as RouterLink} from "react-router-dom"
import {getSpace, getWorkflowTemplate} from "../services/api"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import type {Space, WorkflowTemplate} from "@approvio/api"
import TemplateDetailsRule from "../components/workflow-templates/TemplateDetailsRule"
import {Card, CardHeader, CardTitle, CardDescription, CardContent} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {Loader2, ArrowLeftRight, FileJson, LayoutGrid, Clock, Calendar, Edit3, AlignLeft} from "lucide-react"

const WorkflowTemplateDetailsPage: React.FC = () => {
  const {templateIdentifier} = useParams<{templateIdentifier: string}>()
  const [template, setTemplate] = useState<WorkflowTemplate | null>(null)
  const [spaceName, setSpaceName] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const notification = useNotification()

  useEffect(() => {
    const fetchTemplateDetails = async () => {
      if (!templateIdentifier) return

      setLoading(true)
      setError(null)

      const result = await getWorkflowTemplate(templateIdentifier)

      handleEither(
        result,
        async (templateData: WorkflowTemplate) => {
          setTemplate(templateData)
          const spacesResult = await getSpace(templateData.spaceId)
          handleEither(
            spacesResult,
            (space: Space) => {
              setSpaceName(space.name)
            },
            () => {
              setSpaceName(templateData.spaceId)
            }
          )
        },
        errorMessage => {
          setError(errorMessage.message)
          notification.showError(errorMessage.message)
        }
      )

      setLoading(false)
    }

    fetchTemplateDetails()
  }, [templateIdentifier, notification])

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!template) {
    return (
      <Alert className="m-4 border-amber-500/50 bg-amber-500/10">
        <AlertDescription className="text-amber-600">Workflow Template not found.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Top Section: Overview */}
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="flex flex-col items-start justify-between gap-4 pb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10">
              <FileJson className="size-6 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold tracking-tight">{template.name}</CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2 text-base text-muted-foreground">
                <span className="rounded-sm border border-border/50 bg-muted px-1.5 py-0.5 font-mono text-xs">
                  v{template.version}
                </span>
                <span>{template.status.replace(/_/g, " ")}</span>
              </CardDescription>
            </div>
          </div>
          <Button asChild variant="outline">
            <RouterLink to={`/workflow-templates/${template.id}/compare`}>
              <ArrowLeftRight className="mr-2 size-4" />
              Compare Versions
            </RouterLink>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-md border border-border/40 bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2">
                <LayoutGrid className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Space</p>
              </div>
              <p className="truncate text-lg font-medium">{spaceName || "Loading..."}</p>
            </div>

            <div className="rounded-md border border-border/40 bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Created</p>
              </div>
              <p className="text-lg font-medium">{new Date(template.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="rounded-md border border-border/40 bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Edit3 className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Last Update</p>
              </div>
              <p className="text-lg font-medium">{new Date(template.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Section */}
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardContent className="space-y-8 pt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-md border border-border/40 bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2">
                <AlignLeft className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Description</p>
              </div>
              <p className="flex-1 text-sm leading-relaxed text-foreground/80">
                {template.description || <span className="italic opacity-50">No description provided.</span>}
              </p>
            </div>

            <div className="rounded-md border border-border/40 bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Default Expiry</p>
              </div>
              <p className="mt-4 font-mono text-base font-medium">
                {template.defaultExpiresInHours !== null ? `${template.defaultExpiresInHours}h` : "System Default"}
              </p>
            </div>
          </div>

          <div className="border-t border-border/40 pt-4">
            <TemplateDetailsRule rule={template.approvalRule} templateId={template.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default WorkflowTemplateDetailsPage
