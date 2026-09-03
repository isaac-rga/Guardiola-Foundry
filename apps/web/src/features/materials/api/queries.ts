import { useQuery } from '@tanstack/react-query'

import {
  getMaterial,
  listMaterials,
} from '@/features/materials/api/endpoints'
import {
  materialDetailQueryKey,
  materialListQueryKey,
} from '@/features/materials/query-keys'

export function useMaterialList(token: string) {
  return useQuery({
    queryKey: materialListQueryKey,
    queryFn: () => listMaterials(token),
  })
}

export function useMaterialDetail(token: string, materialId: string) {
  return useQuery({
    queryKey: materialDetailQueryKey(materialId),
    queryFn: () => getMaterial(token, materialId),
  })
}
