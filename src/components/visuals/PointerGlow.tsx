import { useEffect, useRef } from "react";

const PointerGlow = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      el.style.setProperty("--x", `${x}px`);
      el.style.setProperty("--y", `${y}px`);
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(240px 240px at var(--x) var(--y), hsl(var(--primary)/0.14), transparent 60%)",
        maskImage: "radial-gradient(200px 200px at var(--x) var(--y), rgba(0,0,0,.8), transparent 60%)",
      }}
    />
  );
};

export default PointerGlow;
