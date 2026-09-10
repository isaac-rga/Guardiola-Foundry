import { FileStackIcon, PlusIcon } from 'lucide-react'

import { PageHeader } from '@/components/app/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppShell } from '@/features/app-shell/authenticated-app-shell'
import { useBillsOfMaterials } from './api/bills-of-materials'
import { AssociateTemplateProductButton } from './components/associate-template-product-button'

export function BillsOfMaterialsCatalogPage({
  onCreateTemplate,
}: {
  onCreateTemplate: () => void
}) {
  const { session } = useAppShell()
  const { billsOfMaterials, isLoading, loadError } = useBillsOfMaterials(
    session.token,
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bills of Materials"
        description="Browse reusable Templates and Product Variant Implementations in one operational catalog."
        action={<CreateBomMenu onCreateTemplate={onCreateTemplate} />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Operational catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading Bills of Materials...
            </p>
          ) : null}
          {loadError ? <p role="alert">{loadError.message}</p> : null}
          {!isLoading && !loadError && billsOfMaterials.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No Bills of Materials registered yet.
            </div>
          ) : null}
          {billsOfMaterials.length > 0 ? (
            <Table className="min-w-[58rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>Bill of Materials</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Product context</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last updated</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billsOfMaterials.map((billOfMaterials) => (
                  <TableRow key={billOfMaterials.id}>
                    <TableCell className="max-w-[18rem] whitespace-normal align-top">
                      <p className="font-medium">{billOfMaterials.name}</p>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                        BOM ID {billOfMaterials.id}
                      </p>
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge
                        variant={
                          billOfMaterials.kind === 'template'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {billOfMaterials.kind === 'template'
                          ? 'Template'
                          : 'Implementation'}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-normal align-top">
                      {billOfMaterials.product ? (
                        <div className="space-y-1">
                          <p className="font-medium">
                            {billOfMaterials.product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {billOfMaterials.product.id} ·{' '}
                            {billOfMaterials.product.availability ===
                            'available'
                              ? 'Available'
                              : 'Unavailable'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="font-medium">No Product associated</p>
                          <p className="text-xs text-muted-foreground">
                            Product relationship is optional
                          </p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal align-top text-sm">
                      <p>{billOfMaterials.createdBy.email}</p>
                      <p className="text-muted-foreground">
                        {new Date(
                          billOfMaterials.createdAt,
                        ).toLocaleDateString()}
                      </p>
                    </TableCell>
                    <TableCell className="align-top text-sm">
                      {new Date(billOfMaterials.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right align-top">
                      {billOfMaterials.kind === 'template' &&
                      billOfMaterials.product === null ? (
                        <AssociateTemplateProductButton
                          billOfMaterialsId={billOfMaterials.id}
                          billOfMaterialsName={billOfMaterials.name}
                          token={session.token}
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function CreateBomMenu({ onCreateTemplate }: { onCreateTemplate: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button">
          <PlusIcon /> Create BOM
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onSelect={onCreateTemplate}>
          <FileStackIcon />
          <div>
            <p className="font-medium">BOM Template</p>
            <p className="text-xs text-muted-foreground">
              Create a reusable construction
            </p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
