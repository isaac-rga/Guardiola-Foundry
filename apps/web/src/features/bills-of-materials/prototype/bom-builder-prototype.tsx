// PROTOTYPE — throwaway UI, not production implementation.
// Two shared BOM Builder variants on the existing Bills of Materials route, switchable via ?variant=.
import {
  AlertTriangleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  CheckCircle2Icon,
  ChevronsUpDownIcon,
  CircleDollarSignIcon,
  CopyIcon,
  GripVerticalIcon,
  InfoIcon,
  Layers3Icon,
  PlusIcon,
  RotateCcwIcon,
  SaveIcon,
  SearchIcon,
  SparklesIcon,
  Trash2Icon,
} from 'lucide-react'
import { type ReactNode, useMemo, useRef, useState } from 'react'

import { StatusBadge } from '@/components/app/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  PrototypeSwitcher,
  type PrototypeVariant,
} from '@/features/bills-of-materials/prototype/prototype-switcher'

type BuilderScenario = 'create-template' | 'derive-implementation' | 'edit-implementation'

type PatternProposal = {
  quantity: number
  width: number
}

type PatternSet = {
  id: string
  name: string
  proposals: PatternProposal[]
  retired?: boolean
}

type MaterialOption = {
  id: string
  name: string
  sourceDetail: string
  sourceName: string
  sourceVendor: string
  unitCost: number | null
  width: number | null
  retired?: boolean
}

type BomLine = {
  id: string
  constructionPiece: string
  materialId: string | null
  materialQuantity: number | null
  patternSetId: string | null
  verified: boolean
}

type BomDraft = {
  description: string
  kind: 'template' | 'implementation'
  name: string
  origin: string | null
  product: string | null
  productVariant: string | null
  lines: BomLine[]
}

const materialOptions: MaterialOption[] = [
  {
    id: 'MAT-0142',
    name: 'Ivory Duchess Satin',
    sourceName: 'Duchess satin 150',
    sourceVendor: 'Textiles MX',
    sourceDetail: 'Vendor shade Ivory 02',
    width: 150,
    unitCost: 428.5,
  },
  {
    id: 'MAT-0218',
    name: 'Blush Soft Tulle',
    sourceName: 'Tul ilusión soft matte 300',
    sourceVendor: 'Casa Tules',
    sourceDetail: 'Vendor shade Blush 14',
    width: 300,
    unitCost: 118,
  },
  {
    id: 'MAT-0334',
    name: 'Champagne Horsehair',
    sourceName: 'Crin tubular champagne 120',
    sourceVendor: 'Vendor missing',
    sourceDetail: 'Preferred Source needs attention',
    width: 120,
    unitCost: null,
  },
  {
    id: 'MAT-0091',
    name: 'Silk Organza',
    sourceName: 'Organza de seda natural 140',
    sourceVendor: 'Silk House',
    sourceDetail: 'Vendor shade Natural · retained source',
    width: 140,
    unitCost: 305,
    retired: true,
  },
  {
    id: 'MAT-0048',
    name: 'Natural Silk Mikado',
    sourceName: 'Mikado de seda natural 140',
    sourceVendor: 'Silk House',
    sourceDetail: 'Vendor shade Natural 01',
    width: 140,
    unitCost: 612,
  },
  {
    id: 'MAT-0116',
    name: 'Ivory Stretch Crepe',
    sourceName: 'Crepe stretch bridal 150',
    sourceVendor: 'Textiles MX',
    sourceDetail: 'Vendor shade Ivory 07',
    width: 150,
    unitCost: 284,
  },
  {
    id: 'MAT-0175',
    name: 'Nude Power Mesh',
    sourceName: 'Power mesh fino 160',
    sourceVendor: 'Casa Tules',
    sourceDetail: 'Vendor shade Nude 03',
    width: 160,
    unitCost: 96,
  },
  {
    id: 'MAT-0251',
    name: 'Ivory Chantilly Lace',
    sourceName: 'Encaje Chantilly floral 135',
    sourceVendor: 'Dentelles Atelier',
    sourceDetail: 'Vendor shade Ivory',
    width: 135,
    unitCost: 735,
  },
  {
    id: 'MAT-0289',
    name: 'Champagne Beaded Tulle',
    sourceName: 'Tul bordado con pedrería 130',
    sourceVendor: 'Embroideries Co.',
    sourceDetail: 'Vendor shade Champagne 11',
    width: 130,
    unitCost: 890,
  },
  {
    id: 'MAT-0307',
    name: 'Soft White Organza',
    sourceName: 'Organza crisp soft white 145',
    sourceVendor: 'Silk House',
    sourceDetail: 'Vendor shade Soft White',
    width: 145,
    unitCost: 328,
  },
  {
    id: 'MAT-0362',
    name: 'Ivory Bridal Lining',
    sourceName: 'Forro bridal ligero 150',
    sourceVendor: 'Textiles MX',
    sourceDetail: 'Vendor shade Ivory 02',
    width: 150,
    unitCost: 82,
  },
  {
    id: 'MAT-0414',
    name: 'White Horsehair Braid',
    sourceName: 'Crin rígida para ruedo 10',
    sourceVendor: 'Trims Studio',
    sourceDetail: 'Vendor shade White',
    width: 10,
    unitCost: 44,
  },
]

