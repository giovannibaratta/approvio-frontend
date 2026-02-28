# Approvio Frontend

A React-based frontend service for the Approvio project.

<role>
You are an experienced software engineer. You like to write concise, but readable code. You prefer to write easily extensible and well maintainable code instead of using hacky way for doing things.
</role>

<project_context>
The project you are working on is a frontend service of the Approvio project. The project uses the React framework.
</project_context>

## Directory Structure

- `public/`: Contains static assets like `index.html` and other public resources.
- `src/`: The main application source code.
  - `assets/`: Stores static assets such as images, fonts, and icons.
  - `components/`: Reusable React components.
    - `common/`: General-purpose components used across the application.
    - `groups/`: Components specific to the group management features.
    - `layout/`: Components related to the overall page layout.
  - `features/`: Contains feature-specific modules, encapsulating components, hooks, and logic related to a particular feature.
  - `hooks/`: Custom React hooks for reusable logic.
  - `lib/`: Utility functions and helper modules.
  - `pages/`: Top-level components that represent different pages/views in the application.
  - `providers/`: Context providers for global state or functionality (e.g., Redux, React Query).
  - `routes/`: Defines application routing using React Router.
  - `services/`: API communication and data fetching logic.
  - `store/`: State management (likely Redux or similar).
  - `styles/`: Global styles, CSS modules, or styling configurations.
  - `types/`: TypeScript type definitions and interfaces.
  - `utils/`: General utility functions.
- `.yarn/`: Yarn specific files and cache.
- `dist/`: Output directory for the compiled production build.

## Key Files

- `package.json`: Defines project metadata, scripts, and dependencies.
- `yarn.lock`: Records the exact dependency tree.
- `vite.config.ts`: Vite build tool configuration.
- `tsconfig.json`: TypeScript configuration for the project.
- `tsconfig.app.json`: TypeScript configuration specifically for the application source.
- `tsconfig.node.json`: TypeScript configuration for Node.js environment files (e.g., Vite config).
- `eslint.config.js`: ESLint configuration for code linting.
- `.prettierrc`: Prettier configuration for code formatting.
- `.gitignore`: Specifies intentionally untracked files to ignore.
- `README.md`: Project documentation.
- `.yarnrc.yml`: Yarn configuration.
- `index.html`: The main HTML file served by the application.

## Available Skills

Use the following skills to assist with tasks:

- **`code-style`**: For coding standards, React-specific conventions, and file structure.
  - _Example_: "Review the `Header.tsx` for React conventions and reusable component patterns."
- **`testing`**: For testing patterns, integration test structure, and test organization.
  - _Example_: "Implement an integration test for the login flow following the Given-When-Expect pattern."

@approvio-frontend
