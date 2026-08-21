import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";

import { loginAction } from "@/app/admin/actions";
import { getAdmin } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getAdmin()) redirect("/admin/projects");
  const { error } = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <Link className="back-link" href="/"><ArrowLeft aria-hidden="true" /> Back to portfolio</Link>
        <div className="admin-login-icon"><LockKeyhole aria-hidden="true" /></div>
        <p className="section-kicker">Private workspace</p>
        <h1>Portfolio admin</h1>
        <p>Sign in with the administrator account configured in Supabase.</p>
        {!configured ? <div className="admin-notice admin-notice-error">Supabase variables have not been configured in this environment yet.</div> : null}
        {error ? <div className="admin-notice admin-notice-error">{error}</div> : null}
        <form action={loginAction} className="admin-login-form">
          <label className="admin-field"><span>Email</span><input autoComplete="email" disabled={!configured} name="email" required type="email" /></label>
          <label className="admin-field"><span>Password</span><input autoComplete="current-password" disabled={!configured} minLength={8} name="password" required type="password" /></label>
          <button className="admin-button admin-button-primary" disabled={!configured} type="submit">Sign in</button>
        </form>
      </div>
    </main>
  );
}
