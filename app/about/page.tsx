"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Target, Heart, Globe, Users, Award, Shield, ArrowRight, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "50K+", label: "Verified Nodes", icon: Globe, color: "text-blue-500" },
  { value: "120+", label: "Global Campus", icon: MapPin, color: "text-emerald-500" },
  { value: "95%", label: "Synergy Rate", icon: Zap, color: "text-amber-500" },
  { value: "24/7", label: "Relay Uptime", icon: Shield, color: "text-indigo-500" },
];

import { MapPin } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Abstract Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-indigo-500/5 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      <div className="container max-w-7xl mx-auto px-6 py-24 space-y-32">
        {/* Hero Section */}
        <section className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <Badge variant="outline" className="px-4 py-1.5 rounded-full border-indigo-200 bg-indigo-50 text-indigo-600 font-bold tracking-wide uppercase text-[10px]">
            Institutional Evolution
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Architecting the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 italic">Future of Connection</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed">
            Career Nexus is more than a platform. It's a high-performance protocol designed to bridge the gap between academic excellence and global professional impact.
          </p>
          <div className="flex justify-center gap-4 pt-4">
             <Button className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 font-bold uppercase tracking-widest text-[10px]">
                Explore Our Thesis
             </Button>
             <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-200 font-bold uppercase tracking-widest text-[10px] text-slate-500">
                Contact Protocol Office
             </Button>
          </div>
        </section>

        {/* Core Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <Card className="rounded-[3rem] border-none shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden group">
              <CardContent className="p-12 space-y-8">
                 <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                    <Target className="h-8 w-8 text-white" />
                 </div>
                 <div className="space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight italic uppercase">Our Mission</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">
                       To synchronize global alumni intelligence, creating a seamless data-driven environment where every graduate has the resources to scale their professional trajectory while contributing back to the institutional core.
                    </p>
                 </div>
                 <ul className="space-y-3">
                    {["Member Synergy", "Verified Credentials", "Global Mentorship"].map((item, i) => (
                       <li key={i} className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-400">
                          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                          {item}
                       </li>
                    ))}
                 </ul>
              </CardContent>
           </Card>

           <Card className="rounded-[3rem] border-none shadow-2xl bg-slate-900 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                 <Award className="h-64 w-64 rotate-12" />
              </div>
              <CardContent className="p-12 space-y-8 relative z-10">
                 <div className="h-16 w-16 rounded-[1.5rem] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                    <Heart className="h-8 w-8 text-purple-400" />
                 </div>
                 <div className="space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight italic uppercase">Our Vision</h2>
                    <p className="text-slate-400 font-medium leading-relaxed">
                       To become the universal infrastructure for alumni engagement, setting the standard for institutional networking through cutting-edge technology, elegant interface design, and uncompromised security protocols.
                    </p>
                 </div>
                 <ul className="space-y-3">
                    {["Absolute Privacy", "Decentralized Growth", "Infinite Connectivity"].map((item, i) => (
                       <li key={i} className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-500">
                          <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                          {item}
                       </li>
                    ))}
                 </ul>
              </CardContent>
           </Card>
        </section>

        {/* Stats Matrix */}
        <section className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 md:p-20 shadow-sm border border-slate-100 dark:border-slate-800">
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
              {stats.map((stat, i) => (
                 <div key={i} className="text-center space-y-4 group">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center transition-all group-hover:bg-indigo-600 group-hover:translate-y-[-4px]">
                       <stat.icon className={`h-6 w-6 ${stat.color} group-hover:text-white transition-colors`} />
                    </div>
                    <div>
                       <div className="text-4xl font-black tracking-tighter italic text-slate-900 dark:text-white">{stat.value}</div>
                       <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">{stat.label}</div>
                    </div>
                 </div>
              ))}
           </div>
        </section>

        {/* Culture Section */}
        <section className="space-y-16">
           <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight italic uppercase">The Culture of Excellence</h2>
              <p className="text-slate-500 max-w-2xl mx-auto font-medium">We operate at the intersection of design, technology, and community. Our internal protocols ensure every update pushes the boundary of what's possible.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Design Driven", desc: "Every pixel is scrutinized. Every interaction is choreographed. We believe aesthetic excellence drives engagement.", icon: Sparkles },
                { title: "Security First", desc: "Member data is sacred. We implement multi-layered encryption nodes to ensure total privacy and data isolation.", icon: Shield },
                { title: "Network Impact", desc: "We measure success by the quality of connections established and the scale of professional impact achieved.", icon: Award },
              ].map((item, i) => (
                <div key={i} className="p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 hover:shadow-xl group">
                   <item.icon className="h-6 w-6 text-slate-300 mb-6 group-hover:text-indigo-600 transition-colors" />
                   <h3 className="text-lg font-bold italic uppercase mb-2">{item.title}</h3>
                   <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
           </div>
        </section>

        {/* CTA Footer */}
        <section className="bg-indigo-600 rounded-[4rem] p-12 md:p-24 text-center text-white relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-700 opacity-50" />
           <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight italic">Ready to Initialize Your Legacy?</h2>
              <p className="text-indigo-100 max-w-xl mx-auto font-medium">Join the thousands of alumni who have already upgraded their institutional engagement protocol.</p>
              <Button className="h-16 px-12 rounded-2xl bg-white text-indigo-600 hover:bg-slate-50 shadow-2xl shadow-black/20 font-black uppercase tracking-[0.2em] text-[10px]">
                 Launch Your Node <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
           </div>
        </section>
      </div>

      <footer className="py-12 border-t border-slate-100 text-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Career Nexus Protocol • Est. 2024 • Version 2.0.4</p>
      </footer>
    </div>
  );
}

import { Sparkles } from "lucide-react";
