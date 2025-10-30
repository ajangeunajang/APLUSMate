import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  metadataBase: new URL("https://aplus-mate.vercel.app"), // 배포 도메인으로 교체
  title: "A+MATE",
  description: "PDF 창, 챗봇 창을 번갈아가며 공부하고 있나요?",
  openGraph: {
    type: "website",
    url: "https://aplus-mate.vercel.app/",
    siteName: "A+MATE",
    title: "A+MATE",
    description: "PDF 창, 챗봇 창을 번갈아가며 공부하고 있나요?",
    images: [
      {
        url: "/A+Mateog.png",  
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "A+MATE"
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "A+MATE",
    description: "PDF 창, 챗봇 창을 번갈아가며 공부하고 있나요?",
    images: ["/A+Mateog.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
