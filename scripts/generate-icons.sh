#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
BRANDING_DIR="${ROOT_DIR}/packages/branding"
SOURCE_DIR="${BRANDING_DIR}/source"
WEB_ICONS_DIR="${BRANDING_DIR}/web/icons"
ELECTRON_DIR="${BRANDING_DIR}/electron"
SRGB_PROFILE="/System/Library/ColorSync/Profiles/sRGB Profile.icc"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/janus-icons.XXXXXX")"

cleanup() {
  rm -rf -- "${TMP_DIR}"
}
trap cleanup EXIT

log() {
  printf '[generate-icons] %s\n' "$1"
}

fail() {
  printf '[generate-icons] 错误：%s\n' "$1" >&2
  exit 1
}

if [[ $# -ne 1 ]]; then
  printf '用法：bash scripts/generate-icons.sh <图片路径|http(s) 图片 URL>\n' >&2
  exit 1
fi

INPUT="$1"

command -v sips >/dev/null 2>&1 || fail '缺少命令：sips（请在 macOS 上运行）'
command -v node >/dev/null 2>&1 || fail '缺少命令：node'

if [[ "${INPUT}" == http://* || "${INPUT}" == https://* ]]; then
  command -v curl >/dev/null 2>&1 || fail '处理远程图片需要 curl'
  log "下载远程图片：${INPUT}"
  curl -fsSL --retry 2 "${INPUT}" -o "${TMP_DIR}/original"
elif [[ "${INPUT}" == file://* ]]; then
  INPUT="${INPUT#file://}"
  [[ -f "${INPUT}" ]] || fail "文件不存在：${INPUT}"
  cp -- "${INPUT}" "${TMP_DIR}/original"
else
  [[ -f "${INPUT}" ]] || fail "文件不存在：${INPUT}"
  cp -- "${INPUT}" "${TMP_DIR}/original"
fi

log '将原图标准化为 sRGB PNG'
sips -s format png "${TMP_DIR}/original" --out "${TMP_DIR}/normalized.png" >/dev/null
if [[ -f "${SRGB_PROFILE}" ]]; then
  sips -m "${SRGB_PROFILE}" "${TMP_DIR}/normalized.png" >/dev/null
else
  log '未找到 sRGB profile，跳过色彩空间转换'
fi

mkdir -p "${SOURCE_DIR}" "${WEB_ICONS_DIR}" "${ELECTRON_DIR}"

resize() {
  local size="$1"
  local output="$2"
  sips -z "${size}" "${size}" "${TMP_DIR}/normalized.png" --out "${output}" >/dev/null
  if [[ -f "${SRGB_PROFILE}" ]]; then
    sips -m "${SRGB_PROFILE}" "${output}" >/dev/null
  fi
}

log '生成源文件与 Web/PWA 图标'
sips -z 1024 1024 "${TMP_DIR}/normalized.png" --out "${SOURCE_DIR}/janus-icon-1024.png" >/dev/null
resize 180 "${WEB_ICONS_DIR}/apple-touch-icon.png"
resize 16 "${WEB_ICONS_DIR}/icon-16.png"
resize 32 "${WEB_ICONS_DIR}/icon-32.png"
resize 48 "${WEB_ICONS_DIR}/icon-48.png"
resize 192 "${WEB_ICONS_DIR}/icon-192.png"
resize 512 "${WEB_ICONS_DIR}/icon-512.png"
resize 1024 "${WEB_ICONS_DIR}/icon-1024.png"

log '生成 Electron 图标'
resize 512 "${ELECTRON_DIR}/icon.png"
resize 256 "${TMP_DIR}/icon-256.png"

cat > "${TMP_DIR}/make-ico.mjs" <<'NODE'
import { readFileSync, writeFileSync } from "node:fs"

const [output, ...files] = process.argv.slice(2)
const datas = files.map((file) => readFileSync(file))
const directory = Buffer.alloc(6)
directory.writeUInt16LE(0, 0)
directory.writeUInt16LE(1, 2)
directory.writeUInt16LE(files.length, 4)

const entries = []
let offset = 6 + files.length * 16

for (const [index, data] of datas.entries()) {
  const width = data.readUInt32BE(16)
  const height = data.readUInt32BE(20)
  const entry = Buffer.alloc(16)
  entry.writeUInt8(width >= 256 ? 0 : width, 0)
  entry.writeUInt8(height >= 256 ? 0 : height, 1)
  entry.writeUInt8(0, 2)
  entry.writeUInt8(0, 3)
  entry.writeUInt16LE(1, 4)
  entry.writeUInt16LE(32, 6)
  entry.writeUInt32LE(data.length, 8)
  entry.writeUInt32LE(offset, 12)
  entries.push(entry)
  offset += data.length
}

writeFileSync(output, Buffer.concat([directory, ...entries, ...datas]))
NODE

node "${TMP_DIR}/make-ico.mjs" \
  "${WEB_ICONS_DIR}/favicon.ico" \
  "${WEB_ICONS_DIR}/icon-16.png" \
  "${WEB_ICONS_DIR}/icon-32.png" \
  "${WEB_ICONS_DIR}/icon-48.png"

node "${TMP_DIR}/make-ico.mjs" \
  "${ELECTRON_DIR}/icon.ico" \
  "${WEB_ICONS_DIR}/icon-16.png" \
  "${WEB_ICONS_DIR}/icon-32.png" \
  "${WEB_ICONS_DIR}/icon-48.png" \
  "${TMP_DIR}/icon-256.png"

if command -v iconutil >/dev/null 2>&1; then
  ICONSET="${TMP_DIR}/Janus.iconset"
  mkdir -p "${ICONSET}"
  resize 16 "${ICONSET}/icon_16x16.png"
  resize 32 "${ICONSET}/icon_16x16@2x.png"
  resize 32 "${ICONSET}/icon_32x32.png"
  resize 64 "${ICONSET}/icon_32x32@2x.png"
  resize 128 "${ICONSET}/icon_128x128.png"
  resize 256 "${ICONSET}/icon_128x128@2x.png"
  resize 256 "${ICONSET}/icon_256x256.png"
  resize 512 "${ICONSET}/icon_256x256@2x.png"
  resize 512 "${ICONSET}/icon_512x512.png"
  resize 1024 "${ICONSET}/icon_512x512@2x.png"
  iconutil --convert icns --output "${ELECTRON_DIR}/icon.icns" "${ICONSET}"
else
  log '未找到 iconutil，跳过 macOS icon.icns'
fi

log '图标已替换：'
printf '  %s\n' \
  "${SOURCE_DIR}/janus-icon-1024.png" \
  "${WEB_ICONS_DIR}/favicon.ico" \
  "${WEB_ICONS_DIR}/apple-touch-icon.png" \
  "${WEB_ICONS_DIR}/icon-192.png" \
  "${WEB_ICONS_DIR}/icon-512.png" \
  "${ELECTRON_DIR}/icon.png" \
  "${ELECTRON_DIR}/icon.ico"

if [[ -f "${ELECTRON_DIR}/icon.icns" ]]; then
  printf '  %s\n' "${ELECTRON_DIR}/icon.icns"
fi
