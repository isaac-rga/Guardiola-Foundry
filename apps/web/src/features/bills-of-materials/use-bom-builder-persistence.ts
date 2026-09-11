import { useRef } from 'react'
import { useBlocker } from '@tanstack/react-router'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import type {
  BillOfMaterialsDetail,
  CreateBillOfMaterialsRequest,
} from '@guardiola-foundry/shared-types'
import { createBillOfMaterialsRequestSchema } from '@guardiola-foundry/shared-validation'

import {
  useApplyBillOfMaterialsTemplate,
  useCreateBillOfMaterials,
  useUpdateBillOfMaterials,
} from './api/bills-of-materials'
import { BillOfMaterialsRequestError } from './api/endpoints'

type BuilderFormValues = z.input<typeof createBillOfMaterialsRequestSchema>

export function useBomBuilderPersistence({
  applicationTemplateId,
  existing,
  fields,
  form,
  onSaved,
  token,
}: {
  applicationTemplateId?: string
  existing?: BillOfMaterialsDetail
  fields: Array<{ id: string }>
  form: UseFormReturn<BuilderFormValues, unknown, CreateBillOfMaterialsRequest>
  onSaved: () => void
  token: string
}) {
  const createMutation = useCreateBillOfMaterials(token)
  const applyMutation = useApplyBillOfMaterialsTemplate(
    token,
    applicationTemplateId ?? '',
  )
  const updateMutation = useUpdateBillOfMaterials(token, existing?.id ?? '')
  const allowNavigation = useRef(false)
  const persistedLineIds = useRef(new Map<string, string>())

  if (existing && persistedLineIds.current.size === 0) {
    fields.forEach((field, index) => {
      const persistedId = existing.lines[index]?.id
      if (persistedId) persistedLineIds.current.set(field.id, persistedId)
    })
  }

  const blocker = useBlocker({
    shouldBlockFn: () => form.formState.isDirty && !allowNavigation.current,
    withResolver: true,
    enableBeforeUnload: form.formState.isDirty,
  })

  const submit = form.handleSubmit(async (values) => {
    try {
      if (applicationTemplateId && values.kind === 'implementation') {
        await applyMutation.applyTemplate({
          name: values.name,
          productVariantId: values.productVariantId,
        })
      } else if (existing) {
        await updateMutation.updateBillOfMaterials({
          updatedAt: existing.updatedAt,
          name: values.name,
          description: values.description,
          lines: values.lines.map((line, index) => ({
            id: persistedLineIds.current.get(fields[index].id) ?? null,
            ...line,
          })),
        })
      } else {
        await createMutation.createBillOfMaterials(values)
      }
      form.reset(values)
      allowNavigation.current = true
      onSaved()
    } catch (error) {
      if (error instanceof BillOfMaterialsRequestError) {
        applyServerFieldErrors(form, error.fieldErrors)
      }
      // The mutation error is visible while the unsaved draft remains in place.
    }
  })

  return {
    blocker,
    isSaving:
      createMutation.isSaving ||
      updateMutation.isSaving ||
      applyMutation.isSaving,
    saveError: applicationTemplateId
      ? applyMutation.saveError
      : existing
        ? updateMutation.saveError
        : createMutation.saveError,
    submit,
  }
}

function applyServerFieldErrors(
  form: UseFormReturn<BuilderFormValues, unknown, CreateBillOfMaterialsRequest>,
  fieldErrors: Record<string, string[]>,
) {
  Object.entries(fieldErrors).forEach(([field, messages]) => {
    if (!messages[0]) return
    if (field === 'name') {
      form.setError('name', { message: messages[0] })
      return
    }
    const match = /^lines\.(\d+)\.(patternSetId|materialId)$/.exec(field)
    if (match) {
      form.setError(
        `lines.${Number(match[1])}.${match[2] as 'patternSetId' | 'materialId'}`,
        { message: messages[0] },
      )
    }
  })
}
