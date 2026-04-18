import React from "react"

const HomePage: React.FC = () => {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">Welcome to Approvio</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          The developer-first platform for streamlined approval workflows, team management, and workspace organization.
        </p>
      </div>
    </div>
  )
}

export default HomePage
