import getUserId from '../utils/getUserId';
import { generateToken } from '../utils/jwtToken';
import { hashPassword, verifyPassword } from '../utils/hashPassword';
import {
  usernameValidation,
  emailValidation,
  nameValidation,
} from '../utils/userValidation';

const Mutation = {
  async createUser(parent, args, { prisma }, info) {
    const password = await hashPassword(args.data.password);
    await usernameValidation(prisma, args.data.username);
    await emailValidation(prisma, args.data.email);
    await nameValidation(prisma, args.data.fullname);

    const user = await prisma.mutation.createUser({
      data: {
        ...args.data,
        password,
      },
    });

    return {
      user,
      token: generateToken(user.id),
    };
  },
  async login(parent, args, { prisma }, info) {
    const user = (
      await prisma.query.users({
        where: {
          OR: [{ email: args.data.email }, { username: args.data.email }],
        },
      })
    )[0];

    if (!user) {
      throw new Error('Unable to authenticate');
    }

    const isMatch = await verifyPassword(args.data.password, user.password);

    if (!isMatch) {
      throw new Error('Unable to authenticate');
    }

    return {
      user,
      token: generateToken(user.id),
    };
  },
  deleteUser(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    return prisma.mutation.deleteUser({
      where: {
        id: userId,
      },
      info,
    });
  },
  async updateUser(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    if (typeof args.data.password === 'string') {
      args.data.password = await hashPassword(args.data.password);
    }
    if (typeof args.data.username === 'string') {
      await usernameValidation(prisma, args.data.username);
    }
    if (typeof args.data.email === 'string') {
      await emailValidation(prisma, args.data.email);
    }
    if (typeof args.data.fullname === 'string') {
      await nameValidation(prisma, args.data.fullname);
    }

    return prisma.mutation.updateUser(
      {
        where: {
          id: userId,
        },
        data: args.data,
      },
      info,
    );
  },
  createPost(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    return prisma.mutation.createPost(
      {
        data: {
          ...args.data,
          author: {
            connect: {
              id: userId,
            },
          },
        },
      },
      info,
    );
  },
  async deletePost(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    const post = (
      await prisma.query.posts(
        {
          where: {
            id: args.id,
          },
        },
        info,
      )
    )[0];

    if (!post) {
      throw new Error('Post not found');
    }

    if (post.author.id !== userId) {
      throw new Error('Forbidden to delete post');
    }

    return prisma.mutation.deletePost(
      {
        where: {
          id: args.id,
        },
      },
      info,
    );
  },
  async updatePost(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    const post = (
      await prisma.query.posts(
        {
          where: {
            id: args.id,
          },
        },
        info,
      )
    )[0];

    if (!post) {
      throw new Error('Post not found');
    }

    if (post.author.id !== userId) {
      throw new Error('Forbidden to update post');
    }

    return prisma.mutation.updatePost(
      {
        where: {
          id: args.id,
        },
        data: args.data,
      },
      info,
    );
  },
  async follow(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    const follow = (
      await prisma.query.follows({
        where: {
          follower: {
            id: userId,
          },
          following: {
            id: args.id,
          },
        },
      })
    )[0];

    if (follow) {
      throw new Error('Failed follow');
    }

    return prisma.mutation.createFollow(
      {
        data: {
          follower: {
            connect: {
              id: userId,
            },
          },
          following: {
            connect: {
              id: args.id,
            },
          },
        },
      },
      info,
    );
  },
  async unfollow(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    const follow = (
      await prisma.query.follows({
        where: {
          follower: {
            id: userId,
          },
          following: {
            id: args.id,
          },
        },
      })
    )[0];

    if (!follow) {
      throw new Error('Failed unfollow');
    }

    return prisma.mutation.deleteFollow(
      {
        where: {
          id: follow.id,
        },
      },
      info,
    );
  },
};

export { Mutation as default };
