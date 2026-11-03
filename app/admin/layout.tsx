import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "Admin | OGP",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="adm" dir="ltr" lang="en">
      <header className="adm-top">
        <div className="adm-wrap adm-bar">
          <a href="/admin" className="adm-brand">
            OGP <span>Admin</span>
          </a>
          <nav aria-label="Admin" className="adm-nav">
            <a href="/admin">Dashboard</a>
            <a href="/admin/leads">Leads</a>
            <a href="/admin/seo">SEO &amp; content</a>
            <a href="/admin/leads/export">Export CSV</a>
            <a href="/" target="_blank" rel="noopener">View site</a>
          </nav>
        </div>
      </header>
      <main className="adm-wrap adm-main">{children}</main>
    </div>
  );
}
