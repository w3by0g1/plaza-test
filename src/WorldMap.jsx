import { useRef, useEffect } from "react";
import p5 from "p5";
import { setLandGrid } from "./landDetection";

const PIXEL_SIZE = 5;
const HOVER_RADIUS = 8;
const TRAIL_DECAY = 2;
const BASE_BRIGHTNESS = 215;
const MIN_BRIGHTNESS = 140;

const WorldMap = ({ onMapReady }) => {
  const containerRef = useRef(null);
  const p5InstanceRef = useRef(null);

  useEffect(() => {
    const sketch = (p) => {
      let mapImg = null;
      let landPixels = [];
      let cols = 0;
      let rows = 0;
      
      // Only track pixels that are currently affected (much more efficient)
      let activePixels = new Map(); // key: "x,y", value: current brightness
      
      // Track mouse movement
      let lastMouseX = 0;
      let lastMouseY = 0;
      let isMouseMoving = false;

      p.setup = async () => {
        const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.style("position", "absolute");
        canvas.style("top", "0");
        canvas.style("left", "0");
        canvas.style("z-index", "0");
        p.noSmooth();
        p.pixelDensity(1);
        p.frameRate(60);
        
        mapImg = await p.loadImage("/world-map.png");
        
        generateLandGrid();
        generatePixelData();
        drawFullMap();
        
        if (onMapReady) onMapReady();
      };

      const generateLandGrid = () => {
        if (!mapImg) return;
        
        const gridCols = 200;
        const gridRows = 100;
        
        const sampleBuffer = p.createGraphics(gridCols, gridRows);
        sampleBuffer.pixelDensity(1);
        sampleBuffer.image(mapImg, 0, 0, gridCols, gridRows);
        sampleBuffer.loadPixels();
        
        const grid = [];
        for (let y = 0; y < gridRows; y++) {
          grid[y] = [];
          for (let x = 0; x < gridCols; x++) {
            const idx = (y * gridCols + x) * 4;
            const r = sampleBuffer.pixels[idx];
            const g = sampleBuffer.pixels[idx + 1];
            const b = sampleBuffer.pixels[idx + 2];
            const brightness = (r + g + b) / 3;
            grid[y][x] = brightness < 200;
          }
        }
        
        setLandGrid(grid, gridCols, gridRows);
        sampleBuffer.remove();
      };

      const generatePixelData = () => {
        if (!mapImg) return;
        
        cols = Math.ceil(p.width / PIXEL_SIZE);
        rows = Math.ceil(p.height / PIXEL_SIZE);
        
        const sampleBuffer = p.createGraphics(cols, rows);
        sampleBuffer.pixelDensity(1);
        sampleBuffer.image(mapImg, 0, 0, cols, rows);
        sampleBuffer.loadPixels();
        
        landPixels = [];
        for (let y = 0; y < rows; y++) {
          landPixels[y] = [];
          for (let x = 0; x < cols; x++) {
            const idx = (y * cols + x) * 4;
            const r = sampleBuffer.pixels[idx];
            const g = sampleBuffer.pixels[idx + 1];
            const b = sampleBuffer.pixels[idx + 2];
            const a = sampleBuffer.pixels[idx + 3];
            const brightness = (r + g + b) / 3;
            landPixels[y][x] = a >= 128 && brightness < 200;
          }
        }
        
        sampleBuffer.remove();
      };

      const drawFullMap = () => {
        p.background(255);
        p.noStroke();
        
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (landPixels[y] && landPixels[y][x]) {
              p.fill(BASE_BRIGHTNESS);
              p.rect(x * PIXEL_SIZE + 1, y * PIXEL_SIZE + 1, PIXEL_SIZE - 2, PIXEL_SIZE - 2);
            }
          }
        }
      };

      const drawPixel = (x, y, brightness) => {
        if (landPixels[y] && landPixels[y][x]) {
          // Clear the pixel area first
          p.fill(255);
          p.noStroke();
          p.rect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
          // Draw the pixel
          p.fill(brightness);
          p.rect(x * PIXEL_SIZE + 1, y * PIXEL_SIZE + 1, PIXEL_SIZE - 2, PIXEL_SIZE - 2);
        }
      };

      p.draw = () => {
        if (!landPixels.length) return;
        
        const mousePixelX = Math.floor(p.mouseX / PIXEL_SIZE);
        const mousePixelY = Math.floor(p.mouseY / PIXEL_SIZE);
        
        // Check if mouse has moved
        isMouseMoving = (p.mouseX !== lastMouseX || p.mouseY !== lastMouseY);
        lastMouseX = p.mouseX;
        lastMouseY = p.mouseY;
        
        // Only add new pixels to trail if mouse is moving
        if (isMouseMoving) {
          for (let dy = -HOVER_RADIUS; dy <= HOVER_RADIUS; dy++) {
            for (let dx = -HOVER_RADIUS; dx <= HOVER_RADIUS; dx++) {
              const x = mousePixelX + dx;
              const y = mousePixelY + dy;
              
              if (x < 0 || x >= cols || y < 0 || y >= rows) continue;
              if (!landPixels[y] || !landPixels[y][x]) continue;
              
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance > HOVER_RADIUS) continue;
              
              const key = `${x},${y}`;
              const targetBrightness = MIN_BRIGHTNESS + (distance / HOVER_RADIUS) * (BASE_BRIGHTNESS - MIN_BRIGHTNESS - 40);
              const currentBrightness = activePixels.get(key) ?? BASE_BRIGHTNESS;
              
              if (targetBrightness < currentBrightness) {
                activePixels.set(key, targetBrightness);
              }
            }
          }
        }
        
        // Only update trail if there are active pixels
        if (activePixels.size === 0) return;
        
        // Update and draw active pixels
        const toRemove = [];
        
        activePixels.forEach((brightness, key) => {
          const [x, y] = key.split(',').map(Number);
          
          // Only fade if mouse is moving, otherwise keep current brightness
          if (isMouseMoving) {
            const newBrightness = brightness + TRAIL_DECAY;
            
            if (newBrightness >= BASE_BRIGHTNESS) {
              toRemove.push(key);
              drawPixel(x, y, BASE_BRIGHTNESS);
            } else {
              activePixels.set(key, newBrightness);
              drawPixel(x, y, newBrightness);
            }
          }
        });
        
        // Remove fully faded pixels
        toRemove.forEach(key => activePixels.delete(key));
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        if (mapImg) {
          activePixels.clear();
          generatePixelData();
          drawFullMap();
        }
      };
    };

    if (containerRef.current && !p5InstanceRef.current) {
      p5InstanceRef.current = new p5(sketch, containerRef.current);
    }

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [onMapReady]);

  return <div ref={containerRef} className="world-map-container" />;
};

export default WorldMap;
