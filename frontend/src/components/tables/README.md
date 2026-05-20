# ReusableTable Component

A flexible, reusable table component with built-in sorting and action buttons.

## Features

- ✅ **Infinite columns support** - Add as many columns as needed
- ✅ **Sortable columns** - Click column headers to sort (Asc → Desc → None)
- ✅ **Action column** - Always includes an "Action" column with View, Edit, Delete buttons
- ✅ **Icon-only buttons** - Action buttons show only icons with colors (no text)
- ✅ **Custom rendering** - Support for custom cell rendering
- ✅ **Theme-aware** - Uses theme variables for consistent styling
- ✅ **Type-safe** - Fully typed with TypeScript generics

## Basic Usage

```tsx
import ReusableTable, { Column, ActionHandlers } from "@/components/tables/ReusableTable";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const columns: Column<User>[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "email", label: "Email", sortable: true },
  { key: "role", label: "Role", sortable: true },
];

const data: User[] = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "Admin" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User" },
];

const actions: ActionHandlers<User> = {
  onView: (user) => console.log("View:", user),
  onEdit: (user) => console.log("Edit:", user),
  onDelete: (user) => console.log("Delete:", user),
};

function MyComponent() {
  return (
    <ReusableTable
      data={data}
      columns={columns}
      actions={actions}
    />
  );
}
```

## Column Configuration

### Basic Column
```tsx
{ key: "name", label: "Name", sortable: true }
```

### Column with Custom Rendering
```tsx
{
  key: "status",
  label: "Status",
  sortable: true,
  render: (value, row) => (
    <span className={value ? "text-green-500" : "text-red-500"}>
      {value ? "Active" : "Inactive"}
    </span>
  )
}
```

### Non-sortable Column
```tsx
{ key: "avatar", label: "Avatar", sortable: false }
```

## Action Buttons

The action column always appears last and includes three buttons:

- **View** (Blue) - Eye icon
- **Edit** (Orange) - Pencil icon  
- **Delete** (Red) - Trash icon

### Optional Actions
You can provide only the actions you need:

```tsx
// Only view and edit
const actions = {
  onView: (row) => handleView(row),
  onEdit: (row) => handleEdit(row),
};

// Only delete
const actions = {
  onDelete: (row) => handleDelete(row),
};

// No actions (action column won't show buttons)
<ReusableTable data={data} columns={columns} />
```

## Sorting

- Click a column header to sort ascending
- Click again to sort descending
- Click a third time to remove sorting
- Sort indicators (arrows) show the current sort direction
- Only sortable columns can be sorted (set `sortable: false` to disable)

## Props

### ReusableTableProps<T>

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | `T[]` | Yes | Array of data objects |
| `columns` | `Column<T>[]` | Yes | Column configuration |
| `actions` | `ActionHandlers<T>` | No | Action button handlers |
| `className` | `string` | No | Additional CSS classes |

### Column<T>

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `key` | `keyof T \| string` | Yes | Data key or custom identifier |
| `label` | `string` | Yes | Column header label |
| `sortable` | `boolean` | No | Enable/disable sorting (default: `true`) |
| `render` | `(value: any, row: T) => React.ReactNode` | No | Custom cell renderer |

### ActionHandlers<T>

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `onView` | `(row: T) => void` | No | View button handler |
| `onEdit` | `(row: T) => void` | No | Edit button handler |
| `onDelete` | `(row: T) => void` | No | Delete button handler |

## Examples

See `ReusableTable.example.tsx` for complete examples including:
- Simple data tables
- Complex data with custom rendering
- Tables with partial actions
- Tables without actions

## Styling

The component uses theme variables for consistent styling:
- Background: `var(--theme-surface)`
- Text: `var(--theme-text-primary)`
- Borders: `var(--theme-border)`

Action button colors:
- View: Blue (`#0ba5ec`)
- Edit: Orange (`#fb6514`)
- Delete: Red (`#f04438`)

