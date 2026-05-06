import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from './prisma';

declare module 'next-auth' {
  interface User {
    role?: string | null;
  }
}

const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials || !credentials.email) return null;

        const foundUser = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!foundUser) return null;

        // Case 1: Login after email verification (no password provided)
        if (!credentials.password) {
          if (!foundUser.emailVerified) {
            throw new Error('User not verified'); // <- frontend expects this string
          }
          return {
            id: foundUser.id.toString(),
            email: foundUser.email,
            role: foundUser.role ?? null,
          };
        }

        // Case 2: Normal login with password
        const isValid = await compare(credentials.password, foundUser.password);
        if (!isValid) return null;

        if (!foundUser.emailVerified) {
          throw new Error('User not verified'); // <- frontend expects this string
        }

        return {
          id: foundUser.id.toString(),
          email: foundUser.email,
          role: foundUser.role ?? null,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        return { ...token, id: user.id, role: user.role ?? null };
      }
      return token;
    },
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as string | null,
        },
      };
    },
    redirect({ baseUrl }) {
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;
