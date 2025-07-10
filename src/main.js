import './style.css'

import * as d3 from "d3";
import { feature } from "topojson-client";

// Define SVG dimensions
const width = 800, height = 800;
const svg = d3.select("#app").append("svg")
  .attr("width", width)
  .attr("height", height);

// Configure the orthographic projection
const projection = d3.geoOrthographic()
  .center([0, 0])
  .rotate([0, -30])
  .clipAngle(90)
  .scale(width / 2.2)
  .translate([width / 2, height / 2]);

const path = d3.geoPath(projection);

// Draw sphere (globe background)
svg.append("path")
  .datum({ type: "Sphere" })
  .attr("fill", "#89cfff")
  .attr("stroke", "#000")
  .attr("d", path);

// Draw graticule (lat/long lines)
const graticule = d3.geoGraticule();
svg.append("path")
  .datum(graticule())
  .attr("fill", "none")
  .attr("stroke", "#ccc")
  .attr("stroke-width", 0.5)
  .attr("d", path);

// Load world land data and draw land areas
const landDataURL = "https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json";
d3.json(landDataURL).then(worldData => {
  const land = feature(worldData, worldData.objects.land);
  svg.append("path")
    .datum(land)
    .attr("fill", "#d8d8d8")
    .attr("stroke", "#444")
    .attr("stroke-width", 0.5)
    .attr("d", path);
});

// Set up drag behavior to rotate the globe
const drag = d3.drag().on("drag", (event) => {
  const [lon, lat] = projection.rotate();
  const sensitivity = 0.25;
  // Update projection rotation based on drag
  projection.rotate([
    lon + event.dx * sensitivity,
    lat - event.dy * sensitivity
  ]);
  // Re-render paths with new projection
  svg.selectAll("path").attr("d", path);
});

// Apply drag to the SVG
svg.call(drag);