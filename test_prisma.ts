import { prisma } from './lib/prisma';

async function main() {
  const users = await prisma.user.findMany({ take: 5 });
  console.log("Users total:", users.length);
  if (users.length > 0) {
    const user = users[0];
    const clerkId = (user.metadata as any)?.clerkId;
    console.log("Sample ClerkId:", clerkId);
    
    if (clerkId) {
      const match = await prisma.user.findFirst({
        where: {
          metadata: {
            path: ['clerkId'],
            equals: clerkId
          }
        }
      });
      console.log("Match using path:", !!match);
      
      const match2 = await prisma.user.findFirst({
        where: {
          metadata: {
            string_contains: clerkId // Prisma json string_contains is different...
          }
        }
      });
      console.log("Match using contains?", match2);
      
      // Let's just list all metadata
      console.log("Metadata:", user.metadata);
    }
  }
}
main().catch(console.error);
