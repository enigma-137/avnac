import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import { useEffect, useRef, useState } from 'react'

export type PngExportCrop = 'none' | 'selection' | 'content'

export type ExportPngOptions = {
  multiplier: number
  transparent: boolean
  crop: PngExportCrop
}

const DEFAULT_EXPORT: ExportPngOptions = {
  multiplier: 1,
  transparent: false,
  crop: 'none',
}

type Props = {
  disabled?: boolean
  onExport: (opts: ExportPngOptions) => void
}

export default function EditorExportMenu({ disabled, onExport }: Props) {
  const [open, setOpen] = useState(false)
  const [opts, setOpts] = useState<ExportPngOptions>(DEFAULT_EXPORT)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const n = e.target as Node
      if (wrapRef.current?.contains(n)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div ref={wrapRef} className="relative inline-flex">
      <button
        type="button"
        disabled={disabled}
        className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--hover)] disabled:pointer-events-none disabled:opacity-40"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="hidden sm:inline">Export PNG</span>
        <span className="sm:hidden">PNG</span>
        <HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={1.6} />
      </button>
      {open ? (
        <div
          className="absolute right-0 top-full z-[100] mt-1 w-64 rounded-xl border border-black/[0.08] bg-white p-3 shadow-lg"
          role="menu"
        >
          <label className="mb-2 block text-xs font-medium text-neutral-600">
            Scale
            <select
              className="mt-1 w-full rounded-lg border border-black/[0.1] bg-white px-2 py-1.5 text-sm text-neutral-900"
              value={String(opts.multiplier)}
              onChange={(e) =>
                setOpts((p) => ({
                  ...p,
                  multiplier: Number(e.target.value),
                }))
              }
            >
              <option value="1">1×</option>
              <option value="2">2×</option>
              <option value="3">3×</option>
            </select>
          </label>
          <label className="mb-2 block text-xs font-medium text-neutral-600">
            Crop
            <select
              className="mt-1 w-full rounded-lg border border-black/[0.1] bg-white px-2 py-1.5 text-sm text-neutral-900"
              value={opts.crop}
              onChange={(e) =>
                setOpts((p) => ({
                  ...p,
                  crop: e.target.value as PngExportCrop,
                }))
              }
            >
              <option value="none">Full artboard</option>
              <option value="content">Content bounds</option>
              <option value="selection">Selection</option>
            </select>
          </label>
          <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-neutral-800">
            <input
              type="checkbox"
              checked={opts.transparent}
              onChange={(e) =>
                setOpts((p) => ({ ...p, transparent: e.target.checked }))
              }
            />
            Transparent background
          </label>
          <button
            type="button"
            className="w-full rounded-lg bg-neutral-900 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            onClick={() => {
              onExport(opts)
              setOpen(false)
            }}
          >
            Download
          </button>
        </div>
      ) : null}
    </div>
  )
}
