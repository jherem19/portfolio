import type { CSSProperties } from "react";

const DOTS = Array.from({ length: 34 }, (_, index) => ({
  left: `${4 + ((index * 29) % 92)}%`,
  top: `${5 + ((index * 47) % 90)}%`,
  size: index % 9 === 0 ? 3 : 2,
  delay: `${-(index % 11) * 0.63}s`,
  duration: `${4.8 + (index % 6) * 0.8}s`,
  opacity: 0.28 + (index % 5) * 0.09,
  mint: index % 7 === 0 || index % 13 === 0,
}));

type DotStyle = CSSProperties & {
  "--dot-dim": number;
  "--dot-mid": number;
  "--dot-opacity": number;
};

export function AmbientDots({ className = "" }: { className?: string }) {
  return (
    <div className={`ambient-dot-field ${className}`} aria-hidden="true">
      {DOTS.map((dot, index) => (
        <span
          className={dot.mint ? "is-mint" : undefined}
          key={index}
          style={{
            "--dot-dim": dot.opacity * 0.45,
            "--dot-mid": dot.opacity * 0.62,
            "--dot-opacity": dot.opacity,
            left: dot.left,
            top: dot.top,
            width: dot.size,
            height: dot.size,
            animationDelay: dot.delay,
            animationDuration: dot.duration,
          } as DotStyle}
        />
      ))}
    </div>
  );
}
