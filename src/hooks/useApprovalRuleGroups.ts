import {useState, useEffect} from "react"
import type {ApprovalRule} from "@approvio/api"
import {getGroup} from "../services/api"
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

      await Promise.all(
        groupIds.map(async id => {
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
