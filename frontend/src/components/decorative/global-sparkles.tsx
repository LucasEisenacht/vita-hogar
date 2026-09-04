"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import {
  decorativeEffectsExcludedPaths,
  ENABLE_GLITTER_TEXTURE,
  ENABLE_GLOBAL_SPARKLES,
  SPARKLE_DENSITY,
  SPARKLE_OPACITY,
} from "@/config/decorative-effects";

type SparkleKind = "star" | "heart" | "glitter" | "diamond" | "cluster";
type SparkleTone = "champagne" | "dusty" | "iridescent" | "pastel" | "pearl";
type SparkleMotion = "a" | "b" | "c" | "d" | "e";

type SparkleParticle = {
  className: string;
  homeStyle?: CSSProperties;
  kind: SparkleKind;
  motion: SparkleMotion;
  tone: SparkleTone;
};

const viewportParticles: Array<SparkleParticle> = [
  { kind: "star", tone: "pastel", motion: "a", className: "global-sparkle-size-emphasis left-[7%] top-[18%] size-[10px] [--delay:-1.2s] [--duration:7.2s] [--sparkle-alpha:0.68]" },
  { kind: "glitter", tone: "pastel", motion: "e", className: "left-[91%] top-[16%] size-[4px] [--delay:-3.8s] [--duration:6.4s] [--sparkle-alpha:0.44]" },
  { kind: "diamond", tone: "dusty", motion: "d", className: "left-[15%] top-[42%] size-[7px] [--delay:-2.4s] [--duration:7.6s] [--sparkle-alpha:0.6]" },
  { kind: "glitter", tone: "pearl", motion: "b", className: "left-[84%] top-[47%] size-[4px] [--delay:-5.1s] [--duration:6.9s] [--sparkle-alpha:0.42]" },
  { kind: "star", tone: "pastel", motion: "c", className: "left-[6%] top-[72%] size-[11px] [--delay:-4.6s] [--duration:8.1s] [--sparkle-alpha:0.7]" },
  { kind: "glitter", tone: "dusty", motion: "e", className: "left-[93%] top-[74%] size-[4px] [--delay:-1.8s] [--duration:6.2s] [--sparkle-alpha:0.46]" },
  { kind: "star", tone: "champagne", motion: "b", className: "left-[24%] top-[88%] size-[10px] [--delay:-6.2s] [--duration:7.8s] [--sparkle-alpha:0.62]" },
  { kind: "glitter", tone: "pastel", motion: "a", className: "left-[76%] top-[86%] size-[3px] [--delay:-3.1s] [--duration:6.7s] [--sparkle-alpha:0.44]" },
];

