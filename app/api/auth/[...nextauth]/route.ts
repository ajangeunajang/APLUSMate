import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';

// 환경 변수 검증
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;
const backendUrl = process.env.BACKEND_URL;

if (!googleClientId) {
  throw new Error('GOOGLE_CLIENT_ID is not set in environment variables');
}
if (!googleClientSecret) {
  throw new Error('GOOGLE_CLIENT_SECRET is not set in environment variables');
}
if (!nextAuthSecret) {
  throw new Error('NEXTAUTH_SECRET is not set in environment variables');
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        user_id: { label: 'User ID', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.user_id || !credentials?.password) {
          console.error('Missing credentials');
          return null;
        }

        try {
          // FastAPI 백엔드에 직접 요청
          const response = await fetch(`${backendUrl}/users/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: credentials.user_id,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            console.error('Login failed:', error);
            return null;
          }

          const user = await response.json();
          
          // 사용자 정보 반환
          return {
            id: user.id || credentials.user_id,
            name: user.name || credentials.user_id,
            email: user.email || `${credentials.user_id}@aplusmate.local`,
          };
        } catch (error) {
          console.error('Credentials authorization error:', error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/',
    error: '/',
  },

  secret: nextAuthSecret,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
