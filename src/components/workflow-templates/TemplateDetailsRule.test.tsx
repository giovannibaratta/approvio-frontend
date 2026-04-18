import {test, expect} from "@playwright/experimental-ct-react"
import TemplateDetailsRule from "./TemplateDetailsRule"
import type {ApprovalRule} from "@approvio/api"

test.use({viewport: {width: 500, height: 500}})

test("TemplateDetailsRule shows rendered and raw view", async ({mount, page}) => {
  const rule: ApprovalRule = {
    type: "AND",
    rules: [
      {
        type: "GROUP_REQUIREMENT",
        groupId: "group-123",
        minCount: 2
      }
    ]
  }

  const component = await mount(<TemplateDetailsRule rule={rule} templateId="test-template-id" />)

  // Default is rendered view
  await expect(page.getByText("Approval Rule")).toBeVisible()
  await expect(page.getByText("ALL of the following (AND)")).toBeVisible()
  await expect(page.getByText("Required Group")).toBeVisible()
  await expect(page.getByText("2", {exact: true})).toBeVisible()

  // Switch to raw view
  await component.getByRole("switch", {name: "Raw JSON"}).click()
  await expect(page.getByText('"groupId": "group-123"')).toBeVisible()
})
