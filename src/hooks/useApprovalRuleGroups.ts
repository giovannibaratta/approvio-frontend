import {useState, useEffect} from "react"
import type {ApprovalRule} from "@approvio/api"
import {getGroup} from "../services/api"
import {handleEither} from "../utils/either"

/**
 * Hook to extract and resolve group names from an ApprovalRule
 */
export function useApprovalRuleGroups(rule: ApprovalRule) {
  const [groupMap, setGroupMap] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchGroups = async () => {
      const groupIds = new Set<string>()

      const extractGroupIds = (r: ApprovalRule) => {
        if (r.type === "GROUP_REQUIREMENT") groupIds.add(r.groupId)
        else if (r.type === "AND" || r.type === "OR") r.rules.forEach(extractGroupIds)
      }

      extractGroupIds(rule)

      if (groupIds.size === 0) return

      const map: Record<string, string> = {}

      await Promise.all(
        Array.from(groupIds).map(async id => {
          if (!id) return
          const result = await getGroup(id)
          handleEither(
            result,
            groupData => {
              map[id] = groupData.name
            },
            err => {
              console.error(`Failed to load group ${id} for name resolution`, err)
            }
          )
        })
      )

      setGroupMap(map)
    }

    fetchGroups()
  }, [rule])

  return groupMap
}
