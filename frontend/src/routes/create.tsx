import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useLayoutEffect, useRef, useState } from 'react'
import EditorExportMenu from '../components/editor-export-menu'
import FabricEditor, { type FabricEditorHandle } from '../components/fabric-editor'

type CreateSearch = {
  id?: string
}

export const Route = createFileRoute('/create')({
  validateSearch: (raw: Record<string, unknown>): CreateSearch => {
    const id = raw.id
    return {
      id: typeof id === 'string' && id.length > 0 ? id : undefined,
    }
  },
  component: CreatePage,
})

function CreatePage() {
  const editorRef = useRef<FabricEditorHandle>(null)
  const [editorReady, setEditorReady] = useState(false)
  const search = Route.useSearch()
  const id = search.id
  const navigate = Route.useNavigate()

  useLayoutEffect(() => {
    if (id) return
    void navigate({
      to: '/create',
      search: { id: crypto.randomUUID() },
      replace: true,
    })
  }, [id, navigate])

  if (!id) {
    return null
  }

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-[var(--surface-subtle)]">
      <header className="flex flex-shrink-0 items-center gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3 sm:px-5 sm:py-3.5">
        <Link
          to="/"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] no-underline transition hover:bg-[var(--hover)]"
          aria-label="Back to home"
          title="Back to home"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={20} strokeWidth={1.6} />
        </Link>
        <h1 className="m-0 text-base font-semibold leading-tight text-[var(--text)] sm:text-lg">
          Editor
        </h1>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <EditorExportMenu
            disabled={!editorReady}
            onExport={(opts) => editorRef.current?.exportPng(opts)}
          />
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4">
        <FabricEditor
          ref={editorRef}
          persistId={id}
          onReadyChange={setEditorReady}
        />
      </div>
    </div>
  )
}
