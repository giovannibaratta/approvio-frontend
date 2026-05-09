import {useState} from "react"
import {DataTable, DataSubTable, type Column} from "./DataTable"

interface MockData {
  id: string
  name: string
  value: number
}

const mockColumns: Column<MockData>[] = [
  {id: "name", label: "Name", width: "50%", render: row => row.name},
  {id: "value", label: "Value", width: "50%", render: row => row.value}
]

const mockData: MockData[] = [
  {id: "1", name: "Item A", value: 100},
  {id: "2", name: "Item B", value: 200}
]

export function DataTableTestWrapper() {
  return (
    <DataTable
      title="Test Table"
      columns={mockColumns}
      data={mockData}
      loading={false}
      total={2}
      page={0}
      rowsPerPage={10}
      onPageChange={() => undefined}
      onRowsPerPageChange={() => undefined}
    />
  )
}

export function DataTableLoadingWrapper() {
  return (
    <DataTable
      title="Test Table"
      columns={mockColumns}
      data={[]}
      loading={true}
      total={0}
      page={0}
      rowsPerPage={10}
      onPageChange={() => undefined}
      onRowsPerPageChange={() => undefined}
    />
  )
}

export function DataTableExpandableWrapper() {
  return (
    <DataTable
      title="Expandable Table"
      columns={mockColumns}
      data={mockData}
      loading={false}
      total={2}
      page={0}
      rowsPerPage={10}
      onPageChange={() => undefined}
      onRowsPerPageChange={() => undefined}
      expandableRow={row => <div data-testid={`expanded-${row.id}`}>Expanded {row.name}</div>}
    />
  )
}

export function DataSubTableWrapper() {
  const [clicked, setClicked] = useState(false)
  return (
    <div>
      <DataSubTable
        columns={mockColumns}
        data={mockData}
        hasMore={true}
        loadingMore={false}
        onShowMore={() => {
          setClicked(true)
        }}
        noDataMessage="No sub data"
      />
      {clicked && <div data-testid="show-more-clicked">Clicked</div>}
    </div>
  )
}

export function DataSubTableLoadingWrapper() {
  return (
    <DataSubTable
      columns={mockColumns}
      data={mockData}
      hasMore={true}
      loadingMore={true}
      onShowMore={() => undefined}
    />
  )
}
