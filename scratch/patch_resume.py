import re

path = r'e:\Real Word Projects\alumni-dashboard\app\organization\[slug]\dashboard\jobs\[jobId]\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the resume block
old_start = '                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">'
old_end = '                        </div>\n                        \n'

# Find the position
start_idx = content.find(old_start)
if start_idx == -1:
    print("NOT FOUND - dumping context around line 405:")
    lines = content.split('\n')
    for i, l in enumerate(lines[402:412], start=403):
        print(f"{i}: {repr(l)}")
else:
    # Find the end of this specific div block (the one with Resume)
    end_idx = content.find('                        \n', start_idx) + len('                        \n')
    
    old_block = content[start_idx:end_idx]
    print(f"Found block ({len(old_block)} chars):")
    print(repr(old_block[:200]))
    
    new_block = """                        <div className="space-y-2">
                           <label className="text-xs font-semibold text-slate-600">Resume</label>
                           {(profile?.alumniProfile?.resumeUrl || profile?.studentProfile?.resumeUrl) && !resumeFile && (
                             <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                               <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center border border-slate-100"><FileText className="h-4 w-4 text-blue-600" /></div>
                               <div className="flex-1 min-w-0">
                                 <p className="text-xs font-semibold text-slate-700">Resume from your profile</p>
                                 <p className="text-[10px] text-slate-400">Will be submitted automatically</p>
                               </div>
                               <Badge className="bg-emerald-50 text-emerald-600 border-none text-[10px] font-semibold rounded-lg">Linked</Badge>
                             </div>
                           )}
                           {resumeFile ? (
                             <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                               <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center border border-blue-100"><FileText className="h-4 w-4 text-blue-600" /></div>
                               <div className="flex-1 min-w-0">
                                 <p className="text-xs font-semibold text-blue-700 truncate">{resumeFile.name}</p>
                                 <p className="text-[10px] text-blue-400">{(resumeFile.size / 1024).toFixed(0)} KB</p>
                               </div>
                               <button className="text-rose-500 text-xs font-semibold" onClick={() => setResumeFile(null)}>Remove</button>
                             </div>
                           ) : (
                             <button type="button" onClick={() => fileInputRef.current?.click()}
                               className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors">
                               + Upload a different resume (PDF, max 5MB)
                             </button>
                           )}
                           <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                             onChange={e => { const f = e.target.files?.[0]; if (f && f.size > 5*1024*1024) { toast.error('File must be under 5MB'); return; } if (f) setResumeFile(f); }} />
                        </div>
                        
"""
    
    content = content[:start_idx] + new_block + content[end_idx:]
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: Resume upload UI applied!")
