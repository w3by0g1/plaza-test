import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import "./App.css";

import DJS, { ALL_BPMS } from "./data/djs";
import {
  CHARACTERS,
  CHARACTERS_INVERSE,
  ROW_COLORS,
  ANIMATIONS,
} from "./data/characters";

import SearchBar from "./components/SearchBar";
import DJSlider from "./components/DJSlider";
import MiiCharacter from "./components/MiiCharacter";
import BasketPanel from "./components/BasketPanel";
import useParallax from "./hooks/useParallax";

// --- Flag mapping by location ---
const LOCATION_FLAGS = {
  Berlin: "./FLAG.svg",
  Paris: "./FLAG.svg",
  London: "./FLAG=GB.svg",
  "New York": "./FLAG=US.svg",
  "Los Angeles": "./FLAG=US.svg",
  Melbourne: "./FLAG=AU.svg",
  Sydney: "./FLAG=AU.svg",
  "São Paulo": "./FLAG=BR.svg",
  "Buenos Aires": null,
  Lisbon: null,
  Barcelona: null,
  Montreal: null,
  Tokyo: null,
  Mumbai: null,
  Singapore: null,
  Nairobi: null,
};

// --- Flag shadow component (memoized) ---
const FlagShadow = React.memo(({ scale = 1, location = "" }) => {
  const flagW = 72;
  const flagH = 48;
  const src = LOCATION_FLAGS[location];
  if (!src) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "-18px",
        left: "50%",
        transform: "translateX(-50%)",
        perspective: "120px",
        perspectiveOrigin: "50% 0%",
        pointerEvents: "none",
        zIndex: -1,
      }}
    >
      <img
        src={src}
        alt={location}
        style={{
          width: flagW,
          height: flagH,
          display: "block",
          transformOrigin: "50% 0%",
          transform: `rotateX(45deg) scaleX(${1.1 / scale})`,
          opacity: 0.65,
          imageRendering: "crisp-edges",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: flagW,
          height: flagH,
          transformOrigin: "50% 0%",
          transform: `rotateX(45deg) scaleX(${1.1 / scale})`,
          background: `linear-gradient(
            160deg,
            rgba(255,255,255,0.55) 0%,
            rgba(255,255,255,0.15) 35%,
            rgba(255,255,255,0.0) 60%,
            rgba(0,0,0,0.08) 100%
          )`,
          borderRadius: "1px",
          pointerEvents: "none",
        }}
      />
    </div>
  );
});

// --- Mii item component (memoized with custom comparator) ---
const MiiItem = React.memo(
  ({
    mii,
    hoverAnim,
    isVisible,
    isFiltered,
    hasFilter,
    scale,
    shadowOpacity,
    tx,
    ty,
    zOpacity,
    blurAmount,
    onMouseEnter,
    onClick,
    onAnimationEnd,
  }) => (
    <div
      data-id={mii.id}
      className={`mii ${hoverAnim || ""} ${!isVisible ? "hidden" : ""} ${!hasFilter ? "on-map" : ""} ${mii.fadeIn ? "fade-in" : ""}`}
      style={{
        transform: `translate(calc(${tx}px - 50%), calc(${ty}px - 50%)) scale(${scale})`,
        opacity: zOpacity,
        filter: blurAmount > 0 ? `blur(${blurAmount}px)` : "none",
      }}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      onAnimationEnd={onAnimationEnd}
    >
      {isFiltered && <FlagShadow scale={scale} location={mii.location} />}
      <MiiCharacter character={mii.character} />
      {isVisible && (
        <div className="mii-reflection" style={{ opacity: shadowOpacity }}>
          <MiiCharacter character={mii.character} />
        </div>
      )}
    </div>
  ),
  (prev, next) =>
    prev.tx === next.tx &&
    prev.ty === next.ty &&
    prev.scale === next.scale &&
    prev.zOpacity === next.zOpacity &&
    prev.blurAmount === next.blurAmount &&
    prev.isVisible === next.isVisible &&
    prev.isFiltered === next.isFiltered &&
    prev.hasFilter === next.hasFilter &&
    prev.hoverAnim === next.hoverAnim &&
    prev.shadowOpacity === next.shadowOpacity &&
    prev.mii.fadeIn === next.mii.fadeIn,
);

