import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NHI Shield | Machine Identity Security",
  description: "Machine identity and access security command centre.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
