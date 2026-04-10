"use client";

import { useParams, useRouter } from "next/navigation";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  DollarSign, 
  User, 
  Calendar, 
  Mail, 
  Download, 
  Receipt, 
  Building2, 
  Settings,
  ShieldCheck,
  Globe,
  Zap,
  Activity,
  Award,
  ChevronRight,
  TrendingUp,
  Clock,
  ExternalLink,
  FileText,
  Users
} from "lucide-react";

export default function DonationDetailPage() {
  const params = useParams();
  const router = useRouter();

  // Mock donation data
  const donation = {
    id: params.donationId,
    donor: {
      name: "Sarah Chen",
      email: "sarah.chen@example.com",
      phone: "+1 (555) 123-4567",
      batch: "2015",
      company: "TechCorp"
    },
    amount: 10000,
    type: "one-time",
    status: "completed",
    campaign: "Scholarship Program",
    date: "2024-01-15",
    method: "Credit Card",
    receipt: "RC-2024-001",
    notes: "Thank you for supporting our scholarship program!",
    frequency: "one-time",
    nextPayment: null
  };

  const transactionHistory = [
    { id: 1, date: "2024-01-15", amount: 10000, status: "completed", method: "Credit Card" },
    { id: 2, date: "2023-12-15", amount: 10000, status: "completed", method: "Credit Card" },
    { id: 3, date: "2023-11-15", amount: 10000, status: "completed", method: "Credit Card" }
  ];

  const donorStats = {
    totalDonated: 30000,
    donationCount: 3,
    firstDonation: "2023-11-15",
    preferredMethod: "Credit Card",
    avgDonation: 10000
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-10 animate-in fade-in duration-700">
      {/* Transaction Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900" onClick={() => router.push("/admin/donations")}>
              <ArrowLeft className="h-4 w-4" />
           </Button>
           <div>
              <div className="flex items-center gap-2 mb-1">
                 <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Financial Matrix</span>
                 <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Asset Verification</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Transaction Analysis</h1>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-11 rounded-xl font-bold text-slate-400 px-6 uppercase text-[10px] tracking-widest">
              <Receipt className="h-4 w-4 mr-3" /> PDF Receipt
           </Button>
           <Button className="h-11 rounded-xl font-bold px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10 uppercase text-[10px] tracking-widest">
              <Settings className="h-4 w-4 mr-3" /> Audit Control
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-10">
           <Tabs defaultValue="details" className="w-full">
              <TabsList className="bg-slate-100 dark:bg-slate-950/40 p-1.5 rounded-2xl w-fit flex gap-1 mb-8 overflow-x-auto no-scrollbar">
                 <TabsTrigger value="details" className="h-9 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400">Transaction Details</TabsTrigger>
                 <TabsTrigger value="history" className="h-9 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400">Financial History</TabsTrigger>
                 <TabsTrigger value="donor" className="h-9 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400">Entity Metrics</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="m-0 animate-in fade-in slide-in-from-bottom-2">
                 <div className="space-y-10">
                    <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-10">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-8">
                             <div>
                                <h3 className="text-xl font-bold italic uppercase tracking-tighter mb-6">Asset Specification</h3>
                                <div className="space-y-4">
                                   {[
                                     { label: "Nominal Yield", value: `$${donation.amount.toLocaleString()}`, color: "text-emerald-600" },
                                     { label: "Temporal Date", value: new Date(donation.date).toLocaleDateString() },
                                     { label: "Transfer Protocol", value: donation.method },
                                     { label: "Identity Hash", value: donation.receipt },
                                   ].map((item, i) => (
                                     <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50/50">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                        <span className={`text-sm font-bold italic ${item.color || "text-slate-900"}`}>{item.value}</span>
                                     </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                          <div className="space-y-8">
                             <div>
                                <h3 className="text-xl font-bold italic uppercase tracking-tighter mb-6">Campaign Objective</h3>
                                <div className="space-y-4">
                                   <div className="p-6 rounded-2xl bg-slate-50 border-none">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Internal Designation</p>
                                      <p className="text-sm font-bold text-slate-900 uppercase italic">{donation.campaign}</p>
                                   </div>
                                   <div className="p-6 rounded-2xl bg-slate-50 border-none">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Frequency Logic</p>
                                      <Badge className="bg-blue-100 text-blue-600 border-none rounded-lg text-[9px] font-black uppercase tracking-widest px-3 py-1 italic">{donation.type}</Badge>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                       {donation.notes && (
                          <div className="mt-12 p-8 rounded-3xl bg-indigo-50/30 border border-indigo-100/20">
                             <div className="flex items-center gap-3 mb-4">
                                <FileText className="h-4 w-4 text-indigo-400" />
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Strategic Context (Notes)</span>
                             </div>
                             <p className="text-sm font-medium text-slate-600 leading-relaxed italic">{donation.notes}</p>
                          </div>
                       )}
                    </Card>

                    <Card className="border-none shadow-sm rounded-[3rem] bg-indigo-600 p-10 text-white relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000 rotate-12">
                          <Activity className="h-48 w-48" />
                       </div>
                       <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10">
                          {[
                            { label: "Entities Supported", value: "2", icon: Users, desc: "Scholarship Nodes" },
                            { label: "Programs Funded", value: "1", icon: Building2, desc: "Academic Stream" },
                            { label: "Cycle Yield", value: "6 Mo", icon: TrendingUp, desc: "Continuous Support" },
                          ].map((item, i) => (
                             <div key={i} className="text-center md:text-left">
                                <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center mb-6 backdrop-blur-md">
                                   <item.icon className="h-6 w-6" />
                                </div>
                                <p className="text-4xl font-bold tracking-tighter mb-1">{item.value}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100/70 mb-1">{item.label}</p>
                                <p className="text-[9px] text-indigo-100/40 font-bold uppercase tracking-widest italic">{item.desc}</p>
                             </div>
                          ))}
                       </div>
                    </Card>
                 </div>
              </TabsContent>

              <TabsContent value="history" className="m-0 animate-in fade-in slide-in-from-bottom-2">
                 <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden">
                    <Table>
                       <TableHeader className="bg-slate-50/50">
                          <TableRow className="border-none hover:bg-transparent">
                             <TableHead className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Temporal Cycle</TableHead>
                             <TableHead className="py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-center">Nominal Yield</TableHead>
                             <TableHead className="py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-center">Transfer Protocol</TableHead>
                             <TableHead className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-right">Verification</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {transactionHistory.map((t) => (
                             <TableRow key={t.id} className="border-b border-slate-50/50 hover:bg-white/40 transition-all">
                                <TableCell className="px-10 py-6">
                                   <div className="flex items-center gap-3">
                                      <Clock className="h-3.5 w-3.5 text-slate-300" />
                                      <span className="text-sm font-bold text-slate-900 uppercase italic">{new Date(t.date).toLocaleDateString()}</span>
                                   </div>
                                </TableCell>
                                <TableCell className="text-center text-sm font-bold italic text-emerald-600">${t.amount.toLocaleString()}</TableCell>
                                <TableCell className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.method}</TableCell>
                                <TableCell className="px-10 text-right">
                                   <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-lg text-[9px] font-black uppercase tracking-widest px-3 py-1 italic">Verified</Badge>
                                </TableCell>
                             </TableRow>
                          ))}
                       </TableBody>
                    </Table>
                 </Card>
              </TabsContent>

              <TabsContent value="donor" className="m-0 animate-in fade-in slide-in-from-bottom-2">
                 <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-10">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
                       <Avatar className="h-24 w-24 rounded-[2rem] border-4 border-white shadow-xl">
                          <AvatarImage src={`/avatars/${donation.donor.name.toLowerCase().replace(' ', '-')}.jpg`} />
                          <AvatarFallback className="bg-slate-900 text-white font-black text-lg italic">{donation.donor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                       </Avatar>
                       <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-10 w-full text-center md:text-left">
                          <div>
                             <h3 className="text-xl font-bold italic uppercase tracking-tighter mb-6">Entity Coordinates</h3>
                             <div className="space-y-4">
                                <div className="flex items-center justify-center md:justify-start gap-4 p-4 rounded-2xl bg-slate-50">
                                   <Mail className="h-4 w-4 text-slate-300" />
                                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{donation.donor.email}</span>
                                </div>
                                <div className="flex items-center justify-center md:justify-start gap-4 p-4 rounded-2xl bg-slate-50">
                                   <Building2 className="h-4 w-4 text-slate-300" />
                                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{donation.donor.company}</span>
                                </div>
                             </div>
                          </div>
                          <div>
                             <h3 className="text-xl font-bold italic uppercase tracking-tighter mb-6">Nodal Statistics</h3>
                             <div className="space-y-3">
                                {[
                                  { label: "Institutional Batch", value: `Class of ${donation.donor.batch}` },
                                  { label: "Aggregate Yield", value: `$${donorStats.totalDonated.toLocaleString()}`, color: "text-emerald-600" },
                                  { label: "Donation Pulse", value: `${donorStats.donationCount} Units` },
                                ].map((stat, i) => (
                                   <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50/50">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                                      <span className={`text-[11px] font-bold italic uppercase tracking-tighter ${stat.color || "text-slate-900"}`}>{stat.value}</span>
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                 </Card>
              </TabsContent>
           </Tabs>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-8">
           <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 backdrop-blur-xl p-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic mb-8">Asset Control Protocol</h4>
              <div className="space-y-3">
                 {[
                   { label: "Dispatch Receipt", icon: Receipt, sub: "PDF Protocol" },
                   { label: "Entity Relay", icon: Mail, sub: "Institutional Message" },
                   { label: "Payload Export", icon: Download, sub: "JSON Object" },
                   { label: "Process Refund", icon: DollarSign, sub: "Financial Reversion", danger: true }
                 ].map((action, i) => (
                    <button 
                       key={i} 
                       className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all group ${action.danger ? "hover:bg-rose-50" : "hover:bg-slate-50"}`}
                    >
                       <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center transition-colors ${action.danger ? "text-rose-400 group-hover:text-rose-600" : "text-slate-300 group-hover:text-blue-600"}`}>
                             <action.icon className="h-4 w-4" />
                          </div>
                          <div className="text-left">
                             <p className={`text-[11px] font-bold uppercase italic ${action.danger ? "text-rose-600" : "text-slate-900"}`}>{action.label}</p>
                             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">{action.sub}</p>
                          </div>
                       </div>
                       <ChevronRight className={`h-3.5 w-3.5 transition-transform ${action.danger ? "text-rose-100 group-hover:text-rose-300" : "text-slate-100 group-hover:text-slate-400"}`} />
                    </button>
                 ))}
              </div>
           </Card>

           <Card className="border-none shadow-sm rounded-[2.5rem] bg-slate-900 p-8 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-32 w-32 bg-blue-500/20 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>
              <div className="relative z-10 flex flex-col gap-6">
                 <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                    <ShieldCheck className="h-6 w-6 text-blue-400" />
                 </div>
                 <div>
                    <h4 className="text-xl font-bold uppercase italic tracking-tighter">Security Posture</h4>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 leading-loose">Asset verified at Node level. No discrepancies identified in transaction hash RC-2024-001.</p>
                 </div>
                 <Button variant="ghost" className="w-full h-12 rounded-2xl border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/5">
                    Verify Identity Node <ExternalLink className="h-3.5 w-3.5 ml-3" />
                 </Button>
              </div>
           </Card>
        </div>
      </div>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Integrated Financial Governor v1.1.2 • Verified Assets Only</p>
      </footer>
    </div>
  );
}