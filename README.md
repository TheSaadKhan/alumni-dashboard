🗂️ Project Structure

This is the structure of the Alumni Portal project using Next.js App Router, Tailwind CSS, and TypeScript:

/alumni-portal/
│
├── app/                     # Application routes (Next.js App Router)
│   ├── dashboard/           # Protected dashboard pages
│   │   └── page.tsx         # Dashboard homepage
│   │
│   ├── auth/                # Authentication routes
│   │   ├── login/           # Login page
│   │   │   └── page.tsx
│   │   ├── register/        # Registration page
│   │   │   └── page.tsx
│   │
│   ├── layout.tsx           # Root layout for the entire app
│   ├── page.tsx             # Public home/landing page
│   └── globals.css          # Global styles (Tailwind base, etc.)
│
├── components/              # Reusable UI and layout components
│   ├── ui/                  # UI elements (buttons, inputs, etc.)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── sidebar.tsx
│   │   └── sidebar-menu.tsx
│   │
│   ├── layout/              # Layout wrappers
│   │   └── SidebarLayout.tsx
│   │
│   └── shared/              # Shared logic/components
│       └── SidebarProvider.tsx
│
├── context/                 # React Context for global state
│   └── SidebarContext.tsx
│
├── hooks/                   # Custom React hooks
│   └── useSidebar.ts
│
├── lib/                     # Utility functions and services
│   ├── api.ts               # API abstraction layer
│   └── auth.ts              # Auth helper functions
│
├── types/                   # Global TypeScript types
│   └── index.ts
│
├── public/                  # Static files and assets
│   └── logo.svg
│
├── styles/                  # Custom or third-party CSS
│   └── sidebar.css
│
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── next.config.js           # Next.js configuration
└── package.json             # Project dependencies and scripts

✅ Notes:

The project uses App Router (Next.js 13+).

All routes are in the app/ directory.

Components are organized by type (UI, layout, shared).

Context and hooks are decoupled for reusability.

Static files like images or icons are kept in public/.