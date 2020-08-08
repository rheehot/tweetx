import 'core-js/stable';
import 'cross-fetch/polyfill';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../src/prisma';

export const userOne = {
  input: {
    username: 'jen_barber',
    fullname: 'Jen Barber',
    email: 'jen@example.org',
    password: bcrypt.hashSync('foobar'),
  },
  user: undefined,
  jwt: undefined,
};

const seedDatabase = async () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL *= 10;

  // Delete test data
  await prisma.mutation.deleteManyUsers();

  // Create User one
  userOne.user = await prisma.mutation.createUser({
    data: userOne.input,
  });
  userOne.jwt = jwt.sign({ userId: userOne.user.id }, process.env.JWT_SECRET);
};

export { seedDatabase as default };
