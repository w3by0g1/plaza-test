import { useState, useEffect } from "react";

export default function useParallax(lerpSpeed = 0.02) {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let rafId = null;

    const handleMouseMove = (e) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const lerp = () => {
      current.x += (target.x - current.x) * lerpSpeed;
      current.y += (target.y - current.y) * lerpSpeed;
      setParallax({ x: current.x, y: current.y });
      rafId = requestAnimationFrame(lerp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    rafId = requestAnimationFrame(lerp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [lerpSpeed]);

  return parallax;
}
