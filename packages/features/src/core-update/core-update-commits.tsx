import type { CoreCommitResponse } from "@janus/api-client/contracts"
import { DateDisplay } from "@janus/ui/components/date-display"
import { GitBranch } from "lucide-react"

export function CoreUpdateCommitSummary({
  localCommit,
  upstreamCommit,
}: {
  localCommit: CoreCommitResponse | null
  upstreamCommit: CoreCommitResponse | null
}) {
  return (
    <section className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3" aria-label="核心提交摘要">
      <CommitCard label="当前核心" commit={localCommit} />
      <CommitCard label="更新源最新提交" commit={upstreamCommit} />
    </section>
  )
}

export function CoreUpdateCommitHistory({
  history,
  sourceBranch,
  sourceRepository,
}: {
  history: CoreCommitResponse[]
  sourceBranch: string
  sourceRepository: string
}) {
  const sourceLabel = `${sourceRepository} · ${sourceBranch}`

  return (
    <section className="mt-3 flex min-h-0 flex-1 flex-col border-slate-900/7 border-t pt-3 sm:mt-5 sm:min-h-40 sm:pt-5">
      <div className="flex min-w-0 shrink-0 items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-semibold text-[1.05rem]">更新源提交记录</h2>
          <p className="mt-1 truncate text-slate-500 text-xs" title={sourceLabel}>
            {sourceLabel}
          </p>
        </div>
        <GitBranch className="size-5 shrink-0 text-slate-400" aria-hidden="true" />
      </div>

      {history.length > 0 ? (
        <ol className="scrollbar-hidden mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pb-1 sm:mt-4">
          {history.map((commit) => (
            <CommitRow key={commit.sha1} commit={commit} />
          ))}
        </ol>
      ) : (
        <p className="mt-2 flex min-h-0 flex-1 items-center justify-center rounded-2xl bg-slate-900/[0.025] px-4 text-slate-400 text-sm sm:mt-4">
          暂无更新源提交记录
        </p>
      )}
    </section>
  )
}

function CommitCard({ label, commit }: { label: string; commit: CoreCommitResponse | null }) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-900/8 bg-slate-900/[0.025] px-3 py-2.5 sm:rounded-2xl sm:p-4">
      <p className="truncate text-slate-500 text-xs" title={label}>
        {label}
      </p>
      {commit ? (
        <>
          <p
            className="mt-1.5 truncate font-medium text-xs sm:mt-2 sm:text-sm"
            title={commit.message}
          >
            {commit.message}
          </p>
          <div className="mt-2 flex min-w-0 items-center gap-2 text-slate-500 text-xs sm:mt-3">
            <code className="shrink-0 rounded-md bg-slate-900/6 px-1.5 py-0.5 sm:rounded-lg sm:px-2 sm:py-1">
              {commit.sha1}
            </code>
            <span className="hidden truncate sm:inline">{commit.author}</span>
          </div>
        </>
      ) : (
        <p className="mt-1.5 line-clamp-2 text-slate-400 text-xs sm:mt-2 sm:text-sm">
          暂时无法读取提交信息
        </p>
      )}
    </article>
  )
}

function CommitRow({ commit }: { commit: CoreCommitResponse }) {
  return (
    <li className="grid min-w-0 grid-cols-[4.75rem_minmax(0,1fr)] gap-x-2 gap-y-1 rounded-xl border border-slate-900/7 px-3 py-2.5 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-3">
      <code className="truncate text-blue-700 text-xs">{commit.sha1}</code>
      <div className="min-w-0">
        <p className="truncate font-medium text-sm" title={commit.message}>
          {commit.message}
        </p>
        <p className="mt-0.5 truncate text-slate-500 text-xs" title={commit.author}>
          {commit.author}
        </p>
      </div>
      <DateDisplay
        className="col-start-2 text-slate-500 text-xs tabular-nums sm:col-start-auto"
        value={normalizeGitDate(commit.committedAt)}
        options={{ dateStyle: "medium", timeStyle: "short" }}
      />
    </li>
  )
}

function normalizeGitDate(value: string): string {
  return value.replace(" ", "T").replace(/ ([+-]\d{2})(\d{2})$/, "$1:$2")
}
