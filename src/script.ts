import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const newLink = await prisma.link.create({
        data: {
            description: "Fullstack tutorial for Graphql",
            url: "www.ebonyishops.com",
        },
    })
    const allLinks = await prisma.link.findMany();
}

main()
    .catch((e) => {
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });