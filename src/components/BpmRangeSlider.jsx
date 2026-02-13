import React, { useCallback } from "react";
import { ALL_BPMS } from "../data/djs";

const BPM_LABELS = ["<110", "110", "125", "140", "155+"];

export default function BpmRangeSlider({ bpmRange, onBpmRangeChange }) {
  const [min, max] = bpmRange;
  const steps = ALL_BPMS.length - 1;

  const handleMin = useCallback(
    (e) => {
      const val = parseInt(e.target.value);
      onBpmRangeChange(Math.min(val, max), max);
    },
    [max, onBpmRangeChange],
  );

  const handleMax = useCallback(
    (e) => {
      const val = parseInt(e.target.value);
      onBpmRangeChange(min, Math.max(val, min));
    },
    [min, onBpmRangeChange],
  );

  const leftPercent = (min / steps) * 100;
  const rightPercent = (max / steps) * 100;

  // Build display label
  const isFullRange = min === 0 && max === steps;
  let label = "Any BPM";
  if (!isFullRange) {
    const lo = BPM_LABELS[min];
    const hi = BPM_LABELS[max];
    label = lo === hi ? ALL_BPMS[min] : `${lo} – ${hi}`;
  }

  return (
    <div className="bpm-range-slider">
      <div className="bpm-range-label">{label}</div>
      <div className="bpm-range-track-wrapper">
        <div
          className="bpm-range-highlight"
          style={{ left: `${leftPercent}%`, right: `${100 - rightPercent}%` }}
        />
        <input
          type="range"
          min="0"
          max={steps}
          step="1"
          value={min}
          onChange={handleMin}
          className="bpm-range-input bpm-range-min"
        />
        <input
          type="range"
          min="0"
          max={steps}
          step="1"
          value={max}
          onChange={handleMax}
          className="bpm-range-input bpm-range-max"
        />
      </div>
      <div className="bpm-range-ticks">
        {BPM_LABELS.map((lbl, i) => (
          <span
            key={i}
            className={`bpm-tick ${i >= min && i <= max ? "active" : ""}`}
          >
            {lbl}
          </span>
        ))}
      </div>
    </div>
  );
}
