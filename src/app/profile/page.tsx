import { ProfileForm } from "@/components/forms/profile-form";
import { createClient } from "@/lib/supabase/server";
import { connection } from "next/server";

export default async function ProfilePage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,birth_date,objectives")
    .eq("user_id", user!.id)
    .single();
  return (
    <section className="rounded-[30px] bg-[#fafaf7] p-5 shadow-[0_24px_70px_rgba(37,30,25,.07)] md:p-8">
      <p className="text-[10px] font-bold tracking-[.16em] text-[#8b5c6c]">
        PERFIL
      </p>
      <h2 className="mt-2 font-serif text-4xl">Como o Brio conhece você.</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d6761]">
        Seus dados básicos e objetivos orientam os módulos e deixam as
        recomendações mais relevantes.
      </p>
      <ProfileForm
        initial={{
          fullName: profile?.full_name ?? "",
          birthDate: profile?.birth_date ?? "",
          objectives: profile?.objectives ?? [],
        }}
      />
    </section>
  );
}
