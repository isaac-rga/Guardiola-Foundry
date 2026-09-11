import { zodResolver } from '@hookform/resolvers/zod'
import {
  CopyIcon,
  GripVerticalIcon,
  InfoIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import type {
  BillOfMaterialsCostProjectionExclusionReason,
  BillOfMaterialsDetail,
  BillOfMaterialsLinePreferredSource,
  CreateBillOfMaterialsRequest,
  CreateBillOfMaterialsLineRequest,
  PatternSetSearchItem,
  ProductVariantCandidate,
  ProductSummary,
} from '@guardiola-foundry/shared-types'
import { createBillOfMaterialsRequestSchema } from '@guardiola-foundry/shared-validation'

import { StatusBadge } from '@/components/app/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAppShell } from '@/features/app-shell/authenticated-app-shell'
import { cn } from '@/lib/utils'
import { BillOfMaterialsRequestError } from './api/endpoints'
import { calculateDraftBomCostProjection } from './bom-cost-projection'
import {
  isCompleteBillOfMaterialsLine,
  resolveBillOfMaterialsLineVerification,
} from './bom-line-verification'
import { MaterialPicker } from './components/material-picker'
import { PatternProposalDialog } from './components/pattern-proposal-dialog'
import { PatternSetPicker } from './components/pattern-set-picker'
import { TemplateProductScope } from './components/template-product-scope'
import { useBomBuilderPersistence } from './use-bom-builder-persistence'

const emptyLine: CreateBillOfMaterialsLineRequest = {
  constructionPiece: '',
  materialId: null,
  materialQuantity: null,
  patternSetId: null,
  lineNote: null,
  verified: false,
}

type CreateBillOfMaterialsFormValues = z.input<
  typeof createBillOfMaterialsRequestSchema
>
type CreateBillOfMaterialsLineFormValues = NonNullable<
  CreateBillOfMaterialsFormValues['lines']
>[number]

type BomBuilderContext =
  | { kind: 'template' }
  | {
      kind: 'implementation'
      productVariant: Pick<ProductVariantCandidate, 'id' | 'name' | 'product'>
      sourceTemplate?: BillOfMaterialsDetail
    }

interface BuilderMaterial {
  id: string
  name: string
  preferredSource: BillOfMaterialsLinePreferredSource | null
  attention: Array<'source-needs-attention'>
}

export function BomBuilderPage({
  context,
  existing,
  onCancel,
  onReload,
  onSaved,
}: {
  context: BomBuilderContext
  existing?: BillOfMaterialsDetail
  onCancel: () => void
  onReload?: () => void
  onSaved: () => void
}) {
  const { session } = useAppShell()
  const sourceTemplate =
    context.kind === 'implementation' ? context.sourceTemplate : undefined
  const implementationVariant =
    context.kind === 'implementation' ? context.productVariant : undefined
  const initialBillOfMaterials = existing ?? sourceTemplate
  const capabilities = resolveBuilderCapabilities(sourceTemplate)
  const form = useForm<
    CreateBillOfMaterialsFormValues,
    unknown,
    CreateBillOfMaterialsRequest
  >({
    resolver: zodResolver(createBillOfMaterialsRequestSchema, undefined, {
      mode: 'sync',
    }),
    defaultValues: existing
      ? {
          kind: existing.kind,
          name: existing.name,
          description: existing.description,
          ...(existing.kind === 'template'
            ? { productId: existing.product?.id ?? null }
            : { productVariantId: existing.productVariant!.id }),
          lines: existing.lines.map((line) => ({
            constructionPiece: line.constructionPiece,
            materialId: line.material?.id ?? null,
            materialQuantity: line.materialQuantity,
            patternSetId: line.patternSet?.id ?? null,
            lineNote: line.lineNote,
            verified: line.verification.status === 'verified',
          })),
        }
      : sourceTemplate
        ? {
            kind: 'implementation',
            name: '',
            description: sourceTemplate.description,
            productVariantId: implementationVariant!.id,
            lines: sourceTemplate.lines.map((line) => ({
              constructionPiece: line.constructionPiece,
              materialId: line.material?.id ?? null,
              materialQuantity: line.materialQuantity,
              patternSetId: line.patternSet?.id ?? null,
              lineNote: line.lineNote,
              verified: false,
            })),
          }
        : context.kind === 'template'
          ? {
              kind: 'template',
              name: '',
              description: null,
              productId: null,
              lines: [],
            }
          : {
              kind: 'implementation',
              name: '',
              description: null,
              productVariantId: implementationVariant!.id,
              lines: [],
            },
  })
  const { append, fields, move, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  })
  const lines = useWatch({ control: form.control, name: 'lines' }) ?? []
  const [activeIndex, setActiveIndex] = useState<number | null>(
    initialBillOfMaterials?.lines.length ? 0 : null,
  )
  const [materialsById, setMaterialsById] = useState<
    Record<string, BuilderMaterial>
  >(() =>
    Object.fromEntries(
      initialBillOfMaterials?.lines.flatMap((line) =>
        line.material
          ? [
              [
                line.material.id,
                {
                  id: line.material.id,
                  name: line.material.name,
                  preferredSource: line.material.preferredSource,
                  attention: line.attention.filter(
                    (attention) => attention === 'source-needs-attention',
                  ),
                },
              ],
            ]
          : [],
      ) ?? [],
    ),
  )
  const [patternSetsById, setPatternSetsById] = useState<
    Record<
      string,
      Pick<PatternSetSearchItem, 'id' | 'name' | 'quantityProposalCount'> & {
        status?: 'active' | 'retired'
      }
    >
  >(() =>
    Object.fromEntries(
      initialBillOfMaterials?.lines.flatMap((line) =>
        line.patternSet ? [[line.patternSet.id, line.patternSet]] : [],
      ) ?? [],
    ),
  )
  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(
    null,
  )
  const dragHandleIndex = useRef<number | null>(null)
  const draggedIndex = useRef<number | null>(null)
  const { blocker, isSaving, saveError, submit } = useBomBuilderPersistence({
    applicationTemplateId: sourceTemplate?.id,
    existing,
    fields,
    form,
    onSaved,
    token: session.token,
  })

  const addLine = () => {
    append(emptyLine)
    setActiveIndex(fields.length)
  }

  const duplicateLine = () => {
    if (activeIndex === null) return
    append({ ...lines[activeIndex], verified: false })
    setActiveIndex(fields.length)
  }

  const removeLine = () => {
    if (activeIndex === null) return
    remove(activeIndex)
    if (fields.length === 1) setActiveIndex(null)
    else setActiveIndex(Math.min(activeIndex, fields.length - 2))
  }

  const moveLine = (from: number, to: number) => {
    if (to < 0 || to >= fields.length || from === to) return
    move(from, to)
    setActiveIndex(to)
  }

  const updateLineVerification = (
    index: number,
    change: Partial<CreateBillOfMaterialsLineFormValues>,
  ) => {
    form.setValue(
      `lines.${index}.verified`,
      resolveBillOfMaterialsLineVerification(lines[index] ?? emptyLine, change),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    )
  }

  const activeLine = activeIndex === null ? null : lines[activeIndex]
  const activeMaterial = activeLine?.materialId
    ? (materialsById[activeLine.materialId] ?? null)
    : null
  const activePatternSet = activeLine?.patternSetId
    ? (patternSetsById[activeLine.patternSetId] ?? null)
    : null
  const costProjection = calculateDraftBomCostProjection(lines, materialsById)
  const activeCostProjection =
    activeIndex === null ? null : costProjection.lines[activeIndex]
  const attentionCount = lines.filter(
    (line) =>
      line.materialId &&
      (materialsById[line.materialId]?.attention.length ?? 0) > 0,
  ).length

  return (
    <div className="space-y-6">
      <Dialog open={blocker.status === 'blocked'}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>
              Your Bill of Materials draft has changes that have not been saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={blocker.reset}>
              Continue editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={blocker.proceed}
            >
              Discard draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Back to catalog
        </Button>
        <Button type="submit" form="create-bom" disabled={isSaving}>
          <SaveIcon /> {isSaving ? 'Saving...' : 'Save BOM'}
        </Button>
      </div>

      <Form {...form}>
        <form
          id="create-bom"
          noValidate
          onSubmit={submit}
          className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start"
        >
          <Card className="xl:col-span-2">
            <CardHeader>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-1.5">
                      <FormLabel className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                        {context.kind === 'template'
                          ? 'BOM Name'
                          : 'BOM Typification'}
                      </FormLabel>
                      <TooltipProvider delayDuration={250}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              aria-label="How to choose a BOM typification"
                              className="rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                              type="button"
                            >
                              <InfoIcon className="size-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            className="max-w-72 leading-5"
                            side="right"
                          >
                            Name the construction by its distinguishing
                            attributes, such as design, color, train, or
                            silhouette.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <h1 className="mt-2">
                      <FormControl>
                        <Input
                          {...field}
                          autoFocus
                          className="-ml-2 h-auto w-[calc(100%+1rem)] rounded-none border-0 border-b border-border/70 bg-transparent px-2 py-1 font-editorial text-4xl! leading-none text-foreground shadow-none transition-[border-color,background-color,box-shadow,border-radius] placeholder:text-muted-foreground/45 hover:rounded-md hover:border hover:border-input hover:bg-background/70 focus-visible:rounded-md focus-visible:border-ring focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/20 sm:text-5xl! md:text-5xl!"
                          disabled={isSaving}
                          placeholder="Untitled Bill of Materials"
                        />
                      </FormControl>
                    </h1>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="mt-2 text-sm text-muted-foreground">
                {context.kind === 'implementation'
                  ? `BOM Implementation · ${context.productVariant.product.name} · ${context.productVariant.product.id}`
                  : existing?.product
                    ? `BOM Template · ${existing.product.name} · ${existing.product.id}`
                    : selectedProduct
                      ? `BOM Template · ${selectedProduct.name} · ${selectedProduct.id}`
                      : 'BOM Template · No Product association'}
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {context.kind === 'template' && !existing ? (
                <TemplateProductScope
                  selectedProduct={selectedProduct}
                  token={session.token}
                  onSelect={(product) => {
                    setSelectedProduct(product)
                    form.setValue('productId', product?.id ?? null, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }}
                />
              ) : context.kind === 'implementation' ? (
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Product Variant
                  </p>
                  <p className="mt-2 font-medium">
                    {context.productVariant.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {context.productVariant.id}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {context.productVariant.product.name} ·{' '}
                    {context.productVariant.product.id} · Fixed for this
                    Implementation
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Assigned Product
                  </p>
                  <p className="mt-2 font-medium">
                    {existing?.product?.name ?? 'No Product association'}
                  </p>
                  {existing?.product ? (
                    <p className="text-xs text-muted-foreground">
                      {existing.product.id} · Fixed for this Template
                    </p>
                  ) : null}
                </div>
              )}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={isSaving || !capabilities.canEditDescription}
                        value={field.value ?? ''}
                        placeholder="Optional construction context"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {shouldShowSaveError(saveError) ? (
                <div className="space-y-2" role="alert">
                  <p>{saveError!.message}</p>
                  {saveError instanceof BillOfMaterialsRequestError &&
                  saveError.status === 409 &&
                  !saveError.deleted &&
                  onReload ? (
                    <Button type="button" variant="outline" onClick={onReload}>
                      Reload current saved version
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Construction Board</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {lines.length} {lines.length === 1 ? 'line' : 'lines'} ·{' '}
                  {lines.filter(isCompleteBillOfMaterialsLine).length} complete
                  · {lines.filter((line) => line.verified === true).length}{' '}
                  verified
                </p>
              </div>
              {capabilities.copyNotice ? (
                <p className="text-xs text-muted-foreground">
                  {capabilities.copyNotice}
                </p>
              ) : (
                <Button type="button" onClick={addLine} disabled={isSaving}>
                  <PlusIcon /> Add BOM line
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    No BOM Lines yet.
                  </p>
                  <p className="mt-1">
                    Add a Construction Piece; Material and quantity may remain
                    incomplete.
                  </p>
                </div>
              ) : (
                <div className="grid overflow-hidden rounded-xl border lg:grid-cols-[18rem_minmax(0,1fr)]">
                  <ol className="space-y-2 border-b bg-muted/20 p-3 lg:border-r lg:border-b-0">
                    {fields.map((field, index) => {
                      const line = lines[index] ?? emptyLine
                      const lineName =
                        line.constructionPiece?.trim() ||
                        `Untitled line ${index + 1}`
                      return (
                        <li
                          className={cn(
                            'flex items-center gap-2 rounded-xl border bg-card p-2',
                            activeIndex === index &&
                              'border-primary/40 bg-primary/5',
                          )}
                          draggable={capabilities.canEditComposition}
                          key={field.id}
                          onDragEnd={() => {
                            dragHandleIndex.current = null
                            draggedIndex.current = null
                          }}
                          onDragStart={(event) => {
                            if (dragHandleIndex.current !== index) {
                              event.preventDefault()
                              return
                            }
                            draggedIndex.current = index
                            event.dataTransfer.effectAllowed = 'move'
                          }}
                          onDragOver={(event) => {
                            if (draggedIndex.current !== null)
                              event.preventDefault()
                          }}
                          onDrop={(event) => {
                            event.preventDefault()
                            if (draggedIndex.current !== null) {
                              moveLine(draggedIndex.current, index)
                            }
                            dragHandleIndex.current = null
                            draggedIndex.current = null
                          }}
                        >
                          <button
                            aria-label={`Reorder ${lineName}`}
                            className="cursor-grab rounded-md p-1 text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            disabled={!capabilities.canEditComposition}
                            onKeyDown={(event) => {
                              if (
                                event.key !== 'ArrowUp' &&
                                event.key !== 'ArrowDown'
                              )
                                return
                              event.preventDefault()
                              moveLine(
                                index,
                                index + (event.key === 'ArrowUp' ? -1 : 1),
                              )
                            }}
                            onPointerDown={() => {
                              dragHandleIndex.current = index
                            }}
                            onPointerUp={() => {
                              dragHandleIndex.current = null
                            }}
                            type="button"
                          >
                            <GripVerticalIcon className="size-4" />
                          </button>
                          <button
                            className="min-w-0 flex-1 text-left"
                            onClick={() => setActiveIndex(index)}
                            type="button"
                          >
                            <span className="block truncate text-sm font-medium">
                              {lineName}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {(line.materialId
                                ? materialsById[line.materialId]?.name
                                : null) ?? 'Material unresolved'}
                            </span>
                          </button>
                          <span
                            aria-label={
                              isCompleteBillOfMaterialsLine(line)
                                ? 'Complete'
                                : 'Incomplete'
                            }
                            className={cn(
                              'size-2 rounded-full',
                              isCompleteBillOfMaterialsLine(line)
                                ? 'bg-emerald-500'
                                : 'bg-stone-300',
                            )}
                          />
                        </li>
                      )
                    })}
                  </ol>

                  <section className="min-w-0 space-y-6 p-5 lg:p-7">
                    {activeLine && activeIndex !== null ? (
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                              Selected construction line
                            </p>
                            <FormField
                              control={form.control}
                              name={`lines.${activeIndex}.constructionPiece`}
                              render={({ field }) => (
                                <FormItem className="mt-2">
                                  <FormLabel className="sr-only">
                                    Construction Piece
                                  </FormLabel>
                                  <h2>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        aria-label="Construction Piece"
                                        disabled={
                                          !capabilities.canEditComposition
                                        }
                                        className="-ml-2 h-auto w-[calc(100%+1rem)] rounded-none border-0 border-b border-border/70 bg-transparent px-2 py-1 font-editorial text-3xl! leading-tight text-foreground shadow-none transition-[border-color,background-color,box-shadow,border-radius] placeholder:text-muted-foreground/45 hover:rounded-md hover:border hover:border-input hover:bg-background/70 focus-visible:rounded-md focus-visible:border-ring focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/20 md:text-3xl!"
                                        placeholder="Untitled construction piece"
                                        value={field.value ?? ''}
                                        onChange={(event) => {
                                          field.onChange(event)
                                          updateLineVerification(activeIndex, {
                                            constructionPiece:
                                              event.target.value,
                                          })
                                        }}
                                      />
                                    </FormControl>
                                  </h2>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          {capabilities.canEditComposition ? (
                            <div className="flex gap-1">
                              <Button
                                aria-label="Duplicate line"
                                onClick={duplicateLine}
                                size="icon-sm"
                                type="button"
                                variant="outline"
                              >
                                <CopyIcon />
                              </Button>
                              <Button
                                aria-label="Remove line"
                                onClick={removeLine}
                                size="icon-sm"
                                type="button"
                                variant="ghost"
                              >
                                <Trash2Icon />
                              </Button>
                            </div>
                          ) : null}
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <FormItem>
                            <FormLabel>Material</FormLabel>
                            {!capabilities.canEditComposition ? (
                              <div className="rounded-xl border bg-muted/20 px-3 py-2 text-sm">
                                {activeMaterial
                                  ? `${activeMaterial.name} · ${activeMaterial.id}`
                                  : 'Material unresolved'}
                              </div>
                            ) : (
                              <MaterialPicker
                                selected={activeMaterial}
                                token={session.token}
                                onSelect={(material) => {
                                  const materialChanged =
                                    material?.id !== activeLine.materialId
                                  form.setValue(
                                    `lines.${activeIndex}.materialId`,
                                    material?.id ?? null,
                                    {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    },
                                  )
                                  if (materialChanged) {
                                    form.setValue(
                                      `lines.${activeIndex}.materialQuantity`,
                                      null,
                                      {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      },
                                    )
                                    updateLineVerification(activeIndex, {
                                      materialId: material?.id ?? null,
                                    })
                                  }
                                  if (material) {
                                    setMaterialsById((current) => ({
                                      ...current,
                                      [material.id]: material,
                                    }))
                                  }
                                }}
                              />
                            )}
                          </FormItem>
                          <FormField
                            control={form.control}
                            name={`lines.${activeIndex}.patternSetId`}
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center justify-between gap-2">
                                  <FormLabel>Pattern Set (optional)</FormLabel>
                                  {capabilities.canEditComposition &&
                                  activePatternSet &&
                                  activePatternSet.quantityProposalCount > 0 ? (
                                    <PatternProposalDialog
                                      materialId={activeLine.materialId}
                                      materialWidthCentimeters={
                                        activeMaterial?.preferredSource
                                          ?.widthCentimeters ?? null
                                      }
                                      patternSetId={activePatternSet.id}
                                      proposalCount={
                                        activePatternSet.quantityProposalCount
                                      }
                                      token={session.token}
                                      onUse={(quantityMeters) => {
                                        form.setValue(
                                          `lines.${activeIndex}.materialQuantity`,
                                          quantityMeters,
                                          {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                          },
                                        )
                                        updateLineVerification(activeIndex, {
                                          materialQuantity: quantityMeters,
                                        })
                                      }}
                                    />
                                  ) : null}
                                </div>
                                {!capabilities.canEditComposition ? (
                                  <div className="rounded-xl border bg-muted/20 px-3 py-2 text-sm">
                                    {activePatternSet
                                      ? `${activePatternSet.name} · ${activePatternSet.id}`
                                      : 'No Pattern Set'}
                                  </div>
                                ) : (
                                  <PatternSetPicker
                                    selected={activePatternSet}
                                    token={session.token}
                                    onSelect={(patternSet) => {
                                      field.onChange(patternSet?.id ?? null)
                                      if (patternSet) {
                                        setPatternSetsById((current) => ({
                                          ...current,
                                          [patternSet.id]: patternSet,
                                        }))
                                      }
                                    }}
                                  />
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`lines.${activeIndex}.materialQuantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Final meters</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      aria-label="Final meters"
                                      className="pr-8"
                                      disabled={
                                        !capabilities.canEditComposition ||
                                        !activeLine.materialId
                                      }
                                      min="0.001"
                                      step="0.001"
                                      type="number"
                                      value={field.value ?? ''}
                                      onChange={(event) => {
                                        field.onChange(
                                          event.target.value === ''
                                            ? null
                                            : Number(event.target.value),
                                        )
                                        updateLineVerification(activeIndex, {
                                          materialQuantity:
                                            event.target.value === ''
                                              ? null
                                              : Number(event.target.value),
                                        })
                                      }}
                                    />
                                    <span className="absolute top-2.5 right-3 text-xs text-muted-foreground">
                                      m
                                    </span>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`lines.${activeIndex}.verified`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Verification</FormLabel>
                                <label
                                  className={cn(
                                    'flex h-10 items-center gap-2 rounded-xl border border-input/90 bg-card px-3 text-sm font-medium transition-[color,box-shadow,border-color] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30',
                                    isCompleteBillOfMaterialsLine(activeLine)
                                      ? 'cursor-pointer'
                                      : 'cursor-not-allowed opacity-50',
                                  )}
                                >
                                  <Checkbox
                                    aria-label="Manually verified"
                                    checked={field.value === true}
                                    disabled={
                                      !capabilities.canEditComposition ||
                                      !isCompleteBillOfMaterialsLine(activeLine)
                                    }
                                    onCheckedChange={(checked) =>
                                      field.onChange(
                                        resolveBillOfMaterialsLineVerification(
                                          activeLine,
                                          { verified: checked === true },
                                        ),
                                      )
                                    }
                                  />
                                  Manually verified
                                </label>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`lines.${activeIndex}.lineNote`}
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Line Note</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    aria-label="Line Note"
                                    disabled={!capabilities.canEditComposition}
                                    value={field.value ?? ''}
                                    placeholder="Optional construction guidance"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/30 px-3 py-3">
                          <StatusBadge
                            label={
                              isCompleteBillOfMaterialsLine(activeLine)
                                ? 'Complete'
                                : 'Incomplete'
                            }
                            tone={
                              isCompleteBillOfMaterialsLine(activeLine)
                                ? 'success'
                                : 'muted'
                            }
                          />
                          {activeMaterial?.attention.includes(
                            'source-needs-attention',
                          ) ? (
                            <StatusBadge
                              label="Source needs attention"
                              tone="warning"
                            />
                          ) : null}
                          {activeMaterial?.preferredSource ? (
                            <p className="text-xs text-muted-foreground">
                              {activeMaterial.preferredSource.widthCentimeters
                                ? `${activeMaterial.preferredSource.widthCentimeters} cm width`
                                : 'Width unavailable'}{' '}
                              · {activeMaterial.preferredSource.name} ·{' '}
                              {activeMaterial.preferredSource.vendor}
                              {activeMaterial.preferredSource
                                .vendorShadeOrDetail
                                ? ` · ${activeMaterial.preferredSource.vendorShadeOrDetail}`
                                : ''}
                              {activeMaterial.preferredSource
                                .landedUnitCostCents !== null
                                ? ` · ${formatCurrencyFromCents(activeMaterial.preferredSource.landedUnitCostCents)}/m`
                                : ' · Landed Unit Cost unavailable'}
                            </p>
                          ) : null}
                          {activeCostProjection?.amountCents !== null &&
                          activeCostProjection?.amountCents !== undefined ? (
                            <span className="text-xs font-medium">
                              {formatCurrencyFromCents(
                                activeCostProjection.amountCents,
                              )}
                            </span>
                          ) : activeCostProjection ? (
                            <span className="text-xs text-muted-foreground">
                              {costExclusionLabel(
                                activeCostProjection.exclusionReason,
                              )}
                            </span>
                          ) : null}
                        </div>
                      </>
                    ) : null}
                  </section>
                </div>
              )}
            </CardContent>
          </Card>

          <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Whole BOM</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">
                    Construction lines
                  </span>
                  <span className="font-medium">{lines.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Complete</span>
                  <span className="font-medium">
                    {lines.filter(isCompleteBillOfMaterialsLine).length}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Verified</span>
                  <span className="font-medium">
                    {lines.filter((line) => line.verified === true).length}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Need attention</span>
                  <span className="font-medium">{attentionCount}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">
                    Material projection
                  </span>
                  <span className="font-medium">
                    {costProjection.summary.amountCents === null
                      ? 'Unavailable'
                      : `${formatCurrencyFromCents(costProjection.summary.amountCents)}${costProjection.summary.availability === 'partial' ? ' · partial' : ''}`}
                  </span>
                </div>
                {costProjection.summary.excludedLineCount > 0 ? (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {costProjection.summary.excludedLineCount}{' '}
                    {costProjection.summary.excludedLineCount === 1
                      ? 'line'
                      : 'lines'}{' '}
                    excluded from projection.
                  </p>
                ) : null}
                <p className="border-t pt-4 text-xs leading-5 text-muted-foreground">
                  Incomplete or unverified lines do not block saving.
                </p>
                {sourceTemplate ? (
                  <p className="border-t pt-4 text-xs leading-5 text-muted-foreground">
                    Origin: {sourceTemplate.name} · {sourceTemplate.id}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </aside>
        </form>
      </Form>
    </div>
  )
}

function resolveBuilderCapabilities(sourceTemplate?: BillOfMaterialsDetail) {
  const canEditCopiedValues = sourceTemplate === undefined
  return {
    canEditDescription: canEditCopiedValues,
    canEditComposition: canEditCopiedValues,
    copyNotice: sourceTemplate
      ? `Copied from ${sourceTemplate.name} when you save`
      : null,
  }
}

function shouldShowSaveError(error: Error | null) {
  if (!error) return false
  if (!(error instanceof BillOfMaterialsRequestError)) return true
  const fields = Object.keys(error.fieldErrors)
  return fields.length === 0 || fields.includes('productVariantId')
}

function formatCurrencyFromCents(amountCents: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amountCents / 100)
}

function costExclusionLabel(
  reason: BillOfMaterialsCostProjectionExclusionReason | null,
) {
  if (reason === 'missing-material') return 'Material required for projection'
  if (reason === 'missing-material-quantity')
    return 'Final meters required for projection'
  return 'Landed Unit Cost unavailable'
}
