export const experienceDurations = {
  fast: 180,
  normal: 250,
  slow: 320,
} as const;

export const experienceEasing = {
  ease: "cubic-bezier(0.2, 0, 0, 1)",
  premium: "cubic-bezier(0.16, 1, 0.3, 1)",
  softOvershoot: "cubic-bezier(0.2, 1.04, 0.24, 1)",
} as const;

export const experienceOverlay = {
  backdrop:
    "bg-foreground/24 backdrop-blur-[10px] supports-[backdrop-filter]:backdrop-saturate-[118%]",
  panel:
    "border border-white/58 bg-[rgba(255,250,248,0.9)] shadow-[0_26px_78px_rgba(74,55,47,0.16)] backdrop-blur-[18px]",
} as const;

export const experienceMotion = {
  interactive:
    "transition-all duration-[250ms] ease-out hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
  overlayIn:
    "animate-[wtodocell-experience-overlay_250ms_cubic-bezier(0.16,1,0.3,1)_both]",
  panelIn:
    "animate-[wtodocell-experience-panel_250ms_cubic-bezier(0.16,1,0.3,1)_both]",
} as const;
