import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-6 sm:px-10 lg:px-16", className)}>
      {children}
    </div>
  );
}
