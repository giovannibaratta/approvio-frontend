import {useState} from "react"
import {TemplateActionsForm} from "./TemplateActionsForm"
import {type WorkflowAction} from "@approvio/api"

export const TestWrapper = ({initialActions = []}: {initialActions?: WorkflowAction[]}) => {
  const [actions, setActions] = useState<WorkflowAction[]>(initialActions)
  const [isValid, setIsValid] = useState(true)

  return (
    <div>
      <div data-testid="is-valid">{isValid ? "VALID" : "INVALID"}</div>
      <TemplateActionsForm
        actions={actions}
        setActions={setActions}
        disableComponents={false}
        setIsValid={setIsValid}
      />
      <div data-testid="actions-count">{actions.length}</div>
    </div>
  )
}
