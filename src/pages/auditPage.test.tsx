import {test, expect} from "@playwright/experimental-ct-react"
import {AuditPageTestWrapper} from "./auditPage.test.fixtures"
import type {AuditLog} from "@approvio/api"

test.describe("AuditPage", () => {
  const mockLogs: AuditLog[] = [
    {
      id: "log-1",
      createdAt: "2024-03-20T10:00:00Z",
      auditType: "WORKFLOW_CREATED",
      target: {type: "workflow", id: "wf-1"},
      actor: {type: "user", id: "user-1"},
      payload: {}
    } as any,
    {
      id: "log-2",
      createdAt: "2024-03-19T14:30:00Z",
      auditType: "SPACE_CREATED",
      target: {type: "space", id: "sp-1"},
      actor: {type: "user", id: "user-1"},
      payload: {}
    } as any
  ]

  test("renders empty state", async ({mount, page}) => {
    await page.route("**/audit-logs*", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          auditLogs: [],
          pagination: {hasMore: false}
        })
      })
    })

    const component = await mount(<AuditPageTestWrapper />)

    await expect(component.getByRole("heading", {name: "Audit Logs"})).toBeVisible()
    await expect(component.getByText("No data available")).toBeVisible()
  })

  test("renders table with entries", async ({mount, page}) => {
    await page.route("**/audit-logs*", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          auditLogs: mockLogs,
          pagination: {hasMore: false}
        })
      })
    })

    const component = await mount(<AuditPageTestWrapper />)

    await expect(component.getByRole("heading", {name: "Audit Logs"})).toBeVisible()

    await expect(component.getByText("Workflow created")).toBeVisible()
    await expect(component.getByText("Space created")).toBeVisible()

    await expect(component.getByText("wf-1")).toBeVisible()
    await expect(component.getByText("sp-1")).toBeVisible()
    await expect(component.getByText("user-1")).toHaveCount(2)
  })
})
