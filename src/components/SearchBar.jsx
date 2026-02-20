import React from "react";
import { ALL_GENRES, ALL_LOCATIONS } from "../data/djs";
import DJS from "../data/djs";
import BpmRangeSlider from "./BpmRangeSlider";

// Precompute which locations have featured DJs
const LOCATIONS_WITH_FEATURED = new Set(
  DJS.filter(
    (dj) => dj.bpm === "125-140" && dj.genres.includes("Electronic"),
  ).map((dj) => dj.location),
);

export default function SearchBar({
  selectedGenres,
  selectedLocations,
  topGenre,
  topLocation,
  topBpm,
  onGenreSelect,
  onLocationSelect,
  bpmRange,
  onBpmRangeChange,
  onClear,
  hasFilter,
}) {
  const isFullBpmRange = bpmRange[0] === 0 && bpmRange[1] === 4;
  return (
    <div className="airbnb-search-bar">
      <div
        className={`search-section location-section ${selectedLocations.length > 0 ? "has-selection" : ""}`}
      >
        <div className="section-label">
          <img src="./song_row.png" alt="Location" />
        </div>
        <div className="section-dropdown">
          {ALL_LOCATIONS.map((location) => {
            const hasFeatured = LOCATIONS_WITH_FEATURED.has(location);
            return (
              <button
                key={location}
                className={`dropdown-btn ${selectedLocations.includes(location) ? "active" : ""} ${topLocation === location ? "top" : ""} ${!hasFeatured ? "disabled" : ""}`}
                onClick={
                  hasFeatured ? () => onLocationSelect(location) : undefined
                }
              >
                {location}
              </button>
            );
          })}
        </div>
      </div>

      {hasFilter && (
        <div className="clear-button" onClick={onClear}>
          ×
        </div>
      )}
    </div>
  );
}
