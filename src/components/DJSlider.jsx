import React from "react";

export default function DJSlider({
  visibleCount,
  maxDisplayCount,
  onSliderChange,
  onConfirm,
  selectedGenres,
  selectedLocations,
  selectedBpms,
}) {
  const count = Math.min(maxDisplayCount, visibleCount);

  return (
    <div className="dj-slider-container">
      <button className="dj-slider-display" onClick={onConfirm}>
        <span className="dj-slider-number">
          + Add {count} drop{count > 1 ? "s" : ""}
        </span>
      </button>
      <div className="dj-slider-controls">
        <input
          type="range"
          min="1"
          max={visibleCount || 1}
          value={count}
          onChange={(e) => onSliderChange(parseInt(e.target.value))}
          className="dj-slider"
        />
      </div>
    </div>
  );
}
