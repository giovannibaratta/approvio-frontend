import {http, HttpResponse} from "msw"

export const handlers = [
  // 1. Auth Info Handler
  http.get("*/auth/info", () => {
    return HttpResponse.json({
      entityType: "user",
      groups: [],
      email: "test@example.com",
      name: "Test User",
      id: "1"
    })
  }),

  // 2. Users List Handler
  http.get("*/users", ({request}) => {
    // In MSW v2, we extract the URL from the request object to get search params
    const url = new URL(request.url)
    const page = url.searchParams.get("page") || "1"
    const limit = url.searchParams.get("limit") || "10"

    return HttpResponse.json({
      users: [
        {
          id: "1",
          displayName: "John Doe",
          email: "john@example.com"
        },
        {
          id: "2",
          displayName: "Jane Doe",
          email: "jane@example.com"
        }
      ],
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: 2
      }
    })
  })
]
