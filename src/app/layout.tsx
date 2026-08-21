import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { jsonLd } from "@/lib/json-ld";
import { site } from "@/data/site";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: "%s | Hector Heredia",
  },
  description: site.description,
  keywords: [...site.expertise, "Digital product designer", "Motion designer portfolio"],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  category: "design",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: site.url,
    siteName: `${site.name} Portfolio`,
    title: site.title,
    description: site.description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    creator: "@JHereM",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Person",
                  "@id": `${site.url}/#person`,
                  name: site.name,
                  url: site.url,
                  image: `${site.url}${site.image}`,
                  jobTitle: site.role,
                  description: site.description,
                  sameAs: site.socials,
                  knowsAbout: site.expertise,
                },
                {
                  "@type": "WebSite",
                  "@id": `${site.url}/#website`,
                  url: site.url,
                  name: `${site.name} Portfolio`,
                  description: site.description,
                  inLanguage: "en",
                  author: { "@id": `${site.url}/#person` },
                },
                {
                  "@type": "ProfilePage",
                  "@id": `${site.url}/#profile-page`,
                  url: site.url,
                  name: site.title,
                  description: site.description,
                  inLanguage: "en",
                  isPartOf: { "@id": `${site.url}/#website` },
                  mainEntity: { "@id": `${site.url}/#person` },
                },
              ],
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