const patternSets: PatternSet[] = [
  {
    id: 'PAT-001',
    name: 'Skirt — quarter circle floor length',
    proposals: [
      { width: 120, quantity: 5.8 },
      { width: 150, quantity: 4.9 },
      { width: 300, quantity: 3.2 },
    ],
  },
  {
    id: 'PAT-014',
    name: 'Chapel train — six panel',
    proposals: [
      { width: 120, quantity: 4.2 },
      { width: 150, quantity: 3.6 },
    ],
  },
  {
    id: 'PAT-022',
    name: 'Structured bodice — princess seam',
    proposals: [],
  },
  {
    id: 'PAT-008',
    name: 'Legacy skirt — showroom sample',
    proposals: [{ width: 150, quantity: 5.1 }],
    retired: true,
  },
  {
    id: 'PAT-031',
    name: 'Skirt — full circle floor length',
    proposals: [{ width: 150, quantity: 8.2 }],
  },
  {
    id: 'PAT-036',
    name: 'Skirt — gathered A-line',
    proposals: [{ width: 150, quantity: 5.4 }],
  },
  {
    id: 'PAT-041',
    name: 'Cathedral train — eight panel',
    proposals: [{ width: 150, quantity: 6.8 }],
  },
  {
    id: 'PAT-047',
    name: 'Structured bodice — corset base',
    proposals: [],
  },
  {
    id: 'PAT-052',
    name: 'Bodice overlay — bateau neckline',
    proposals: [{ width: 135, quantity: 1.4 }],
  },
  {
    id: 'PAT-059',
    name: 'Sleeve — fitted long',
    proposals: [{ width: 135, quantity: 1.6 }],
  },
  {
    id: 'PAT-063',
    name: 'Veil — chapel single layer',
    proposals: [{ width: 300, quantity: 3.1 }],
  },
  {
    id: 'PAT-071',
    name: 'Crinoline — three tier support',
    proposals: [{ width: 150, quantity: 7.5 }],
  },
]

const scenarioLabels: Record<BuilderScenario, string> = {
  'create-template': 'Create template',
  'derive-implementation': 'Create implementation from template',
  'edit-implementation': 'Edit implementation',
}

const initialDrafts: Record<BuilderScenario, BomDraft> = {
  'create-template': {
    kind: 'template',
    name: 'Jackie construction base',
    description: 'Reusable starting point for Jackie construction variants.',
    origin: null,
    product: 'Jackie',
    productVariant: null,
    lines: [],
  },
  'derive-implementation': {
    kind: 'implementation',
    name: 'Jackie — Blush — Chapel Train',
    description: 'Showroom construction using blush tulle and chapel train.',
    origin: 'Template · Jackie construction base',
    product: 'Jackie',
    productVariant: 'Jackie Showroom',
    lines: [
      {
        id: 'line-1',
        constructionPiece: 'Skirt outer layer',
        materialId: 'MAT-0218',
        materialQuantity: 3.4,
        patternSetId: 'PAT-001',
        verified: false,
      },
      {
        id: 'line-2',
        constructionPiece: 'Chapel train',
        materialId: 'MAT-0218',
        materialQuantity: null,
        patternSetId: 'PAT-014',
        verified: false,
      },
      {
        id: 'line-3',
        constructionPiece: 'Bodice structure',
        materialId: 'MAT-0334',
        materialQuantity: 1.2,
        patternSetId: 'PAT-022',
        verified: true,
      },
    ],
  },
  'edit-implementation': {
    kind: 'implementation',
    name: 'Jackie — Blush — Chapel Train',
    description: 'Production-ready construction for the Jackie showroom variant.',
    origin: 'Template · Jackie construction base',
    product: 'Jackie',
    productVariant: 'Jackie Showroom',
    lines: [
      {
        id: 'line-1',
        constructionPiece: 'Skirt outer layer',
        materialId: 'MAT-0218',
        materialQuantity: 3.4,
        patternSetId: 'PAT-001',
        verified: true,
      },
      {
        id: 'line-2',
        constructionPiece: 'Chapel train',
        materialId: 'MAT-0218',
        materialQuantity: 3.6,
        patternSetId: 'PAT-014',
        verified: false,
      },
      {
        id: 'line-3',
        constructionPiece: 'Hem structure',
        materialId: 'MAT-0334',
        materialQuantity: 1.2,
        patternSetId: null,
        verified: false,
      },
      {
        id: 'line-4',
        constructionPiece: 'Bodice overlay',
        materialId: 'MAT-0091',
        materialQuantity: 1.05,
        patternSetId: 'PAT-008',
        verified: true,
      },
    ],
  },
}

function cloneDraft(scenario: BuilderScenario) {
  return structuredClone(initialDrafts[scenario])
}

