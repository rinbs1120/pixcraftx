// Flood fill algorithm for canvas coloring
export function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColor: [number, number, number],
  tolerance: number = 32
) {
  const canvas = ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  startX = Math.round(startX);
  startY = Math.round(startY);

  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

  const startIdx = (startY * width + startX) * 4;
  const startR = data[startIdx];
  const startG = data[startIdx + 1];
  const startB = data[startIdx + 2];
  const startA = data[startIdx + 3];

  // Don't fill if clicking on the same color
  if (
    Math.abs(startR - fillColor[0]) <= tolerance &&
    Math.abs(startG - fillColor[1]) <= tolerance &&
    Math.abs(startB - fillColor[2]) <= tolerance
  ) {
    return;
  }

  const [fillR, fillG, fillB] = fillColor;
  const fillA = 255;

  const visited = new Uint8Array(width * height);
  const stack: [number, number][] = [[startX, startY]];

  function matchesStart(idx: number): boolean {
    return (
      Math.abs(data[idx] - startR) <= tolerance &&
      Math.abs(data[idx + 1] - startG) <= tolerance &&
      Math.abs(data[idx + 2] - startB) <= tolerance &&
      Math.abs(data[idx + 3] - startA) <= tolerance
    );
  }

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const pixelIdx = y * width + x;
    const dataIdx = pixelIdx * 4;

    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited[pixelIdx]) continue;
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