// --- Mii creation ---
const createMiis = () => {
  const padding = 180;
  const topPadding = 0;
  const h = (window.innerHeight - topPadding - padding) * 3;
  const count = DJS.length;
  const positions = [];

  const shuffled = Array.from({ length: count }, (_, i) => i);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  for (let i = 0; i < count; i++) {
    const band = shuffled[i] / count;
    const biasedBand = Math.pow(band, 100);
    const jitterAmount = (1 - biasedBand) * 0.4 + 0.1;
    const jitter = (Math.random() - 0.5) * (h / count) * jitterAmount * 4;
    const homeY = topPadding + biasedBand * h + jitter;
    const clampedY = Math.max(
      topPadding,
      Math.min(window.innerHeight - padding, homeY),
    );

    const depth = clampedY / window.innerHeight;
    const rowWidth = window.innerWidth * (0.55 - depth * 0.2);
    const centerX = window.innerWidth / 2;
    const centerBias = Math.random() * 0.6 + Math.random() * 0.4 - 0.5;
    const offset = centerBias * rowWidth;
    const sidePadding = 100;
    const homeX = Math.max(
      sidePadding,
      Math.min(window.innerWidth - sidePadding, centerX + offset),
    );

    positions.push({ x: homeX, y: clampedY });
  }

  const sortedByY = positions
    .map((pos, i) => ({ i, y: pos.y }))
    .sort((a, b) => a.y - b.y);
  const baseZValues = new Array(positions.length);
  sortedByY.forEach((item, rank) => {
    baseZValues[item.i] = rank / Math.max(1, sortedByY.length - 1);
  });

  const shuffledChars = [...CHARACTERS];
  for (let i = shuffledChars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledChars[i], shuffledChars[j]] = [shuffledChars[j], shuffledChars[i]];
  }

  const shuffledInverse = [...CHARACTERS_INVERSE];
  for (let i = shuffledInverse.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledInverse[i], shuffledInverse[j]] = [
      shuffledInverse[j],
      shuffledInverse[i],
    ];
  }

  let charIdx = 0;
  let inverseCharIdx = 0;

  return DJS.map((dj, i) => {
    const { x: homeX, y: homeY } = positions[i];
    const depth = homeY / window.innerHeight;
    const homeScale = 0.9 + depth * 0.9;
    const homeColorIndex = Math.min(9, Math.round((1 - depth) * 9));
    const baseZ = baseZValues[i];

    const isFeatured = dj.bpm === "125-140" && dj.genres.includes("Electronic");

    const character = isFeatured
      ? shuffledInverse[inverseCharIdx++ % shuffledInverse.length]
      : shuffledChars[charIdx++ % shuffledChars.length];

    return {
      id: i,
      name: dj.name,
      genres: dj.genres,
      location: dj.location,
      bpm: dj.bpm,
      character,
      x: homeX,
      y: homeY,
      homeX,
      homeY,
      homeScale,
      homeColorIndex,
      baseZ,
      targetX: null,
      targetY: null,
      visible: true,
      rowScale: 1,
      rowColor: ROW_COLORS[0],
      rowIndex: 0,
      fadeIn: false,
    };
  });
};

