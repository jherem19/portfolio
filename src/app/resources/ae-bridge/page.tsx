import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRightLeft, Download, Mail } from "lucide-react";

import { SiteSidebar } from "@/components/site-sidebar";
import { resources } from "@/data/resources";

export const metadata: Metadata = {
  title: "AE Bridge — Figma to After Effects",
  description: "Download AE Bridge beta for Windows. Transfer Figma selections to After Effects as editable text, vector shapes, precomps, or raster images.",
  alternates: { canonical: "/resources/ae-bridge" },
};

export default function AEBridgePage() {
  const resource = resources.find((item) => item.slug === "ae-bridge")!;
  return (
    <main className="site-shell">
      <SiteSidebar active="resources" />
      <div className="page-content resources-page resource-detail">
        <Link href="/resources" className="resource-text-link"><ArrowLeft aria-hidden="true" /> All resources</Link>
        <header className="resources-hero">
          <Image className="resource-detail-icon" src="/resources/ae-bridge/icon.webp" width={96} height={96} alt="AE Bridge purple 3D exchange symbol" unoptimized />
          <div className="resource-meta"><span className="section-kicker">Design → Motion</span><span className="resource-badge">Beta · v{resource.version}</span></div>
          <h1>AE Bridge</h1>
          <p>Your Figma selection, ready for motion in After Effects.</p>
          <div className="resource-actions"><a className="resource-download" href="/resources/ae-bridge/download"><Download aria-hidden="true" /> Download for Windows</a><span>Windows x64 · Includes the local companion</span></div>
        </header>
        <div className="resource-demo" aria-hidden="true"><div><span>Figma</span><p>Text<br />Shapes<br />Strokes</p></div><ArrowRightLeft /><div><span>After Effects</span><p>Editable layers<br />One precomp<br />Raster image</p></div></div>
        <section className="resource-detail-section" aria-labelledby="bridge-features"><h2 id="bridge-features">Bring the layers with you.</h2><div className="resource-feature-grid"><div><h3>Editable by default</h3><p>Point text, compatible vector paths, parametric rectangles, ellipses, polygons, and native strokes. Missing fonts use an available AE font.</p></div><div><h3>Your choice of import</h3><p>Keep layers separate, group compatible vectors, or place the selection inside one precomposition. Raster image sends one flattened PNG.</p></div><div><h3>Keep your placement</h3><p>Use the containing Figma design frame as the reference, center the selection, or start at the composition origin.</p></div><div><h3>Local transfer</h3><p>The companion runs on your computer. The plugin sends your selection to localhost, without remote design upload or plugin analytics.</p></div></div></section>
        <section className="resource-detail-section" aria-labelledby="bridge-start"><h2 id="bridge-start">Start in a few steps.</h2><ol className="resource-steps"><li><strong>Install the Windows companion.</strong><p>Run the installer and open AE Bridge First steps. The companion starts locally and generates a private connection code.</p></li><li><strong>Open the plugin in Figma.</strong><p>Community submission is being prepared. Until the listing is available, use Figma desktop → Plugins → Development → Import plugin from manifest and select the manifest shown in First steps.</p></li><li><strong>Connect and send.</strong><p>If needed, click Connect in the plugin and paste your code. Open your project and target composition in AE, select the Figma elements, and click Send to After Effects.</p></li></ol><p className="resource-note">Export .jsx also works without pairing: in AE, choose File → Scripts → Run Script File.</p></section>
        <section className="resource-detail-section" aria-labelledby="bridge-beta"><h2 id="bridge-beta">A beta, with clear limits.</h2><p>Conversion has been tested in After Effects 26.5 on Windows. This release adds layers with each transfer; it does not sync or replace existing layers. Gradients simplify to solid fills, and unsupported effects or geometry may be simplified or rasterized. Review the import report and your result.</p><p>Imported PNGs stay on disk so AE can reference them. Keep the assets folder when moving projects. The installer is currently unsigned.</p></section>
        <section className="resource-detail-section" id="privacy" aria-labelledby="bridge-privacy"><h2 id="bridge-privacy">Privacy and support.</h2><p>AE Bridge does not require a plugin account and has no telemetry. Connection codes are stored in Figma plugin storage on this device; keep yours private. The local companion stores generated PNGs and transfer scripts on your computer. Clearing Figma&apos;s local storage may require pairing again.</p><a className="resource-text-link" href="mailto:hectorheredia19@gmail.com"><Mail aria-hidden="true" /> hectorheredia19@gmail.com</a></section>
      </div>
    </main>
  );
}
