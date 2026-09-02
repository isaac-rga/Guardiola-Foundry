import { zodResolver } from '@hookform/resolvers/zod'
import {
  PURCHASE_PRESENTATIONS,
  PURCHASE_UNITS,
  TEXTILE_FAMILIES,
  VENDOR_CURRENCIES,
} from '@guardiola-foundry/shared-types'
import type { CreateSourceRequest } from '@guardiola-foundry/shared-types'
import { createSourceRequestSchema } from '@guardiola-foundry/shared-validation'
import { Link } from '@tanstack/react-router'
import type { Control } from 'react-hook-form'
import { useForm } from 'react-hook-form'

import { PageHeader } from '@/components/app/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAppShell } from '@/features/app-shell/authenticated-app-shell'
import { SourceValidationError } from '@/features/sources/api/endpoints'
import { useCreateSource } from '@/features/sources/api/queries'

const defaultValues: CreateSourceRequest = {
  name: '',
  vendor: '',
  textileFamily: 'Crepe',
  purchasePresentation: 'roll',
  fixedPieceLength: null,
  purchaseUnit: 'meter',
  minimumPurchaseQuantity: 1,
  purchasePriceCents: 0,
  priceDate: '',
  vendorCurrency: 'USD',
  landedUnitCostCents: null,
  vendorSku: null,
  url: null,
  description: null,
  manufacturer: null,
  fiber: null,
  composition: null,
  gsmGramsPerSquareMeter: null,
  widthCentimeters: null,
  finish: null,
  weave: null,
  presentationNotes: null,
  countryOfOrigin: null,
  comments: null,
  estimatedShippingUsdPerKilogramCents: null,
  igiPercentage: null,
  vendorShades: [],
}

const textileFamilyOptions = TEXTILE_FAMILIES.map((value) => ({
  label: value,
  value,
}))
const presentationOptions = PURCHASE_PRESENTATIONS.map((value) => ({
  label: value === 'roll' ? 'Roll' : 'Piece',
  value,
}))
const purchaseUnitOptions = PURCHASE_UNITS.map((value) => ({
  label: value === 'meter' ? 'Meter' : 'Yard',
  value,
}))
const currencyOptions = VENDOR_CURRENCIES.map((value) => ({
  label: value,
  value,
}))

interface SourceCreatePageProps {
  onCreated: (sourceId: string) => void | Promise<void>
}

