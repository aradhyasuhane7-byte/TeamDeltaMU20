import type { Metadata } from "next";
import "./globals.css";
import SupportWidget from "./support-widget";
import {AppErrorBoundary,ErrorMonitor} from "./error-monitor";

export const metadata: Metadata = {
  title: "Blindspot · Operations Hub",
  manifest: "/manifest.webmanifest",
  appleWebApp: {capable: true, title: "Blindspot", statusBarStyle: "default"},
  description: "Find the delay. Fix the step.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><ErrorMonitor/><AppErrorBoundary>{children}</AppErrorBoundary><footer className="team-delta-note"><strong>A note from Team Delta</strong><p>Your data is protected by account and department permissions. Buyer contact details, private notes and photos stay behind login. Cloud providers store and process data to operate Blindspot; AI chat messages are sent to OpenAI. Please keep passwords and sensitive customer details out of AI Chat.</p></footer><SupportWidget/></body>
    </html>
  );
}
