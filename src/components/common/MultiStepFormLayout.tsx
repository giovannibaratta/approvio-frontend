import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft } from "lucide-react"
import DiscardChangesDialog from "./DiscardChangesDialog"

/**
 * Definition of a single step in the form.
 */
export interface StepDefinition {
  /** Unique identifier for the step */
  id: string | number
  /** Human-readable label displayed below the step icon */
  label: string
  /** Lucide icon component to display for this step */
  icon: React.ElementType
}

/**
 * Props for the MultiStepFormLayout component.
 *
 * NOTE ON STATE MANAGEMENT:
 * This component is "stateless" (dumb) regarding the current step. It does NOT automatically
 * increment the activeStepIndex when the primary button is clicked.
 *
 * RATIONALE:
 * Callers usually need to perform validation, side effects, or asynchronous API calls
 * before transitioning between steps. By keeping the state external, the caller has full
 * control over the lifecycle of the form, including preventing transition if validation fails.
 */
interface MultiStepFormLayoutProps {
  // --- Header ---
  /** Title displayed at the top of the page next to the back arrow */
  pageTitle: string
  /** Subtitle/description displayed below the page title */
  pageDescription: string

  // --- Card Header ---
  /** Icon displayed in the main card header */
  cardIcon: React.ElementType
  /** Tailwind classes for the card icon color (e.g. "text-blue-500") */
  cardIconColorClass?: string
  /** Tailwind classes for the card icon background and border (e.g. "bg-blue-500/10 border-blue-500/20") */
  cardIconBgClass?: string
  /** Title of the current step displayed in the card */
  cardTitle: string
  /** Description of the current step displayed in the card */
  cardDescription: string

  // --- Stepper ---
  /** Array of step definitions to display in the progress indicator */
  steps?: StepDefinition[]
  /** Index of the currently active step (0-based) */
  activeStepIndex?: number

  // --- Action Callbacks & Visibility ---
  /** Called when the top-left back arrow or the "Cancel" button is clicked */
  onCancelClick?: () => void
  /** Called when the user confirms cancellation via the discard dialog */
  onCancelConfirm?: () => void
  /** If true, shows a confirmation dialog before triggering cancellation */
  showCancelConfirmDialog?: boolean

  /** Called when the "Back" button in the footer is clicked */
  onBackClick?: () => void
  /** Whether to show the "Back" button in the footer */
  showBackButton?: boolean

  /** Called when the "Skip" button in the footer is clicked */
  onSkipClick?: () => void
  /** Whether to show the "Skip" button in the footer */
  showSkipButton?: boolean

  /** Called when the primary action button (e.g. "Next Step" or "Create") is clicked */
  onPrimaryClick: () => void
  /** Text to display on the primary action button */
  primaryButtonText: string
  /** Whether the primary action is in a loading state (shows spinner and disables buttons) */
  isPrimaryLoading?: boolean
  /** Whether the primary button should be explicitly disabled */
  isPrimaryDisabled?: boolean

  // --- Content ---
  /** The form content for the current step */
  children: React.ReactNode
}

const MultiStepFormLayout: React.FC<MultiStepFormLayoutProps> = ({
  pageTitle,
  pageDescription,
  cardIcon: CardIcon,
  cardIconColorClass = "text-primary",
  cardIconBgClass = "border-primary/20 bg-primary/10",
  cardTitle,
  cardDescription,
  steps = [],
  activeStepIndex = 0,
  onCancelClick,
  onCancelConfirm,
  showCancelConfirmDialog = true,
  onBackClick,
  showBackButton = false,
  onSkipClick,
  showSkipButton = false,
  onPrimaryClick,
  primaryButtonText,
  isPrimaryLoading = false,
  isPrimaryDisabled = false,
  children,
}) => {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  const handleCancelClick = () => {
    if (showCancelConfirmDialog && onCancelConfirm) {
      setCancelDialogOpen(true)
    } else if (onCancelClick) {
      onCancelClick()
    }
  }

  const handleCancelClose = () => {
    setCancelDialogOpen(false)
  }

  const handleCancelConfirm = () => {
    setCancelDialogOpen(false)
    if (onCancelConfirm) {
      onCancelConfirm()
    } else if (onCancelClick) {
      onCancelClick()
    }
  }

  const hasSteps = steps.length > 0

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancelClick} disabled={isPrimaryLoading} className="shrink-0">
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" {...(pageTitle === "Edit Approval Rule" ? { "data-testid": "edit-rule-header" } : {})}>{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">{pageDescription}</p>
        </div>
      </div>

      {/* Stepper */}
      {hasSteps && (
        <div className="relative mb-8 flex items-center justify-between px-4 md:px-8">
          <div className="absolute inset-x-0 top-1/2 -z-10 h-0.5 -translate-y-1/2 bg-muted/50" />
          {steps.map((step, index) => {
            const isActive = index === activeStepIndex
            const isCompleted = index < activeStepIndex
            const Icon = step.icon

            return (
              <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
                <div
                  className={`flex size-10 items-center justify-center rounded-full border-2 transition-colors
                    ${isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCompleted
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-muted bg-background text-muted-foreground"
                    }`}
                >
                  <Icon className="size-5" />
                </div>
                <span className={`text-xs font-medium uppercase tracking-wider ${isActive || isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
          <div className="flex items-center gap-3">
            <div className={`flex size-10 items-center justify-center rounded-md border ${cardIconBgClass}`}>
              <CardIcon className={`size-5 ${cardIconColorClass}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{cardTitle}</CardTitle>
              <CardDescription>{cardDescription}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {children}
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-border/40 bg-muted/20 py-4">
          {onCancelClick || onCancelConfirm ? (
            <Button variant="ghost" onClick={handleCancelClick} disabled={isPrimaryLoading} className="text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
          ) : <div />} {/* Empty div to keep right-aligned buttons on the right */}

          <div className="flex gap-3">
            {showBackButton && onBackClick && (
              <Button variant="outline" onClick={onBackClick} disabled={isPrimaryLoading}>
                Back
              </Button>
            )}

            {showSkipButton && onSkipClick && (
              <Button variant="outline" onClick={onSkipClick} disabled={isPrimaryLoading}>
                Skip
              </Button>
            )}

            <Button onClick={onPrimaryClick} disabled={isPrimaryDisabled || isPrimaryLoading} className="min-w-[120px]">
              {isPrimaryLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isPrimaryLoading ? "Processing..." : primaryButtonText}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <DiscardChangesDialog
        open={cancelDialogOpen}
        onOpenChange={(open) => !open && handleCancelClose()}
        onCancel={handleCancelClose}
        onConfirm={handleCancelConfirm}
      />
    </div>
  )
}

export default MultiStepFormLayout
