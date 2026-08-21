import Link from "next/link";
import type { Metadata } from "next";
import { FolderKanban, LogOut, Plus } from "lucide-react";

import { logoutAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "Portfolio CMS",
  robots: { index: false, follow: false },
};

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin/projects"><strong>Hector Heredia</strong><span>Portfolio CMS</span></Link>
        <nav>
          <Link href="/admin/projects"><FolderKanban aria-hidden="true" /> Projects</Link>
          <Link href="/admin/projects/new"><Plus aria-hidden="true" /> New project</Link>
        </nav>
        <div className="admin-profile"><span>{admin.email ?? admin.display_name ?? "Administrator"}</span><form action={logoutAction}><button type="submit"><LogOut aria-hidden="true" /> Log out</button></form></div>
      </aside>
      <main className="admin-content">{children}</main>
    </div>
  );
}
