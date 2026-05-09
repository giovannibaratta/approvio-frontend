import React from "react"
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"

interface DiscardChangesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onConfirm: () => void
}

const DiscardChangesDialog: React.FC<DiscardChangesDialogProps> = ({open, onOpenChange, onCancel, onConfirm}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Discard unsaved changes?</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel? Any unsaved changes you have made will be lost.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onCancel}>
            Keep Editing
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Discard Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DiscardChangesDialog
