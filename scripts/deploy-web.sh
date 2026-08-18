#!/usr/bin/env bash

set -Eeuo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/.." && pwd)"
deploy_root="${JANUS_DEPLOY_ROOT:-/var/www/janus}"
deploy_branch="${JANUS_DEPLOY_BRANCH:-main}"
releases_dir="${deploy_root}/releases"

log() {
  printf '\n[Janus Deploy] %s\n' "$1"
}

fail() {
  printf '\n[Janus Deploy] 错误：%s\n' "$1" >&2
  exit 1
}

for command_name in git pnpm flock; do
  command -v "${command_name}" >/dev/null 2>&1 || fail "缺少命令：${command_name}"
done

cd "${repo_root}"

[[ -z "$(git status --porcelain)" ]] || fail "Git 工作区存在未提交改动，请先处理后再部署"

current_branch="$(git branch --show-current)"
[[ "${current_branch}" == "${deploy_branch}" ]] || fail "当前分支为 ${current_branch:-detached HEAD}，预期 ${deploy_branch}"

# Pull may update this script. Re-exec it once so the remainder always uses the fetched version.
if [[ "${JANUS_DEPLOY_SYNCED:-0}" != "1" && "${JANUS_DEPLOY_SKIP_SYNC:-0}" != "1" ]]; then
  log "同步 origin/${deploy_branch}"
  git fetch origin "${deploy_branch}"
  git merge --ff-only FETCH_HEAD
  [[ "$(git rev-parse HEAD)" == "$(git rev-parse FETCH_HEAD)" ]] || fail "服务器分支包含未推送提交，拒绝部署"
  exec env JANUS_DEPLOY_SYNCED=1 bash "${script_dir}/deploy-web.sh"
fi

install -d "${releases_dir}"
exec 9>"${deploy_root}/.deploy.lock"
flock -n 9 || fail "另一个 Janus 部署正在执行"

log "安装依赖"
pnpm install --frozen-lockfile

log "运行 Biome"
pnpm check

log "运行类型检查"
pnpm typecheck

log "运行测试"
pnpm test

log "构建 Web"
pnpm --filter @janus/web build

release_id="$(git rev-parse --short=7 HEAD)"
release_dir="${releases_dir}/${release_id}"

if [[ ! -d "${release_dir}" ]]; then
  staging_dir="$(mktemp -d "${releases_dir}/.${release_id}.XXXXXX")"
  cleanup_staging() {
    rm -rf -- "${staging_dir}"
  }
  trap cleanup_staging EXIT

  cp -a "${repo_root}/apps/web/dist/client/." "${staging_dir}/"
  # TanStack Start SPA emits `_shell.html`; Caddy serves `index.html` as the history fallback.
  [[ -s "${staging_dir}/_shell.html" ]] || fail "构建产物缺少 _shell.html"
  cp -- "${staging_dir}/_shell.html" "${staging_dir}/index.html"
  mv -- "${staging_dir}" "${release_dir}"
  trap - EXIT
else
  log "Release ${release_id} 已存在，直接复用"
  if [[ ! -s "${release_dir}/index.html" && -s "${release_dir}/_shell.html" ]]; then
    cp -- "${release_dir}/_shell.html" "${release_dir}/index.html"
  fi
fi

[[ -s "${release_dir}/index.html" ]] || fail "Release 缺少 index.html，拒绝切换 current"
[[ -d "${release_dir}/assets" ]] || fail "Release 缺少 assets 目录，拒绝切换 current"

next_link="${deploy_root}/.current.${release_id}.$$"
ln -s "${release_dir}" "${next_link}"
mv -Tf -- "${next_link}" "${deploy_root}/current"

log "部署完成：${release_id}"
printf '发布目录：%s\n' "${release_dir}"
printf '当前版本：%s\n' "$(readlink -f "${deploy_root}/current")"
