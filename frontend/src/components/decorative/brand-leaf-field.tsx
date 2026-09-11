import type { HTMLAttributes } from "react";

type BrandLeafFieldProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "home" | "catalog" | "footer";
};

const leaves = [
  "brand-leaf--one",
  "brand-leaf--two",
  "brand-leaf--three",
] as const;

function BrandLeaf() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 42 72">
      <path d="M21 68C21 47 20 26 22 6" stroke="#6F4A32" strokeLinecap="round" strokeWidth="2.2" />
      <path d="M21 53C12 50 7 44 6 35C15 36 20 42 21 53Z" fill="#687A67" fillOpacity=".82" />
      <path d="M21 44C29 40 35 34 37 25C28 27 22 33 21 44Z" fill="#687A67" fillOpacity=".66" />
      <path d="M20 35C12 32 8 26 8 18C16 20 20 26 20 35Z" fill="#687A67" fillOpacity=".74" />
      <path d="M22 26C28 22 31 16 31 9C24 12 21 18 22 26Z" fill="#687A67" fillOpacity=".58" />
    </svg>
  );
}

export function BrandLeafField({
  className = "",
  variant = "home",
  ...props
}: BrandLeafFieldProps) {
  const visibleLeaves = variant === "catalog" ? leaves.slice(0, 2) : leaves;

  return (
    <div
      aria-hidden="true"
      className={`brand-leaf-field brand-leaf-field--${variant} ${className}`}
      {...props}
    >
      {visibleLeaves.map((leaf) => (
        <span className={`brand-leaf ${leaf}`} key={leaf}>
          <BrandLeaf />
        </span>
      ))}
    </div>
  );
}
