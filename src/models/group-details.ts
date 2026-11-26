import type {GroupMembership} from "@approvio/api"

export interface MemberDetails extends GroupMembership {
  userDetails?: {
    id: string
    displayName: string
    createdAt: string
  }
  loadingUserDetails: boolean
}
