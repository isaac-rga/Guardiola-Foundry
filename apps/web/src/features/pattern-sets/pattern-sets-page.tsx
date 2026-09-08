import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import type {
  PatternSet,
  PatternSetMutationRequest,
} from '@guardiola-foundry/shared-types'
import { createPatternSetRequestSchema } from '@guardiola-foundry/shared-validation'

import { PageHeader } from '@/components/app/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useAppShell } from '@/features/app-shell/authenticated-app-shell'
import { usePatternSets } from './api/pattern-sets'

const emptyValues: PatternSetMutationRequest = {
  name: '',
  description: null,
  quantityProposals: [],
}

export function PatternSetsPage() {
  const { session } = useAppShell()
  const isAdmin = session.user.role === 'admin'
  const [includeRetired, setIncludeRetired] = useState(false)
  const [editing, setEditing] = useState<PatternSet | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [retiring, setRetiring] = useState<PatternSet | null>(null)
  const {
    patternSets,
    isLoading,
    loadError,
    isSaving,
    isChangingStatus,
    saveError,
    statusError,
    savePatternSet,
    retirePatternSet,
    restorePatternSet,
  } = usePatternSets(session.token, isAdmin && includeRetired)
  const form = useForm<PatternSetMutationRequest>({
    resolver: zodResolver(createPatternSetRequestSchema),
    defaultValues: emptyValues,
  })
  const proposals = useFieldArray({
    control: form.control,
    name: 'quantityProposals',
  })

  const openCreate = () => {
    setEditing(null)
    form.reset(emptyValues)
    setFormOpen(true)
  }

  const openEdit = (patternSet: PatternSet) => {
    setEditing(patternSet)
    form.reset({
      name: patternSet.name,
      description: patternSet.description,
      quantityProposals: patternSet.quantityProposals,
    })
    setFormOpen(true)
  }

  const submit = form.handleSubmit(async (values) => {
    try {
      await savePatternSet({ current: editing, values })
      setFormOpen(false)
    } catch {
      // Mutation error remains visible while the draft stays open.
    }
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pattern Sets"
        description="Maintain reusable construction patterns and their width-based quantity evidence."
        action={<Button onClick={openCreate}>Create Pattern Set</Button>}
      />

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Pattern Set catalog</CardTitle>
          {isAdmin ? (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={includeRetired}
                onCheckedChange={(checked) =>
                  setIncludeRetired(checked === true)
                }
              />
              Include retired
            </label>
          ) : null}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading Pattern Sets...
            </p>
          ) : null}
          {loadError ? <p role="alert">{loadError.message}</p> : null}
          {statusError ? <p role="alert">{statusError.message}</p> : null}
          {!isLoading && !loadError && patternSets.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No Pattern Sets registered yet.
            </div>
          ) : null}
          {patternSets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pattern Set</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quantity Proposals</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patternSets.map((patternSet) => (
                  <TableRow key={patternSet.id}>
                    <TableCell className="whitespace-normal align-top">
                      <p className="font-medium">{patternSet.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Set ID {patternSet.id}
                      </p>
                      {patternSet.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {patternSet.description}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="align-top capitalize">
                      {patternSet.status}
                    </TableCell>
                    <TableCell className="whitespace-normal align-top">
                      {patternSet.quantityProposals.length === 0 ? (
                        <span className="text-sm text-muted-foreground">
                          None documented
                        </span>
                      ) : (
                        <ul className="space-y-1 text-sm">
                          {patternSet.quantityProposals.map((proposal) => (
                            <li key={proposal.assumedWidthCm}>
                              {proposal.assumedWidthCm} cm →{' '}
                              {proposal.quantityMeters} m
                              {proposal.evidenceNote
                                ? ` — ${proposal.evidenceNote}`
                                : ''}
                            </li>
                          ))}
                        </ul>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal align-top text-sm">
                      <p>{patternSet.createdBy.email}</p>
                      <p className="text-muted-foreground">
                        {new Date(patternSet.createdAt).toLocaleDateString()}
                      </p>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex justify-end gap-2">
                        {patternSet.status === 'active' ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(patternSet)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRetiring(patternSet)}
                            >
                              Retire
                            </Button>
                          </>
                        ) : isAdmin ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isChangingStatus}
                            onClick={async () => {
                              try {
                                await restorePatternSet(patternSet.id)
                              } catch {
                                // Mutation error remains visible in the catalog.
                              }
                            }}
                          >
                            <RotateCcw /> Restore
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit Pattern Set' : 'Create Pattern Set'}
            </DialogTitle>
            <DialogDescription>
              Proposals are advisory evidence. They never calculate or choose
              final material quantity.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form className="space-y-5" onSubmit={submit}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pattern Set name</FormLabel>
                    <FormControl>
                      <Input {...field} autoFocus disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ''}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Quantity Proposals</h3>
                    <p className="text-sm text-muted-foreground">
                      Record assumed width and proposed meters.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      proposals.append({
                        assumedWidthCm: 0,
                        quantityMeters: 0,
                        evidenceNote: null,
                      })
                    }
                  >
                    <Plus /> Add proposal
                  </Button>
                </div>
                {proposals.fields.map((proposal, index) => (
                  <div
                    key={proposal.id}
                    className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_1fr_2fr_auto]"
                  >
                    <FormField
                      control={form.control}
                      name={`quantityProposals.${index}.assumedWidthCm`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assumed width (cm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0.001"
                              step="any"
                              {...field}
                              value={
                                Number.isNaN(field.value) ? '' : field.value
                              }
                              onChange={(event) =>
                                field.onChange(event.target.valueAsNumber)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`quantityProposals.${index}.quantityMeters`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity (m)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0.001"
                              step="0.001"
                              {...field}
                              value={
                                Number.isNaN(field.value) ? '' : field.value
                              }
                              onChange={(event) =>
                                field.onChange(event.target.valueAsNumber)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`quantityProposals.${index}.evidenceNote`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Evidence note</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove proposal ${index + 1}`}
                      onClick={() => proposals.remove(index)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>

              {saveError ? <p role="alert">{saveError.message}</p> : null}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Pattern Set'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(retiring)}
        onOpenChange={(open) => {
          if (!open) setRetiring(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retire Pattern Set?</DialogTitle>
            <DialogDescription>
              Retire {retiring?.name}? Its identity, description, and proposals
              will be preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRetiring(null)}>
              Cancel
            </Button>
            <Button
              disabled={isChangingStatus}
              onClick={async () => {
                if (!retiring) return
                try {
                  await retirePatternSet(retiring.id)
                  setRetiring(null)
                } catch {
                  // Mutation error is rendered above the catalog.
                }
              }}
            >
              Retire Pattern Set
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
