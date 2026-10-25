import type { Metadata, Viewport } from "next";
import { Newsreader, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-brio-sans" });
const editorial = Newsreader({ subsets: ["latin"], variable: "--font-brio-editorial" });

export const metadata: Metadata = { title: "Brio — vida com clareza", description: "Ferramentas e rituais para organizar a vida.", manifest:"/manifest.webmanifest", icons:{ icon:"/icon.svg", apple:"/apple-icon.png" } };
export const viewport: Viewport = { themeColor: "#FAFAF7" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body className={`${sans.variable} ${editorial.variable}`}>{children}</body></html>; }
