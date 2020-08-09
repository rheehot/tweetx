import getUserId from '../utils/getUserId';

const Query = {
  users(parent, args, { prisma }, info) {
    const opArgs = {
      first: args.first,
      skip: args.skip,
      after: args.after,
      orderBy: args.orderBy,
    };

    if (args.query) {
      opArgs.where = {
        username_contains: args.query,
      };
    }

    return prisma.query.users(opArgs, info);
  },
  me(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    return prisma.query.user(
      {
        where: {
          id: userId,
        },
      },
      info,
    );
  },
  async user(parent, args, { prisma }, info) {
    const user = await prisma.query.user(
      {
        where: {
          id: args.id,
        },
      },
      info,
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },
  posts(parent, args, { prisma }, info) {
    const opArgs = {
      first: args.first,
      skip: args.skip,
      after: args.after,
      orderBy: args.orderBy,
    };

    if (args.query) {
      opArgs.where = {
        content_contains: args.query,
      };
    }

    return prisma.query.posts(opArgs, info);
  },
  async post(parent, args, { prisma }, info) {
    const post = await prisma.query.post(
      {
        where: {
          id: args.id,
        },
      },
      info,
    );

    if (!post) {
      throw new Error('Post not found');
    }

    return post;
  },
  followers(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    return prisma.query.follows(
      {
        where: {
          following: {
            id: userId,
          },
        },
      },
      info,
    );
  },
  followings(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);
    return prisma.query.follows(
      {
        where: {
          follower: {
            id: userId,
          },
        },
      },
      info,
    );
  },
};

export { Query as default };
