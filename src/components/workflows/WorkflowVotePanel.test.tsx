import {test, expect} from "@playwright/experimental-ct-react"
import {WorkflowVotePanel} from "./WorkflowVotePanel"
import {NotificationContext} from "@/providers/notification/NotificationContext"

const mockNotificationContext = {
  showError: (msg: string) => {
    console.log("Error Callback:", msg)
  },
  showSuccess: (msg: string) => {
    console.log("Success Callback:", msg)
  }
}

const mockTemplate = {
  id: "temp-1",
  name: "Test Template",
  approvalRule: {
    type: "GROUP_REQUIREMENT",
    minCount: 1,
    groupId: "group-1"
  }
} as any

test.describe("WorkflowVotePanel", () => {
  let votePayload: any = null

  test.beforeEach(async ({page}) => {
    votePayload = null

    await page.route("**/auth/info", async route => {
      return route.fulfill({
        status: 200,
        json: {
          entityType: "HUMAN",
          groups: [{groupId: "group-1", groupName: "Test Group"}],
          id: "user-1"
        }
      })
    })

    await page.route("**/canVote", async route => {
      return route.fulfill({
        status: 200,
        json: {canVote: true, voteStatus: "PENDING"}
      })
    })

    await page.route("**/vote", async route => {
      if (route.request().method() === "POST") {
        votePayload = route.request().postDataJSON()
        return route.fulfill({status: 200, json: {}})
      }
      return route.continue()
    })
  })

  test("successfully casts an approval vote", async ({mount, page}) => {
    const component = await mount(
      <NotificationContext.Provider value={mockNotificationContext}>
        <WorkflowVotePanel
          workflowId="wf-1"
          template={mockTemplate}
          onVoteSuccess={() => {
            /* success */
          }}
        />
      </NotificationContext.Provider>
    )

    const trigger = component.getByRole("button", {name: /Cast Vote/i})
    await expect(trigger).toBeVisible()
    await trigger.click()

    await expect(page.getByText("Loading...")).toBeHidden()

    await page.getByLabel(/Reason/i).fill("Everything looks good")

    // Wait for popover content to be stable
    const submitBtn = page.getByRole("button", {name: /Submit Vote/i})
    await expect(submitBtn).toBeVisible()
    await submitBtn.click()

    // Mocked call is near-instant, but we poll to allow for Playwright's internal dispatch
    await expect
      .poll(() => votePayload, {timeout: 1000})
      .toMatchObject({
        voteType: {type: "APPROVE", votedForGroups: ["group-1"]},
        reason: "Everything looks good"
      })
  })
})
