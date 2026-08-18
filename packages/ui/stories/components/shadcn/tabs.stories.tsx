import { Tabs, TabsContent, TabsList, TabsTrigger } from "@janus/ui/components/tabs"
import preview from "#.storybook/preview"

const meta = preview.meta({
  title: "Components/Shadcn/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
  },
})

export const Default = meta.story({
  render: () => (
    <Tabs className="w-96" defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">概览</TabsTrigger>
        <TabsTrigger value="tasks">任务</TabsTrigger>
        <TabsTrigger value="logs">日志</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">查看实例的运行概览。</TabsContent>
      <TabsContent value="tasks">查看实例的任务队列。</TabsContent>
      <TabsContent value="logs">查看实例的实时日志。</TabsContent>
    </Tabs>
  ),
})

export const Vertical = meta.story({
  render: () => (
    <Tabs className="w-96" defaultValue="overview" orientation="vertical">
      <TabsList>
        <TabsTrigger value="overview">概览</TabsTrigger>
        <TabsTrigger value="tasks">任务</TabsTrigger>
        <TabsTrigger value="logs">日志</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">竖向 Tabs 适合侧栏二级导航。</TabsContent>
      <TabsContent value="tasks">方向键会沿纵向移动焦点。</TabsContent>
      <TabsContent value="logs">选中状态由 Base UI 管理。</TabsContent>
    </Tabs>
  ),
})
