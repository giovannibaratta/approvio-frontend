import {http, HttpResponse} from "msw"

export const handlers = [
  // 0. Auth Providers Handler (Discovery endpoint)
  http.get("*/auth/providers", () => {
    return HttpResponse.json([
      {
        id: "google",
        displayName: "Google",
        loginUrl: "/auth/web/login?provider=google"
      },
      {
        id: "okta",
        displayName: "Okta SSO",
        loginUrl: "/auth/web/login?provider=okta"
      }
    ])
  }),

  // 0.2. Auth Login Handler (Mock SSO flow)
  http.get("*/auth/web/login*", () => {
    // Simulates the backend redirecting back to the application callback URL
    return HttpResponse.redirect("/auth/callback", 302)
  }),

  // 0.5. Auth Logout Handler
  http.post("*/auth/web/logout", () => {
    return new HttpResponse(null, {status: 204})
  }),

  // 1. Auth Info Handler
  http.get("*/auth/info", () => {
    return HttpResponse.json({
      entityType: "user",
      groups: [],
      email: "test@example.com",
      name: "Test User",
      id: "1",
      orgRole: "admin",
      roles: [
        {
          roleName: "GroupReadOnly",
          scope: {
            type: "group",
            groupId: "some-group-id"
          }
        }
      ]
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
  }),

  // 3. Create Space Handler
  http.post("*/spaces", async ({request}) => {
    const data = (await request.json()) as {name: string}
    if (!data.name) {
      return new HttpResponse(JSON.stringify({message: "Name is required"}), {
        status: 400,
        headers: {"Content-Type": "application/json"}
      })
    }
    return new HttpResponse(null, {status: 201})
  }),

  // 4. Spaces List Handler
  http.get("*/spaces", ({request}) => {
    const url = new URL(request.url)
    const page = url.searchParams.get("page") || "1"
    const limit = url.searchParams.get("limit") || "10"

    return HttpResponse.json({
      data: [
        {
          id: "1",
          name: "Engineering Team",
          description: "Space for engineering team collaboration",
          createdAt: new Date().toISOString()
        }
      ],
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: 1
      }
    })
  }),

  // 5. Spaces details handler
  http.get("*/spaces/test-space-id", () => {
    return HttpResponse.json({
      id: "test-space-id",
      name: "Test Space",
      description: "Space for testing"
    })
  }),

  // 6. Groups details handler
  http.get("*/groups/some-group-id", () => {
    return HttpResponse.json({
      id: "some-group-id",
      name: "Test Group",
      description: "Group for testing"
    })
  }),

  // 7. Workflow Template Details Handler
  http.get("*/workflow-templates/3fa85f64-5717-4562-b3fc-2c963f66afa6", () => {
    return HttpResponse.json({
      id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      name: "Test Template",
      version: 1,
      occVersion: 1,
      description: "A test template",
      status: "ACTIVE",
      spaceId: "test-space-id",
      approvalRule: {
        type: "GROUP_REQUIREMENT",
        groupId: "some-group-id",
        minCount: 1
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }),

  // 8. Workflow Templates List Handler
  http.get("*/workflow-templates", ({request}) => {
    const url = new URL(request.url)
    const search = url.searchParams.get("search")
    const limit = parseInt(url.searchParams.get("limit") || "10", 10)
    const page = parseInt(url.searchParams.get("page") || "1", 10)

    // If searching for a specific template, return many versions
    if (search === "test2" || search === "Test") {
      const allVersions = Array.from({length: 15}, (_, i) => ({
        id: `${search}-v${15 - i}`,
        name: search,
        version: (15 - i).toString(),
        description: `Version ${15 - i} of ${search}`,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
        status: "ACTIVE"
      }))

      return HttpResponse.json({
        data: allVersions.slice((page - 1) * limit, page * limit),
        pagination: {
          page,
          limit,
          total: allVersions.length
        }
      })
    }

    // Default list
    return HttpResponse.json({
      data: [
        {
          id: "template-1",
          name: "Test",
          version: "1",
          description: "Main test template",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "ACTIVE"
        },
        {
          id: "template-2",
          name: "test2",
          version: "1",
          description: "Another test template",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "ACTIVE"
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2
      }
    })
  }),

  // 9. Workflows List Handler
  http.get("*/workflows", () => {
    return HttpResponse.json({
      data: [
        {
          id: "workflow-1",
          name: "Software Release v1.2",
          description: "Release approval for v1.2",
          status: "PENDING",
          workflowTemplateId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1
      }
    })
  }),

  // 10. Workflow Details Handler
  http.get("*/workflows/workflow-1", () => {
    return HttpResponse.json({
      id: "workflow-1",
      name: "Software Release v1.2",
      description: "Release approval for v1.2",
      status: "PENDING",
      workflowTemplateId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }),

  // 11. Workflow Votes Handler
  http.get("*/workflows/workflow-1/votes", () => {
    return HttpResponse.json({
      votes: [
        {
          voterId: "1",
          voterType: "user",
          voteType: "APPROVE",
          reason: "Looks good to me",
          votedForGroups: ["some-group-id"],
          timestamp: new Date().toISOString()
        }
      ]
    })
  })
]
