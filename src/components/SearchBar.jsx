import React from "react";
import { ALL_GENRES, ALL_LOCATIONS } from "../data/djs";
import DJS from "../data/djs";
import BpmRangeSlider from "./BpmRangeSlider";

// Precompute featured DJs per location
const FEATURED_BY_LOCATION = {};
ALL_LOCATIONS.forEach((location) => {
  FEATURED_BY_LOCATION[location] = DJS.filter(
    (dj) =>
      dj.location === location &&
      dj.bpm === "125-140" &&
      dj.genres.includes("Electronic"),
  ).map((dj) => dj.name);
});

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
  basketedDJNames, // Set of DJ names already in the basket
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
            const featuredNames = FEATURED_BY_LOCATION[location] || [];
            const hasFeatured = featuredNames.length > 0;

            // Disabled if no featured DJs exist, or all featured DJs are basketed
            const allBasket =
              hasFeatured &&
              featuredNames.every((name) => basketedDJNames?.has(name));
            const isDisabled = !hasFeatured || allBasket;

            return (
              <button
                key={location}
                className={`dropdown-btn ${selectedLocations.includes(location) ? "active" : ""} ${topLocation === location ? "top" : ""} ${isDisabled ? "disabled" : ""}`}
                onClick={
                  isDisabled ? undefined : () => onLocationSelect(location)
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
