class LineSegment {
  constructor(startPos, endPos, c) {
    this.start = startPos;
    this.end = endPos;
    let r = red(c);
    let g = green(c);
    let b = blue(c);
    this.lineColor = color(r, g, b, 150);
  }

  show() {
    stroke(this.lineColor);
    strokeWeight(3);
    line(this.start.x, this.start.y, this.end.x, this.end.y);
  }
}

// --- Line-Line Intersection Function ---
// Returns a p5.Vector on intersection, or null if no intersection
function lineIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  let den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (den == 0) {
    return null;
  }
  let t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
  let u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

  if (t > 0 && t < 1 && u > 0 && u < 1) {
    let pt = createVector();
    pt.x = x1 + t * (x2 - x1);
    pt.y = y1 + t * (y2 - y1);
    return pt;
  } else {
    return null;
  }
}