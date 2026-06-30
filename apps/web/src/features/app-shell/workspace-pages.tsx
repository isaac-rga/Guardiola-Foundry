import { useState, type ReactNode } from 'react'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'

import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

const dashboardMetrics = [
  { label: 'Open development styles', value: '14', detail: 'Across atelier, retail, and bridal capsule.' },
  { label: 'Waiting on fabric', value: '08', detail: 'Sourcing confirmations needed before cutting.' },
  { label: 'Retailer requests', value: '23', detail: 'Line-sheet and asset requests due this week.' },
]

const productsRows = [
  ['Luna Corset Gown', 'Bridal Core', 'Ready for cutting', 'June 14', 'Ana Ruiz'],
  ['Aster Silk Dress', 'Retail Capsule', 'Needs review', 'June 16', 'Daniela Costa'],
  ['Marisol Veil', 'Accessories', 'Waiting on fabric', 'June 19', 'Andrea Ortega'],
]

const materialsRows = [
  ['Italian Silk Satin', 'Fabric', 'Low stock', 'Botanica Textiles', '42 m'],
  ['Pearl Tulle', 'Trim', 'Ready', 'Maison Duvois', '86 m'],
  ['Boning Set 8 mm', 'Structure', 'Waiting on fabric', 'Mendoza Atelier Supply', '13 boxes'],
]

const inventoryRows = [
  ['Raw silk panels', 'Warehouse A', 'Reserved for production', '112 m', 'Updated today'],
  ['Embroidered lace appliques', 'Sample room', 'Needs review', '24 sets', 'Updated yesterday'],
  ['Invisible zipper 22 in', 'Warehouse B', 'Ready to ship', '190 units', 'Updated today'],
]

const bomRows = [
  ['Luna Corset Gown', '12 items', 'Ready for cutting', 'Merchandising'],
  ['Aster Silk Dress', '9 items', 'Waiting on fabric', 'Product Development'],
  ['Marisol Veil', '4 items', 'Needs review', 'Accessories'],
]

