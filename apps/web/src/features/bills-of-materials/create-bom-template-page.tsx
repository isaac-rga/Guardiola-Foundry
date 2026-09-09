import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftIcon, SaveIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import type { CreateBillOfMaterialsTemplateRequest } from '@guardiola-foundry/shared-types'
import { createBillOfMaterialsTemplateRequestSchema } from '@guardiola-foundry/shared-validation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useAppShell } from '@/features/app-shell/authenticated-app-shell'
import { useCreateBillOfMaterialsTemplate } from './api/bills-of-materials'

const emptyTemplate: CreateBillOfMaterialsTemplateRequest = {
  kind: 'template',
  name: '',
  description: null,
}

export function CreateBomTemplatePage({
  onCancel,
  onSaved,
}: {
  onCancel: () => void
  onSaved: () => void
}) {
  const { session } = useAppShell()
  const { createTemplate, isSaving, saveError } =
    useCreateBillOfMaterialsTemplate(session.token)
  const form = useForm<CreateBillOfMaterialsTemplateRequest>({
    resolver: zodResolver(createBillOfMaterialsTemplateRequestSchema),
    defaultValues: emptyTemplate,
  })
  const submit = form.handleSubmit(async (values) => {
    try {
      await createTemplate(values)
      onSaved()
    } catch {
      // The mutation error is visible while the unsaved draft remains in place.
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          <ArrowLeftIcon /> Back to catalog
        </Button>
        <Button type="submit" form="create-bom-template" disabled={isSaving}>
          <SaveIcon /> {isSaving ? 'Saving...' : 'Save BOM'}
        </Button>
      </div>

      <Form {...form}>
        <form id="create-bom-template" onSubmit={submit} className="space-y-6">
          <Card>
            <CardHeader>
              <p className="text-sm font-medium text-muted-foreground">
                BOM Template · No Product association
              </p>
              <h1 className="font-editorial text-3xl font-medium leading-none">
                Construction Board
              </h1>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BOM name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoFocus
                        disabled={isSaving}
                        placeholder="e.g. Jackie base construction"
                      />
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
                        disabled={isSaving}
                        value={field.value ?? ''}
                        placeholder="Optional construction context"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {saveError ? <p role="alert">{saveError.message}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>BOM Lines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                This Template can be saved without BOM Lines. Line composition
                is added in the next Builder slice.
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}
