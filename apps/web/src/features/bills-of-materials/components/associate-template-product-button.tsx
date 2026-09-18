import { useRef, useState } from 'react'
import { MoreHorizontalIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAssociateBillOfMaterialsTemplateProduct } from '../api/bills-of-materials'
import { TemplateProductPickerDialog } from './template-product-scope'

export function AssociateTemplateProductButton({
  billOfMaterialsId,
  billOfMaterialsName,
  canAssociateProduct,
  canCreateImplementation,
  isAdmin,
  isDeleted,
  isReadOnly,
  onDelete,
  onEdit,
  onRestore,
  onDeriveTemplate,
  onCreateImplementation,
  token,
}: {
  billOfMaterialsId: string
  billOfMaterialsName: string
  canAssociateProduct: boolean
  canCreateImplementation: boolean
  isAdmin: boolean
  isDeleted: boolean
  isReadOnly: boolean
  onDelete: () => void
  onCreateImplementation: (returnFocusElement: HTMLButtonElement | null) => void
  onDeriveTemplate: () => void
  onEdit: () => void
  onRestore: () => void
  token: string
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const actionTriggerRef = useRef<HTMLButtonElement>(null)
  const association = useAssociateBillOfMaterialsTemplateProduct(
    token,
    billOfMaterialsId,
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`Actions for ${billOfMaterialsName}`}
            ref={actionTriggerRef}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={onEdit}>
            {isReadOnly ? 'View Bill of Materials' : 'Edit Bill of Materials'}
          </DropdownMenuItem>
          {!isDeleted ? (
            <DropdownMenuItem onSelect={onDeriveTemplate}>
              Derive Template
            </DropdownMenuItem>
          ) : null}
          {canAssociateProduct ? (
            <DropdownMenuItem onSelect={() => setIsPickerOpen(true)}>
              Associate Product
            </DropdownMenuItem>
          ) : null}
          {canCreateImplementation ? (
            <DropdownMenuItem
              onSelect={() => onCreateImplementation(actionTriggerRef.current)}
            >
              Create Implementation
            </DropdownMenuItem>
          ) : null}
          {isDeleted && isAdmin ? (
            <DropdownMenuItem onSelect={onRestore}>
              Restore Bill of Materials
            </DropdownMenuItem>
          ) : null}
          {!isDeleted ? (
            <DropdownMenuItem onSelect={onDelete} variant="destructive">
              Delete Bill of Materials
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <TemplateProductPickerDialog
        error={association.associationError}
        open={isPickerOpen}
        token={token}
        onOpenChange={setIsPickerOpen}
        onSelect={async (product) => {
          try {
            await association.associateProduct({ productId: product.id })
            setIsPickerOpen(false)
          } catch {
            // The dialog keeps the server error visible so the User can choose again.
          }
        }}
      />
    </>
  )
}
