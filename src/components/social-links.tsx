const socialLinks = [
  { label: "X", href: "https://x.com/JHereM", mark: "X" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/3d-visual-designer-jherem/", mark: "in" },
  { label: "Behance", href: "https://www.behance.net/jherem", mark: "Bē" },
  { label: "Instagram", href: "https://www.instagram.com/jherem19/", mark: "◎" },
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
