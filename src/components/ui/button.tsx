import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" };
export function Button({ className, variant = "primary", ...props }: Props) { const styles = { primary:"bg-black text-[#fafaf7] hover:bg-[#292725]", secondary:"border border-[#e9e3db] bg-[#fafaf7] text-black hover:bg-[#e9e3db]", ghost:"text-[#5e5a56] hover:bg-[#e9e3db]" }; return <button className={cn("inline-flex min-h-11 items-center justify-center rounded-none px-4 text-sm font-semibold tracking-wide transition", styles[variant], className)} {...props} />; }
