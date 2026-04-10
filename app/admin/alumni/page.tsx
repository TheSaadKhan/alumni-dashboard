"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Loader2, 
  Download, 
  Filter, 
  UserPlus,
  RefreshCw,
  MoreVertical,
  GraduationCap,
  ChevronRight,
  ShieldCheck,
  Globe,
  MoreHorizontal,
  Bookmark,
  Award
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuthProfile } from "@/context/AuthContext";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function AdminAlumniPage() {
  const { profile } = useAuthProfile();
  const [searchTerm, setSearchTerm] = useState("");
  const [alumni, setAlumni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = (profile as any)?.organizationId;

  const loadAlumni = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/users?organizationId=${orgId}&role=alumni&search=${searchTerm}`);
      if (res.ok) {
        const data = await res.json();
        setAlumni(data.users || []);
      }
    } catch {
      toast.error("Failed to synchronize graduate nodes");
    } finally {
      setLoading(false);
    }
  }, [orgId, searchTerm]);

  useEffect(() => {
    if (orgId) loadAlumni();
  }, [orgId, loadAlumni]);

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-8 animate-in fade-in duration-700">
      {/* Alumni Hub Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.3em]">Graduate Registry</span>
              <div className="h-1 w-1 rounded-full bg-slate-300"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{alumni.length} Identity Nodes</span>
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Alumni Directory</h1>
           <p className="text-slate-500 font-medium mt-1">Regulate platform-verified alumni identities and oversee academic credentials.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-11 rounded-xl font-bold text-slate-400 px-6">
             <RefreshCw className="h-4 w-4 mr-2" /> Sync Roster
           </Button>
           <Button className="h-11 rounded-xl font-bold px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10">
              <Download className="h-4 w-4 mr-2" /> Export Dataset
           </Button>
        </div>
      </div>

      {/* Directory Infrastructure */}
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row gap-4 mb-2">
            <div className="relative flex-1">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
               <Input 
                 placeholder="SEARCH NODES BY NAME, COHORT, OR TRACK..." 
                 className="pl-12 h-12 rounded-xl border-none bg-white shadow-sm text-[10px] font-black tracking-widest uppercase focus:ring-2 focus:ring-blue-500/10"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <Button variant="ghost" className="h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 bg-white shadow-sm">
               <Filter className="h-4 w-4 mr-2" /> Refine Matrix
            </Button>
         </div>

         <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
               {loading ? (
                  <div className="py-24 text-center">
                     <RefreshCw className="h-8 w-8 animate-spin text-slate-200 mx-auto mb-4" />
                     <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">Calibrating Directory Nodes</p>
                  </div>
               ) : alumni.length === 0 ? (
                  <div className="py-24 text-center">
                     <div className="h-16 w-16 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <GraduationCap className="h-8 w-8 text-slate-200" />
                     </div>
                     <h3 className="text-xl font-bold uppercase italic tracking-tighter">Null Registry</h3>
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mt-2">No graduate nodes identified in current matrix segment.</p>
                  </div>
               ) : (
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Institutional Identification</TableHead>
                        <TableHead className="py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-center">Academic Track</TableHead>
                        <TableHead className="py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-center">Temporal Node</TableHead>
                        <TableHead className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-right">Telemetry</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alumni.map((person) => (
                        <TableRow key={person.id} className="border-b border-slate-50/50 hover:bg-white/40 transition-all group">
                          <TableCell className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10 rounded-xl border-2 border-white shadow-sm">
                                 <AvatarImage src={person.imageUrl} />
                                 <AvatarFallback className="bg-slate-900 text-white font-black text-[10px] italic">{person.name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                 <p className="text-sm font-bold text-slate-900 uppercase italic leading-none truncate max-w-[200px]">{person.name}</p>
                                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1.5">{person.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                             <div className="flex flex-col items-center gap-1.5">
                                <Award className="h-4 w-4 text-indigo-100" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase italic">{person.degree || "B.Sc. Global Governance"}</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-center">
                             <Badge variant="outline" className="rounded-lg border-none bg-indigo-50 text-[9px] font-black uppercase tracking-widest text-indigo-600 px-3 py-1 italic">
                                COHORT {person.batch_year || "2024"}
                             </Badge>
                          </TableCell>
                          <TableCell className="px-8 text-right">
                             <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-blue-50 text-slate-200 hover:text-slate-400">
                                <MoreHorizontal className="h-4 w-4" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
               )}
            </div>
            <CardFooter className="p-8 border-t border-slate-50 flex justify-between items-center bg-slate-50/30">
               <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">{alumni.length} GRADUATE IDENTITIES VERIFIED</p>
               <Button variant="ghost" className="h-9 px-6 rounded-xl font-bold uppercase tracking-widest text-[9px] text-blue-600 hover:bg-blue-50">
                  Network Synergy <ChevronRight className="h-3 w-3 ml-2" />
               </Button>
            </CardFooter>
         </Card>
      </div>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Integrated Alumni Directory v1.1.2 • Verified Identities</p>
      </footer>
    </div>
  );
}