const documentParticles: Array<SparkleParticle> = [
  { kind: "star", tone: "pastel", motion: "a", className: "global-sparkle-size-emphasis left-[8%] top-[17%] size-[12px] [--delay:-0.6s] [--duration:7.2s] [--sparkle-alpha:0.72]", homeStyle: { left: "86%", top: "18%" } },
  { kind: "glitter", tone: "pastel", motion: "e", className: "left-[18%] top-[9%] size-[4px] [--delay:-2.1s] [--duration:8.2s] [--sparkle-alpha:0.44]" },
  { kind: "diamond", tone: "dusty", motion: "d", className: "left-[31%] top-[22%] size-[8px] [--delay:-1.4s] [--duration:7.8s] [--sparkle-alpha:0.62]", homeStyle: { left: "75%", top: "29%" } },
  { kind: "cluster", tone: "champagne", motion: "b", className: "left-[45%] top-[13%] size-[18px] [--delay:-3.6s] [--duration:8.6s] [--sparkle-alpha:0.55]", homeStyle: { left: "92%", top: "36%" } },
  { kind: "heart", tone: "pastel", motion: "c", className: "left-[63%] top-[18%] size-[12px] [--delay:-2.8s] [--duration:8.9s] [--sparkle-alpha:0.42]", homeStyle: { left: "8%", top: "31%" } },
  { kind: "glitter", tone: "pearl", motion: "e", className: "left-[78%] top-[10%] size-[4px] [--delay:-4.2s] [--duration:7.4s] [--sparkle-alpha:0.42]" },
  { kind: "star", tone: "pastel", motion: "b", className: "global-sparkle-size-emphasis left-[90%] top-[24%] size-[13px] [--delay:-1.1s] [--duration:8.6s] [--sparkle-alpha:0.74]", homeStyle: { left: "13%", top: "43%" } },
  { kind: "glitter", tone: "pastel", motion: "a", className: "left-[11%] top-[38%] size-[3px] [--delay:-5.3s] [--duration:6.8s] [--sparkle-alpha:0.49]", homeStyle: { left: "82%", top: "48%" } },
  { kind: "diamond", tone: "dusty", motion: "d", className: "left-[23%] top-[47%] size-[8px] [--delay:-0.9s] [--duration:7.6s] [--sparkle-alpha:0.6]", homeStyle: { left: "5%", top: "57%" } },
  { kind: "glitter", tone: "iridescent", motion: "e", className: "left-[39%] top-[37%] size-[3px] [--delay:-3.1s] [--duration:7.9s] [--sparkle-alpha:0.36]" },
  { kind: "star", tone: "pastel", motion: "c", className: "global-sparkle-size-emphasis left-[56%] top-[48%] size-[12px] [--delay:-4.8s] [--duration:7.4s] [--sparkle-alpha:0.82]", homeStyle: { left: "90%", top: "62%" } },
  { kind: "star", tone: "dusty", motion: "a", className: "left-[69%] top-[39%] size-[9px] [--delay:-1.7s] [--duration:8.1s] [--sparkle-alpha:0.62]" },
  { kind: "glitter", tone: "pearl", motion: "d", className: "left-[84%] top-[51%] size-[4px] [--delay:-2.4s] [--duration:7.6s] [--sparkle-alpha:0.47]", homeStyle: { left: "18%", top: "68%" } },
  { kind: "heart", tone: "pastel", motion: "b", className: "left-[93%] top-[44%] size-[11px] [--delay:-5.8s] [--duration:8.7s] [--sparkle-alpha:0.44]", homeStyle: { left: "76%", top: "72%" } },
  { kind: "glitter", tone: "pastel", motion: "e", className: "left-[6%] top-[66%] size-[4px] [--delay:-2.6s] [--duration:7.2s] [--sparkle-alpha:0.45]" },
  { kind: "star", tone: "pastel", motion: "b", className: "left-[20%] top-[76%] size-[11px] [--delay:-4.9s] [--duration:8.2s] [--sparkle-alpha:0.7]", homeStyle: { left: "9%", top: "82%" } },
  { kind: "diamond", tone: "dusty", motion: "c", className: "left-[34%] top-[62%] size-[8px] [--delay:-1.9s] [--duration:7.5s] [--sparkle-alpha:0.6]" },
  { kind: "cluster", tone: "champagne", motion: "a", className: "left-[50%] top-[73%] size-[20px] [--delay:-6.2s] [--duration:8.8s] [--sparkle-alpha:0.52]", homeStyle: { left: "86%", top: "84%" } },
  { kind: "star", tone: "champagne", motion: "d", className: "left-[59%] top-[64%] size-[10px] [--delay:-0.4s] [--duration:6.9s] [--sparkle-alpha:0.65]" },
  { kind: "star", tone: "dusty", motion: "c", className: "left-[72%] top-[78%] size-[13px] [--delay:-3.7s] [--duration:8.4s] [--sparkle-alpha:0.74]" },
  { kind: "glitter", tone: "pearl", motion: "e", className: "left-[14%] top-[23%] size-[3px] [--delay:-6.6s] [--duration:5.8s] [--sparkle-alpha:0.39]", homeStyle: { left: "6%", top: "21%" } },
  { kind: "glitter", tone: "pastel", motion: "b", className: "left-[27%] top-[32%] size-[4px] [--delay:-3.9s] [--duration:6.4s] [--sparkle-alpha:0.49]", homeStyle: { left: "94%", top: "27%" } },
  { kind: "star", tone: "champagne", motion: "a", className: "left-[41%] top-[29%] size-[10px] [--delay:-2.3s] [--duration:7.1s] [--sparkle-alpha:0.68]", homeStyle: { left: "16%", top: "35%" } },
  { kind: "glitter", tone: "iridescent", motion: "e", className: "left-[74%] top-[31%] size-[3px] [--delay:-5.1s] [--duration:8.5s] [--sparkle-alpha:0.34]" },
  { kind: "diamond", tone: "dusty", motion: "d", className: "left-[88%] top-[43%] size-[7px] [--delay:-7.2s] [--duration:6.6s] [--sparkle-alpha:0.65]", homeStyle: { left: "91%", top: "52%" } },
  { kind: "glitter", tone: "pastel", motion: "c", className: "left-[4%] top-[49%] size-[4px] [--delay:-4.4s] [--duration:7s] [--sparkle-alpha:0.47]" },
  { kind: "star", tone: "pastel", motion: "b", className: "left-[16%] top-[55%] size-[9px] [--delay:-6.8s] [--duration:8.2s] [--sparkle-alpha:0.62]", homeStyle: { left: "12%", top: "62%" } },
  { kind: "glitter", tone: "dusty", motion: "e", className: "left-[63%] top-[56%] size-[3px] [--delay:-3.4s] [--duration:6.2s] [--sparkle-alpha:0.42]" },
  { kind: "diamond", tone: "dusty", motion: "c", className: "left-[80%] top-[67%] size-[8px] [--delay:-6.1s] [--duration:7.3s] [--sparkle-alpha:0.62]", homeStyle: { left: "88%", top: "70%" } },
  { kind: "glitter", tone: "pearl", motion: "a", className: "left-[30%] top-[82%] size-[4px] [--delay:-2.9s] [--duration:6.7s] [--sparkle-alpha:0.44]" },
  { kind: "heart", tone: "pastel", motion: "d", className: "left-[44%] top-[87%] size-[12px] [--delay:-7.6s] [--duration:8.4s] [--sparkle-alpha:0.39]", homeStyle: { left: "22%", top: "88%" } },
  { kind: "star", tone: "pastel", motion: "c", className: "left-[67%] top-[86%] size-[11px] [--delay:-5.6s] [--duration:7.7s] [--sparkle-alpha:0.72]" },
  { kind: "glitter", tone: "pastel", motion: "e", className: "left-[92%] top-[83%] size-[4px] [--delay:-1.8s] [--duration:6.9s] [--sparkle-alpha:0.47]" },
  { kind: "star", tone: "champagne", motion: "b", className: "left-[52%] top-[94%] size-[10px] [--delay:-4.7s] [--duration:8.1s] [--sparkle-alpha:0.65]" },
];

