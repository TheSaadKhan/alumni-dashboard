"use client";

import { Check, Zap, Shield, Globe, ArrowRight, MessageCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      <div className="container max-w-7xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
          <Badge variant="outline" className="px-4 py-1.5 rounded-full border-indigo-200 bg-indigo-50 text-indigo-600 font-bold tracking-wide uppercase text-[10px]">
            Institutional Solutions
          </Badge>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white">
            Empower Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 italic">Community</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium leading-relaxed">
            Scalable architecture for alumni networks of all sizes. Choose the protocol that fits your institution's growth vector.
          </p>
        </div>

        {/* Pricing Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter Plan */}
          <PricingCard
            title="Essential"
            price="0"
            description="Perfect for small communities starting their networking journey."
            features={[
              "Up to 500 Active Members",
              "Standard Job Board Access",
              "Community Networking Nodes",
              "Basic Analytics Stream",
              "Public Discussion Forums"
            ]}
            icon={<Globe className="h-6 w-6 text-slate-400" />}
            onAction={() => router.push("/sign-up")}
          />

          {/* Professional Plan (Highlighted) */}
          <PricingCard
            title="Nexus Pro"
            price="49"
            description="Advanced engagement tools for growing institutional networks."
            features={[
              "Unlimited Community Members",
              "Premium Mentorship Module",
              "Global Event Management",
              "Advanced Career Analytics",
              "Custom Branding Nodes",
              "Priority API Access"
            ]}
            highlighted
            icon={<Zap className="h-6 w-6 text-white" />}
            onAction={() => router.push("/sign-up?plan=pro")}
          />

          {/* Enterprise Plan */}
          <PricingCard
            title="Elite"
            price="Custom"
            description="Full-scale infrastructure for global university systems."
            features={[
              "Multi-Campus Hierarchy",
              "White-Label Governance",
              "Direct Database Access",
              "Dedicated Protocol Manager",
              "SSO & Security Compliance",
              "Custom Integration Matrix"
            ]}
            icon={<Shield className="h-6 w-6 text-slate-400" />}
            onAction={() => router.push("/contact")}
            buttonText="Consult with Experts"
          />
        </div>

        {/* Comparison Quote */}
        <div className="mt-32 p-12 rounded-[3rem] bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Star className="h-64 w-64 rotate-12" />
          </div>
          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight">Need something more tailored?</h2>
              <p className="text-slate-400 leading-relaxed">
                Our architecture is modular. If your institution has unique requirements, our engineers can customize the protocol to your exact specifications.
              </p>
              <div className="flex gap-4">
                <Button variant="secondary" className="rounded-xl font-bold h-12 px-8">
                  View Full Specs
                </Button>
                <Button variant="ghost" className="rounded-xl font-bold h-12 text-slate-400 hover:text-white">
                  Schedule Demo
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-2xl font-black mb-1">99.9%</h3>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Uptime Protocol</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-2xl font-black mb-1">256-bit</h3>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Encryption Node</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-2xl font-black mb-1">50ms</h3>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Global Latency</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-2xl font-black mb-1">24/7</h3>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Expert Support</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-32 space-y-12">
          <div className="text-center">
             <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Protocols</h2>
             <p className="text-slate-500 mt-2">Answers to common infrastructure inquiries.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
             {[
               { q: "Can we switch plans at any time?", a: "Absolutely. Our billing protocol is dynamic. You can upgrade or downgrade your tier at any cycle transition." },
               { q: "Is there a limit on file storage?", a: "Starter plans have a 5GB limit. Professional and Elite tiers feature unlimited distributed storage for all institutional assets." },
               { q: "Do you offer non-profit discounts?", a: "Yes. Registered non-profit organizations are eligible for a 40% reduction in subscription fees. Contact support for verification." },
               { q: "How secure is our member data?", a: "We utilize multi-layer encryption and SOC2 compliant protocols. Your member data is isolated and never shared with third-party entities." }
             ].map((faq, i) => (
               <div key={i} className="space-y-3 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-indigo-500" /> {faq.q}
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ 
  title, 
  price, 
  description, 
  features, 
  highlighted = false, 
  icon, 
  onAction,
  buttonText = "Initialize Plan"
}: any) {
  return (
    <div className={`relative p-8 rounded-[2.5rem] flex flex-col h-full transition-all duration-500 group ${
      highlighted 
        ? "bg-slate-900 text-white shadow-2xl scale-105 z-10 translate-y-[-8px]" 
        : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:translate-y-[-4px]"
    }`}>
      {highlighted && (
        <div className="absolute top-0 right-0 m-8">
           <Badge className="bg-indigo-600 text-white border-none font-black text-[9px] tracking-widest px-3 py-1 uppercase italic">RECOMENDED</Badge>
        </div>
      )}

      <div className={`h-14 w-14 rounded-2xl mb-8 flex items-center justify-center transition-transform group-hover:scale-110 ${
        highlighted ? "bg-indigo-600" : "bg-slate-50 dark:bg-slate-800"
      }`}>
        {icon}
      </div>

      <h3 className="text-xl font-bold tracking-tight mb-2 uppercase italic leading-none">{title}</h3>
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-4xl font-black tracking-tighter italic">
          {price === "Custom" ? "" : "$"}
          {price}
        </span>
        {price !== "Custom" && price !== "0" && <span className={`text-sm font-bold uppercase tracking-widest ${highlighted ? "text-slate-500" : "text-slate-400"}`}>/mo</span>}
        {price === "0" && <span className={`text-sm font-bold uppercase tracking-widest ${highlighted ? "text-slate-500" : "text-slate-400"}`}>Free</span>}
      </div>
      <p className={`text-sm font-medium leading-relaxed mb-8 ${highlighted ? "text-slate-400" : "text-slate-500"}`}>
        {description}
      </p>

      <div className="space-y-4 mb-10 flex-1">
        {features.map((f: string, i: number) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`h-5 w-5 rounded-full flex items-center justify-center ${highlighted ? "bg-emerald-500/20 text-emerald-500" : "bg-emerald-100 text-emerald-600"}`}>
               <Check className="h-3 w-3 font-black" />
            </div>
            <span className={`text-xs font-bold uppercase tracking-wide ${highlighted ? "text-slate-300" : "text-slate-600"}`}>{f}</span>
          </div>
        ))}
      </div>

      <Button 
        onClick={onAction}
        className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all group ${
          highlighted 
            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20" 
            : "bg-slate-50 hover:bg-slate-900 hover:text-white dark:bg-slate-800 dark:hover:bg-white dark:hover:text-black"
        }`}
      >
        {buttonText} <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
  );
}