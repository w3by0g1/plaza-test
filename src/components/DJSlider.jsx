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
  const criteria = [
    ...selectedGenres,
    ...selectedLocations,
    ...selectedBpms,
  ].join(", ");

  const count = Math.min(maxDisplayCount, visibleCount);

  return (
    <div className="dj-slider-container">
      <div className="dj-slider-controls">
        <input
          type="range"
          min="1"
          max={visibleCount || 1}
          value={count}
          onChange={(e) => onSliderChange(parseInt(e.target.value))}
          className="dj-slider"
        />
        <span className="dj-slider-label">{visibleCount} available</span>
      </div>
      <button className="dj-slider-display" onClick={onConfirm}>
        <span className="dj-slider-number">
          + Add {count} DJ {count > 1 ? "s" : ""}
        </span>
      </button>
    </div>
  );
}
