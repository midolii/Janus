import type { JanusApiClient } from "@janus/api-client/client"
import type { InstanceResponse } from "@janus/api-client/contracts"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "../../api/queries"

export function useInstanceLifecycleMutation(api: JanusApiClient) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ instance, action }: { instance: string; action: "start" | "stop" }) =>
      action === "start" ? api.startInstance(instance) : api.stopInstance(instance),
    onSuccess: ({ instance }) => {
      queryClient.setQueryData(queryKeys.instance(instance.name), instance)
      queryClient.setQueryData<{ items: InstanceResponse[] }>(queryKeys.instances, (current) => ({
        items: (current?.items ?? []).map((item) =>
          item.name === instance.name ? instance : item,
        ),
      }))
      void queryClient.invalidateQueries({ queryKey: queryKeys.instances })
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks(instance.name) })
    },
  })
}