export function BomBuilderPrototype({
  onVariantChange,
  variant,
}: {
  onVariantChange: (variant: PrototypeVariant) => void
  variant: PrototypeVariant
}) {
  const [scenario, setScenario] = useState<BuilderScenario>('derive-implementation')
  const [draft, setDraft] = useState(() => cloneDraft('derive-implementation'))
  const [lastRemoved, setLastRemoved] = useState<{ index: number; line: BomLine } | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [activeLineId, setActiveLineId] = useState<string | null>('line-1')

  const actions = useMemo(
    () => ({
      addLine() {
        const id = `line-${Date.now()}`
        setDraft((current) => ({
          ...current,
          lines: [
            ...current.lines,
            {
              id,
              constructionPiece: '',
              materialId: null,
              materialQuantity: null,
              patternSetId: null,
              verified: false,
            },
          ],
        }))
        setActiveLineId(id)
        setSaveMessage(null)
      },
      duplicateLine(lineId: string) {
        setDraft((current) => {
          const sourceIndex = current.lines.findIndex((line) => line.id === lineId)
          if (sourceIndex < 0) return current
          const source = current.lines[sourceIndex]
          const duplicate = { ...source, id: `line-${Date.now()}`, verified: false }
          const lines = [...current.lines]
          lines.splice(sourceIndex + 1, 0, duplicate)
          setActiveLineId(duplicate.id)
          return { ...current, lines }
        })
        setSaveMessage(null)
      },
      moveLine(lineId: string, offset: number) {
        setDraft((current) => {
          const from = current.lines.findIndex((line) => line.id === lineId)
          const to = from + offset
          if (from < 0 || to < 0 || to >= current.lines.length) return current
          const lines = [...current.lines]
          const [line] = lines.splice(from, 1)
          lines.splice(to, 0, line)
          return { ...current, lines }
        })
        setSaveMessage(null)
      },
      reorderLine(lineId: string, targetLineId: string, position: 'before' | 'after') {
        setDraft((current) => {
          if (lineId === targetLineId) return current
          const from = current.lines.findIndex((line) => line.id === lineId)
          if (from < 0) return current
          const lines = [...current.lines]
          const [line] = lines.splice(from, 1)
          const target = lines.findIndex((candidate) => candidate.id === targetLineId)
          if (target < 0) return current
          lines.splice(target + (position === 'after' ? 1 : 0), 0, line)
          return { ...current, lines }
        })
        setSaveMessage(null)
      },
      removeLine(lineId: string) {
        setDraft((current) => {
          const index = current.lines.findIndex((line) => line.id === lineId)
          if (index < 0) return current
          setLastRemoved({ index, line: current.lines[index] })
          const lines = current.lines.filter((line) => line.id !== lineId)
          setActiveLineId(lines[Math.min(index, lines.length - 1)]?.id ?? null)
          return { ...current, lines }
        })
        setSaveMessage(null)
      },
      restoreLine() {
        if (!lastRemoved) return
        setDraft((current) => {
          const lines = [...current.lines]
          lines.splice(lastRemoved.index, 0, lastRemoved.line)
          return { ...current, lines }
        })
        setActiveLineId(lastRemoved.line.id)
        setLastRemoved(null)
      },
      updateDraft(patch: Partial<BomDraft>) {
        setDraft((current) => ({ ...current, ...patch }))
        setSaveMessage(null)
      },
      updateLine(lineId: string, patch: Partial<BomLine>) {
        setDraft((current) => ({
          ...current,
          lines: current.lines.map((line) =>
            line.id === lineId
              ? {
                  ...line,
                  ...patch,
                  verified:
                    'verified' in patch && Object.keys(patch).length === 1
                      ? Boolean(patch.verified)
                      : false,
                }
              : line,
          ),
        }))
        setSaveMessage(null)
      },
    }),
    [lastRemoved],
  )

  const changeScenario = (nextScenario: BuilderScenario) => {
    const nextDraft = cloneDraft(nextScenario)
    setScenario(nextScenario)
    setDraft(nextDraft)
    setActiveLineId(nextDraft.lines[0]?.id ?? null)
    setLastRemoved(null)
    setSaveMessage(null)
  }

  const summary = calculateSummary(draft)
  const sharedProps = {
    actions,
    activeLineId,
    draft,
    lastRemoved,
    onActiveLineChange: setActiveLineId,
    onSave: () => setSaveMessage('Prototype only — the full BOM would save atomically.'),
    saveMessage,
    summary,
  }

  return (
    <div className="space-y-5 pb-24">
      <PrototypeContext
        scenario={scenario}
        onScenarioChange={changeScenario}
      />

      {variant === 'A' ? <VariantA {...sharedProps} /> : null}
      {variant === 'B' ? <VariantB {...sharedProps} /> : null}

      <PrototypeSwitcher
        current={variant}
        onChange={onVariantChange}
        state={{ scenario, draft, summary, lastRemoved }}
      />
    </div>
  )
}

type VariantProps = {
  actions: {
    addLine: () => void
    duplicateLine: (lineId: string) => void
    moveLine: (lineId: string, offset: number) => void
    reorderLine: (lineId: string, targetLineId: string, position: 'before' | 'after') => void
    removeLine: (lineId: string) => void
    restoreLine: () => void
    updateDraft: (patch: Partial<BomDraft>) => void
    updateLine: (lineId: string, patch: Partial<BomLine>) => void
  }
  activeLineId: string | null
  draft: BomDraft
  lastRemoved: { index: number; line: BomLine } | null
  onActiveLineChange: (lineId: string) => void
  onSave: () => void
  saveMessage: string | null
  summary: ReturnType<typeof calculateSummary>
}

