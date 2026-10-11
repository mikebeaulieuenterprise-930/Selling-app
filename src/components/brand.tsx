/** Le logo : un radar stylisé, même dessin que les icônes PNG. */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="100" height="100" rx="22" fill="var(--accent)" />
      <circle cx="50" cy="50" r="33" fill="none" stroke="#fff" strokeWidth="4.5" />
      <circle cx="50" cy="50" r="20" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="4.5" />
      <circle cx="61" cy="39" r="7.5" fill="#f2b01e" />
    </svg>
  );
}
