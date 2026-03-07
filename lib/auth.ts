import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcryptjs from 'bcryptjs';
import { connectDB } from './db';
import User from '@/models/User';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: any) {
        await connectDB();

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        let user = await User.findOne({ email: credentials.email });

        // Auto-create user on first login
        if (!user) {
          const salt = await bcryptjs.genSalt(10);
          const hashedPassword = await bcryptjs.hash(credentials.password, salt);
          user = await User.create({
            email: credentials.email,
            password: hashedPassword,
          });
        } else {
          const isValid = await bcryptjs.compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error('Invalid password');
          }
        }

        return {
          id: user._id.toString(),
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