function PrototypeContext({
  onScenarioChange,
  scenario,
}: {
  onScenarioChange: (scenario: BuilderScenario) => void
  scenario: BuilderScenario
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-amber-500/40 bg-amber-50/70 px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <SparklesIcon className="mt-0.5 size-4 shrink-0 text-amber-700" />
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-amber-900 uppercase">
            Throwaway prototype · no data is saved
          </p>
          <p className="mt-1 text-xs text-amber-800/80">
            Compare the two ways to organize the same Builder. Use the scenario to test create and update.
          </p>
        </div>
      </div>
      <Select value={scenario} onValueChange={(value) => onScenarioChange(value as BuilderScenario)}>
        <SelectTrigger className="w-full bg-white md:w-72" aria-label="Prototype scenario">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(scenarioLabels) as BuilderScenario[]).map((option) => (
            <SelectItem key={option} value={option}>
              {scenarioLabels[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function VariantA(props: VariantProps) {
  const { actions, draft, lastRemoved, onSave, saveMessage, summary } = props

  return (
    <div className="space-y-5">
      <BuilderIdentityHeader
        draft={draft}
        onChange={actions.updateDraft}
        onSave={onSave}
        saveMessage={saveMessage}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <Card className="gap-0 overflow-hidden py-0">
          <div className="flex flex-col gap-3 border-b border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-medium">Construction composition</h2>
              <p className="mt-1 text-xs text-muted-foreground">Edit every line in place. Order is the construction sequence.</p>
            </div>
            <Button onClick={actions.addLine} size="sm" type="button">
              <PlusIcon /> Add line
            </Button>
          </div>

          {draft.lines.length === 0 ? (
            <EmptyLines onAdd={actions.addLine} />
          ) : (
            <div className="divide-y divide-border/60">
              {draft.lines.map((line, index) => (
                <InlineLine
                  actions={actions}
                  index={index}
                  key={line.id}
                  line={line}
                  lineCount={draft.lines.length}
                />
              ))}
            </div>
          )}

          {lastRemoved ? <UndoBar name={lastRemoved.line.constructionPiece || 'Untitled line'} onUndo={actions.restoreLine} /> : null}
        </Card>

        <SummaryRail draft={draft} summary={summary} />
      </div>
    </div>
  )
}

function VariantB(props: VariantProps) {
  const {
    actions,
    activeLineId,
    draft,
    lastRemoved,
    onActiveLineChange,
    onSave,
    saveMessage,
    summary,
  } = props
  const activeLine = draft.lines.find((line) => line.id === activeLineId) ?? draft.lines[0]
  const dragHandleLineId = useRef<string | null>(null)
  const [draggedLineId, setDraggedLineId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ lineId: string; position: 'before' | 'after' } | null>(null)
  const [reorderMessage, setReorderMessage] = useState('')

  return (
    <div className="space-y-5">
      <BuilderIdentityHeader
        compact
        draft={draft}
        onChange={actions.updateDraft}
        onSave={onSave}
        saveMessage={saveMessage}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="grid min-h-[43rem] overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-[0_18px_48px_rgba(72,53,40,0.06)] lg:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className="border-b border-border/70 bg-muted/20 p-4 lg:border-r lg:border-b-0">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Construction board</p>
                <p className="mt-1 text-xs text-muted-foreground">{draft.lines.length} lines</p>
              </div>
              <Button aria-label="Add BOM line" onClick={actions.addLine} size="icon-sm" type="button">
                <PlusIcon />
              </Button>
            </div>
            <ol className="space-y-2">
              {draft.lines.map((line, index) => {
                const state = getLineState(line)
                const lineName = line.constructionPiece || 'Untitled piece'
                return (
                  <li
                    className="relative"
                    key={line.id}
                    onDragOver={(event) => {
                      if (!draggedLineId || draggedLineId === line.id) return
                      event.preventDefault()
                      event.dataTransfer.dropEffect = 'move'
                      const bounds = event.currentTarget.getBoundingClientRect()
                      const position = event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after'
                      setDropTarget({ lineId: line.id, position })
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      const sourceLineId = draggedLineId ?? dragHandleLineId.current
                      if (sourceLineId && sourceLineId !== line.id) {
                        const bounds = event.currentTarget.getBoundingClientRect()
                        const position = event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after'
                        actions.reorderLine(sourceLineId, line.id, position)
                        setReorderMessage(`Moved line ${position} ${lineName}.`)
                      }
                      dragHandleLineId.current = null
                      setDraggedLineId(null)
                      setDropTarget(null)
                    }}
                  >
                    {dropTarget?.lineId === line.id && draggedLineId !== line.id ? (
                      <span
                        className={cn(
                          'pointer-events-none absolute right-1 left-1 z-10 h-0.5 rounded-full bg-primary',
                          dropTarget.position === 'before' ? '-top-1' : '-bottom-1',
                        )}
                      />
                    ) : null}
                    <div
                      className={cn(
                        'flex w-full items-stretch rounded-xl border text-left transition-[border-color,background-color,opacity,box-shadow]',
                        activeLine?.id === line.id
                          ? 'border-primary/35 bg-primary/8'
                          : 'border-transparent bg-card hover:border-border',
                        draggedLineId === line.id ? 'opacity-45 shadow-sm' : '',
                      )}
                      draggable
                      onDragEnd={() => {
                        dragHandleLineId.current = null
                        setDraggedLineId(null)
                        setDropTarget(null)
                      }}
                      onDragStart={(event) => {
                        if (dragHandleLineId.current !== line.id) {
                          event.preventDefault()
                          return
                        }
                        event.dataTransfer.effectAllowed = 'move'
                        event.dataTransfer.setData('text/plain', line.id)
                        setDraggedLineId(line.id)
                        onActiveLineChange(line.id)
                      }}
                    >
                      <button
                        aria-label={`Reorder ${lineName}. Use Arrow Up or Arrow Down to move it.`}
                        className="flex cursor-grab items-center rounded-l-xl px-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:outline-none active:cursor-grabbing"
                        data-drag-handle
                        onClick={(event) => event.stopPropagation()}
                        onMouseDown={() => {
                          dragHandleLineId.current = line.id
                        }}
                        onMouseUp={() => {
                          dragHandleLineId.current = null
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
                          event.preventDefault()
                          event.stopPropagation()
                          const offset = event.key === 'ArrowUp' ? -1 : 1
                          const nextIndex = index + offset
                          if (nextIndex < 0 || nextIndex >= draft.lines.length) return
                          actions.moveLine(line.id, offset)
                          setReorderMessage(`Moved ${lineName} to position ${nextIndex + 1}.`)
                        }}
                        title="Drag to reorder · Arrow keys also move this line"
                        type="button"
                      >
                        <GripVerticalIcon className="size-4" />
                      </button>
                      <button
                        aria-current={activeLine?.id === line.id ? 'true' : undefined}
                        className="min-w-0 flex-1 px-1.5 py-3 pr-3 text-left focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:outline-none"
                        onClick={() => onActiveLineChange(line.id)}
                        type="button"
                      >
                        <div className="flex gap-2">
                          <span className="mt-0.5 text-xs text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{lineName}</p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">{materialFor(line)?.name ?? 'Material missing'}</p>
                          </div>
                          <span className={cn('mt-1 size-2 rounded-full', state.attention.length ? 'bg-amber-500' : state.complete ? 'bg-emerald-500' : 'bg-stone-300')} />
                        </div>
                      </button>
                    </div>
                  </li>
                )
              })}
            </ol>
            <p className="sr-only" role="status">{reorderMessage}</p>
            {draft.lines.length === 0 ? <EmptyLines onAdd={actions.addLine} compact /> : null}
            {lastRemoved ? <UndoBar name={lastRemoved.line.constructionPiece || 'Untitled line'} onUndo={actions.restoreLine} compact /> : null}
          </aside>

          <main className="min-w-0 p-5 xl:p-7">
            {activeLine ? (
              <>
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Selected construction line</p>
                    <h2 className="mt-2">
                      <Input
                        aria-label="Construction piece"
                        className="-ml-2 h-auto w-[calc(100%+1rem)] rounded-none border-0 border-b border-border/70 bg-transparent px-2 py-1 font-editorial text-3xl leading-tight text-foreground shadow-none transition-[border-color,background-color,box-shadow,border-radius] placeholder:text-muted-foreground/45 hover:rounded-md hover:border hover:border-input hover:bg-background/70 focus-visible:rounded-md focus-visible:border-ring focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/20 md:text-3xl"
                        onChange={(event) => actions.updateLine(activeLine.id, { constructionPiece: event.target.value })}
                        placeholder="Untitled construction piece"
                        value={activeLine.constructionPiece}
                      />
                    </h2>
                  </div>
                  <div className="flex gap-1">
                    <Button aria-label="Duplicate line" onClick={() => actions.duplicateLine(activeLine.id)} size="icon-sm" type="button" variant="outline"><CopyIcon /></Button>
                    <Button aria-label="Remove line" onClick={() => actions.removeLine(activeLine.id)} size="icon-sm" type="button" variant="ghost"><Trash2Icon /></Button>
                  </div>
                </div>
                <LineEditor line={activeLine} onChange={(patch) => actions.updateLine(activeLine.id, patch)} />
              </>
            ) : (
              <EmptyLines onAdd={actions.addLine} />
            )}
          </main>
        </div>

        <SummaryRail draft={draft} summary={summary} />
      </div>
    </div>
  )
}

function BuilderIdentityHeader({
  compact = false,
  draft,
  onChange,
  onSave,
  saveMessage,
}: {
  compact?: boolean
  draft: BomDraft
  onChange: (patch: Partial<BomDraft>) => void
  onSave: () => void
  saveMessage: string | null
}) {
  const titleLabel = 'BOM Name'

  return (
    <section
      className={cn(
        'rounded-[1.75rem] border border-border/70 bg-card/85 px-6 shadow-[0_18px_48px_rgba(72,53,40,0.06)] md:px-8',
        compact ? 'py-5 md:py-6' : 'py-6 md:py-8',
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Label
              className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase"
              htmlFor="bom-title"
            >
              {titleLabel}
            </Label>
            <TooltipProvider delayDuration={250}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label="How to choose a BOM name"
                    className="rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:outline-none"
                    type="button"
                  >
                    <InfoIcon className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-72 leading-5" side="right" sideOffset={6}>
                  Name the construction by its distinguishing attributes, such as design, color, and train or silhouette. Example: Jackie — Blush — Chapel Train.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <h1 className="mt-2">
            <Input
              aria-label={titleLabel}
              className="-ml-2 h-auto w-[calc(100%+1rem)] rounded-none border-0 border-b border-border/70 bg-transparent px-2 py-1 font-editorial text-4xl leading-none text-foreground shadow-none transition-[border-color,background-color,box-shadow,border-radius] placeholder:text-muted-foreground/45 hover:rounded-md hover:border hover:border-input hover:bg-background/70 focus-visible:rounded-md focus-visible:border-ring focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/20 sm:text-5xl md:text-5xl"
              id="bom-title"
              onChange={(event) => onChange({ name: event.target.value })}
              placeholder="Untitled Bill of Materials"
              value={draft.name}
            />
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            {draft.kind === 'template' ? 'BOM Template' : 'BOM Implementation'} ·{' '}
            {draft.productVariant ?? draft.product ?? 'No Product association'}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Button onClick={onSave} type="button"><SaveIcon /> Save BOM</Button>
          {saveMessage ? <p className="max-w-72 text-right text-xs text-emerald-700" role="status">{saveMessage}</p> : null}
        </div>
      </div>

      <div className="mt-6">
        <Field label="Description">
          <Input value={draft.description} onChange={(event) => onChange({ description: event.target.value })} />
        </Field>
      </div>
    </section>
  )
}

function InlineLine({
  actions,
  index,
  line,
  lineCount,
}: {
  actions: VariantProps['actions']
  index: number
  line: BomLine
  lineCount: number
}) {
  return (
    <section className="grid gap-3 px-4 py-4 xl:grid-cols-[2rem_minmax(10rem,1.1fr)_minmax(10rem,1.3fr)_minmax(10rem,1.3fr)_8rem_auto] xl:items-start">
      <div className="flex items-center gap-1 pt-2 text-xs text-muted-foreground">
        <GripVerticalIcon className="size-4" /> {index + 1}
      </div>
      <Field label="Construction piece"><Input placeholder="e.g. Chapel train" value={line.constructionPiece} onChange={(event) => actions.updateLine(line.id, { constructionPiece: event.target.value })} /></Field>
      <MaterialSelect line={line} onChange={(patch) => actions.updateLine(line.id, patch)} />
      <PatternSelect line={line} onChange={(patch) => actions.updateLine(line.id, patch)} />
      <QuantityField line={line} onChange={(patch) => actions.updateLine(line.id, patch)} />
      <div className="flex items-center justify-end gap-1 pt-6">
        <Button aria-label={`Move line ${index + 1} up`} disabled={index === 0} onClick={() => actions.moveLine(line.id, -1)} size="icon-xs" type="button" variant="ghost"><ArrowUpIcon /></Button>
        <Button aria-label={`Move line ${index + 1} down`} disabled={index === lineCount - 1} onClick={() => actions.moveLine(line.id, 1)} size="icon-xs" type="button" variant="ghost"><ArrowDownIcon /></Button>
        <Button aria-label={`Repeat line ${index + 1}`} onClick={() => actions.duplicateLine(line.id)} size="icon-xs" type="button" variant="ghost"><CopyIcon /></Button>
        <Button aria-label={`Remove line ${index + 1}`} onClick={() => actions.removeLine(line.id)} size="icon-xs" type="button" variant="ghost"><Trash2Icon /></Button>
      </div>
      <div className="xl:col-start-2 xl:col-span-5"><LineFooter line={line} onChange={(patch) => actions.updateLine(line.id, patch)} /></div>
    </section>
  )
}

function LineEditor({ line, onChange }: { line: BomLine; onChange: (patch: Partial<BomLine>) => void }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <MaterialSelect line={line} onChange={onChange} />
      <PatternSelect line={line} onChange={onChange} />
      <QuantityField line={line} onChange={onChange} />
      <VerificationField line={line} onChange={onChange} />
      <div className="md:col-span-2"><LineFooter line={line} onChange={onChange} showVerification={false} /></div>
    </div>
  )
}

function MaterialSelect({ line, onChange }: { line: BomLine; onChange: (patch: Partial<BomLine>) => void }) {
  const material = materialFor(line)

  return (
    <Field label="Material">
      <CatalogPicker
        description="Search the material catalog by name, code, source, or fabric width."
        emptyLabel="No materials match this search."
        items={materialOptions
          .filter((option) => !option.retired || option.id === line.materialId)
          .map((option) => ({
            id: option.id,
            name: option.name,
            idWithName: true,
            searchText: `${option.id} ${option.name} ${option.sourceName} ${option.sourceVendor} ${option.sourceDetail} ${option.width ?? ''}`,
            metadata: (
              <>
                <span>{option.width ? `${option.width} cm` : 'Width unavailable'}</span>
                <span aria-hidden="true">·</span>
                <span className="truncate">Source: {option.sourceName}</span>
                <span aria-hidden="true">·</span>
                <span className="truncate">Vendor: {option.sourceVendor}</span>
                <span aria-hidden="true">·</span>
                <span className="truncate">{option.sourceDetail}</span>
              </>
            ),
            unavailable: option.retired,
          }))}
        label="Material"
        noneLabel="No material"
        onSelect={(value) => onChange({ materialId: value, materialQuantity: null })}
        searchPlaceholder="Search materials…"
        selectedId={line.materialId}
        selectedName={material?.name ?? null}
      />
    </Field>
  )
}

function PatternSelect({ line, onChange }: { line: BomLine; onChange: (patch: Partial<BomLine>) => void }) {
  const pattern = patternFor(line)

  return (
    <Field
      action={
        pattern && pattern.proposals.length > 0 ? (
          <PatternProposalDialog line={line} onChange={onChange} pattern={pattern} />
        ) : undefined
      }
      label="Pattern Set (optional)"
    >
      <CatalogPicker
        description="Search the Pattern Set catalog by name or code."
        emptyLabel="No Pattern Sets match this search."
        items={patternSets
          .filter((option) => !option.retired || option.id === line.patternSetId)
          .map((option) => ({
            id: option.id,
            name: option.name,
            searchText: `${option.id} ${option.name}`,
            metadata: (
              <>
                <span>{option.id}</span>
                <span aria-hidden="true">·</span>
                <span>{option.proposals.length} {option.proposals.length === 1 ? 'proposal' : 'proposals'}</span>
              </>
            ),
            unavailable: option.retired,
          }))}
        label="Pattern Set"
        noneLabel="No Pattern Set"
        onSelect={(value) => onChange({ patternSetId: value })}
        searchPlaceholder="Search Pattern Sets…"
        selectedId={line.patternSetId}
        selectedName={pattern?.name ?? null}
      />
    </Field>
  )
}

type CatalogPickerItem = {
  id: string
  idWithName?: boolean
  metadata: ReactNode
  name: string
  searchText: string
  unavailable?: boolean
}

function CatalogPicker({
  description,
  emptyLabel,
  items,
  label,
  noneLabel,
  onSelect,
  searchPlaceholder,
  selectedId,
  selectedName,
}: {
  description: string
  emptyLabel: string
  items: CatalogPickerItem[]
  label: string
  noneLabel: string
  onSelect: (id: string | null) => void
  searchPlaceholder: string
  selectedId: string | null
  selectedName: string | null
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const normalizedQuery = normalizeSearch(query)
  const matches = normalizedQuery
    ? items.filter((item) => normalizeSearch(item.searchText).includes(normalizedQuery))
    : items

  const choose = (id: string | null) => {
    onSelect(id)
    setOpen(false)
    setQuery('')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setQuery('')
      }}
    >
      <DialogTrigger asChild>
        <Button
          aria-expanded={open}
          aria-label={`Choose ${label}`}
          className="h-10 w-full justify-between px-3 font-normal"
          role="combobox"
          type="button"
          variant="outline"
        >
          <span className={cn('truncate', selectedName ? 'text-foreground' : 'text-muted-foreground')}>
            {selectedName ?? `Choose ${label}`}
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-4 p-0 sm:max-w-2xl">
        <DialogHeader className="px-6 pt-6 pr-14">
          <DialogTitle>Choose {label}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="relative px-6">
          <SearchIcon className="pointer-events-none absolute top-3 left-9 size-4 text-muted-foreground" />
          <Input
            aria-label={`Search ${label}`}
            autoFocus
            className="pl-10"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            value={query}
          />
        </div>

        <div className="border-y border-border/70">
          <div className="flex items-center justify-between px-6 py-2 text-xs text-muted-foreground">
            <span>{matches.length} {matches.length === 1 ? 'result' : 'results'}</span>
            <span>Search narrows as you type</span>
          </div>
          <div className="max-h-[23rem] overflow-y-auto px-3 pb-3">
            {!normalizedQuery ? (
              <button
                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:outline-none"
                onClick={() => choose(null)}
                type="button"
              >
                <span className="text-sm text-muted-foreground">{noneLabel}</span>
                {!selectedId ? <CheckIcon className="size-4 text-primary" /> : null}
              </button>
            ) : null}

            {matches.map((item) => (
              <button
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:outline-none',
                  item.id === selectedId ? 'bg-primary/7' : '',
                )}
                disabled={item.unavailable && item.id !== selectedId}
                key={item.id}
                onClick={() => choose(item.id)}
                type="button"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{item.name}</span>
                    {item.idWithName ? (
                      <span className="shrink-0 text-xs font-normal text-muted-foreground">{item.id}</span>
                    ) : null}
                    {item.unavailable ? <Badge variant="secondary">Unavailable</Badge> : null}
                  </div>
                  <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                    {item.metadata}
                  </div>
                </div>
                <CheckIcon className={cn('mt-1 size-4 shrink-0 text-primary', item.id === selectedId ? 'opacity-100' : 'opacity-0')} />
              </button>
            ))}

            {matches.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <SearchIcon className="mx-auto size-5 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">{emptyLabel}</p>
                <p className="mt-1 text-xs text-muted-foreground">Try a different name, code, or attribute.</p>
              </div>
            ) : null}
          </div>
        </div>

        <p className="px-6 pb-6 text-xs text-muted-foreground">
          Prototype catalog · {items.length} available options in this scenario.
        </p>
      </DialogContent>
    </Dialog>
  )
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim()
}

function QuantityField({ line, onChange }: { line: BomLine; onChange: (patch: Partial<BomLine>) => void }) {
  return (
    <Field label="Final meters">
      <div className="relative"><Input className="pr-7" disabled={!line.materialId} min="0" step="0.001" type="number" value={line.materialQuantity ?? ''} onChange={(event) => onChange({ materialQuantity: event.target.value === '' ? null : Number(event.target.value) })} /><span className="absolute top-2.5 right-2 text-xs text-muted-foreground">m</span></div>
    </Field>
  )
}

function VerificationField({ line, onChange }: { line: BomLine; onChange: (patch: Partial<BomLine>) => void }) {
  return (
    <Field label="Verification">
      <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-input/90 bg-card px-3 text-sm font-medium transition-[color,box-shadow,border-color] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30">
        <Checkbox checked={line.verified} onCheckedChange={(checked) => onChange({ verified: checked === true })} />
        Manually verified
      </label>
    </Field>
  )
}

function LineFooter({
  line,
  onChange,
  showVerification = true,
}: {
  line: BomLine
  onChange: (patch: Partial<BomLine>) => void
  showVerification?: boolean
}) {
  const state = getLineState(line)
  const material = materialFor(line)
  const projection = lineCost(line)

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-muted/25 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={state.complete ? 'Complete' : 'Incomplete'} tone={state.complete ? 'success' : 'muted'} />
        {state.attention.map((attention) => <StatusBadge key={attention} label={attention} tone="warning" />)}
        {material ? <span className="text-xs text-muted-foreground">{material.width ? `${material.width} cm width` : 'Width unavailable'} · {material.sourceName} · {material.sourceVendor} · {material.sourceDetail}</span> : null}
        {projection !== null ? <span className="text-xs font-medium">{formatCurrency(projection)}</span> : null}
      </div>
      {showVerification ? (
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
          <Checkbox checked={line.verified} onCheckedChange={(checked) => onChange({ verified: checked === true })} />
          Manually verified
        </label>
      ) : null}
    </div>
  )
}

function PatternProposalDialog({
  line,
  onChange,
  pattern,
}: {
  line: BomLine
  onChange: (patch: Partial<BomLine>) => void
  pattern: PatternSet
}) {
  const material = materialFor(line)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="xs" type="button" variant="link">
          <SparklesIcon />
          {pattern.proposals.length} {pattern.proposals.length === 1 ? 'proposal' : 'proposals'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pattern proposals</DialogTitle>
          <DialogDescription>
            {pattern.name}. Compare the assumed widths and copy one suggestion into Final meters.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          {pattern.proposals.map((proposal) => (
            <div
              className={cn(
                'rounded-xl border p-4',
                material?.width === proposal.width
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border/70 bg-card',
              )}
              key={proposal.width}
            >
              <div className="flex min-h-6 items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  Assumes {proposal.width} cm
                </span>
                {material?.width === proposal.width ? (
                  <Badge variant="secondary">Current width</Badge>
                ) : null}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <strong className="font-editorial text-3xl">{proposal.quantity} m</strong>
                <DialogClose asChild>
                  <Button
                    disabled={!line.materialId}
                    onClick={() => onChange({ materialQuantity: proposal.quantity })}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Use quantity
                  </Button>
                </DialogClose>
              </div>
            </div>
          ))}
        </div>

        {pattern.retired ? (
          <p className="flex gap-2 text-xs text-amber-800">
            <AlertTriangleIcon className="size-3.5 shrink-0" />
            Retired Pattern Set retained on this line.
          </p>
        ) : null}
        <p className="text-xs leading-5 text-muted-foreground">
          Suggestions are guidance only. The BOM saves only the Pattern Set and final quantity.
          {!line.materialId ? ' Select a Material before using a proposed quantity.' : ''}
        </p>
      </DialogContent>
    </Dialog>
  )
}

function SummaryRail({ draft, summary }: { draft: BomDraft; summary: ReturnType<typeof calculateSummary> }) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
      <Card>
        <CardHeader><CardTitle>Whole BOM</CardTitle></CardHeader>
        <CardContent><CompactSummary draft={draft} summary={summary} /></CardContent>
      </Card>
      <Card className="gap-3 border-primary/20 bg-primary/5">
        <CardContent>
          <div className="flex items-start gap-3"><InfoIcon className="mt-0.5 size-4 shrink-0 text-primary" /><p className="text-xs leading-5 text-muted-foreground">Incomplete, unverified, or attention-bearing lines do not block saving. They stay visible for the team to resolve.</p></div>
        </CardContent>
      </Card>
    </aside>
  )
}

