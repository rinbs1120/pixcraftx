// Flood fill algorithm with boundary detection
export function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColor: [number, number, number],
  boundaryCtx?: CanvasRenderingContext2D | null,
  tolerance: number = 32
) {
  const canvas = ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;
  const useBoundary = !!boundaryCtx;
  let boundaryData: Uint8ClampedArray | null = null;
  if (boundaryCtx) {
    const bd = boundaryCtx.getImageData(0, 0, width, height);
    boundaryData = bd.data;
  }
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  startX = Math.round(startX);
  startY = Math.round(startY);
  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;
  const startIdx = (startY * width + startX) * 4;
  let startR: number, startG: number, startB: number, startA: number;
  if (useBoundary && boundaryData) {
    startR = boundaryData[startIdx];
    startG = boundaryData[startIdx + 1];
    startB = boundaryData[startIdx + 2];
    startA = boundaryData[startIdx + 3];
  } else {
    startR = data[startIdx];
    startG = data[startIdx + 1];
    startB = data[startIdx + 2];
    startA = data[startIdx + 3];
  }
  if (useBoundary && boundaryData) {
    const brightness = startR * 0.299 + startG * 0.587 + startB * 0.114;
    if (brightness < 80) return;
  }
  if (Math.abs(startR - fillColor[0]) <= tolerance && Math.abs(startG - fillColor[1]) <= tolerance && Math.abs(startB - fillColor[2]) <= tolerance) return;
  const [fillR, fillG, fillB] = fillColor;
  const fillA = 255;
  const visited = new Uint8Array(width * height);
  const stack: [number, number][] = [[startX, startY]];
  function isLine(idx: number): boolean {
    if (!boundaryData) return false;
    const brightness = boundaryData[idx] * 0.299 + boundaryData[idx + 1] * 0.587 + boundaryData[idx + 2] * 0.114;
    return brightness < 80;
  }
  function matchesStart(idx: number): boolean {
    if (useBoundary && boundaryData) {
      return !isLine(idx) && Math.abs(boundaryData[idx] - startR) <= tolerance && Math.abs(boundaryData[idx + 1] - startG) <= tolerance && Math.abs(boundaryData[idx + 2] - startB) <= tolerance && Math.abs(boundaryData[idx + 3] - startA) <= tolerance;
    }
    return Math.abs(data[idx] - startR) <= tolerance && Math.abs(data[idx + 1] - startG) <= tolerance && Math.abs(data[idx + 2] - startB) <= tolerance && Math.abs(data[idx + 3] - startA) <= tolerance;
  }
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const pixelIdx = y * width + x;
    const dataIdx = pixelIdx * 4;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited[pixelIdx]) continue;
    if (isLine(dataIdx)) continue;
    if (!matchesStart(dataIdx)) continue;
    visited[pixelIdx] = 1;
    data[dataIdx] = fillR;
    data[dataIdx + 1] = fillG;
    data[dataIdx + 2] = fillB;
    data[dataIdx + 3] = fillA;
    stack.push([x + 1, y]);
    stack.push([x - 1, y]);
    stack.push([x, y + 1]);
    stack.push([x, y - 1]);
  }
  ctx.putImageData(imageData, 0, 0);
}