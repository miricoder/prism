import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcryptjs from 'bcryptjs';
import { connectDB } from './db';
import User from '@/models/User';
import { createSession, validateSession, invalidateAllSessions } from './session-manager';
import { getDeviceInfo } from './device-detection';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
    };
    sessionToken?: string;
    deviceType?: 'mobile' | 'desktop';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    sessionToken?: string;
    deviceType?: 'mobile' | 'desktop';
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
    async jwt({ token, user, trigger, req }: any) {
      // On initial signin
      if (user) {
        token.id = user.id;
        token.email = user.email;
        
        // Generate device info from request headers
        const deviceInfo = getDeviceInfo(req.headers);
        token.deviceType = deviceInfo.deviceType;

        // Create session record (this invalidates previous sessions for this userId)
        try {
          const session = await createSession(
            user.id, // Use userId (MongoDB _id)
            token.jti || `${user.id}-${Date.now()}`,
            deviceInfo,
            req.headers.get('x-forwarded-for') || 'unknown'
          );
          token.sessionToken = session.token;
        } catch (error) {
          console.error('Failed to create session:', error);
        }
      }
      
      return token;
    },
    
    async session({ session, token, trigger }: any) {
      if (session.user) {
        session.user.id = token.id as string;
        session.sessionToken = token.sessionToken || token.jti || token.sub || null;
        session.deviceType = token.deviceType;

        // Validate session is still active
        if (session.sessionToken) {
          const isValid = await validateSession(session.sessionToken);
          if (!isValid) {
            // Session has been invalidated (logged in elsewhere)
            throw new Error('Session invalidated');
          }
        }
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
