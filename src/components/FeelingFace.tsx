import type { CSSProperties } from "react";
import type { FeelingCode } from "@/lib/workout-labels";

interface FaceLook {
  fill: string;
  stroke: string;
  eyes: string;
  mouth: string;
  mouthFilled: boolean;
}

// One drawn face per feeling, from a big grin down to worn out — the child
// picks one after a workout, and the parent sees the same face later.
export const FEELING_FACES: Record<FeelingCode, FaceLook> = {
  fun: { fill: "#fff4d3", stroke: "#8a5d00", eyes: "M9.8 13.4q1.8-2.4 3.6 0M18.6 13.4q1.8-2.4 3.6 0", mouth: "M9.5 18.2q6.5 7.2 13 0z", mouthFilled: true },
  fine: { fill: "#e3f8ea", stroke: "#15803d", eyes: "M11.5 12.2v1.9M20.5 12.2v1.9", mouth: "M11 19.2q5 4.2 10 0", mouthFilled: false },
  frustrated: { fill: "#fff0e4", stroke: "#b9530f", eyes: "M11.5 13.2v1.9M20.5 13.2v1.9M9.6 10.2l3.6 1.6M22.4 10.2l-3.6 1.6", mouth: "M11 22.4q5-4 10 0", mouthFilled: false },
  tired: { fill: "#e6efff", stroke: "#1d4ed8", eyes: "M9.8 14h3.6M18.6 14h3.6", mouth: "M12.5 21.2h7", mouthFilled: false },
  exhausted: { fill: "#eeedf3", stroke: "#4a4458", eyes: "M10 12l3 3M13 12l-3 3M19 12l3 3M22 12l-3 3", mouth: "M10.5 21.5q1.75-2 3.5 0t3.5 0t3.5 0", mouthFilled: false },
};

interface FeelingFaceProps {
  code: FeelingCode;
  className?: string;
  style?: CSSProperties;
  // Omit when a surrounding control already carries the label.
  label?: string;
}

export function FeelingFace({ code, className, style, label }: FeelingFaceProps) {
  const face = FEELING_FACES[code];
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      style={style}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle cx="16" cy="16" r="15" fill={face.fill} />
      <path d={face.eyes} fill="none" stroke={face.stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path
        d={face.mouth}
        fill={face.mouthFilled ? face.stroke : "none"}
        stroke={face.stroke}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