export function DashboardWorkspacePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="A calm operating view for the atelier."
        description="Track collections, sourcing pressure, and near-term production without leaving the shared workspace."
        badges={[
          { label: 'Balanced density' },
          { label: 'Light-only workspace', variant: 'outline' },
        ]}
        action={<Button size="lg">Review priorities</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {dashboardMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="font-editorial text-4xl">{metric.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{metric.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <TableCard
          title="Production queue"
          description="The next decisions are visible at a glance, with status language kept precise."
          headers={['Style', 'Collection', 'Status', 'Target review', 'Owner']}
          rows={productsRows}
          statusColumn={2}
        />
        <Card>
          <CardHeader>
            <CardTitle>Attention points</CardTitle>
            <CardDescription>Operational clarity with quiet brand tone.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoBlock
              title="Materials"
              body="Low stock may affect two sample-room commitments if sourcing slips past Thursday."
            />
            <InfoBlock
              title="Retail portal"
              body="One showroom pack is missing approved editorial stills for the next retailer drop."
            />
            <InfoBlock
              title="Orders"
              body="Three made-to-measure orders still need final measurement confirmation."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function ProductsWorkspacePage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Product lifecycle"
        title="Products"
        description="Shape each style through approvals, sourcing readiness, and production checkpoints without drifting into dashboard clutter."
        badges={[
          { label: 'Editorial header' },
          { label: 'Operational table', variant: 'outline' },
        ]}
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus />
                New product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-editorial text-3xl">New product</DialogTitle>
                <DialogDescription>
                  Use dialogs only for focused edits or small item creation. This keeps the flow short and calm.
                </DialogDescription>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  setDialogOpen(false)
                }}
              >
                <FieldGroup label="Product name">
                  <Input placeholder="Luna Corset Gown" />
                </FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldGroup label="Collection">
                    <Select defaultValue="bridal-core">
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bridal-core">Bridal Core</SelectItem>
                        <SelectItem value="retail-capsule">Retail Capsule</SelectItem>
                        <SelectItem value="accessories">Accessories</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldGroup>
                  <FieldGroup label="Status">
                    <Select defaultValue="review">
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="review">Needs review</SelectItem>
                        <SelectItem value="cutting">Ready for cutting</SelectItem>
                        <SelectItem value="fabric">Waiting on fabric</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldGroup>
                </div>
                <FieldGroup label="Notes">
                  <Textarea placeholder="Capture the next approval or sourcing detail." />
                </FieldGroup>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save draft</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <TableCard
          title="Current style list"
          description="Tables stay practical: compact rows, muted dividers, and status badges for the decisions that matter."
          headers={['Style', 'Collection', 'Status', 'Review date', 'Owner']}
          rows={productsRows}
          statusColumn={2}
        />
        <Card>
          <CardHeader>
            <CardTitle>Collection notes</CardTitle>
            <CardDescription>Editorial restraint belongs in hierarchy, not in the data grid itself.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricRow label="Styles in fitting" value="06" />
            <MetricRow label="Approvals due this week" value="04" />
            <MetricRow label="Ready for retail assets" value="09" />
          </CardContent>
          <CardFooter className="border-t border-border/60 pt-5">
            <p className="text-sm text-muted-foreground">
              Product pages can carry more editorial space than tables, but the operational state still stays clear.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export function MaterialsWorkspacePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Materials"
        description="Track fabrics, trims, vendors, availability, and sourcing decisions with warm neutral surfaces and quiet status signaling."
        action={<Button size="lg">Add material</Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.9fr_1fr]">
        <TableCard
          title="Material register"
          description="Dense enough for daily use, without harsh contrast or decorative styling."
          headers={['Material', 'Type', 'Status', 'Vendor', 'Available']}
          rows={materialsRows}
          statusColumn={2}
        />
        <Card>
          <CardHeader>
            <CardTitle>Sourcing notes</CardTitle>
            <CardDescription>Short, calm microcopy keeps decisions actionable.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoBlock
              title="Waiting on fabric"
              body="Italian Silk Satin still needs final dye-lot confirmation before Monday's cutting allocation."
            />
            <InfoBlock
              title="Needs review"
              body="Two lace trims require quality comparison between atelier samples and inbound stock."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function InventoryWorkspacePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Warehouse"
        title="Inventory"
        description="Operational screens stay balanced by default: clear filters, predictable sections, and restrained accents only where attention helps."
        action={
          <Button size="lg" variant="outline">
            <SlidersHorizontal />
            Adjust columns
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Inventory filters</CardTitle>
            <CardDescription>Forms remain structured, compact, and calm.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
              <FieldGroup label="Search">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Search materials or locations" />
                </div>
              </FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldGroup label="Location">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      <SelectItem value="warehouse-a">Warehouse A</SelectItem>
                      <SelectItem value="warehouse-b">Warehouse B</SelectItem>
                      <SelectItem value="sample-room">Sample room</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldGroup>
                <FieldGroup label="Status">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="reserved">Reserved for production</SelectItem>
                      <SelectItem value="review">Needs review</SelectItem>
                      <SelectItem value="ready">Ready to ship</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldGroup>
              </div>
              <div className="flex gap-3">
                <Button type="submit">Apply filters</Button>
                <Button type="button" variant="outline">
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <TableCard
          title="Live stock view"
          description="Muted dividers, practical row height, and clear quantity alignment keep the dense view easy to scan."
          headers={['Item', 'Location', 'Status', 'Quantity', 'Last update']}
          rows={inventoryRows}
          statusColumn={2}
          numericColumns={[3]}
        />
      </div>
    </div>
  )
}

export function BillsOfMaterialsWorkspacePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Production planning"
        title="Bills of Materials"
        description="BOM views stay dense and predictable, with enough hierarchy to keep product context visible without turning the grid into a landing page."
        action={<Button size="lg">Create BOM</Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.75fr_1fr]">
        <TableCard
          title="Active BOMs"
          description="Important lifecycle states get elegant badges instead of loud color blocks."
          headers={['Style', 'Components', 'Status', 'Owner']}
          rows={bomRows}
          statusColumn={2}
        />
        <Card>
          <CardHeader>
            <CardTitle>Readiness summary</CardTitle>
            <CardDescription>Secondary panels support the table instead of competing with it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricRow label="BOMs ready for cutting" value="07" />
            <MetricRow label="Blocked by materials" value="03" />
            <MetricRow label="Pending review" value="02" />
            <Separator />
            <p className="text-sm leading-6 text-muted-foreground">
              Low stock may affect upcoming production. Review the waiting materials queue before the next cut plan.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TableCard({
  description,
  headers,
  numericColumns,
  rows,
  statusColumn,
  title,
}: {
  description: string
  headers: string[]
  numericColumns?: number[]
  rows: string[][]
  statusColumn: number
  title: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead
                  key={header}
                  className={numericColumns?.includes(index) ? 'text-right' : index === 0 ? 'pl-6' : ''}
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.join('-')}>
                {row.map((cell, index) => (
                  <TableCell
                    key={`${row[0]}-${headers[index]}`}
                    className={numericColumns?.includes(index) ? 'text-right font-medium' : index === 0 ? 'pl-6 font-medium' : ''}
                  >
                    {index === statusColumn ? <StatusFromText label={cell} /> : cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function StatusFromText({ label }: { label: string }) {
  if (label === 'Ready for cutting' || label === 'Ready' || label === 'Ready to ship') {
    return <StatusBadge label={label} tone="success" />
  }

  if (label === 'Waiting on fabric' || label === 'Low stock') {
    return <StatusBadge label={label} tone="warning" />
  }

  if (label === 'Needs review') {
    return <StatusBadge label={label} tone="muted" />
  }

  return <StatusBadge label={label} />
}

function InfoBlock({ body, title }: { body: string; title: string }) {
  return (
    <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/35 p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant="outline" className="min-w-10 justify-center">
        {value}
      </Badge>
    </div>
  )
}

function FieldGroup({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
    </div>
  )
}
