# 🎓 AlumniConnect - Institutional Network Hub

![Next.js 14](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma)
![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql)

A premium, enterprise-grade alumni networking platform designed for modern educational institutions. This platform bridges the gap between current students and professional alumni through mentorship, career opportunities, and institutional engagement.

---

## 🚀 Presentation Highlights

### 🛡️ Intelligence-Driven Access (RBAC)
- **Zero-Latency Permission Checks**: Leverages **Clerk Public Metadata** synchronization to provide instantaneous role validation without recurrent database round-trips.
- **Strict Role Isolation**: Discrete access layers for `Super Admin`, `Admin`, `Alumni`, and `Student`. 
- **Security-First Headers**: Redirect logic implemented at the layout level ensures unauthorized users never render sensitive dashboard telemetry.

### 🏂 Streamlined Onboarding 2.0
- **Context-Aware Setup**: The system automatically detects pre-assigned roles (Alumni/Student) via invites or sync, bypassing redundant steps to reduce friction.
- **Institution Linkage**: Seamlessly connects users to their specific university nodes through a verified organization registry.
- **Progressive Profiling**: Multi-step flow that gathers essential professional data while maintaining high conversion rates.

### 🌐 High-Performance Architecture
- **Server-Side SEO (Metadata API)**: Optimized Next.js 14 Metadata for every major route (`/admin`, `/dashboard`, `/onboarding`), ensuring social link previews and search engine indexability.
- **Server/Client Hybrid Layouts**: Strategic separation of interactive components from parent server layouts to maximize performance and SEO.
- **Type-Safe Persistence**: End-to-end type safety from the Prisma schema through Zod validation to the frontend interactive components.

---

## ✨ Features

- **Knowledge Nexus (Mentorship)**: Connect students with industry veterans through a goal-oriented request system.
- **Career Market (Jobs)**: Specialized job board for alumni to post opportunities within their private institutional network.
- **Administrative Intelligence**: Comprehensive dashboard for governors to track engagement, user growth, and philanthropy goals.
- **Modern Aesthetics**: Rich visual language using glassmorphism, dynamic gradients, and micro-animations for a premium feel.

---

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (via Prisma ORM)
- **Authentication:** Clerk Express / Next.js SDK
- **Styling:** Tailwind CSS + Headless UI / Radix
- **Animations:** Framer Motion + Aceternity UI components
- **State:** Context API for best-effort Auth/Org data persistence

---

## 📁 Access Matrix

| Role | Entry Route | Permissions | Restrictions |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `/admin` | Full System Control, Org Creation, Global Analytics | Standard Dashboard |
| **Admin** | `/admin` | Org Member Management, Event/Job Moderation | Setup Organization |
| **Alumni** | `/dashboard` | Job Posting, Mentorship, Networking | Admin Hub Access |
| **Student** | `/dashboard` | Seek Mentorship, Career Search, Community Access | Admin Hub, Job Posting |

---

## 🏗 Getting Started

1. **Clone & Install**
   ```bash
   npm install
   ```
2. **Setup Environment**
   Configure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `DATABASE_URL` in `.env`.
3. **Database Migration**
   ```bash
   npx prisma migrate dev
   ```
4. **Launch**
   ```bash
   npm run dev
   ```

---

## 🛡 License
This project is licensed under the **MIT License**.

> “You’re not building a tool — you’re crafting an emotion.”
