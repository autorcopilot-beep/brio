import { connection } from "next/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin";
export default async function AdminLayout({children}:{children:React.ReactNode}){await connection();const{user}=await requireAdmin();return <AdminShell email={user.email??""}>{children}</AdminShell>}
