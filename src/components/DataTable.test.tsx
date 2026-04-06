import {test, expect} from "@playwright/experimental-ct-react"
import {
  DataTableTestWrapper,
  DataTableLoadingWrapper,
  DataTableExpandableWrapper,
  DataSubTableWrapper,
  DataSubTableLoadingWrapper
} from "./DataTable.test.fixtures"

test.describe("DataTable", () => {
  test("renders simple data table correctly", async ({mount}) => {
    const component = await mount(<DataTableTestWrapper />)

    await expect(component).toContainText("Test Table")
    await expect(component).toContainText("Item A")
    await expect(component).toContainText("Item B")
    await expect(component).toContainText("200")
  })

  test("shows loading state", async ({mount}) => {
    const component = await mount(<DataTableLoadingWrapper />)

    await expect(component.locator(".MuiCircularProgress-root")).toBeVisible()
    await expect(component).not.toContainText("Item A")
  })

  test("expands row content", async ({mount}) => {
    const component = await mount(<DataTableExpandableWrapper />)

    const expandButton = component.locator("button[aria-label='expand row']").first()
    await expect(expandButton).toBeVisible()

    // Initially expanded content is not visible
    await expect(component.locator("[data-testid='expanded-1']")).toBeHidden()

    await expandButton.click()

    // After click, expanded content should be visible
    await expect(component.locator("[data-testid='expanded-1']")).toBeVisible()
    await expect(component.locator("[data-testid='expanded-1']")).toContainText("Expanded Item A")
  })
})

test.describe("DataSubTable", () => {
  test("renders blended child rows and handles 'Show more'", async ({mount}) => {
    const component = await mount(<DataSubTableWrapper />)

    await expect(component).toContainText("Item A")
    await expect(
      component
        .locator("svg[data-testid='SubdirectoryArrowRightIcon']")
        .or(component.locator(".MuiSvgIcon-root"))
        .first()
    ).toBeVisible()

    const showMoreButton = component.getByRole("button", {name: "Show more versions"})
    await expect(showMoreButton).toBeVisible()

    // Verify click event is passed to component state
    await expect(component.locator("[data-testid='show-more-clicked']")).toBeHidden()
    await showMoreButton.click()
    await expect(component.locator("[data-testid='show-more-clicked']")).toBeVisible()
  })

  test("renders loading state for 'Show more'", async ({mount}) => {
    const component = await mount(<DataSubTableLoadingWrapper />)

    const loadingButton = component.getByRole("button", {name: "Loading..."})
    await expect(loadingButton).toBeVisible()
    await expect(loadingButton).toBeDisabled()
  })
})
