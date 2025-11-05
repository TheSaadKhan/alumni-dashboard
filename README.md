# 🎓 Alumni Dashboard

![License](https://img.shields.io/badge/license-MIT-green)
![Next.js](https://img.shields.io/badge/Next.js-13+-black)
![TypeScript](https://img.shields.io/badge/TypeScript-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38BDF8)
![Build](https://github.com/your-org/alumni-dashboard/actions/workflows/ci.yml/badge.svg)
![Tests](https://img.shields.io/github/actions/workflow/status/your-org/alumni-dashboard/tests.yml?label=tests)
![Deployment](https://img.shields.io/github/deployments/your-org/alumni-dashboard/production?label=vercel)

A next-generation Alumni Dashboard built with Next.js 13+, TypeScript, and a modern, scalable architecture.  
Designed to connect graduates, foster meaningful networking, and celebrate impact across generations.

---

## ✨ Features

- Secure login, registration, and password recovery  
- Personalized dashboards with events, jobs, and messaging  
- Admin management system for users, jobs, events, and donations  
- Real-time impact tracking and alumni engagement tools  
- Fully responsive and accessibility-optimized interface  
- Modular API routes for authentication and data services  

---

## 🛠 Tech Stack

- **Framework:** Next.js (App Router)  
- **Language:** TypeScript  
- **UI:** Tailwind CSS, Radix UI  
- **State Management:** Zustand or Redux Toolkit  
- **Auth:** NextAuth.js or Clerk  
- **Testing:** Jest, React Testing Library  
- **Linting & Formatting:** ESLint, Prettier  

---

## 📁 Project Structure

```
/alumni-dashboard
│
├── public/                      
│   └── assets/                  
│
├── app/                        
│   ├── layout.tsx               
│   ├── page.tsx                 
│   ├── not-found.tsx            
│   │
│   ├── about/                   
│   ├── contact/                 
│   ├── stories/[slug]/          
│   ├── donate/                  
│   │
│   ├── auth/
│   │   ├── login/               
│   │   ├── register/            
│   │   ├── forgot-password/     
│   │   └── reset-password/      
│   │
│   ├── dashboard/
│   │   ├── layout.tsx           
│   │   ├── page.tsx             
│   │   ├── profile/edit/        
│   │   ├── events/              
│   │   │   ├── [eventId]/       
│   │   │   └── create/          
│   │   ├── jobs/                
│   │   │   ├── [jobId]/         
│   │   │   └── post/            
│   │   ├── messages/[conversationId]/ 
│   │   ├── network/[alumniId]/        
│   │   ├── impact/              
│   │   ├── settings/            
│   │   │   ├── security/        
│   │   │   └── notifications/   
│   │
│   ├── admin/
│   │   ├── layout.tsx           
│   │   ├── page.tsx             
│   │   ├── users/[userId]/      
│   │   ├── events/              
│   │   ├── jobs/                
│   │   ├── donations/           
│   │   └── analytics/           
│   │
│   ├── api/                     
│   │   ├── auth/                
│   │   ├── users/               
│   │   ├── events/              
│   │   ├── jobs/                
│   │   └── messages/            
│
├── components/                  
│   ├── dashboard/               
│   ├── ui/                      
│   └── common/                  
│
├── hooks/                       
├── context/                     
├── lib/                         
├── services/                    
├── styles/                      
└── types/                       

├── .env.local                   
├── next.config.js               
├── tailwind.config.js           
├── tsconfig.json                
└── README.md                    
```

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-org/alumni-dashboard.git
cd alumni-dashboard
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
```

### 3. Setup environment variables
Copy `.env.example` to `.env.local` and configure your authentication and database credentials.

### 4. Run the development server
```bash
npm run dev
# or
yarn dev
```

### 5. Open in your browser
Visit [http://localhost:3000](http://localhost:3000) to explore the dashboard.

---

## 🧩 Contributing

We welcome contributions from the community.

1. Fork the repo  
2. Create your feature branch  
   ```bash
   git checkout -b feature/cool-feature
   ```
3. Commit changes and push your branch  
   ```bash
   git push origin feature/cool-feature
   ```
4. Open a Pull Request  

Refer to `CONTRIBUTING.md` for more details and coding guidelines.

---

## 🛡 License

This project is licensed under the **MIT License**.  
See the [`LICENSE`](LICENSE) file for details.

---

## 🙌 Acknowledgements

Inspired by a shared vision to connect alumni worldwide through community, technology, and legacy.

---

> “You’re not building a tool — you’re crafting an emotion.”


# alumni-dashboard (DB + Backend scaffold)

This directory contains production-ready starter files for:
- supabase/ — migrations, policies, triggers, views, seeds.
- db/ — backend client, generated types, queries, optional Drizzle schema, helpers and repositories.

Steps to use:
1. Edit the SQL migration files in supabase/migrations/ to match your final schema.
2. Enable necessary extensions by running supabase/extensions/0000_extensions.sql.
3. Push migrations to your Supabase project in order.
4. Fill in RLS policies in supabase/policies/** before opening database to clients.
5. Populate db/types/supabase.ts by running: supabase gen types typescript --schema public > db/types/supabase.ts
6. Securely set SUPABASE_SERVICE_ROLE_KEY in server environment variables (only for server).
