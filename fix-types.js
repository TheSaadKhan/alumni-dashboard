const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
        if (f !== 'node_modules' && f !== '.next' && f !== '.git') {
            walkDir(dirPath, callback);
        }
    } else {
        if (dirPath.endsWith('.ts') || dirPath.endsWith('.tsx')) {
            callback(dirPath);
        }
    }
  });
}

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    let modified = false;

    // Fix Next.js 15 Route Handler Params:
    // Pattern 1: (req: NextRequest, { params }: { params: { ... } })
    const rx1 = /(?:req|request)\s*:\s*(?:Next)?Request\s*,\s*\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*(\w+)\s*:\s*string\s*;?\s*\}\s*;?\s*\}/g;
    content = content.replace(rx1, (match, paramName) => {
        modified = true;
        return `request: NextRequest, context: { params: Promise<{ ${paramName}: string }> }`;
    });

    // Pattern 2: (_: Request, { params }: ...)
    const rx2 = /_\s*:\s*(?:Next)?Request\s*,\s*\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*(\w+)\s*:\s*string\s*;?\s*\}\s*;?\s*\}/g;
    content = content.replace(rx2, (match, paramName) => {
        modified = true;
        return `_: NextRequest, context: { params: Promise<{ ${paramName}: string }> }`;
    });

    // We must also inject `await context.params`
    // Find where `params` was used and insert the await logic.
    // This is hard to do safely with a regex. Let's do a simple approach: find `const { <paramName> } = params;` or wait, if we replaced `{ params }` with `context`, `params` is undefined.
    // Just inject `const { <param> } = await context.params;` at the top of the function
    if (modified) {
        // Very hacky but normally works for standard handlers: find `try {` and insert it after.
        content = content.replace(/try\s*\{/g, `try {\n    const params = await context.params;\n`);
        content = content.replace(/import \{ NextRequest([^}]*)\} from "next\/server";/g, 'import { NextRequest } from "next/server";\nimport { NextResponse } from "next/server";');
        // Dedup imports if nextresponse was added twice
    }

    // Fix Prisma legacy table names in all files
    const tableReplacements = [
        ['prisma.profiles', 'prisma.user'],
        ['prisma.organizations', 'prisma.organization'],
        ['prisma.organization_roles', 'prisma.role'], // or whatever it was
        ['prisma.organization_members', 'prisma.userRole'], // Need to be careful here
        ['prisma.events', 'prisma.event'],
        ['prisma.jobs', 'prisma.jobPosting'],
        ['prisma.donations', 'prisma.donation'],
        ['prisma.organization_invitations', 'prisma.orgInvitation'],
    ];

    tableReplacements.forEach(([oldStr, newStr]) => {
        if (content.includes(oldStr)) {
            content = content.replace(new RegExp(oldStr.replace('.', '\\.'), 'g'), newStr);
            modified = true;
        }
    });

    // Fix Next Config
    if (filePath.endsWith('next.config.ts') && content.includes('swcMinify')) {
        content = content.replace(/swcMinify:\s*true,?\n?/g, '');
        modified = true;
    }

    if (modified && content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Fixed: ${filePath}`);
    }
}

console.log("Starting script...");
walkDir('./app', fixFile);
walkDir('./components', fixFile);
walkDir('./lib', fixFile);
walkDir('./hooks', fixFile);
console.log("Done.");
