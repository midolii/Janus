import type {
  ConfigGroupResponse,
  ConfigMenuResponse,
  ConfigResponse,
  ConfigTaskResponse,
} from "@janus/api-client/contracts"
import { describe, expect, it } from "vitest"
import { matchesConfigGroupRenderer } from "./config-group-renderer"

const emotionGroup: ConfigGroupResponse = {
  name: "Emotion",
  displayName: "心情设置",
  help: "",
  fields: [
    {
      key: "Main2.Emotion.Mode",
      name: "Mode",
      displayName: "心情模式",
      help: "",
      widgetType: "select",
      default: null,
      options: [],
      display: null,
      readOnly: false,
      sensitive: false,
    },
    {
      key: "Main2.Emotion.Fleet1Value",
      name: "Fleet1Value",
      displayName: "一队心情",
      help: "",
      widgetType: "input",
      default: null,
      options: [],
      display: null,
      readOnly: false,
      sensitive: false,
    },
  ],
}

const task: ConfigTaskResponse = {
  name: "Main2",
  displayName: "主线图-2Plus",
  help: "",
  groups: [emotionGroup],
}

const menu: ConfigMenuResponse = {
  name: "Farm",
  displayName: "出击Plus",
  page: "setting",
  menuType: "collapse",
  tasks: [task],
}

const config: ConfigResponse = {
  instance: "alas",
  module: "alas",
  revision: "revision",
  values: {},
  redactedPaths: [],
}

describe("config group renderer matching", () => {
  it("matches a reusable layout by stable group and field shape", () => {
    const context = {
      moduleName: "alas",
      menu,
      task,
      group: emotionGroup,
      config,
      changes: {},
      onFieldChange: () => undefined,
    }

    expect(
      matchesConfigGroupRenderer(
        {
          groupName: "Emotion",
          requiredFields: [
            { name: "Mode", widgetType: "select" },
            { name: "Fleet1Value", widgetType: "input" },
          ],
        },
        context,
      ),
    ).toBe(true)
    expect(
      matchesConfigGroupRenderer(
        { taskName: "Main", groupName: "Emotion", requiredFields: [{ name: "Mode" }] },
        context,
      ),
    ).toBe(false)
  })
})
