import type { HTMLAttributes } from "react";

type BotanicalMotifProps = HTMLAttributes<HTMLDivElement>;

const leaves = [
  "vita-laurel-leaf--one",
  "vita-laurel-leaf--two",
  "vita-laurel-leaf--three",
  "vita-laurel-leaf--four",
  "vita-laurel-leaf--five",
  "vita-laurel-leaf--six",
] as const;

function LaurelLeaf() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 28 48">
      <path d="M14 45C14 31 14 18 15 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.1" />
      <path d="M14 34C8 32 4 28 3 22C9 22 13 26 14 34Z" fill="currentColor" fillOpacity=".78" />
      <path d="M14 27C19 25 23 21 25 16C19 16 15 20 14 27Z" fill="currentColor" fillOpacity=".9" />
      <path d="M14 20C9 18 6 14 6 9C11 10 14 14 14 20Z" fill="currentColor" fillOpacity=".68" />
      <path d="M15 14C18 11 20 7 20 3C16 5 14 9 15 14Z" fill="currentColor" fillOpacity=".82" />
    </svg>
  );
}

export function BotanicalMotif({ className = "", ...props }: BotanicalMotifProps) {
  return (
    <div aria-hidden="true" className={`vita-botanical-motif ${className}`} {...props}>
      {leaves.map((leaf) => (
        <span className={`vita-laurel-leaf ${leaf}`} key={leaf}>
          <LaurelLeaf />
        </span>
      ))}
    </div>
  );
}
