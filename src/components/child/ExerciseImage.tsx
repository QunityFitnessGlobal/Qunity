interface ExerciseImageProps {
  imageUrl: string | null;
  alt: string;
  className?: string;
  // Size of the stand-in figure drawn when the exercise has no image yet.
  figureClassName?: string;
  tone?: "purple" | "blue";
}

// An exercise's picture from the database (exercises.image_url), or a simple
// figure in its place until one is uploaded — so the layout is the same
// either way.
export function ExerciseImage({
  imageUrl,
  alt,
  className = "",
  figureClassName = "h-8 w-8",
  tone = "purple",
}: ExerciseImageProps) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external Storage URLs, no remotePatterns configured
      <img src={imageUrl} alt={alt} className={`object-cover ${className}`} />
    );
  }
  return (
    <span
      className={`flex items-center justify-center ${tone === "blue" ? "bg-[#eef3ff]" : "bg-[#f1edf5]"} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={figureClassName}
        fill="none"
        stroke={tone === "blue" ? "#7f9be0" : "#a79fb8"}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="4.5" r="2" />
        <path d="M12 7v7M12 14l-3.5 6M12 14l3.5 6M6 10.5h12" />
      </svg>
    </span>
  );
}
