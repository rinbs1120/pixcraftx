/**
 * Auto-close gaps in line art using skeleton endpoint detection and connection.
 * v2: Added preprocessing dilation, larger gap tolerance, multi-pass closing.
 */

/**
 * Binarize image data - returns Uint8Array where 1 = line pixel, 0 = background
 */
function binarize(data: Uint8ClampedArray, width: number, height: number, threshold: number = 128): Uint8Array {
  const binary = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const brightness = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
    binary[i] = brightness < threshold ? 1 : 0;
  }
  return binary;
}

/**
 * Light dilation - expand line regions by 1 pixel.
 * Used as preprocessing to help skeleton bridge tiny gaps.
 */
function dilate(binary: Uint8Array, width: number, height: number): Uint8Array {
  const result = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (binary[y * width + x] === 1) {
        result[y * width + x] = 1;
        // Mark all 8 neighbors
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              result[ny * width + nx] = 1;
            }
          }
        }
      }
    }
  }
  return result;
}

/**
 * Zhang-Suen thinning algorithm
 * Reduces binary line art to 1-pixel-wide skeleton
 */
function zhangSuenThinning(binary: Uint8Array, width: number, height: number): Uint8Array {
  const img = new Uint8Array(binary);
  const p = new Uint8Array(8);
  let changed = true;
  let iteration = 0;
  const MAX_ITERATIONS = 50;
  
  while (changed && iteration < MAX_ITERATIONS) {
    changed = false;
    iteration++;
    
    for (let sub = 0; sub < 2; sub++) {
      const toRemove: number[] = [];
      
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          if (img[idx] === 0) continue;
          
          p[0] = img[(y-1) * width + x];     // p2 (N)
          p[1] = img[(y-1) * width + (x+1)]; // p3 (NE)
          p[2] = img[y * width + (x+1)];     // p4 (E)
          p[3] = img[(y+1) * width + (x+1)]; // p5 (SE)
          p[4] = img[(y+1) * width + x];     // p6 (S)
          p[5] = img[(y+1) * width + (x-1)]; // p7 (SW)
          p[6] = img[y * width + (x-1)];     // p8 (W)
          p[7] = img[(y-1) * width + (x-1)]; // p9 (NW)
          
          const B = p[0] + p[1] + p[2] + p[3] + p[4] + p[5] + p[6] + p[7];
          if (B < 2 || B > 6) continue;
          
          let A = 0;
          for (let i = 0; i < 7; i++) {
            if (p[i] === 0 && p[i + 1] === 1) A++;
          }
          if (p[7] === 0 && p[0] === 1) A++;
          if (A !== 1) continue;
          
          if (sub === 0) {
            if (p[0] * p[2] * p[4] !== 0) continue;
            if (p[2] * p[4] * p[6] !== 0) continue;
          } else {
            if (p[0] * p[2] * p[6] !== 0) continue;
            if (p[0] * p[4] * p[6] !== 0) continue;
          }
          
          toRemove.push(idx);
        }
      }
      
      if (toRemove.length > 0) {
        for (const ri of toRemove) img[ri] = 0;
        changed = true;
      }
    }
  }
  
  return img;
}

interface Endpoint {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
}

/**
 * Find endpoints in skeleton image
 * Endpoint = line pixel with exactly 1 neighbor (8-connected)
 */
function findEndpoints(skeleton: Uint8Array, width: number, height: number): Endpoint[] {
  const endpoints: Endpoint[] = [];
  const offsets = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (skeleton[y * width + x] === 0) continue;
      
      let count = 0;
      let dirX = 0, dirY = 0;
      
      for (const [ox, oy] of offsets) {
        if (skeleton[(y+oy) * width + (x+ox)] === 1) {
          count++;
          dirX += ox;
          dirY += oy;
        }
      }
      
      if (count === 1) {
        endpoints.push({ x, y, dirX: -dirX, dirY: -dirY });
      }
    }
  }
  
  return endpoints;
}

/**
 * Estimate local line width around a point on the original binary image
 */