function CompactSummary({ draft, summary }: { draft: BomDraft; summary: ReturnType<typeof calculateSummary> }) {
  return (
    <div className="space-y-4">
      <SummaryRow icon={Layers3Icon} label="Construction lines" value={String(draft.lines.length)} />
      <SummaryRow icon={CheckCircle2Icon} label="Complete / verified" value={`${summary.completeCount} / ${summary.verifiedCount}`} />
      <SummaryRow icon={AlertTriangleIcon} label="Need attention" value={String(summary.attentionCount)} warning={summary.attentionCount > 0} />
      <SummaryRow icon={CircleDollarSignIcon} label="Material projection" value={summary.costLabel} />
      {summary.excludedCostCount > 0 ? <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{summary.excludedCostCount} line(s) excluded from projection.</p> : null}
      {draft.origin ? <div className="border-t border-border/70 pt-4"><p className="text-xs text-muted-foreground">Origin</p><p className="mt-1 text-xs font-medium">{draft.origin}</p><p className="mt-1 text-[11px] leading-4 text-muted-foreground">Lineage is informational; later edits do not synchronize.</p></div> : null}
    </div>
  )
}

function SummaryRow({ icon: Icon, label, value, warning = false }: { icon: typeof Layers3Icon; label: string; value: string; warning?: boolean }) {
  return <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className={cn('size-4', warning ? 'text-amber-600' : '')} />{label}</div><span className={cn('text-sm font-medium', warning ? 'text-amber-700' : '')}>{value}</span></div>
}