// --- Grid position calculator ---
function getGridPositions(count) {
  const padding = 80;
  const topPadding = 220;
  const bottomPadding = 250;
  const availableWidth = window.innerWidth - padding * 2;
  const availableHeight = window.innerHeight - topPadding - bottomPadding;

  const cols = 10;
  const rows = Math.max(1, Math.ceil(count / cols));
  const baseSpacingX = 120;
  const baseSpacingY = 180;

  const gridWidth = (cols - 1) * baseSpacingX;
  const gridHeight = (rows - 1) * baseSpacingY;
  const scaleX = gridWidth > 0 ? availableWidth / gridWidth : 1;
  const scaleY = gridHeight > 0 ? availableHeight / gridHeight : 1;
  const scale = Math.min(scaleX, scaleY, 1);

  const spacingX = baseSpacingX * scale;
  const spacingY = baseSpacingY * scale;

  const totalGridWidth = (cols - 1) * spacingX;
  const totalGridHeight = (rows - 1) * spacingY;
  const offsetX = (availableWidth - totalGridWidth) / 2 + padding;
  const offsetY = topPadding + (availableHeight - totalGridHeight) / 2;

  const positions = Array.from({ length: count }, (_, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    const itemsInRow = Math.min(cols, count - row * cols);
    const rowWidth = (itemsInRow - 1) * spacingX;
    const rowOffsetX = (availableWidth - rowWidth) / 2 + padding;

    const x =
      itemsInRow === 1 ? window.innerWidth / 2 : rowOffsetX + col * spacingX;
    const y = offsetY + row * spacingY;

    return { x, y, rowScale: 1, rowColor: ROW_COLORS[0], row };
  });

  return { positions, scale };
}

// --- Top stat helpers ---
function getTopStat(djs, filterFn, extractFn) {
  const filtered = djs.filter(filterFn);
  const counts = {};
  filtered.forEach((dj) => {
    const values = extractFn(dj);
    (Array.isArray(values) ? values : [values]).forEach((v) => {
      counts[v] = (counts[v] || 0) + 1;
    });
  });
  let top = null,
    max = 0;
  Object.entries(counts).forEach(([key, count]) => {
    if (count > max) {
      max = count;
      top = key;
    }
  });
  return top;
}

