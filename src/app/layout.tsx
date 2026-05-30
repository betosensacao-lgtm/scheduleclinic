import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "@/styles/globals.css";
import { Toaster } from "sonner";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "ScheduleClinic – Book Your Appointment",
  description: "Find top-rated doctors, dentists, and aesthetic clinics. Real-time availability, digital pre-screening, and instant confirmation.",
  keywords: ["clinic scheduling", "doctor appointment", "healthcare booking", "pre-anamnesis"],
  openGraph: {
    title: "ScheduleClinic",
    description: "Book clinic appointments in seconds",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
