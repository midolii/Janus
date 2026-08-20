interface ImportMetaEnv {
  readonly VITE_JANUS_API_BASE_URL?: string
  readonly VITE_JANUS_CORE_UPDATE_POLL_INTERVAL_MS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
