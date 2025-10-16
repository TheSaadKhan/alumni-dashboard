// app/page.tsx

import Navbar from "@/components/ui/navbar";


const navItems = [

  { name: 'Dashboard', href: '#dashboard', current: false },
  { name: 'Directory', href: '#directory', current: false },
  { name: 'Events', href: '#events', current: true },
  { name: 'Jobs', href: '#jobs', current: false },
  { name: 'News', href: '#news', current: false },
  { name: 'Messaging', href: '#messaging', current: false },
  { name: 'Donations', href: '#donations', current: false },
  { name: 'Mentorship', href: '#mentorship', current: false },


]


export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navbar */}
      <Navbar navigation={navItems} />
      {/* Main content */}
      <div className=" p-6">
        <h1 className="text-3xl font-bold">Welcome Home</h1>
        <p>This is your homepage content.</p>
      </div>
    </main>
  );
}
