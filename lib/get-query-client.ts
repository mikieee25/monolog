import { QueryClient, isServer } from '@tanstack/react-query'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Server-prefetched data is fresh for 30 s on the client
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
      },
    },
  })
}

// ponytail: one client per browser session; new client per server request
let browserQueryClient: QueryClient | undefined

export function getQueryClient(): QueryClient {
  if (isServer) {
    return makeQueryClient()
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}
