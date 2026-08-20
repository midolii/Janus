import type { JanusApiClient } from "@janus/api-client/client"
import type { CoreUpdateStatus } from "@janus/api-client/contracts"
import { Button } from "@janus/ui/components/button"
import { cn } from "@janus/ui/lib/utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, LoaderCircle, RefreshCw, Rocket } from "lucide-react"
import { useEffect, useState } from "react"
import { coreUpdateQueryOptions, queryKeys } from "../api/queries"
import { CoreUpdateCommitHistory, CoreUpdateCommitSummary } from "./core-update-commits"

type ManualCheckPhase = "idle" | "requesting" | "waiting"

const statusCopy: Record<CoreUpdateStatus, { label: string; detail: string }> = {
  upToDate: { label: "已是最新版本", detail: "当前核心与配置的更新源一致。" },
  updateAvailable: { label: "发现可用更新", detail: "确认提交记录后可以开始更新。" },
  checking: { label: "正在检查更新", detail: "正在拉取并比较更新源。" },
  failed: { label: "上次更新失败", detail: "请检查核心日志和网络后重试。" },
  starting: { label: "正在准备更新", detail: "即将等待运行中的实例安全停止。" },
  waitingForInstances: { label: "正在等待实例停止", detail: "核心会保存恢复计划后继续更新。" },
  updating: { label: "正在更新核心", detail: "请不要关闭 AzurPilot 服务。" },
  restarting: { label: "正在重启服务", detail: "页面会在服务恢复后自动刷新状态。" },
  finished: { label: "更新已经完成", detail: "AzurPilot 核心已切换到新版本。" },
  canceling: { label: "正在取消更新", detail: "正在恢复此前运行的实例。" },
  unknown: { label: "未知更新状态", detail: "请检查 AzurPilot 核心日志。" },
}

const busyStatuses = new Set<CoreUpdateStatus>([
  "checking",
  "starting",
  "waitingForInstances",
  "updating",
  "restarting",
  "canceling",
])

export function CoreUpdatePanel({ api }: { api: JanusApiClient }) {
  const queryClient = useQueryClient()
  // The dashboard owns periodic polling. This observer only renders the shared cache so its
  // network state cannot start or stop the manually triggered check button animation.
  const update = useQuery(coreUpdateQueryOptions(api, false))
  const [confirming, setConfirming] = useState(false)
  const [manualCheckPhase, setManualCheckPhase] = useState<ManualCheckPhase>("idle")
  const checkMutation = useMutation({
    mutationFn: () => api.checkCoreUpdate(),
    onSuccess: (snapshot) => {
      queryClient.setQueryData(queryKeys.coreUpdate, snapshot)
      setManualCheckPhase(snapshot.status === "checking" ? "waiting" : "idle")
    },
    onError: () => setManualCheckPhase("idle"),
  })
  const applyMutation = useMutation({
    mutationFn: () => api.applyCoreUpdate(),
    onSuccess: (snapshot) => {
      setConfirming(false)
      queryClient.setQueryData(queryKeys.coreUpdate, snapshot)
    },
  })
  const snapshot = update.data
  const busy = snapshot ? busyStatuses.has(snapshot.status) : false
  const copy = statusCopy[snapshot?.status ?? "unknown"]
  const manualCheckActive = manualCheckPhase !== "idle"

  useEffect(() => {
    if (manualCheckPhase === "waiting" && snapshot?.status !== "checking") {
      setManualCheckPhase("idle")
    }
  }, [manualCheckPhase, snapshot?.status])

  function checkForUpdates() {
    setManualCheckPhase("requesting")
    checkMutation.mutate()
  }

  return (
    <main className="min-h-0 min-w-0 flex-1 bg-white/28 p-3 sm:p-4 lg:p-8">
      <div className="mx-auto flex h-full min-h-0 max-w-5xl flex-col">
        <header className="shrink-0">
          <h1 className="font-semibold text-[1.65rem] tracking-[-0.035em] sm:text-[2rem]">
            核心更新
          </h1>
          <p className="mt-1 text-slate-500 text-sm">
            检查更新源的提交记录，并安全更新 AzurPilot 核心。
          </p>
        </header>

        <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] bg-white/68 p-3 ring-1 ring-slate-900/6 sm:mt-6 sm:p-6">
          {update.isPending ? <UpdateLoading /> : null}
          {update.isError ? (
            <UpdateError detail={update.error.message} onRetry={() => void update.refetch()} />
          ) : null}
          {snapshot ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="shrink-0 overflow-hidden pb-1">
                <section className="rounded-2xl bg-[#174c68] p-4 text-white sm:rounded-3xl sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-blue-100 text-xs">
                        {busy ? (
                          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                        ) : snapshot.available ? (
                          <Rocket className="size-4" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                        )}
                        更新状态
                      </div>
                      <h2 className="mt-2 font-semibold text-lg tracking-[-0.025em] sm:mt-3 sm:text-xl">
                        {copy.label}
                      </h2>
                      <p className="mt-1 text-blue-100/78 text-xs sm:text-sm">{copy.detail}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busy || manualCheckActive}
                        onClick={checkForUpdates}
                      >
                        <RefreshCw
                          className={cn("size-4", manualCheckActive && "animate-spin")}
                          aria-hidden="true"
                        />
                        {manualCheckActive ? "正在检查" : "检查更新"}
                      </Button>
                      {confirming ? (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setConfirming(false)}
                          >
                            取消
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            disabled={applyMutation.isPending}
                            onClick={() => applyMutation.mutate()}
                          >
                            确认更新
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          disabled={
                            !snapshot.enabled ||
                            (!snapshot.available && snapshot.status !== "failed") ||
                            busy
                          }
                          onClick={() => setConfirming(true)}
                        >
                          <Rocket aria-hidden="true" />
                          开始更新
                        </Button>
                      )}
                    </div>
                  </div>
                </section>

                {!snapshot.enabled ? (
                  <p
                    className="mt-3 rounded-2xl bg-amber-50 px-3 py-2.5 text-amber-900 text-xs sm:mt-4 sm:px-4 sm:py-3 sm:text-sm"
                    role="alert"
                  >
                    当前进程未启用安全重启或依赖同步服务，因此不会开放更新操作。
                  </p>
                ) : null}
                {checkMutation.error || applyMutation.error ? (
                  <p
                    className="mt-3 rounded-2xl bg-red-50 px-3 py-2.5 text-red-900 text-xs sm:mt-4 sm:px-4 sm:py-3 sm:text-sm"
                    role="alert"
                  >
                    {checkMutation.error?.message ?? applyMutation.error?.message}
                  </p>
                ) : null}

                <CoreUpdateCommitSummary
                  localCommit={snapshot.localCommit}
                  upstreamCommit={snapshot.upstreamCommit}
                />
              </div>

              <CoreUpdateCommitHistory
                history={snapshot.history}
                sourceBranch={snapshot.sourceBranch}
                sourceRepository={snapshot.sourceRepository}
              />
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}

function UpdateLoading() {
  return (
    <div className="flex min-h-56 items-center justify-center gap-2 text-slate-500 text-sm">
      <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
      正在读取更新状态
    </div>
  )
}

function UpdateError({ detail, onRetry }: { detail: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center text-center">
      <AlertTriangle className="size-6 text-red-600" aria-hidden="true" />
      <p className="mt-3 font-medium">无法读取更新状态</p>
      <p className="mt-1 max-w-md text-slate-500 text-sm">{detail}</p>
      <Button className="mt-4" type="button" variant="outline" onClick={onRetry}>
        重试
      </Button>
    </div>
  )
}
