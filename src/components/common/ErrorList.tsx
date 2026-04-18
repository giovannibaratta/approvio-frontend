import React from "react"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {AlertCircle} from "lucide-react"

export interface ErrorEntry {
  message: string
  timestamp: string
}

interface ErrorListProps {
  errors: ErrorEntry[]
}

const ErrorList: React.FC<ErrorListProps> = ({errors}) => {
  if (errors.length === 0) return <></>

  // Limit to the 3 most recent errors
  const recentErrors = errors.slice(0, 3)

  return (
    <div className="mb-4">
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertDescription className="font-mono text-xs">
          <div className="mt-1 flex flex-col gap-1">
            {recentErrors.map((err, index) => (
              <span key={index}>
                <span className="opacity-50">[{err.timestamp}]</span> {err.message}
              </span>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default ErrorList
