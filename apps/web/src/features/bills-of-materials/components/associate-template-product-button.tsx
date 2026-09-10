import { useState } from 'react'
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
  token,
}: {
  billOfMaterialsId: string
  billOfMaterialsName: string
  token: string
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
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
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => setIsPickerOpen(true)}>
            Associate Product
          </DropdownMenuItem>
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
