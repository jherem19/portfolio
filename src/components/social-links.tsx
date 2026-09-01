import {
  IconBrandBehance,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandX,
} from "@tabler/icons-react";

import { site } from "@/data/site";

const socialLinks = [
  { label: "X", href: site.socials[0], Icon: IconBrandX },
  { label: "LinkedIn", href: site.socials[1], Icon: IconBrandLinkedin },
  { label: "Behance", href: site.socials[2], Icon: IconBrandBehance },
  { label: "Instagram", href: site.socials[3], Icon: IconBrandInstagram },
];

export function SocialLinks({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "social-list social-list-compact" : "social-list"} aria-label="Social profiles">
      {socialLinks.map(({ label, href, Icon }) => (
        <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}>
          <Icon aria-hidden="true" stroke={1.7} />
        </a>
      ))}
    </div>
  );
}
