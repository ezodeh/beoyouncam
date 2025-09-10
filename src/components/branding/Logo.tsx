import React from "react";

export type LogoVariant = "icon" | "wordmark" | "stacked" | "horizontal" | "brand";

interface LogoProps {
  variant?: LogoVariant; // which composition to render
  colored?: boolean; // render original colors or tint with currentColor
  gradient?: boolean; // if true, use background gradient via className instead of currentColor
  size?: number | string; // width in px or any CSS size (height auto via aspect-ratio)
  className?: string;
  title?: string; // accessible label
}

// Using عيونكام logo paths
const srcMap: Record<LogoVariant, string> = {
  icon: "/lovable-uploads/168fd1c7-87c9-4acf-aa27-fb49da03f0c9.png",
  wordmark: "/lovable-uploads/168fd1c7-87c9-4acf-aa27-fb49da03f0c9.png",
  stacked: "/lovable-uploads/168fd1c7-87c9-4acf-aa27-fb49da03f0c9.png",
  horizontal: "/lovable-uploads/168fd1c7-87c9-4acf-aa27-fb49da03f0c9.png",
  brand: "/lovable-uploads/168fd1c7-87c9-4acf-aa27-fb49da03f0c9.png",
};

// Approximate aspect ratios based on source images
const ratioMap: Record<LogoVariant, number> = {
  icon: 2.0, // ~384x191
  wordmark: 1.86, // ~372x200
  stacked: 0.9, // ~384x427
  horizontal: 3.76, // ~771x205
  brand: 3.0,
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
  const aria = title || "شعار عيونكام";

  // Brand composition: icon (right) + text (left) for RTL
  if (variant === "brand") {
    const height = typeof size === "number" ? `${size}px` : size;
    const iconSrc = srcMap.brand;
    return (
      <span role="img" aria-label={aria} className={(className ? className + " " : "") + "inline-flex items-center gap-2 leading-none"}>
        <img src={iconSrc} alt="" aria-hidden="true" loading="lazy" style={{ height, width: "auto" }} />
        <span className="font-extrabold font-nastaliq text-xl md:text-2xl">عيونكام</span>
      </span>
    );
  }

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
