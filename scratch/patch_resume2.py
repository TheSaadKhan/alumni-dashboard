path = r'e:\Real Word Projects\alumni-dashboard\app\organization\[slug]\dashboard\jobs\[jobId]\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = [
    '                       <div className="space-y-2">\n',
    '                          <label className="text-xs font-semibold text-slate-600">Resume</label>\n',
    '                          {(profile?.alumniProfile?.resumeUrl || profile?.studentProfile?.resumeUrl) && !resumeFile && (\n',
    '                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">\n',
    '                              <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center border border-slate-100"><FileText className="h-4 w-4 text-blue-600" /></div>\n',
    '                              <div className="flex-1 min-w-0">\n',
    '                                <p className="text-xs font-semibold text-slate-700">Resume from your profile</p>\n',
    '                                <p className="text-[10px] text-slate-400">Will be submitted automatically</p>\n',
    '                              </div>\n',
    '                              <Badge className="bg-emerald-50 text-emerald-600 border-none text-[10px] font-semibold rounded-lg">Linked</Badge>\n',
    '                            </div>\n',
    '                          )}\n',
    '                          {resumeFile ? (\n',
    '                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">\n',
    '                              <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center border border-blue-100"><FileText className="h-4 w-4 text-blue-600" /></div>\n',
    '                              <div className="flex-1 min-w-0">\n',
    '                                <p className="text-xs font-semibold text-blue-700 truncate">{resumeFile.name}</p>\n',
    '                                <p className="text-[10px] text-blue-400">{(resumeFile.size / 1024).toFixed(0)} KB</p>\n',
    '                              </div>\n',
    "                              <button className=\"text-rose-500 text-xs font-semibold\" onClick={() => setResumeFile(null)}>Remove</button>\n",
    '                            </div>\n',
    '                          ) : (\n',
    '                            <button type="button" onClick={() => fileInputRef.current?.click()}\n',
    '                              className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors">\n',
    '                              + Upload a different resume (PDF, max 5MB)\n',
    '                            </button>\n',
    '                          )}\n',
    '                          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"\n',
    "                            onChange={e => { const f = e.target.files?.[0]; if (f && f.size > 5*1024*1024) { toast.error('File must be under 5MB'); return; } if (f) setResumeFile(f); }} />\n",
    '                       </div>\n',
    '                       \n',
]

# Replace lines 404..421 (0-indexed), i.e. Python slice [404:422]
result = lines[:404] + new_lines + lines[422:]
with open(path, 'w', encoding='utf-8') as f:
    f.writelines(result)
print(f'SUCCESS: Resume upload UI replaced. Total lines: {len(result)}')
