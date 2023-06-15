import { extendType, objectType, nonNull, stringArg, intArg, inputObjectType, enumType, arg, list } from "nexus";
import { Prisma } from "@prisma/client";

// Define an object type called Link that represents the links that can be posted to Hacker News
export const Link = objectType({
    name: "Link",
    definition(t) {
        t.nonNull.int("id");
        t.nonNull.string("description");
        t.nonNull.string("url");
        t.nonNull.dateTime("createdAt");
        t.field("postedBy", {
            type: "User",
            resolve(parent, args, context) {
                return context.prisma.link
                    .findUnique({ where: { id: parent.id } })
                    .postedBy();
            },
        });
        t.nonNull.list.nonNull.field("voters", {
            type: "User",
            resolve(parent, args, context) {
                return context.prisma.link
                    .findUnique({ where: { id: parent.id } })
                    .voters();
            }
        })
    },
});

// Define a Message type to return messages after an operation has been carried out
export const Message = objectType({
    name: "Message",
    definition(t) {
        t.nonNull.string("message");
        t.nonNull.boolean("success");
    },
});

// Extend the Query root type and adding a new root field to it called feed.
export const LinkQuery = extendType({
    type: "Query",
    definition(t) {
        t.nonNull.list.field("feed", { //list of links
            type: "Link",
            args: {
                filter: stringArg(),
                skip: intArg(),
                take: intArg(),
                orderBy: arg({ type: list(nonNull(LinkOrderByInput))}),
            },
            resolve(parent, args, context, info) {
                const where = args.filter
                    ? {
                        OR: [
                            { description: { contains: args.filter } },
                            { url: { contains: args.filter } },
                        ]
                    } : {};
                return context.prisma.link.findMany({
                    where,
                    skip: args?.skip as number | undefined,
                    take: args?.take as number | undefined,
                    orderBy: args?.orderBy as Prisma.Enumerable<Prisma.LinkOrderByWithRelationInput> | undefined,
                });
            },
        });
        t.field("link", { //a single link
            type: "Link",
            args: {
                id: nonNull(intArg()),
            },

            resolve(parent, args, context, info) {
                const linkID = args.id;
                return context.prisma.link.findUnique({ where: { id: linkID } })
            },
        });
    },
});

// Extend the Mutation type to add a new root field called post
export const LinkMutation = extendType({
    type: "Mutation",
    definition(t) {
        t.nonNull.field("post", {
            type: "Link",
            args: {
                description: nonNull(stringArg()),
                url: nonNull(stringArg()),
            },
            resolve(parent, args, context) {
                const { description, url } = args;
                const { userId } = context;

                if (!userId) {
                    throw new Error("Cannot post without loggin in")
                }
                const newLink = context.prisma.link.create({
                    data: {
                        description: description,
                        url: url,
                        postedBy: { connect: { id: userId } }
                    },
                });
                return newLink
            },
        });
        t.nonNull.field("updateLink", {
            type: "Message",
            args: {
                id: nonNull(intArg()),
                description: nonNull(stringArg()),
                url: nonNull(stringArg()),
            },
            async resolve(parent, args, context) {
                const { id, url, description } = args;
                const updatedLink = await context.prisma.link.update({ where: { id: id }, data: { description: description, url: url } });
                if (updatedLink) {
                    return { message: "UPDATED SUCCESSFULLY", success: true };
                } else {
                    return { message: "SOMETHING WENT WRONG", success: false };
                }
            }
        });
        t.nonNull.field("deleteLink", {
            type: "Message",
            args: { id: nonNull(intArg()) },
            async resolve(parent, args, context) {
                const id = args.id;
                const deletedLink = await context.prisma.link.delete({ where: { id: id } })
                if (deletedLink) {
                    return { message: "DELETED SUCCESSFULLY", success: true };
                } else {
                    return { message: "SOMETHING WENT WRONG", success: false };
                }
            },
        });
    },
});

//Add a field LinkOrderInput for sorting links
export const LinkOrderByInput = inputObjectType({
    name: "LinkOrderInput",
    definition(t) {
        t.field("description", {type: Sort});
        t.field("url", {type: Sort});
        t.field("createdAt", {type: Sort});
    },
});

export const Sort = enumType({
    name: "Sort",
    members: ["asc", "desc"],
})