function estimateLineWidth(binary: Uint8Array, width: number, height: number, px: number, py: number): number {
  let totalDist = 0;
  let directions = 0;
  const maxR = 15;
  
  const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
  for (const [ddx, ddy] of dirs) {
    for (let r = 1; r <= maxR; r++) {
      const nx = px + ddx * r;
      const ny = py + ddy * r;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) break;
      if (binary[ny * width + nx] === 0) {
        totalDist += r - 1;
        directions++;
        break;
      }
    }
  }
  
  return directions > 0 ? Math.max(2, Math.round((totalDist / directions) * 2)) : 3;
}

/**
 * Close gaps for one pass. Returns number of connections made.
 */
function closeGapsPass(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  maxGapDistance: number
): number {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Binarize with threshold 200 to capture anti-aliased edge pixels
  const binary = binarize(data, width, height, 200);
  
  // Quick check
  let linePixelCount = 0;
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === 1) linePixelCount++;
  }
  if (linePixelCount < 10) return 0;
  
  // Preprocess: dilate then skeletonize
  // Dilation helps the skeleton bridge tiny (1-2px) gaps
  const dilated = dilate(binary, width, height);
  const skeleton = zhangSuenThinning(dilated, width, height);
  
  // Find endpoints from the DILATED skeleton (which already bridges tiny gaps)
  const endpoints = findEndpoints(skeleton, width, height);
  
  if (endpoints.length < 2) return 0;
  
  // Find gap pairs
  const pairs: {i: number, j: number, dist: number}[] = [];
  
  for (let i = 0; i < endpoints.length; i++) {
    for (let j = i + 1; j < endpoints.length; j++) {
      const dx = endpoints[i].x - endpoints[j].x;
      const dy = endpoints[i].y - endpoints[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > maxGapDistance || dist < 1.5) continue;
      
      // Verify gap: check that the path between endpoints goes through background
      const steps = Math.max(Math.ceil(dist), 1);
      let linePixels = 0;
      let totalPixels = 0;
      
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const sx = Math.round(endpoints[i].x + (endpoints[j].x - endpoints[i].x) * t);
        const sy = Math.round(endpoints[i].y + (endpoints[j].y - endpoints[i].y) * t);
        if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
          totalPixels++;
          if (binary[sy * width + sx] === 1) linePixels++;
        }
      }
      
      // Allow up to 40% line pixels in between (handles anti-aliased edges)
      if (totalPixels > 0 && linePixels / totalPixels <= 0.4) {
        pairs.push({ i, j, dist });
      }
    }
  }
  
  pairs.sort((a, b) => a.dist - b.dist);
  
  const used = new Set<number>();
  let connectionsMade = 0;
  
  for (const pair of pairs) {
    if (used.has(pair.i) || used.has(pair.j)) continue;
    
    const ep1 = endpoints[pair.i];
    const ep2 = endpoints[pair.j];
    
    const lineWidth = estimateLineWidth(binary, width, height, ep1.x, ep1.y);
    
    ctx.beginPath();
    ctx.moveTo(ep1.x, ep1.y);
    ctx.lineTo(ep2.x, ep2.y);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    used.add(pair.i);
    used.add(pair.j);
    connectionsMade++;
  }
  
  return connectionsMade;
}

/**
 * Auto-close gaps in line art on a canvas.
 * Runs multiple passes to catch gaps that become visible after closing others.
 */
export function autoCloseGaps(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  maxGapDistance: number = 30
): number {
  let totalConnections = 0;
  
  // Pass 1: Close gaps up to maxGapDistance
  const pass1 = closeGapsPass(ctx, width, height, maxGapDistance);
  totalConnections += pass1;
  
  // Pass 2: After closing gaps, re-detect and close remaining (new endpoints may be reachable)
  if (pass1 > 0) {
    const pass2 = closeGapsPass(ctx, width, height, maxGapDistance);
    totalConnections += pass2;
    
    // Pass 3: One more round
    if (pass2 > 0) {
      const pass3 = closeGapsPass(ctx, width, height, maxGapDistance);
      totalConnections += pass3;
    }
  }
  
  return totalConnections;
}
