import React from "react";

export default React.memo(function MiiCharacter({ character }) {
  return (
    <img
      className="mii-character"
      src={`/CHARACTER-${character}.svg`}
      alt={`Character ${character}`}
      draggable={false}
    />
  );
});
