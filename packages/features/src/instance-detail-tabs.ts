export const instanceDetailTabs = ["overview", "tasks", "config", "logs"] as const

export type InstanceDetailTab = (typeof instanceDetailTabs)[number]
