import crypto from 'crypto';
import getUserId from '../utils/getUserId';
import { generateToken } from '../utils/jwtToken';
import { hashPassword, verifyPassword } from '../utils/hashPassword';
import {
  usernameValidation,
  emailValidation,
  nameValidation,
  authCheck,
} from '../utils/userValidation';
import sendEmail from '../utils/sendEmail';
import signS3 from '../utils/fileUpload';

const Mutation = {
  async createUser(parent, args, { prisma }, info) {
    const password = await hashPassword(args.data.password);
    const photoUrl =
      'https://suhy.s3.ap-northeast-2.amazonaws.com/tweetx/Download/no-image-icon-389x389.jpg';
    await usernameValidation(prisma, args.data.username);
    await emailValidation(prisma, args.data.email);
    await nameValidation(prisma, args.data.fullname);

    const user = await prisma.mutation.createUser({
      data: {
        ...args.data,
        photoUrl,
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
  async deleteUser(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    await authCheck(prisma, userId);

    return prisma.mutation.deleteUser({
      where: {
        id: userId,
      },
      info,
    });
  },
  async fileUploadSign(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);
    await authCheck(prisma, userId);

    const { name, size, type } = args.data;
    if (!name || !type) {
      throw new Error('Please upload a file');
    }

    if (!type.startsWith('image')) {
      throw new Error('Please upload an image file');
    }

    if (size > process.env.MAX_FILE_UPLOAD) {
      throw new Error(
        `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
      );
    }

    const updatedName = `photo_${userId}${name}`;

    return signS3(updatedName, type);
  },
  async updateUser(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    await authCheck(prisma, userId);

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
  async createPost(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    await authCheck(prisma, userId);

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

    await authCheck(prisma, userId);

    const post = (
      await prisma.query.posts(
        {
          where: {
            id: args.id,
            author: {
              id: userId,
            },
          },
        },
        info,
      )
    )[0];

    if (!post) {
      throw new Error('Post not found');
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

    await authCheck(prisma, userId);

    const post = (
      await prisma.query.posts(
        {
          where: {
            id: args.id,
            author: {
              id: userId,
            },
          },
        },
        info,
      )
    )[0];

    if (!post) {
      throw new Error('Post not found');
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

    await authCheck(prisma, userId);

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

    await authCheck(prisma, userId);

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
  async forgotPassword(parent, args, { prisma, request }, info) {
    const user = (
      await prisma.query.users({
        where: {
          OR: [{ email: args.data.email }, { username: args.data.email }],
        },
      })
    )[0];

    if (!user) {
      throw new Error('Not registered');
    }

    const resetToken = crypto.randomBytes(20).toString('hex');

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const resetPasswordExpire = new Date(
      new Date().getTime() + 10 * 60 * 1000, // 10 minutes
    ).toISOString();

    const rootUrl = `${request.request.protocol}://${request.request.get(
      'host',
    )}/reset-password/${resetToken}`;

    const html = `
      <div>You are receiving this email because you (or someone else) has requested the reset of a password.</div>
      <div>Please visit our website. If not you, please ignore this email.</div>
      <br />
      <div>${rootUrl}</div>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password reset token for a test project',
        html,
      });

      const updatedUser = await prisma.mutation.updateUser({
        where: {
          id: user.id,
        },
        data: {
          resetPasswordToken,
          resetPasswordExpire,
        },
      });

      if (!updatedUser) {
        throw new Error('Server error, please try again');
      }

      return 'Email sent.';
    } catch (err) {
      throw new Error('Email could not be sent');
    }
  },
  async resetPassword(parent, args, { prisma }, info) {
    const password = await hashPassword(args.data.password);

    if (!args.data.resetToken) {
      throw new Error('Invalid token');
    }

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(args.data.resetToken)
      .digest('hex');

    const user = (
      await prisma.query.users({
        where: {
          resetPasswordToken,
          resetPasswordExpire_gte: new Date().toISOString(),
        },
      })
    )[0];

    if (!user) {
      throw new Error('Invalid token');
    }

    const updatedUser = await prisma.mutation.updateUser({
      where: {
        id: user.id,
      },
      data: {
        password,
        resetPasswordToken: null,
        resetPasswordExpire: null,
      },
    });

    if (!updatedUser) {
      throw new Error('Server error');
    }

    return {
      token: generateToken(user.id),
      user: updatedUser,
    };
  },
};

export { Mutation as default };