function EmptyLines({ compact = false, onAdd }: { compact?: boolean; onAdd: () => void }) {
  return (
    <div className={cn('text-center', compact ? 'px-2 py-8' : 'px-6 py-14')}>
      <Layers3Icon className="mx-auto size-7 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium">No construction lines yet</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">Start with a Construction Piece. Material and quantity can remain incomplete while the team works.</p>
      <Button className="mt-4" onClick={onAdd} size="sm" type="button"><PlusIcon /> Add first line</Button>
    </div>
  )
}

function UndoBar({ compact = false, name, onUndo }: { compact?: boolean; name: string; onUndo: () => void }) {
  return <div className={cn('flex items-center justify-between gap-3 bg-stone-900 text-stone-100', compact ? 'mt-4 rounded-xl px-3 py-2' : 'px-5 py-3')}><p className="truncate text-xs">Removed “{name}”</p><Button className="text-stone-100 hover:bg-stone-800 hover:text-white" onClick={onUndo} size="xs" type="button" variant="ghost"><RotateCcwIcon /> Undo</Button></div>
}

function Field({
  action,
  children,
  label,
}: {
  action?: React.ReactNode
  children: React.ReactNode
  label: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex min-h-6 items-center justify-between gap-2">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {action}
      </div>
      {children}
    </div>
  )
}

