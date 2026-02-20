import { useState, useEffect } from "react";

export default function useParallax(lerpSpeed = 0.02) {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let rafId = null;
    const isMobile = window.innerWidth <= 768;

    let baseGamma = null;
    let baseBeta = null;

    const handleOrientation = (e) => {
      if (baseGamma === null) baseGamma = e.gamma;
      if (baseBeta === null) baseBeta = e.beta;
      target.x = Math.max(-1, Math.min(1, (e.gamma - baseGamma) / 30));
      target.y = Math.max(-1, Math.min(1, (e.beta - baseBeta) / 30));
    };

    const attachGyro = () => {
      window.addEventListener("deviceorientation", handleOrientation);
    };

    const requestGyroOnFirstTap = async () => {
      if (typeof DeviceOrientationEvent?.requestPermission === "function") {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === "granted") attachGyro();
        } catch {}
      } else {
        attachGyro(); // Android — no permission needed
      }
      // Remove itself after first tap regardless
      window.removeEventListener("touchstart", requestGyroOnFirstTap);
    };

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

    if (isMobile) {
      window.addEventListener("touchstart", requestGyroOnFirstTap);
    } else {
      window.addEventListener("mousemove", handleMouseMove);
    }

    rafId = requestAnimationFrame(lerp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchstart", requestGyroOnFirstTap);
      window.removeEventListener("deviceorientation", handleOrientation);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [lerpSpeed]);

  return parallax;
}