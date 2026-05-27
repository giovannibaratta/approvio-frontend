import {test, expect} from "@playwright/experimental-ct-react"
import {ProfilePageTestWrapper} from "./profilePage.test.fixtures"
import { userWithGroupsAndRolesResponse } from "@approvio/api/mocks"
import type { AuditLog } from "@approvio/api"

test.describe("ProfilePage Activity Log", () => {
  const mockLogs: AuditLog[] = [
    {
      id: "log-1",
      createdAt: "2024-03-20T10:00:00Z",
      auditType: "WORKFLOW_CREATED",
      target: { type: "workflow", id: "wf-1" },
      actor: { type: "user", id: userWithGroupsAndRolesResponse.id },
      payload: {}
    } as any
  ]

  test("renders empty activity state", async ({mount, page}) => {
    await page.route("**/auth/info", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({...userWithGroupsAndRolesResponse, entityType: "user"})
      })
    })

    await page.route("**/audit-logs/me*", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          auditLogs: [],
          pagination: { hasMore: false }
        })
      })
    })

    const component = await mount(<ProfilePageTestWrapper />)

    await expect(component.getByText("My Recent Activity")).toBeVisible()
    await expect(component.getByText("No activity recorded yet.")).toBeVisible()
  })

  test("renders activity entries", async ({mount, page}) => {
    await page.route("**/auth/info", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({...userWithGroupsAndRolesResponse, entityType: "user"})
      })
    })

    await page.route("**/audit-logs/me*", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          auditLogs: mockLogs,
          pagination: { hasMore: false }
        })
      })
    })

    const component = await mount(<ProfilePageTestWrapper />)

    await expect(component.getByText("My Recent Activity")).toBeVisible()

    await expect(component.getByText("Workflow created")).toBeVisible()
    await expect(component.getByText("wf-1")).toBeVisible()
  })
})