function materialFor(line: BomLine) {
  return materialOptions.find((material) => material.id === line.materialId) ?? null
}

function patternFor(line: BomLine) {
  return patternSets.find((pattern) => pattern.id === line.patternSetId) ?? null
}

function lineCost(line: BomLine) {
  const unitCost = materialFor(line)?.unitCost
  if (line.materialQuantity === null || unitCost === null || unitCost === undefined) return null
  return Math.round(line.materialQuantity * unitCost * 100) / 100
}

function getLineState(line: BomLine) {
  const material = materialFor(line)
  const pattern = patternFor(line)
  const attention: string[] = []
  if (material?.retired) attention.push('Material needs attention')
  if (material && material.unitCost === null) attention.push('Source needs attention')
  if (pattern?.retired) attention.push('Pattern needs attention')
  return {
    attention,
    complete: Boolean(line.constructionPiece.trim() && line.materialId && line.materialQuantity !== null),
  }
}

function calculateSummary(draft: BomDraft) {
  const costs = draft.lines.map(lineCost)
  const calculatedCosts = costs.filter((cost): cost is number => cost !== null)
  const excludedCostCount = costs.length - calculatedCosts.length
  const total = calculatedCosts.reduce((sum, cost) => sum + cost, 0)
  const costLabel = calculatedCosts.length === 0
    ? 'Unavailable'
    : `${formatCurrency(total)}${excludedCostCount ? ' · partial' : ''}`

  return {
    attentionCount: draft.lines.filter((line) => getLineState(line).attention.length > 0).length,
    completeCount: draft.lines.filter((line) => getLineState(line).complete).length,
    costLabel,
    excludedCostCount,
    verifiedCount: draft.lines.filter((line) => line.verified).length,
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)
}
