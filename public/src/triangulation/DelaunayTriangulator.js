/**
 * DelaunayTriangulator - Simplified Delaunay triangulation using Bowyer-Watson algorithm
 * This is a self-contained implementation to avoid external dependencies
 */
export class DelaunayTriangulator {
  constructor() {
    console.log('[DelaunayTriangulator] Initialized');
  }

  /**
   * Calculate circumcircle of a triangle
   * @param {Object} p1 - Point {x, y}
   * @param {Object} p2 - Point {x, y}
   * @param {Object} p3 - Point {x, y}
   * @returns {Object} Circumcircle {x, y, r2} (r2 is radius squared)
   */
  circumcircle(p1, p2, p3) {
    const ax = p1.x, ay = p1.y;
    const bx = p2.x, by = p2.y;
    const cx = p3.x, cy = p3.y;

    const dx = bx - ax;
    const dy = by - ay;
    const ex = cx - ax;
    const ey = cy - ay;

    const bl = dx * dx + dy * dy;
    const cl = ex * ex + ey * ey;
    const d = 0.5 / (dx * ey - dy * ex);

    const x = ax + (ey * bl - dy * cl) * d;
    const y = ay + (dx * cl - ex * bl) * d;
    const r2 = (x - ax) * (x - ax) + (y - ay) * (y - ay);

    return { x, y, r2 };
  }

  /**
   * Check if point is inside circumcircle of triangle
   * @param {Object} point - Point {x, y}
   * @param {Object} circle - Circumcircle {x, y, r2}
   * @returns {boolean}
   */
  inCircle(point, circle) {
    const dx = point.x - circle.x;
    const dy = point.y - circle.y;
    return dx * dx + dy * dy < circle.r2;
  }

  /**
   * Perform Delaunay triangulation using Bowyer-Watson algorithm
   * @param {Array} points - Array of points [{x, y}, ...]
   * @returns {Array} Array of triangles, each triangle is [i, j, k] indices
   */
  triangulate(points) {
    console.log(`[DelaunayTriangulator] Triangulating ${points.length} points`);
    
    if (points.length < 3) {
      console.warn('[DelaunayTriangulator] Need at least 3 points for triangulation');
      return [];
    }

    // Find bounding box
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (const p of points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }

    // Create super triangle that contains all points
    const dx = maxX - minX;
    const dy = maxY - minY;
    const deltaMax = Math.max(dx, dy);
    const midx = (minX + maxX) / 2;
    const midy = (minY + maxY) / 2;

    const p0 = { x: midx - 20 * deltaMax, y: midy - deltaMax };
    const p1 = { x: midx, y: midy + 20 * deltaMax };
    const p2 = { x: midx + 20 * deltaMax, y: midy - deltaMax };

    // Initialize triangulation with super triangle
    const triangles = [[0, 1, 2]];
    const allPoints = [p0, p1, p2, ...points];

    // Add points one by one
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const pointIdx = i + 3; // Offset by 3 for super triangle vertices
      const badTriangles = [];

      // Find triangles whose circumcircle contains the point
      for (let j = 0; j < triangles.length; j++) {
        const tri = triangles[j];
        const circle = this.circumcircle(
          allPoints[tri[0]],
          allPoints[tri[1]],
          allPoints[tri[2]]
        );

        if (this.inCircle(point, circle)) {
          badTriangles.push(j);
        }
      }

      // Find the boundary edges of bad triangles
      const edges = [];
      for (const idx of badTriangles) {
        const tri = triangles[idx];
        edges.push([tri[0], tri[1]]);
        edges.push([tri[1], tri[2]]);
        edges.push([tri[2], tri[0]]);
      }

      // Remove bad triangles
      for (let j = badTriangles.length - 1; j >= 0; j--) {
        triangles.splice(badTriangles[j], 1);
      }

      // Find unique edges (edges that appear only once)
      const uniqueEdges = [];
      for (let j = 0; j < edges.length; j++) {
        const edge = edges[j];
        let isUnique = true;

        for (let k = 0; k < edges.length; k++) {
          if (j === k) continue;
          const other = edges[k];
          if ((edge[0] === other[0] && edge[1] === other[1]) ||
              (edge[0] === other[1] && edge[1] === other[0])) {
            isUnique = false;
            break;
          }
        }

        if (isUnique) {
          // Check if this edge hasn't been added yet
          const alreadyAdded = uniqueEdges.some(e => 
            (e[0] === edge[0] && e[1] === edge[1]) ||
            (e[0] === edge[1] && e[1] === edge[0])
          );
          if (!alreadyAdded) {
            uniqueEdges.push(edge);
          }
        }
      }

      // Create new triangles from unique edges and the point
      for (const edge of uniqueEdges) {
        triangles.push([edge[0], edge[1], pointIdx]);
      }
    }

    // Remove triangles that share vertices with super triangle
    const finalTriangles = triangles.filter(tri => 
      tri[0] >= 3 && tri[1] >= 3 && tri[2] >= 3
    );

    // Adjust indices to remove super triangle offset
    const result = finalTriangles.map(tri => [
      tri[0] - 3,
      tri[1] - 3,
      tri[2] - 3
    ]);

    console.log(`[DelaunayTriangulator] Created ${result.length} triangles`);
    return result;
  }

  /**
   * Get edges from triangles
   * @param {Array} triangles - Array of triangle indices
   * @returns {Array} Array of unique edges [[i, j], ...]
   */
  getEdges(triangles) {
    const edgeSet = new Set();
    
    for (const tri of triangles) {
      const edges = [
        [Math.min(tri[0], tri[1]), Math.max(tri[0], tri[1])],
        [Math.min(tri[1], tri[2]), Math.max(tri[1], tri[2])],
        [Math.min(tri[2], tri[0]), Math.max(tri[2], tri[0])]
      ];
      
      for (const edge of edges) {
        edgeSet.add(`${edge[0]},${edge[1]}`);
      }
    }
    
    return Array.from(edgeSet).map(e => e.split(',').map(Number));
  }
}
