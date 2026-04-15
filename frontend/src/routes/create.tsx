import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft02Icon,
  FolderExportIcon,
  FolderOpenIcon,
} from '@hugeicons/core-free-icons'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import EditorExportMenu from '../components/editor-export-menu'
import FabricEditor, { type FabricEditorHandle } from '../components/fabric-editor'

export const Route = createFileRoute('/create')({
  component: CreatePage,
})

function CreatePage() {
  const editorRef = useRef<FabricEditorHandle>(null)
  const loadInputRef = useRef<HTMLInputElement>(null)
  const [editorReady, setEditorReady] = useState(false)

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-[var(--surface-subtle)]">
      <header className="flex flex-shrink-0 items-center gap-2 border-b border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 sm:px-4 sm:py-2">
        <Link
          to="/"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] no-underline transition hover:bg-[var(--hover)]"
          aria-label="Back to home"
          title="Back to home"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={18} strokeWidth={1.6} />
        </Link>
        <h1 className="m-0 text-sm font-semibold leading-tight text-[var(--text)] sm:text-base">
          Editor
        </h1>
        <input
          ref={loadInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void editorRef.current?.loadDocument(f)
            e.target.value = ''
          }}
        />
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            disabled={!editorReady}
            onClick={() => editorRef.current?.saveDocument()}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--hover)] disabled:pointer-events-none disabled:opacity-40"
            aria-label="Save document"
            title="Save document"
          >
            <HugeiconsIcon
              icon={FolderExportIcon}
              size={18}
              strokeWidth={1.6}
            />
            <span className="hidden sm:inline">Save</span>
          </button>
          <button
            type="button"
            disabled={!editorReady}
            onClick={() => loadInputRef.current?.click()}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--hover)] disabled:pointer-events-none disabled:opacity-40"
            aria-label="Open document"
            title="Open document"
          >
            <HugeiconsIcon icon={FolderOpenIcon} size={18} strokeWidth={1.6} />
            <span className="hidden sm:inline">Open</span>
          </button>
          <EditorExportMenu
            disabled={!editorReady}
            onExport={(opts) => editorRef.current?.exportPng(opts)}
          />
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4">
        <FabricEditor ref={editorRef} onReadyChange={setEditorReady} />
      </div>
    </div>
  )
}
