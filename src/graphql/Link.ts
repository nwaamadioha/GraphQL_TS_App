import { extendType, objectType, nonNull, stringArg, intArg } from "nexus";
import { NexusGenObjects } from "../../nexus-typegen"

// Define an object type called Link that represents the links that can be posted to Hacker News
export const Link = objectType({
    name: "Link",
    definition(t) {
        t.nonNull.int("id");
        t.nonNull.string("description");
        t.nonNull.string("url");
        t.field("postedBy", {
            type: "User",
            resolve(parent, args, context) {
                return context.prisma.link
                    .findUnique({ where: { id: parent.id } })
                    .postedBy();
            },
        });
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
        t.nonNull.list.field("feeds", {
            type: "Link",
            resolve(parent, args, context, info) {
                return context.prisma.link.findMany();
            },
        });
        t.field("link", {
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