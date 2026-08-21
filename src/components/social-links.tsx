import { site } from "@/data/site";

const socialLinks = [
  { label: "X", href: site.socials[0], mark: "X" },
  { label: "LinkedIn", href: site.socials[1], mark: "in" },
  { label: "Behance", href: site.socials[2], mark: "Bē" },
  { label: "Instagram", href: site.socials[3], mark: "◎" },
];

export function SocialLinks({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "social-list social-list-compact" : "social-list"} aria-label="Social profiles">
      {socialLinks.map((social) => (
        <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label} title={social.label}>
          <span aria-hidden="true">{social.mark}</span>
        </a>
      ))}
    </div>
  );
}