export function SourceCreatePage({ onCreated }: SourceCreatePageProps) {
  const { session } = useAppShell()
  const createSource = useCreateSource(session.token)
  const form = useForm<CreateSourceRequest>({
    resolver: zodResolver(createSourceRequestSchema),
    defaultValues,
  })
  const isPending = createSource.isPending

  const onSubmit = form.handleSubmit(async (values) => {
    form.clearErrors()

    try {
      const result = await createSource.mutateAsync(values)
      await onCreated(result.source.id)
    } catch (error) {
      if (error instanceof SourceValidationError) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          const message = messages?.[0]
          if (message) {
            form.setError(field as keyof CreateSourceRequest, {
              type: 'server',
              message,
            })
          }
        }
      }
    }
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Source"
        description="Register a vendor-specific textile offering in the authoritative Sources catalog."
        action={
          <Button asChild variant="outline">
            <Link to="/app/sources">Cancel</Link>
          </Button>
        }
      />

      <Card>
        <CardContent>
          <Form {...form}>
            <form className="space-y-8" onSubmit={onSubmit}>
              <SourceSection title="Commercial data">
                <div className="grid gap-5 md:grid-cols-2">
                  <TextField
                    control={form.control}
                    name="name"
                    label="Source Name"
                    disabled={isPending}
                  />
                  <TextField
                    control={form.control}
                    name="vendor"
                    label="Vendor"
                    disabled={isPending}
                  />
                  <SelectField
                    control={form.control}
                    name="textileFamily"
                    label="Textile Family"
                    options={textileFamilyOptions}
                    disabled={isPending}
                  />
                  <SelectField
                    control={form.control}
                    name="purchasePresentation"
                    label="Purchase Presentation"
                    options={presentationOptions}
                    disabled={isPending}
                  />
                  <NumberField
                    control={form.control}
                    name="fixedPieceLength"
                    label="Fixed Piece Length"
                    disabled={isPending}
                  />
                  <SelectField
                    control={form.control}
                    name="purchaseUnit"
                    label="Purchase Unit"
                    options={purchaseUnitOptions}
                    disabled={isPending}
                  />
                  <NumberField
                    control={form.control}
                    name="minimumPurchaseQuantity"
                    label="Minimum Purchase Quantity"
                    disabled={isPending}
                  />
                  <MoneyField
                    control={form.control}
                    name="purchasePriceCents"
                    label="Purchase Price"
                    disabled={isPending}
                  />
                  <TextField
                    control={form.control}
                    name="priceDate"
                    label="Price Date"
                    type="date"
                    disabled={isPending}
                  />
                  <SelectField
                    control={form.control}
                    name="vendorCurrency"
                    label="Vendor Currency"
                    options={currencyOptions}
                    disabled={isPending}
                  />
                  <MoneyField
                    control={form.control}
                    name="landedUnitCostCents"
                    label="Landed Unit Cost (MXN per meter)"
                    disabled={isPending}
                  />
                  <TextField
                    control={form.control}
                    name="vendorSku"
                    label="Vendor SKU"
                    disabled={isPending}
                  />
                  <TextField
                    control={form.control}
                    name="url"
                    label="Vendor URL"
                    type="url"
                    disabled={isPending}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Landed Unit Cost is optional. An Active Source without it will
                  show Cost needs attention.
                </p>
              </SourceSection>

              <SourceSection title="Technical data">
                <div className="grid gap-5 md:grid-cols-2">
                  <TextAreaField
                    control={form.control}
                    name="description"
                    label="Description"
                    disabled={isPending}
                  />
                  <TextField
                    control={form.control}
                    name="manufacturer"
                    label="Manufacturer"
                    disabled={isPending}
                  />
                  <TextField
                    control={form.control}
                    name="fiber"
                    label="Fiber"
                    disabled={isPending}
                  />
                  <TextField
                    control={form.control}
                    name="composition"
                    label="Composition"
                    disabled={isPending}
                  />
                  <NumberField
                    control={form.control}
                    name="gsmGramsPerSquareMeter"
                    label="GSM (grams per square meter)"
                    disabled={isPending}
                  />
                  <NumberField
                    control={form.control}
                    name="widthCentimeters"
                    label="Width (centimeters)"
                    disabled={isPending}
                  />
                  <TextField
                    control={form.control}
                    name="finish"
                    label="Finish"
                    disabled={isPending}
                  />
                  <TextField
                    control={form.control}
                    name="weave"
                    label="Weave"
                    disabled={isPending}
                  />
                  <TextAreaField
                    control={form.control}
                    name="presentationNotes"
                    label="Presentation Notes"
                    disabled={isPending}
                  />
                  <TextField
                    control={form.control}
                    name="countryOfOrigin"
                    label="Country of Origin"
                    disabled={isPending}
                  />
                  <TextAreaField
                    control={form.control}
                    name="comments"
                    label="Comments"
                    disabled={isPending}
                  />
                </div>
              </SourceSection>

              <SourceSection title="Future costing inputs">
                <p className="text-sm text-muted-foreground">
                  These inputs do not calculate or update Landed Unit Cost.
                </p>
                <div className="grid gap-5 md:grid-cols-3">
                  <MoneyField
                    control={form.control}
                    name="estimatedShippingUsdPerKilogramCents"
                    label="Estimated Shipping (USD per kg)"
                    disabled={isPending}
                  />
                  <NumberField
                    control={form.control}
                    name="igiPercentage"
                    label="IGI Percentage"
                    disabled={isPending}
                  />
                  <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                    <p className="text-sm font-medium">IVA</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      16% fixed business rule
                    </p>
                  </div>
                </div>
              </SourceSection>

              <SourceSection title="Vendor Shades">
                <FormField
                  control={form.control}
                  name="vendorShades"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor Shades</FormLabel>
                      <FormControl>
                        <Textarea
                          defaultValue={(field.value ?? []).join('\n')}
                          disabled={isPending}
                          name={field.name}
                          onBlur={field.onBlur}
                          ref={field.ref}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value
                                .split('\n')
                                .map((value) => value.trim())
                                .filter(Boolean),
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Enter one Vendor shade name or code per line.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </SourceSection>

              {createSource.isError &&
              !(createSource.error instanceof SourceValidationError) ? (
                <p
                  className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
                  role="alert"
                >
                  {createSource.error instanceof Error
                    ? createSource.error.message
                    : 'Unable to create Source.'}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3">
                <Button asChild type="button" variant="outline">
                  <Link to="/app/sources">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Creating Source...' : 'Create Source'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

function SourceSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="space-y-5 rounded-2xl border border-border/70 p-5">
      <legend className="px-2 text-base font-semibold">{title}</legend>
      {children}
    </fieldset>
  )
}

type TextFieldName =
  | 'name'
  | 'vendor'
  | 'priceDate'
  | 'vendorSku'
  | 'url'
  | 'manufacturer'
  | 'fiber'
  | 'composition'
  | 'finish'
  | 'weave'
  | 'countryOfOrigin'

function TextField({
  control,
  name,
  label,
  type = 'text',
  disabled,
}: {
  control: Control<CreateSourceRequest>
  name: TextFieldName
  label: string
  type?: string
  disabled: boolean
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              value={field.value ?? ''}
              type={type}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

type TextAreaFieldName = 'description' | 'presentationNotes' | 'comments'

function TextAreaField({
  control,
  name,
  label,
  disabled,
}: {
  control: Control<CreateSourceRequest>
  name: TextAreaFieldName
  label: string
  disabled: boolean
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              value={field.value ?? ''}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

type NumberFieldName =
  | 'fixedPieceLength'
  | 'minimumPurchaseQuantity'
  | 'gsmGramsPerSquareMeter'
  | 'widthCentimeters'
  | 'igiPercentage'

function NumberField({
  control,
  name,
  label,
  disabled,
}: {
  control: Control<CreateSourceRequest>
  name: NumberFieldName
  label: string
  disabled: boolean
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              defaultValue={field.value ?? ''}
              disabled={disabled}
              name={field.name}
              onBlur={field.onBlur}
              ref={field.ref}
              step="any"
              type="number"
              onChange={(event) =>
                field.onChange(
                  event.target.value === '' ? null : Number(event.target.value),
                )
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

type MoneyFieldName =
  | 'purchasePriceCents'
  | 'landedUnitCostCents'
  | 'estimatedShippingUsdPerKilogramCents'

function MoneyField({
  control,
  name,
  label,
  disabled,
}: {
  control: Control<CreateSourceRequest>
  name: MoneyFieldName
  label: string
  disabled: boolean
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              defaultValue={
                field.value === null || field.value === undefined
                  ? ''
                  : field.value / 100
              }
              disabled={disabled}
              name={field.name}
              onBlur={field.onBlur}
              ref={field.ref}
              step="0.01"
              type="number"
              onChange={(event) =>
                field.onChange(
                  event.target.value === ''
                    ? null
                    : Math.round(Number(event.target.value) * 100),
                )
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

type SelectFieldName =
  | 'textileFamily'
  | 'purchasePresentation'
  | 'purchaseUnit'
  | 'vendorCurrency'

function SelectField({
  control,
  name,
  label,
  options,
  disabled,
}: {
  control: Control<CreateSourceRequest>
  name: SelectFieldName
  label: string
  options: ReadonlyArray<{ label: string; value: string }>
  disabled: boolean
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            disabled={disabled}
            value={field.value}
            onValueChange={field.onChange}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
