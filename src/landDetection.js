// Shared land data
let landGrid = null;
let landGridCols = 0;
let landGridRows = 0;

export const setLandGrid = (grid, cols, rows) => {
  landGrid = grid;
  landGridCols = cols;
  landGridRows = rows;
};

export const isLandAt = (xPercent, yPercent) => {
  if (!landGrid) return true;
  const col = Math.floor(xPercent * landGridCols);
  const row = Math.floor(yPercent * landGridRows);
  if (col < 0 || col >= landGridCols || row < 0 || row >= landGridRows) {
    return false;
  }
  return landGrid[row][col];
};

export const getLandPositionsInBounds = (x1, y1, x2, y2, step = 0.02) => {
  const positions = [];
  for (let y = y1; y < y2; y += step) {
    for (let x = x1; x < x2; x += step) {
      if (isLandAt(x, y)) {
        positions.push({ x, y });
      }
    }
  }
  return positions;
};