function renderSparkleShape(kind: SparkleKind) {
  if (kind !== "heart") {
    return null;
  }

  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path d="M12 20.1s-7.2-4.4-9.2-9.1C1.4 7.8 3.2 4.6 6.5 4.6c1.9 0 3.4 1 4.2 2.4.8-1.4 2.3-2.4 4.2-2.4 3.3 0 5.1 3.2 3.7 6.4-2 4.7-9.2 9.1-9.2 9.1Z" />
    </svg>
  );
}

function isDecorativePath(pathname: string) {
  return !decorativeEffectsExcludedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function getDocumentParticleLimit(isHomePath: boolean) {
  if (SPARKLE_DENSITY === "low") {
    return 14;
  }

  if (SPARKLE_DENSITY === "high") {
    return documentParticles.length;
  }

  return isHomePath ? 30 : 28;
}

function getViewportParticleLimit() {
  if (SPARKLE_DENSITY === "low") {
    return 4;
  }

  return viewportParticles.length;
}

export function GlobalSparkles() {
  const pathname = usePathname();
  const isHomePath = pathname === "/";

  if (!ENABLE_GLOBAL_SPARKLES || !isDecorativePath(pathname)) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="global-sparkle-layers"
      style={{ "--sparkle-opacity": SPARKLE_OPACITY } as CSSProperties}
    >
      <div
        className={`global-sparkle-field global-sparkle-field--viewport ${
          ENABLE_GLITTER_TEXTURE ? "global-sparkle-field--texture" : ""
        }`}
      >
        {viewportParticles
          .slice(0, getViewportParticleLimit())
          .map((particle, index) => (
            <span
              className={`global-sparkle global-sparkle--${particle.kind} global-sparkle-tone-${particle.tone} global-sparkle-motion-${particle.motion} ${particle.className}`}
              key={`viewport-${particle.kind}-${index}`}
            >
              {renderSparkleShape(particle.kind)}
            </span>
          ))}
      </div>
      <div
        className={`global-sparkle-field global-sparkle-field--document ${
          isHomePath ? "global-sparkle-field--home" : ""
        } ${ENABLE_GLITTER_TEXTURE ? "global-sparkle-field--texture" : ""}`}
      >
        {documentParticles
          .slice(0, getDocumentParticleLimit(isHomePath))
          .map((particle, index) => (
            <span
              className={`global-sparkle global-sparkle--${particle.kind} global-sparkle-tone-${particle.tone} global-sparkle-motion-${particle.motion} ${particle.className}`}
              key={`document-${particle.kind}-${index}`}
              style={isHomePath ? particle.homeStyle : undefined}
            >
              {renderSparkleShape(particle.kind)}
            </span>
          ))}
      </div>
    </div>
  );
}
