import {test, expect} from "@playwright/experimental-ct-react"
import {
  DataTableTestWrapper,
  DataTableLoadingWrapper,
  DataTableExpandableWrapper,
  DataSubTableWrapper,
  DataSubTableLoadingWrapper,
  DataTableInteractiveWrapper
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

    await expect(component.locator(".animate-spin")).toBeVisible()
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

  test("handles interactive row click, cell click, and preventRowClick", async ({mount}) => {
    let rowClickCalled = false
    let cellClickCalled = false
    let preventCellClickCalled = false

    const component = await mount(
      <DataTableInteractiveWrapper
        onRowClick={() => {
          rowClickCalled = true
        }}
        onCellClick={() => {
          cellClickCalled = true
        }}
        onPreventCellClick={() => {
          preventCellClickCalled = true
        }}
      />
    )

    // 1. Test cellClick: Clicking on the 'Name' cell (first column cell)
    // It should trigger onCellClick but NOT trigger onRowClick
    const nameCell = component.locator("table tbody tr").first().locator("td").nth(0)
    await nameCell.click()
    expect(cellClickCalled).toBe(true)
    expect(rowClickCalled).toBe(false)

    // Reset flags
    cellClickCalled = false
    rowClickCalled = false

    // 2. Test preventRowClick: Clicking inside the 'Value' cell (second column cell)
    // It should trigger custom click inside the cell but NOT trigger onRowClick
    const valueCellButton = component.locator("table tbody tr").first().locator("td").nth(1).locator("button")
    await valueCellButton.click()
    expect(preventCellClickCalled).toBe(true)
    expect(rowClickCalled).toBe(false)

    // Reset flags
    preventCellClickCalled = false
    rowClickCalled = false

    // 3. Test rowClick: Clicking on the 'Plain' cell (third column cell)
    // It should propagate and trigger onRowClick
    const plainCell = component.locator("table tbody tr").first().locator("td").nth(2)
    await plainCell.click()
    expect(rowClickCalled).toBe(true)
  })
})

test.describe("DataSubTable", () => {
  test("renders blended child rows and handles 'Show more'", async ({mount}) => {
    const component = await mount(<DataSubTableWrapper />)

    await expect(component).toContainText("Item A")
    await expect(component.locator(".lucide-corner-down-right").first()).toBeVisible()

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
