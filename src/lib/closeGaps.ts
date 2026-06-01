/**
 * Auto-close gaps in line art using skeleton endpoint detection and connection.
 * Based on: skeletonize (Zhang-Suen) → find endpoints → pair & connect nearby endpoints.
 * 
 * The core insight: morphological closing (dilate+erode) only thickens lines uniformly,
 * it doesn't actually connect line endpoints. This algorithm finds where lines END
 * and draws new line segments to connect nearby endpoints that form gaps.
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
 * Zhang-Suen thinning algorithm
 * Reduces binary line art to 1-pixel-wide skeleton
 */
function zhangSuenThinning(binary: Uint8Array, width: number, height: number): Uint8Array {
  const img = new Uint8Array(binary);
  const p = new Uint8Array(8); // p2-p9 neighbors
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
          
          // Get 8 neighbors clockwise: p2(N), p3(NE), p4(E), p5(SE), p6(S), p7(SW), p8(W), p9(NW)
          p[0] = img[(y-1) * width + x];     // p2
          p[1] = img[(y-1) * width + (x+1)]; // p3
          p[2] = img[y * width + (x+1)];     // p4
          p[3] = img[(y+1) * width + (x+1)]; // p5
          p[4] = img[(y+1) * width + x];     // p6
          p[5] = img[(y+1) * width + (x-1)]; // p7
          p[6] = img[y * width + (x-1)];     // p8
          p[7] = img[(y-1) * width + (x-1)]; // p9
          
          // B(p) = number of non-zero neighbors
          const B = p[0] + p[1] + p[2] + p[3] + p[4] + p[5] + p[6] + p[7];
          if (B < 2 || B > 6) continue;
          
          // A(p) = number of 0→1 transitions in clockwise order
          let A = 0;
          for (let i = 0; i < 7; i++) {
            if (p[i] === 0 && p[i + 1] === 1) A++;
          }
          if (p[7] === 0 && p[0] === 1) A++;
          if (A !== 1) continue;
          
          if (sub === 0) {
            // Sub-iteration 1: p2*p4*p6=0 AND p4*p6*p8=0
            if (p[0] * p[2] * p[4] !== 0) continue;
            if (p[2] * p[4] * p[6] !== 0) continue;
          } else {
            // Sub-iteration 2: p2*p4*p8=0 AND p2*p6*p8=0
            if (p[0] * p[2] * p[6] !== 0) continue;
            if (p[0] * p[4] * p[6] !== 0) continue;
          }
          
          toRemove.push(idx);
        }
      }
      
      if (toRemove.length > 0) {
        for (const ri of toRemove) {
          img[ri] = 0;
        }
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
 * Also computes direction (away from the single neighbor)
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
        // Direction points away from the single neighbor
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
  const maxR = 12;
  
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
  
  return directions > 0 ? Math.max(1, Math.round((totalDist / directions) * 2)) : 2;
}

/**
 * Auto-close gaps in line art on a canvas.
 * 
 * Algorithm:
 * 1. Binarize the image
 * 2. Skeletonize (Zhang-Suen thinning) to get 1px-wide lines
 * 3. Find endpoints (pixels with exactly 1 neighbor)
 * 4. Pair nearby endpoints and connect them with lines
 * 
 * @returns Number of gaps closed
 */
export function autoCloseGaps(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  maxGapDistance: number = 15
): number {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Step 1: Binarize (threshold 128 to capture anti-aliased edges)
  const binary = binarize(data, width, height, 128);
  
  // Quick check: count line pixels, skip if very few
  let linePixelCount = 0;
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === 1) linePixelCount++;
  }
  if (linePixelCount < 10) return 0;
  
  // Step 2: Skeletonize
  const skeleton = zhangSuenThinning(binary, width, height);
  
  // Step 3: Find endpoints
  const endpoints = findEndpoints(skeleton, width, height);
  
  if (endpoints.length < 2) return 0;
  
  // Step 4: Find gap pairs (nearby endpoints with background between them)
  const pairs: {i: number, j: number, dist: number}[] = [];
  
  for (let i = 0; i < endpoints.length; i++) {
    for (let j = i + 1; j < endpoints.length; j++) {
      const dx = endpoints[i].x - endpoints[j].x;
      const dy = endpoints[i].y - endpoints[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > maxGapDistance || dist < 1) continue;
      
      // Verify this is a real gap: the line between endpoints should be mostly background
      const steps = Math.max(Math.ceil(dist), 1);
      let linePixels = 0;
      let bgPixels = 0;
      
      for (let s = 1; s < steps; s++) { // Skip endpoints themselves
        const t = s / steps;
        const sx = Math.round(endpoints[i].x + (endpoints[j].x - endpoints[i].x) * t);
        const sy = Math.round(endpoints[i].y + (endpoints[j].y - endpoints[i].y) * t);
        if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
          if (binary[sy * width + sx] === 1) linePixels++;
          else bgPixels++;
        }
      }
      
      // Only connect if the path between them is mostly background (real gap)
      if (bgPixels >= linePixels) {
        pairs.push({ i, j, dist });
      }
    }
  }
  
  // Sort by distance (closest gaps first)
  pairs.sort((a, b) => a.dist - b.dist);
  
  // Step 5: Connect pairs
  const used = new Set<number>();
  let connectionsMade = 0;
  
  for (const pair of pairs) {
    if (used.has(pair.i) || used.has(pair.j)) continue;
    
    const ep1 = endpoints[pair.i];
    const ep2 = endpoints[pair.j];
    
    // Estimate line width from the original binary image
    const lineWidth = estimateLineWidth(binary, width, height, ep1.x, ep1.y);
    
    // Draw connecting line on the canvas
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
