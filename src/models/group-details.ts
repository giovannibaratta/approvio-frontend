import type { GroupMembership } from "@approvio/api";

export interface MemberDetails extends GroupMembership {
  userDetails?: {
    id: string;
    displayName: string;
    email: string;
    createdAt: string;
  };
  loadingUserDetails: boolean;
}
