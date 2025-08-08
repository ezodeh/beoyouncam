import React from "react";

export type LogoVariant = "icon" | "wordmark" | "stacked" | "horizontal";

interface LogoProps {
  variant?: LogoVariant; // which composition to render
  colored?: boolean; // render original colors or tint with currentColor
  gradient?: boolean; // if true, use background gradient via className instead of currentColor
  size?: number | string; // width in px or any CSS size (height auto via aspect-ratio)
  className?: string;
  title?: string; // accessible label
}

// Using public paths for uploaded PNGs
const srcMap: Record<LogoVariant, string> = {
  icon: "/lovable-uploads/6ff975c7-0141-4e6b-9d33-48024a875e58.png",
  wordmark: "/lovable-uploads/e635fc05-a945-415e-9dae-80f972c792cf.png",
  stacked: "/lovable-uploads/3abf2523-09b8-4264-b731-d9f044049749.png",
  horizontal: "/lovable-uploads/feffbd15-6f18-425a-baed-b8539b349521.png",
};

// Approximate aspect ratios based on source images
const ratioMap: Record<LogoVariant, number> = {
  icon: 2.0, // ~384x191
  wordmark: 1.86, // ~372x200
  stacked: 0.9, // ~384x427
  horizontal: 3.76, // ~771x205
};

const Logo: React.FC<LogoProps> = ({
  variant = "icon",
  colored = true,
  gradient = false,
  size = 32,
  className,
  title,
}) => {
  const src = srcMap[variant];
  const aria = title || "شعار من عيونكم";

  if (colored) {
    return (
      <img
        src={src}
        alt={aria}
        loading="lazy"
        className={className}
        style={{ width: typeof size === "number" ? `${size}px` : size, height: "auto" }}
      />
    );
  }

  // Monochrome/tinted mode using CSS mask so the color follows currentColor
  const width = typeof size === "number" ? `${size}px` : size;
  const style: React.CSSProperties = {
    width,
    aspectRatio: String(ratioMap[variant]),
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    display: "inline-block",
    ...(gradient ? {} : { backgroundColor: "currentColor" }),
  } as React.CSSProperties;

  return <span role="img" aria-label={aria} style={style} className={className} />;
};

export default Logo;
