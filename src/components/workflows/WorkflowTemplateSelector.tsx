import React, {useState, useEffect, useMemo, useCallback} from "react"
import {Loader2, Search, Check} from "lucide-react"
import {cn} from "@/lib/utils"
import {Input} from "@/components/ui/input"
import {ScrollArea} from "@/components/ui/scroll-area"
import {listWorkflowTemplates, getWorkflowTemplate, type FrontendError} from "@/services/api"
import {handleEither} from "@/utils/either"
import type {WorkflowTemplateSummary, ListWorkflowTemplates200Response} from "@approvio/api"
import {useNotification} from "@/providers/notification/NotificationContext"
import {debounce} from "@/utils/debounce"

interface WorkflowTemplateSelectorProps {
  value: string | null
  onChange: (templateId: string | null, template: WorkflowTemplateSummary | null) => void
  disabled?: boolean
  error?: string | null
}

export const WorkflowTemplateSelector: React.FC<WorkflowTemplateSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  error
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<WorkflowTemplateSummary[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplateSummary | null>(null)

  const notification = useNotification()

  // Sync internal state with external value prop
  useEffect(() => {
    // If no value is passed, clear selection and search
    if (!value) {
      if (selectedTemplate) {
        setSelectedTemplate(null)
        setSearchQuery("")
      }
      return
    }

    // If template is already fetched and matches value, no action needed
    if (selectedTemplate && selectedTemplate.id === value) {
      return
    }

    const fetchInitial = async () => {
      setLoadingSearch(true)
      const result = await getWorkflowTemplate(value)
      handleEither(
        result,
        (template) => {
          setSelectedTemplate(template)
          setSearchQuery(template.name)
        },
        (err) => {
          // Log hydration failure (e.g. template deleted or restricted)
          console.error("[WorkflowTemplateSelector] Failed to hydrate initial template:", err)
        }
      )
      setLoadingSearch(false)
    }

    fetchInitial()
  }, [value, selectedTemplate, setSelectedTemplate, setSearchQuery, setLoadingSearch])

  const performSearch = useCallback(
    async (query: string) => {
      // The backend requires at least 3 characters to perform a search.
      // We allow empty query to reset to the default list.
      if (query.length > 0 && query.length < 3) {
        setSearchResults([])
        return
      }

      setLoadingSearch(true)
      const result = await listWorkflowTemplates({
        status: ["ACTIVE"],
        search: query || undefined,
        limit: 10
      })

      handleEither(
        result,
        (response: ListWorkflowTemplates200Response) => {
          setSearchResults(response.data)
        },
        (err: FrontendError) => {
          notification.showError(`Failed to search templates: ${err.message}`)
          setSearchResults([])
        }
      )

      setLoadingSearch(false)
    },
    [notification]
  )

  const debouncedSearch = useMemo(
    () => debounce(performSearch, 300),
    [performSearch]
  )

  useEffect(() => {
    debouncedSearch(searchQuery)
    return () => {
      debouncedSearch.clear()
    }
  }, [searchQuery, debouncedSearch])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
    if (!isOpen) setIsOpen(true)
  }

  const handleSelect = (template: WorkflowTemplateSummary) => {
    setSelectedTemplate(template)
    setSearchQuery(template.name) // populate search box with the selected template name
    onChange(template.id, template)
    setIsOpen(false)
  }

  const handleClear = () => {
      setSearchQuery("")
      setSelectedTemplate(null)
      onChange(null, null)
      if (!isOpen) setIsOpen(true)
  }

  // Highlight matches using same standard util pattern (reproduced here for self-containment)
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return text
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"))
    return (
      <span>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={index} className="rounded-sm bg-emerald-500/20 px-0.5 font-semibold text-emerald-700">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search and select a workflow template..."
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          autoComplete="off"
          className={cn("pl-9 pr-10", error && "border-destructive focus-visible:ring-destructive")}
        />
        {searchQuery && !disabled && (
           <button
             type="button"
             onClick={handleClear}
             className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
           >
             <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
           </button>
        )}
        {loadingSearch && (
          <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {isOpen && (
        <>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
             className="fixed inset-0 z-40"
             onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border/50 bg-popover shadow-md outline-none">
            <ScrollArea className="max-h-[300px]">
              <div className="p-1">
                {searchResults.length === 0 && !loadingSearch ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {searchQuery.length > 0 && searchQuery.length < 3
                      ? "Type at least 3 characters to search..."
                      : "No workflow templates found."}
                  </div>
                ) : (
                  searchResults.map(template => (
                    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                    <div
                      key={template.id}
                      onClick={() => handleSelect(template)}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                        value === template.id ? "bg-accent/50" : ""
                      )}
                    >
                      <span className="absolute left-2 flex size-3.5 items-center justify-center">
                        {value === template.id && (
                           <Check className="size-4 text-emerald-500" />
                        )}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {highlightMatch(template.name, searchQuery)}
                        </span>
                        {template.description && (
                          <span className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {template.description}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
      {error && <span className="text-sm font-medium text-destructive">{error}</span>}
    </div>
  )
}

export default WorkflowTemplateSelector
