### File Structure ###
/alumni-portal/
│
├── /app/                     # App directory (Next.js App Router)
│   ├── /dashboard/           # Dashboard routes (protected)
│   │   └── page.tsx          # Dashboard Home
│   │
│   ├── /auth/                # Auth routes (login, register)
│   │   ├── /login/
│   │   │   └── page.tsx
│   │   ├── /register/
│   │   │   └── page.tsx
│   │
│   ├── /layout.tsx          # Root layout for the app
│   ├── /page.tsx            # Home page
│   └── /globals.css         # Global CSS
│
├── /components/
│   ├── /ui/                  # UI primitives and shared components
│   │   ├── sidebar.tsx
│   │   ├── sidebar-menu.tsx
│   │   ├── button.tsx
│   │   └── input.tsx
│   │
│   ├── /layout/             # Layout components
│   │   └── SidebarLayout.tsx
│   │
│   └── /shared/             # Reusable logic or wrappers
│       └── SidebarProvider.tsx
│
├── /lib/                    # Utility functions and services
│   ├── auth.ts              # Auth-related helpers
│   └── api.ts               # API call abstraction
│
├── /context/                # React context providers
│   └── SidebarContext.tsx
│
├── /hooks/                  # Custom React hooks
│   └── useSidebar.ts
│
├── /types/                  # TypeScript types
│   └── index.ts
│
├── /public/                 # Static assets (images, icons)
│   └── logo.svg
│
├── /styles/                # Custom styles if any
│   └── sidebar.css
│
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── package.json
