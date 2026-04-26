import { HugeiconsIcon } from '@hugeicons/react'
import { getPublicApiBase } from '../lib/public-api-base'
import {
  MagicWand02FreeIcons,
  Cancel01Icon,
  FilterIcon,
} from '@hugeicons/core-free-icons'
import { useCallback, useEffect, useState } from 'react'
import type { FabricImage } from 'fabric'
import {
  // FloatingToolbarDivider,
  SidebarPanelShell,
  // floatingToolbarIconButton,
} from './floating-toolbar-shell'
import EditorRangeSlider from './editor-range-slider'

type Props = {
  image: FabricImage
  fabricMod: any
  canvas: any
  onApply?: () => void
  onClose?: () => void
}

export default function ImageEffectsToolbar({
  image,
  fabricMod,
  canvas,
  onApply,
  onClose,
}: Props) {
  const [saturation, setSaturation] = useState(100)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [grayscale, setGrayscale] = useState(0)
  const [backgroundRemoving, setBackgroundRemoving] = useState(false)
  const applyFilters = useCallback(() => {
    if (!canvas || !fabricMod || !image) return

    const filters = [] as any[]

    // Apply grayscale (ColorMatrix for better compatibility and intensity support)
    if (grayscale > 0) {
      const ColorMatrixClass = fabricMod.filters?.ColorMatrix
      if (ColorMatrixClass) {
        const grayscaleFilter = new ColorMatrixClass()
        // Standard grayscale matrix
        const matrix = [
          0.2126, 0.7152, 0.0722, 0, 0,
          0.2126, 0.7152, 0.0722, 0, 0,
          0.2126, 0.7152, 0.0722, 0, 0,
          0,      0,      0,      1, 0
        ]
        
        // If grayscale < 100, we can interpolate with identity matrix
        if (grayscale < 100) {
          const ratio = grayscale / 100
          const identity = [
            1, 0, 0, 0, 0,
            0, 1, 0, 0, 0,
            0, 0, 1, 0, 0,
            0, 0, 0, 1, 0
          ]
          for (let i = 0; i < matrix.length; i++) {
            matrix[i] = matrix[i]! * ratio + identity[i]! * (1 - ratio)
          }
        }
        
        grayscaleFilter.matrix = matrix
        filters.push(grayscaleFilter)
      }
    }

    // Apply brightness (0.5-1.5 range)
    if (brightness !== 100) {
      const BrightnessClass = fabricMod.filters?.Brightness
      if (BrightnessClass) {
        filters.push(new BrightnessClass({ brightness: (brightness - 100) / 100 }))
      }
    }

    // Apply contrast (0.5-1.5 range)
    if (contrast !== 100) {
      const ContrastClass = fabricMod.filters?.Contrast
      if (ContrastClass) {
        filters.push(new ContrastClass({ contrast: (contrast - 100) / 100 }))
      }
    }

    // Apply saturation (0-2 range)
    if (saturation !== 100) {
      const SaturationClass = fabricMod.filters?.Saturation
      if (SaturationClass) {
        filters.push(new SaturationClass({ saturation: (saturation - 100) / 100 }))
      }
    }

    const otherFilters = (image.filters || []).filter((f: any) => {
      const type = f.type
      return type !== 'Saturation' && type !== 'Brightness' && type !== 'Contrast' && type !== 'ColorMatrix'
    })

    image.filters = [...otherFilters, ...filters]
    image.applyFilters()
    canvas.requestRenderAll()
  }, [canvas, fabricMod, image, saturation, brightness, contrast, grayscale])

  useEffect(() => {
    if (!image || !image.filters) return

    let foundSaturation = 100
    let foundBrightness = 100
    let foundContrast = 100
    let foundGrayscale = 0

    image.filters.forEach((filter: any) => {
      if (filter.type === 'Saturation') {
        foundSaturation = Math.round(filter.saturation * 100 + 100)
      } else if (filter.type === 'Brightness') {
        foundBrightness = Math.round(filter.brightness * 100 + 100)
      } else if (filter.type === 'Contrast') {
        foundContrast = Math.round(filter.contrast * 100 + 100)
      } else if (filter.type === 'ColorMatrix' && filter.matrix) {
        // Simple heuristic: if it's our grayscale matrix, set grayscale to 100
        // Our matrix starts with [0.2126, 0.7152, 0.0722, ...]
        if (filter.matrix[0] === 0.2126 && filter.matrix[1] === 0.7152) {
          foundGrayscale = 100
        }
      }
    })

    setSaturation(foundSaturation)
    setBrightness(foundBrightness)
    setContrast(foundContrast)
    setGrayscale(foundGrayscale)
  }, [image])

  useEffect(() => {
    applyFilters()
  }, [saturation, brightness, contrast, grayscale, applyFilters])

  const handleRemoveBackground = useCallback(async () => {
    if (backgroundRemoving) return

    let url: string | null = null
    try {
      setBackgroundRemoving(true)

      if (!image) return
      const dataSrc = image.getSrc()
      if (!dataSrc) return

      const imgResponse = await fetch(dataSrc)
      const imgBlob = await imgResponse.blob()

      const formData = new FormData()
      formData.append('image_file', imgBlob)
      formData.append('size', 'auto')

      const urlBase = getPublicApiBase()
      const response = await fetch(`${urlBase}/remove-bg/`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API request failed: ${response.status}`)
      }

      const resultBlob = await response.blob()
      url = URL.createObjectURL(resultBlob)

      const newImage = await fabricMod.FabricImage.fromURL(url, {
        crossOrigin: 'anonymous',
      })

      // Copy all relevant standard properties
      newImage.set({
        left: image.left,
        top: image.top,
        scaleX: image.scaleX,
        scaleY: image.scaleY,
        angle: image.angle,
        originX: image.originX,
        originY: image.originY,
        flipX: image.flipX,
        flipY: image.flipY,
        skewX: image.skewX,
        skewY: image.skewY,
        opacity: image.opacity,
        visible: image.visible,
      })
      
      // Copy custom Avnac properties to maintain interactivity and identification
      const source = image as any
      const target = newImage as any
      if ('avnacId' in source) target.avnacId = source.avnacId
      if ('avnacLayerId' in source) target.avnacLayerId = source.avnacLayerId
      if ('avnacLayerName' in source) target.avnacLayerName = source.avnacLayerName
      if ('avnacLocked' in source) target.avnacLocked = source.avnacLocked
      if ('avnacBlur' in source) target.avnacBlur = source.avnacBlur
      if ('avnacShapeMeta' in source) target.avnacShapeMeta = source.avnacShapeMeta

      // Use proper Fabric API to replace the object so events like 'object:added' fire
      const index = canvas.getObjects().indexOf(image)
      canvas.add(newImage)
      if (index !== -1) {
        canvas.moveObjectTo(newImage, index)
      }
      canvas.remove(image)
      canvas.setActiveObject(newImage)
      canvas.requestRenderAll()

      onApply?.()
    } catch (error) {
      console.error('Background removal failed:', error)
      alert(`Background removal failed: ${error instanceof Error ? error.message : error}`)
    } finally {
      if (url) {
        URL.revokeObjectURL(url)
      }
      setBackgroundRemoving(false)
    }
  }, [image, fabricMod, canvas, backgroundRemoving, onApply])

  const resetEffects = useCallback(() => {
    if (!image || !canvas) return
    setSaturation(100)
    setBrightness(100)
    setContrast(100)
    setGrayscale(0)
    image.filters = []
    image.applyFilters()
    canvas.requestRenderAll()
    onApply?.()
  }, [image, canvas, onApply])

  return (
    <SidebarPanelShell role="dialog" aria-label="Image effects">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={FilterIcon} size={18} strokeWidth={1.75} className="text-neutral-600" />
          <span className="text-sm font-semibold text-neutral-800">Image Effects</span>
        </div>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 hover:bg-black/[0.06]"
          onClick={onClose}
          aria-label="Close"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-600">Saturation</label>
              <span className="text-xs text-neutral-500">{saturation}%</span>
            </div>
            <EditorRangeSlider
              min={0}
              max={200}
              value={saturation}
              onChange={setSaturation}
              trackClassName="w-full"
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-600">Brightness</label>
              <span className="text-xs text-neutral-500">{brightness}%</span>
            </div>
            <EditorRangeSlider
              min={50}
              max={150}
              value={brightness}
              onChange={setBrightness}
              trackClassName="w-full"
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-600">Contrast</label>
              <span className="text-xs text-neutral-500">{contrast}%</span>
            </div>
            <EditorRangeSlider
              min={50}
              max={150}
              value={contrast}
              onChange={setContrast}
              trackClassName="w-full"
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-600">Grayscale</label>
              <span className="text-xs text-neutral-500">{grayscale}%</span>
            </div>
            <EditorRangeSlider
              min={0}
              max={100}
              value={grayscale}
              onChange={setGrayscale}
              trackClassName="w-full"
            />
          </div>

          <div className="h-px bg-black/[0.06]" />

          <div className="flex flex-col gap-3">
            <span className="text-xs font-medium text-neutral-600">Magic Tools</span>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl border border-black/[0.06] bg-white p-3 text-left transition-colors hover:bg-black/[0.02]"
              onClick={handleRemoveBackground}
              disabled={backgroundRemoving}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                {backgroundRemoving ? (
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <HugeiconsIcon icon={MagicWand02FreeIcons} size={20} strokeWidth={1.75} />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-neutral-900">Remove background</span>
                <span className="text-[11px] text-neutral-500">Magic background removal</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-black/[0.06] p-4">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-100 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
          onClick={resetEffects}
        >
          Reset all effects
        </button>
      </div>
    </SidebarPanelShell>
  )
}
