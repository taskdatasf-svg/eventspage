import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  metadataBase: new URL("https://events.studentforge.in"),
  authors: [{ name: "Studio Redlix", url: "https://www.redlix.co.in/" }],
  creator: "Studio Redlix",
  publisher: "Studio Redlix",
  title: "StudentForge | Campus Events & Ticketing Portal",
  description: "RSVP for college workshops, student tech meetups, and campus gatherings with custom check-in QR passes.",
  icons: {
    icon: "https://ik.imagekit.io/dypkhqxip/events%20by%20sf.png",
    shortcut: "https://ik.imagekit.io/dypkhqxip/events%20by%20sf.png",
    apple: "https://ik.imagekit.io/dypkhqxip/events%20by%20sf.png",
  },
  openGraph: {
    title: "StudentForge | Campus Events & Ticketing Portal",
    description: "RSVP for college workshops, student tech meetups, and campus gatherings with custom check-in QR passes.",
    url: "https://events.studentforge.in",
    siteName: "StudentForge",
    images: [
      {
        url: "https://ik.imagekit.io/dypkhqxip/events%20by%20main.png",
        width: 1200,
        height: 630,
        alt: "StudentForge Campus Events & Ticketing Portal",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StudentForge | Campus Events & Ticketing Portal",
    description: "RSVP for college workshops, student tech meetups, and campus gatherings with custom check-in QR passes.",
    images: ["https://ik.imagekit.io/dypkhqxip/events%20by%20main.png"],
  },
  verification: {
    google: "google-site-verification-token",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-0EBKZ76ZHP"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-0EBKZ76ZHP');
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
