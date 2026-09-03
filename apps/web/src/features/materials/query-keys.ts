export const materialListQueryKey = ['materials'] as const

export function materialDetailQueryKey(materialId: string) {
  return ['materials', 'detail', materialId] as const
}
