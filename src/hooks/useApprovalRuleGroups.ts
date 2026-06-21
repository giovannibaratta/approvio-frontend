import {useState, useEffect} from "react"
import type {ApprovalRule, ResourceResolveRequest} from "@approvio/api"
import {resolveResources} from "../services/api"
import {handleEither} from "../utils/either"
import {extractGroupIds} from "../utils/rules"

/**
 * Hook to extract and resolve group names from an ApprovalRule
 */
export function useApprovalRuleGroups(rule: ApprovalRule) {
  const [groupMap, setGroupMap] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchGroups = async () => {
      const groupIds = extractGroupIds(rule)

      if (groupIds.length === 0) return

      const map: Record<string, string> = {}
      const resourcesToResolve: ResourceResolveRequest["resources"] = groupIds
        .filter((id): id is string => !!id)
        .map(id => ({type: "group", id}))

      if (resourcesToResolve.length > 0) {
        const result = await resolveResources({resources: resourcesToResolve})
        handleEither(
          result,
          res => {
            res.resolved.forEach(item => {
              map[item.id] = item.name
            })
            res.denied.forEach(item => {
              console.error(`Failed to load group ${item.id} for name resolution: ${item.reason}`)
            })
          },
          err => {
            console.error("Failed to load groups for name resolution", err)
          }
        )
      }

      setGroupMap(map)
    }

    fetchGroups()
  }, [rule])

  return groupMap
}
