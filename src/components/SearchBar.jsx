import React from "react";
import { ALL_GENRES, ALL_LOCATIONS } from "../data/djs";
import BpmRangeSlider from "./BpmRangeSlider";

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
      {/* <div
        className={`search-section genre-section ${selectedGenres.length > 0 ? "has-selection" : ""}`}
      >
        <div className="section-label">Genre</div>
        <div className="section-dropdown">
          {ALL_GENRES.map((genre) => (
            <button
              key={genre}
              className={`dropdown-btn ${selectedGenres.includes(genre) ? "active" : ""} ${topGenre === genre ? "top" : ""}`}
              onClick={() => onGenreSelect(genre)}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      <div className="section-divider" /> */}

      <div
        className={`search-section location-section ${selectedLocations.length > 0 ? "has-selection" : ""}`}
      >
        <div className="section-label">
          <img src="./song_row.png" alt="Location" />
        </div>
        <div className="section-dropdown">
          {ALL_LOCATIONS.map((location) => (
            <button
              key={location}
              className={`dropdown-btn ${selectedLocations.includes(location) ? "active" : ""} ${topLocation === location ? "top" : ""}`}
              onClick={() => onLocationSelect(location)}
            >
              {location}
            </button>
          ))}
        </div>
      </div>

      {/* <div className="section-divider" />

      <div className={`search-section bpm-section ${!isFullBpmRange ? "has-selection" : ""}`}>
        <div className="section-label">BPM</div>
        <div className="section-dropdown bpm-dropdown">
          <BpmRangeSlider
            bpmRange={bpmRange}
            onBpmRangeChange={onBpmRangeChange}
          />
        </div>
      </div> */}

      {hasFilter && (
        <div className="clear-button" onClick={onClear}>
          ×
        </div>
      )}
    </div>
  );
}
