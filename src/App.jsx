import React, { useState, useEffect, useRef, useCallback } from "react";
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

// --- Mii creation ---

const createMiis = () => {
  const padding = 180;
  const topPadding = 0;
  const h = (window.innerHeight - topPadding - padding) * 3; // 50% taller than screen
  const count = DJS.length;
  const positions = [];

  // Distribute characters biased toward bottom, more scattered at top
  const shuffled = Array.from({ length: count }, (_, i) => i);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  for (let i = 0; i < count; i++) {
    const band = shuffled[i] / count; // Evenly spaced 0-1
    // Bias toward bottom: characters cluster at bottom, spread out toward top
    const biasedBand = Math.pow(band, 100);
    // More jitter the further up (less organized at top)
    const jitterAmount = (1 - biasedBand) * 0.4 + 0.1;
    const jitter = (Math.random() - 0.5) * (h / count) * jitterAmount * 4;
    const homeY = topPadding + biasedBand * h + jitter;
    const clampedY = Math.max(
      topPadding,
      Math.min(window.innerHeight - padding, homeY),
    );

    // Width narrows at bottom (more centered), wider at top
    const depth = clampedY / window.innerHeight;
    const rowWidth = window.innerWidth * (0.55 - depth * 0.2);
    const centerX = window.innerWidth / 2;
    // Slightly center-biased distribution
    const centerBias = Math.random() * 0.6 + Math.random() * 0.4 - 0.5;
    const offset = centerBias * rowWidth;
    const sidePadding = 100;
    const homeX = Math.max(
      sidePadding,
      Math.min(window.innerWidth - sidePadding, centerX + offset),
    );

    positions.push({ x: homeX, y: clampedY });
  }

  // Sort indices by Y to assign evenly-distributed baseZ values
  const sortedByY = positions
    .map((pos, i) => ({ i, y: pos.y }))
    .sort((a, b) => a.y - b.y);
  const baseZValues = new Array(positions.length);
  sortedByY.forEach((item, rank) => {
    baseZValues[item.i] = rank / Math.max(1, sortedByY.length - 1);
  });

  // Shuffle characters so each DJ gets a random one
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
    // Depth based on Y position: bottom = close (large, dark), top = far (small, light)
    const depth = homeY / window.innerHeight; // 0 (top/far) to 1 (bottom/close)
    const homeScale = 0.9 + depth * 0.9; // 0.4 at top to 1.0 at bottom
    const homeColorIndex = Math.min(9, Math.round((1 - depth) * 9)); // dark at bottom, light at top
    const baseZ = baseZValues[i]; // evenly distributed 0-1 for depth scrolling

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
  const genre = "Electronic";
  const location = "London";
  const bpm = "125-140";

  const hasFilter =
    selectedGenres.length > 0 ||
    selectedLocations.length > 0 ||
    selectedBpms.length > 0;

  // Initialize
  useEffect(() => {
    setMiis(createMiis());
  }, []);

  // Cleanup animation on unmount
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

  // --- Depth scroll system (only when no filters) ---

  const startDepthLoop = useCallback(() => {
    if (depthLoopRef.current) return;
    const loop = () => {
      const vel = scrollVelRef.current;
      if (Math.abs(vel) < 0.000005) {
        scrollVelRef.current = 0;
        depthLoopRef.current = null;
        return;
      }
      scrollVelRef.current *= 0.94; // damping
      depthOffsetRef.current += vel;
      setDepthOffset(depthOffsetRef.current);
      depthLoopRef.current = requestAnimationFrame(loop);
    };
    depthLoopRef.current = requestAnimationFrame(loop);
  }, []);

  // Wheel listener — accumulates velocity, starts depth loop
  useEffect(() => {
    if (hasFilter) {
      // Reset depth scroll when filters are active
      scrollVelRef.current = 0;
      depthOffsetRef.current = 0;
      setDepthOffset(0);
      if (depthLoopRef.current) {
        cancelAnimationFrame(depthLoopRef.current);
        depthLoopRef.current = null;
      }
      return;
    }
    // Desktop: wheel
    const handleWheel = (e) => {
      if (e.target.closest(".section-dropdown")) return;
      e.preventDefault();
      scrollVelRef.current += e.deltaY * 0.00002;
      startDepthLoop();
    };

    // Mobile: touch swipe
    let lastTouchY = null;

    const handleTouchStart = (e) => {
      lastTouchY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (lastTouchY === null) return;
      if (e.target.closest(".section-dropdown")) return;
      e.preventDefault();
      const deltaY = lastTouchY - e.touches[0].clientY; // inverted so swipe-up = scroll forward
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

  // Memoize visible count
  const visibleCount = React.useMemo(
    () => miis.filter((m) => m.visible).length,
    [miis],
  );

  // Basket DJ names
  const basketedDJNames = React.useMemo(
    () => new Set(basket.flatMap((item) => item.djs.map((dj) => dj.name))),
    [basket],
  );

  // --- Animation ---

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

  // --- Filters ---

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

            // Always restrict to featured DJs when any filter is active
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

  // Recalculate grid when slider changes
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

  // Re-apply filters when basket changes
  useEffect(() => {
    if (miis.length > 0)
      applyFilters(selectedGenres, selectedLocations, selectedBpms);
  }, [basketedDJNames]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Handlers ---

  const handleMouseEnter = (id) => {
    const anim = ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)];
    setHoverAnimations((prev) => ({ ...prev, [id]: anim }));
  };

  const handleAnimationEnd = (id) => {
    // On mobile, clear the animation class after it plays once
    if (window.innerWidth <= 768) {
      setHoverAnimations((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const handleGenreSelect = (genre) => {
    const next = selectedGenres.includes(genre)
      ? selectedGenres.filter((g) => g !== genre)
      : [...selectedGenres, genre];
    setSelectedGenres(next);
    applyFilters(next, selectedLocations, selectedBpms);
  };

  const handleLocationSelect = (location) => {
    const next = selectedLocations.includes(location)
      ? selectedLocations.filter((l) => l !== location)
      : [...selectedLocations, location];
    setSelectedLocations(next);
    applyFilters(selectedGenres, next, selectedBpms);
  };

  const handleBpmRange = (min, max) => {
    setBpmRange([min, max]);
    const isFullRange = min === 0 && max === ALL_BPMS.length - 1;
    const next = isFullRange ? [] : ALL_BPMS.slice(min, max + 1);
    setSelectedBpms(next);
    applyFilters(selectedGenres, selectedLocations, next);
  };

  const handleClear = () => {
    setSelectedGenres([]);
    setSelectedLocations([]);
    setSelectedBpms([]);
    setBpmRange([0, ALL_BPMS.length - 1]);
    applyFilters([], [], []);
  };

  const handleConfirm = () => {
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

    setBasket((prev) => [
      ...prev,
      {
        id: Date.now(),
        genres: [...selectedGenres],
        locations: [...selectedLocations],
        bpms: [...selectedBpms],
        djs: selectedDJs,
      },
    ]);
    handleClear();
  };

  // --- Top stats ---

  const topGenre =
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
      : null;

  const topLocation =
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
      : null;

  const topBpm =
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
      : null;

  // --- Render ---

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
      />

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
        {(() => {
          // Determine visibility first
          let count = 0;
          const items = miis.map((mii) => {
            const isVisible =
              mii.visible && (!hasFilter || count < maxDisplayCount);
            if (mii.visible && hasFilter) count++;
            return { mii, isVisible };
          });

          // Precompute per-item values
          const wH = window.innerHeight;
          const wW = window.innerWidth;
          const cx = wW / 2;
          const depthTop = 0;
          const depthBottom = window.innerWidth > 768 ? 0 : 0;
          const depthRange = wH - depthTop - depthBottom;

          const computed = items.map(({ mii, isVisible }) => {
            const isFiltered = hasFilter && isVisible;

            if (!hasFilter) {
              // --- Depth-scroll mode --
              const ez = (((mii.baseZ + depthOffset) % 1) + 1) % 1; // wrap 0-1
              const scale =
                (window.innerWidth > 768 ? 0.25 : 0.1) +
                ez * (window.innerWidth > 768 ? 0.5 : 0.45);
              const colorIndex = Math.min(9, Math.round((1 - ez) * 9));
              const color = ROW_COLORS[colorIndex];
              const ty =
                depthTop +
                Math.pow(ez, window.innerWidth > 768 ? 7 : 8) * depthRange;
              // Narrow X toward center for far characters + mouse parallax
              const narrowFactor =
                (window.innerWidth > 768 ? 0.1 : 0.1) + ez * 1.7;
              const parallaxX = parallax.x * (1 - ez) * -200;
              const tx = cx + (mii.homeX - cx) * narrowFactor + parallaxX;
              // Shadow: stronger for close
              const shadowOpacity = (0.1 + ez * 0.4).toFixed(2);
              // Fade at wrap boundaries for smooth looping
              let zOpacity = 1;
              if (ez > 0.92) zOpacity = 1 - (ez - 0.92) / 0.08;
              if (ez < 0.08) zOpacity = ez / 0.08;
              return {
                mii,
                isVisible,
                isFiltered,
                scale,
                color,
                shadowOpacity,
                tx,
                ty,
                ez,
                zOpacity,
                blurAmount: 0,
              };
            }

            // --- Filtered / grid mode (flat, no perspective) ---
            const scale = isFiltered ? gridScale * 0.5 : 1;
            const color = isFiltered ? ROW_COLORS[0] : ROW_COLORS[0];
            const shadowOpacity = "0.4";
            const tx = mii.x;
            const ty = mii.y;
            return {
              mii,
              isVisible,
              isFiltered,
              scale,
              color,
              shadowOpacity,
              tx,
              ty,
              ez: 0,
              zOpacity: 1,
              blurAmount: 0,
            };
          });

          // Sort by depth (only in unfiltered mode)
          if (!hasFilter) {
            computed.sort((a, b) => a.ez - b.ez);

            // Depth blur: blurry at top (far), sharp from bottom 33% onward
            for (let i = 0; i < computed.length; i++) {
              const a = computed[i];
              if (!a.isVisible) continue;
              const sharpThreshold = 0.825;
              a.blurAmount =
                a.ez >= sharpThreshold ? 0 : (1 - a.ez / sharpThreshold) * 20;
            }
          }

          return computed.map(
            ({
              mii,
              isVisible,
              scale,
              shadowOpacity,
              tx,
              ty,
              zOpacity,
              blurAmount,
            }) => (
              <div
                key={mii.id}
                className={`mii ${hoverAnimations[mii.id] || ""} ${!isVisible ? "hidden" : ""} ${!hasFilter ? "on-map" : ""} ${mii.fadeIn ? "fade-in" : ""}`}
                style={{
                  transform: `translate(calc(${tx}px - 50%), calc(${ty}px - 50%)) scale(${scale})`,
                  opacity: zOpacity,
                  filter: blurAmount > 0 ? `blur(${blurAmount}px)` : "none",
                }}
                onMouseEnter={() => {
                  if (window.innerWidth > 768) handleMouseEnter(mii.id);
                }}
                onClick={() => {
                  if (window.innerWidth <= 768) handleMouseEnter(mii.id);
                }}
                onAnimationEnd={() => handleAnimationEnd(mii.id)}
              >
                <MiiCharacter character={mii.character} />
                {isVisible && (
                  <div
                    className="mii-reflection"
                    style={{ opacity: shadowOpacity }}
                  >
                    <MiiCharacter character={mii.character} />
                  </div>
                )}
              </div>
            ),
          );
        })()}
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
