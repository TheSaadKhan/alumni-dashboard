# 🎓 AlumniConnect - Institutional Network Hub

![Next.js 16](https://img.shields.io/badge/Next.js-16_Turbopack-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma)
![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql)

AlumniConnect is a premium, enterprise-grade alumni networking platform designed for modern educational institutions. It facilitates seamless collaboration between students and alumni through mentorship, career tracking, and institutional engagement.

---

## 🚀 Key Modules & Features

### 🏢 Institutional Dashboard
*   **Scoped Analytics**: Real-time metrics for member growth, engagement rates, and career activity.
*   **Role-Based Views**: Dynamic interfaces for Admins (Management) vs. Members (Engagement).
*   **Institutional Branding**: Supports slug-based routing (e.g., `/organization/university-slug/dashboard`) with unique organizational context.

### 👥 Network & Community
*   **Member Directory**: Advanced search and filtering for finding alumni by graduation year, industry, or company.
*   **Profile Management**: Rich user profiles including professional history, skills, and academic achievements.
*   **First-Mile Outreach**: Built-in messaging system to initiate direct conversations from profiles.

### 💼 Career Center
*   **Institutional Job Board**: Alumni can post internal opportunities specifically for their university network.
*   **Application Tracking**: Streamlined flow for students to apply and alumni to review resumes.
*   **Urgency Markers**: Visual highlights for urgent or featured roles.

### 🎓 Mentorship Portal
*   **Mentor Matching**: Goal-oriented request system based on shared skills and industry interests.
*   **Availability Tracking**: Alumni can set mentorship slots and topics they are willing to cover.
*   **Mentorship Feed**: Centralized hub for tracking active and pending mentorship requests.

### 📅 Programming & Events
*   **Institutional Events**: University-sanctioned webinars, career fairs, and networking mixers.
*   **Registration Management**: Integrated check-in system and capacity tracking.
*   **Event Types**: Supports Online, In-Person, and Hybrid event modes.

---

## 🛡 Security & Architecture

*   **Intelligence-Driven RBAC**: 
    - Implements Role-Based Access Control using Clerk Public Metadata.
    - Zero-latency permission checks integrated into Next.js middleware and layouts.
*   **High-Performance Build**: 
    - Powered by **Next.js 16 (Turbopack)** for ultra-fast compilation and HMR.
    - Optimized Static/Dynamic route generation for high-load environments.
*   **Persistence Layer**: 
    - **Prisma ORM** with PostgreSQL.
    - Atomic updates and complex relational mapping (10+ related tables).
*   **Privacy Controls**: 
    - Granular user-controlled visibility for profiles and contact information.
    - Notification preferences for Email, In-App, and Desktop alerts.

---

## 📁 Project Architecture

*   `app/api/`: RESTful endpoints for dashboard stats, messaging, and profile management.
*   `app/organization/[slug]/`: The core dynamic routing hub for multi-tenant institutional support.
*   `components/ui/`: A curated collection of premium Radix-based UI components.
*   `lib/prisma/`: Centralized database client and type-safe schema generated for PostgreSQL.
*   `context/`: Lightweight state management for Auth and Global Organizational context.

---

## 🛠 Tech Stack

*   **Framework:** Next.js 16 (App Router + Turbopack)
*   **Authentication:** Clerk (Advanced Workflow + Metadata Sync)
*   **ORM:** Prisma
*   **Database:** PostgreSQL (Edge-ready)
*   **UI/UX:** Tailwind CSS, Framer Motion, Lucide Icons, Sonner (Toasts)
*   **State:** Context API + SWR-style data fetching patterns

---

## 🏗 Getting Started

1.  **Installation**
    ```bash
    npm install
    ```
2.  **Environment Configuration**
    Set up `.env` with:
    - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
    - `CLERK_SECRET_KEY`
    - `DATABASE_URL` / `DIRECT_URL`
3.  **Database Sync**
    ```bash
    npx prisma generate
    npx prisma db push
    ```
4.  **Production Build**
    ```bash
    npm run build
    ```

---

## 📊 Access Matrix

| Role | Primary Route | Key Permissions |
| :--- | :--- | :--- |
| **Super Admin** | `/admin` | Global Stats, Organization Registry, System Logs |
| **Admin** | `/organization/[slug]/dashboard` | Member Management, Content Moderation |
| **Alumni** | `/organization/[slug]/dashboard/profile` | Job Posting, Mentorship, Networking |
| **Student** | `/organization/[slug]/dashboard/network` | Career Search, Mentorship Seeking |

---

## 🛡 License
Licensed under the **MIT License**.

> “Building more than just a network — we are crafting the future of institutional legacy.”