// --- App ---
function App() {
  const [miis, setMiis] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedBpms, setSelectedBpms] = useState([]);
  const [bpmRange, setBpmRange] = useState([0, ALL_BPMS.length - 1]);
  const [hoverAnimations, setHoverAnimations] = useState({});
  const [maxDisplayCount, setMaxDisplayCount] = useState(20);
  const [gridScale, setGridScale] = useState(1);
  const [basket, setBasket] = useState([]);
  const [depthOffset, setDepthOffset] = useState(0);
  const animationRef = useRef(null);
  const prevDisplayCountRef = useRef(0);
  const scrollVelRef = useRef(0);
  const depthLoopRef = useRef(null);
  const depthOffsetRef = useRef(0);
  const parallax = useParallax(0.02);

  const hasFilter =
    selectedGenres.length > 0 ||
    selectedLocations.length > 0 ||
    selectedBpms.length > 0;

  useEffect(() => {
    setMiis(createMiis());
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (depthLoopRef.current) {
        cancelAnimationFrame(depthLoopRef.current);
        depthLoopRef.current = null;
      }
    };
  }, []);

  const startDepthLoop = useCallback(() => {
    if (depthLoopRef.current) return;
    const loop = () => {
      const vel = scrollVelRef.current;
      if (Math.abs(vel) < 0.000005) {
        scrollVelRef.current = 0;
        depthLoopRef.current = null;
        return;
      }
      scrollVelRef.current *= 0.94;
      depthOffsetRef.current += vel;
      // Only trigger re-render if movement is meaningful
      if (Math.abs(vel) > 0.00005) {
        setDepthOffset(depthOffsetRef.current);
      }
      depthLoopRef.current = requestAnimationFrame(loop);
    };
    depthLoopRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    if (hasFilter) {
      scrollVelRef.current = 0;
      depthOffsetRef.current = 0;
      setDepthOffset(0);
      if (depthLoopRef.current) {
        cancelAnimationFrame(depthLoopRef.current);
        depthLoopRef.current = null;
      }
      return;
    }
    const handleWheel = (e) => {
      if (e.target.closest(".section-dropdown")) return;
      e.preventDefault();
      scrollVelRef.current += e.deltaY * 0.00002;
      startDepthLoop();
    };

    let lastTouchY = null;
    const handleTouchStart = (e) => {
      lastTouchY = e.touches[0].clientY;
    };
    const handleTouchMove = (e) => {
      if (lastTouchY === null) return;
      if (e.target.closest(".section-dropdown")) return;
      e.preventDefault();
      const deltaY = lastTouchY - e.touches[0].clientY;
      lastTouchY = e.touches[0].clientY;
      scrollVelRef.current -= deltaY * 0.00005;
      startDepthLoop();
    };
    const handleTouchEnd = () => {
      lastTouchY = null;
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [hasFilter, startDepthLoop]);

  const visibleCount = useMemo(
    () => miis.filter((m) => m.visible).length,
    [miis],
  );

  const basketedDJNames = useMemo(
    () => new Set(basket.flatMap((item) => item.djs.map((dj) => dj.name))),
    [basket],
  );

  const startAnimation = useCallback(() => {
    if (animationRef.current) return;
    const animate = () => {
      setMiis((prevMiis) => {
        let anyMoving = false;
        const next = prevMiis.map((mii) => {
          const tx = mii.targetX,
            ty = mii.targetY;
          if (tx == null || ty == null) return mii;
          const dx = tx - mii.x,
            dy = ty - mii.y;
          if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
            if (mii.x === tx && mii.y === ty) return mii;
            anyMoving = true;
            return { ...mii, x: tx, y: ty };
          }
          anyMoving = true;
          return { ...mii, x: mii.x + dx * 0.1, y: mii.y + dy * 0.1 };
        });
        if (!anyMoving) {
          animationRef.current = null;
          return prevMiis;
        }
        animationRef.current = requestAnimationFrame(animate);
        return next;
      });
    };
    animationRef.current = requestAnimationFrame(animate);
  }, []);

  const applyFilters = useCallback(
    (newGenres, newLocations, newBpms) => {
      const hasAnyFilter =
        newGenres.length > 0 || newLocations.length > 0 || newBpms.length > 0;

      if (!hasAnyFilter) {
        setMiis((prev) =>
          prev.map((mii) => ({
            ...mii,
            x: mii.homeX,
            y: mii.homeY,
            targetX: null,
            targetY: null,
            visible: !basketedDJNames.has(mii.name),
            rowScale: 1,
            rowColor: ROW_COLORS[0],
            fadeIn: false,
          })),
        );
        prevDisplayCountRef.current = 0;
      } else {
        setMiis((prev) => {
          const matchFlags = prev.map((mii) => {
            if (basketedDJNames.has(mii.name)) return false;
            const isFeatured =
              mii.bpm === "125-140" && mii.genres.includes("Electronic");
            if (!isFeatured) return false;
            const g =
              newGenres.length === 0 ||
              mii.genres.some((x) => newGenres.includes(x));
            const l =
              newLocations.length === 0 || newLocations.includes(mii.location);
            const b = newBpms.length === 0 || newBpms.includes(mii.bpm);
            return g && l && b;
          });
          const matchCount = matchFlags.filter(Boolean).length;
          const displayCount = Math.min(maxDisplayCount, matchCount);
          const { positions, scale } = getGridPositions(displayCount);
          setGridScale(scale);
          prevDisplayCountRef.current = displayCount;
          let posIndex = 0;

          return prev.map((mii, i) => {
            if (!matchFlags[i])
              return { ...mii, visible: false, fadeIn: false };
            if (posIndex < displayCount) {
              const pos = positions[posIndex++];
              return {
                ...mii,
                x: pos.x,
                y: pos.y,
                targetX: pos.x,
                targetY: pos.y,
                rowScale: pos.rowScale,
                rowColor: pos.rowColor,
                rowIndex: pos.row,
                visible: true,
                fadeIn: true,
              };
            }
            return { ...mii, visible: true, targetX: null, targetY: null };
          });
        });
      }
    },
    [maxDisplayCount, basketedDJNames],
  );

  useEffect(() => {
    if (!hasFilter) return;
    setMiis((prev) => {
      const matching = prev.filter((mii) => mii.visible);
      const displayCount = Math.min(maxDisplayCount, matching.length);
      const { positions, scale } = getGridPositions(displayCount);
      setGridScale(scale);
      const prevCount = prevDisplayCountRef.current;
      let posIndex = 0,
        hasNewTargets = false;

      const result = prev.map((mii) => {
        if (mii.visible && posIndex < displayCount) {
          const idx = posIndex;
          const pos = positions[posIndex++];
          const isNew = idx >= prevCount;
          if (isNew) {
            return {
              ...mii,
              x: pos.x,
              y: pos.y,
              targetX: pos.x,
              targetY: pos.y,
              rowScale: pos.rowScale,
              rowColor: pos.rowColor,
              rowIndex: pos.row,
              fadeIn: true,
            };
          }
          if (mii.targetX !== pos.x || mii.targetY !== pos.y)
            hasNewTargets = true;
          return {
            ...mii,
            targetX: pos.x,
            targetY: pos.y,
            rowScale: pos.rowScale,
            rowColor: pos.rowColor,
            rowIndex: pos.row,
            fadeIn: false,
          };
        }
        return mii.fadeIn ? { ...mii, fadeIn: false } : mii;
      });

      prevDisplayCountRef.current = displayCount;
      if (hasNewTargets) startAnimation();
      return result;
    });
  }, [maxDisplayCount, hasFilter, startAnimation]);

  useEffect(() => {
    if (miis.length > 0)
      applyFilters(selectedGenres, selectedLocations, selectedBpms);
  }, [basketedDJNames]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stable per-id handlers
  const handleMouseEnterById = useCallback((id) => {
    if (window.innerWidth > 768) {
      const anim = ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)];
      setHoverAnimations((prev) => ({ ...prev, [id]: anim }));
    }
  }, []);

  const handleClickById = useCallback((id) => {
    if (window.innerWidth <= 768) {
      const anim = ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)];
      setHoverAnimations((prev) => ({ ...prev, [id]: anim }));
    }
  }, []);

  const handleAnimationEndById = useCallback((id) => {
    if (window.innerWidth <= 768) {
      setHoverAnimations((prev) => ({ ...prev, [id]: "" }));
    }
  }, []);

  // Compute all derived render data in one memoized pass
  const computedMiis = useMemo(() => {
    if (miis.length === 0) return [];

    let count = 0;
    const wH = window.innerHeight;
    const wW = window.innerWidth;
    const cx = wW / 2;
    const depthTop = 0;
    const depthRange = wH - depthTop;

    const items = miis.map((mii) => {
      const isVisible = mii.visible && (!hasFilter || count < maxDisplayCount);
      if (mii.visible && hasFilter) count++;

      const isFiltered = hasFilter && isVisible;

      if (!hasFilter) {
        const ez = (((mii.baseZ + depthOffset) % 1) + 1) % 1;
        const scale = (wW > 768 ? 0.25 : 0.1) + ez * (wW > 768 ? 0.5 : 0.45);
        const ty = depthTop + Math.pow(ez, wW > 768 ? 7 : 8) * depthRange;
        const narrowFactor = (wW > 768 ? 0.1 : 0.1) + ez * 1.7;
        const parallaxX = parallax.x * (1 - ez) * -200;
        const tx = cx + (mii.homeX - cx) * narrowFactor + parallaxX;
        const shadowOpacity = (0.1 + ez * 0.4).toFixed(2);
        let zOpacity = 1;
        if (ez > 0.92) zOpacity = 1 - (ez - 0.92) / 0.08;
        if (ez < 0.08) zOpacity = ez / 0.08;
        const sharpThreshold = 0.825;
        const blurAmount =
          ez >= sharpThreshold ? 0 : (1 - ez / sharpThreshold) * 20;

        return {
          mii,
          isVisible,
          isFiltered,
          scale,
          shadowOpacity,
          tx,
          ty,
          ez,
          zOpacity,
          blurAmount,
        };
      }

      const scale = isFiltered ? gridScale * 0.5 : 1;
      const tx = mii.x;
      const ty = mii.y;
      return {
        mii,
        isVisible,
        isFiltered,
        scale,
        shadowOpacity: "0.4",
        tx,
        ty,
        ez: 0,
        zOpacity: 1,
        blurAmount: 0,
      };
    });

    if (!hasFilter) {
      items.sort((a, b) => a.ez - b.ez);
    }

    return items;
  }, [miis, depthOffset, hasFilter, gridScale, parallax.x, maxDisplayCount]);

  const handleGenreSelect = useCallback(
    (genre) => {
      const next = selectedGenres.includes(genre)
        ? selectedGenres.filter((g) => g !== genre)
        : [...selectedGenres, genre];
      setSelectedGenres(next);
      applyFilters(next, selectedLocations, selectedBpms);
    },
    [applyFilters, selectedGenres, selectedLocations, selectedBpms],
  );

  const handleLocationSelect = useCallback(
    (location) => {
      const next = selectedLocations.includes(location)
        ? selectedLocations.filter((l) => l !== location)
        : [...selectedLocations, location];
      setSelectedLocations(next);
      applyFilters(selectedGenres, next, selectedBpms);
    },
    [applyFilters, selectedGenres, selectedLocations, selectedBpms],
  );

  const handleBpmRange = useCallback(
    (min, max) => {
      setBpmRange([min, max]);
      const isFullRange = min === 0 && max === ALL_BPMS.length - 1;
      const next = isFullRange ? [] : ALL_BPMS.slice(min, max + 1);
      setSelectedBpms(next);
      applyFilters(selectedGenres, selectedLocations, next);
    },
    [applyFilters, selectedGenres, selectedLocations],
  );

  const handleClear = useCallback(() => {
    setSelectedGenres([]);
    setSelectedLocations([]);
    setSelectedBpms([]);
    setBpmRange([0, ALL_BPMS.length - 1]);
    applyFilters([], [], []);
  }, [applyFilters]);

  const handleConfirm = useCallback(() => {
    if (!hasFilter) return;
    let count = 0;
    const selectedDJs = miis
      .filter((mii) => {
        if (mii.visible && count < maxDisplayCount) {
          count++;
          return true;
        }
        return false;
      })
      .map((mii) => ({
        name: mii.name,
        genres: mii.genres,
        location: mii.location,
        bpm: mii.bpm,
        character: mii.character,
      }));

    setBasket((prev) => {
      let updated = [...prev];

      // Group selected DJs by location
      const byLocation = {};
      selectedDJs.forEach((dj) => {
        if (!byLocation[dj.location]) byLocation[dj.location] = [];
        byLocation[dj.location].push(dj);
      });

      Object.entries(byLocation).forEach(([location, djs]) => {
        const existingIndex = updated.findIndex(
          (item) =>
            item.locations.length === 1 && item.locations[0] === location,
        );

        if (existingIndex !== -1) {
          // Merge into existing single-location item
          const existing = updated[existingIndex];
          const existingNames = new Set(existing.djs.map((dj) => dj.name));
          const mergedDJs = [
            ...existing.djs,
            ...djs.filter((dj) => !existingNames.has(dj.name)),
          ];
          updated[existingIndex] = { ...existing, djs: mergedDJs };
        } else {
          // New basket item for this location
          updated.push({
            id: Date.now() + Math.random(),
            genres: [...selectedGenres],
            locations: [location],
            bpms: [...selectedBpms],
            djs,
          });
        }
      });

      return updated;
    });

    handleClear();
  }, [
    hasFilter,
    miis,
    maxDisplayCount,
    selectedGenres,
    selectedLocations,
    selectedBpms,
    handleClear,
  ]);

  const topGenre = useMemo(
    () =>
      selectedLocations.length > 0 || selectedBpms.length > 0
        ? getTopStat(
            DJS,
            (dj) => {
              const l =
                selectedLocations.length === 0 ||
                selectedLocations.includes(dj.location);
              const b =
                selectedBpms.length === 0 || selectedBpms.includes(dj.bpm);
              return l && b;
            },
            (dj) => dj.genres,
          )
        : null,
    [selectedLocations, selectedBpms],
  );

  const topLocation = useMemo(
    () =>
      selectedGenres.length > 0 || selectedBpms.length > 0
        ? getTopStat(
            DJS,
            (dj) => {
              const g =
                selectedGenres.length === 0 ||
                dj.genres.some((x) => selectedGenres.includes(x));
              const b =
                selectedBpms.length === 0 || selectedBpms.includes(dj.bpm);
              return g && b;
            },
            (dj) => dj.location,
          )
        : null,
    [selectedGenres, selectedBpms],
  );

  const topBpm = useMemo(
    () =>
      selectedGenres.length > 0 || selectedLocations.length > 0
        ? getTopStat(
            DJS,
            (dj) => {
              const g =
                selectedGenres.length === 0 ||
                dj.genres.some((x) => selectedGenres.includes(x));
              const l =
                selectedLocations.length === 0 ||
                selectedLocations.includes(dj.location);
              return g && l;
            },
            (dj) => dj.bpm,
          )
        : null,
    [selectedGenres, selectedLocations],
  );

  return (
    <div className="plaza">
      <SearchBar
        selectedGenres={selectedGenres}
        selectedLocations={selectedLocations}
        selectedBpms={selectedBpms}
        topGenre={topGenre}
        topLocation={topLocation}
        topBpm={topBpm}
        onGenreSelect={handleGenreSelect}
        onLocationSelect={handleLocationSelect}
        bpmRange={bpmRange}
        onBpmRangeChange={handleBpmRange}
        onClear={handleClear}
        hasFilter={hasFilter}
        basketedDJNames={basketedDJNames}
      />

      {hasFilter && (
        <div className="available-count">
          {visibleCount} drop{visibleCount > 1 ? "s" : ""} available
        </div>
      )}

      {hasFilter && (
        <DJSlider
          visibleCount={visibleCount}
          maxDisplayCount={maxDisplayCount}
          onSliderChange={setMaxDisplayCount}
          onConfirm={handleConfirm}
          selectedGenres={selectedGenres}
          selectedLocations={selectedLocations}
          selectedBpms={selectedBpms}
        />
      )}

      <div className="mii-container">
        {computedMiis.map(
          ({
            mii,
            isVisible,
            isFiltered,
            scale,
            shadowOpacity,
            tx,
            ty,
            zOpacity,
            blurAmount,
          }) => (
            <MiiItem
              key={mii.id}
              mii={mii}
              hoverAnim={hoverAnimations[mii.id]}
              isVisible={isVisible}
              isFiltered={isFiltered}
              hasFilter={hasFilter}
              scale={scale}
              shadowOpacity={shadowOpacity}
              tx={tx}
              ty={ty}
              zOpacity={zOpacity}
              blurAmount={blurAmount}
              onMouseEnter={() => handleMouseEnterById(mii.id)}
              onClick={() => handleClickById(mii.id)}
              onAnimationEnd={() => handleAnimationEndById(mii.id)}
            />
          ),
        )}
      </div>

      <div className="tilt-shift-top" />
      <div className="tilt-shift-bottom" />

      <BasketPanel
        basket={basket}
        onRemove={(id) =>
          setBasket((prev) => prev.filter((item) => item.id !== id))
        }
      />
    </div>
  );
}

export default App;
