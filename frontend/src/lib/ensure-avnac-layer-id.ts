import type { FabricObject } from 'fabric'

type WithLayerId = FabricObject & {
  avnacLayerId?: string
  avnacLayerName?: string
}

const LAYER_NAME_MAX = 120

export function getAvnacLayerName(obj: FabricObject): string | undefined {
  const v = (obj as WithLayerId).avnacLayerName
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t.length > 0 ? t : undefined
}

export function setAvnacLayerName(obj: FabricObject, name: string) {
  const t = name.trim().slice(0, LAYER_NAME_MAX)
  if (!t) {
    obj.set({
      avnacLayerName: undefined,
    } as Partial<FabricObject> & { avnacLayerName?: string })
    return
  }
  obj.set({
    avnacLayerName: t,
  } as Partial<FabricObject> & { avnacLayerName?: string })
}

export function ensureAvnacLayerId(obj: FabricObject): string {
  const cur = (obj as WithLayerId).avnacLayerId
  if (typeof cur === 'string' && cur.length > 0) return cur
  const id = crypto.randomUUID()
  obj.set({
    avnacLayerId: id,
  } as Partial<FabricObject> & { avnacLayerId?: string })
  return id
}

export function renewAvnacLayerId(obj: FabricObject): string {
  const id = crypto.randomUUID()
  obj.set({
    avnacLayerId: id,
  } as Partial<FabricObject> & { avnacLayerId?: string })
  return id
}
