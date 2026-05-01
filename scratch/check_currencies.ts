import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const currencies = await prisma.currency.findMany()
  console.log('Available Currencies:', currencies)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
