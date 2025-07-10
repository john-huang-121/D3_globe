import './style.css'

import * as d3 from "d3";
import { feature } from "topojson-client";

// Load Data
const landDataURL = "/globeLandCoordinates.json";
const airportGeoData = "/airports.json";

// State
let isDragging = false;
let airports = [];

// Define SVG dimensions
const width = 800, height = 800;
const svg = d3.select("#app").append("svg")
  .attr("width", width)
  .attr("height", height);

const drawGlobe = async () => {
  // Configure the orthographic projection
  const projection = d3.geoOrthographic()
    .center([0, 0])
    .rotate([0, -30])
    .clipAngle(90)
    .scale(width / 2.2)
    .translate([width / 2, height / 2]);

  // Convert geoJson data to svg path
  const path = d3.geoPath(projection);

  // Draw sphere (globe background)
  svg.append("path")
    .datum({ type: "Sphere" })
    .attr("fill", "#0077be")
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
  d3.json(landDataURL).then(worldData => {
    const land = feature(worldData, worldData.objects.land);
    svg.append("path")
      .datum(land)
      .attr("fill", "#384e1d")
      .attr("stroke", "#444")
      .attr("stroke-width", 0.5)
      .attr("d", path);
  });

  airports = await d3.json(airportGeoData);

  // Render airports
  const renderAirports = () => {
    const visibleAirports = airports.filter(a => {
      const coord = [a.lon, a.lat];
      const distance = d3.geoDistance(coord, projection.invert([width / 2, height / 2]));
      return distance <= Math.PI / 2;
    });

    const circles = svg.selectAll("circle.airport")
      .data(visibleAirports, d => d.id || d.name);

    circles.enter()
      .append("circle")
      .attr("class", "airport")
      .attr("r", 1)
      .attr("fill", "red")
      .merge(circles)
      .attr("cx", d => projection([d.lon, d.lat])[0])
      .attr("cy", d => projection([d.lon, d.lat])[1]);

    circles.exit().remove();
  };

  // Set up drag behavior to rotate the globe
  const drag = d3.drag()
    .on("start", () => isDragging = true )
    .on("drag", (event) => {
      const [lon, lat] = projection.rotate();
      const sensitivity = 0.25;
      // Update projection rotation based on drag
      projection.rotate([
        lon + event.dx * sensitivity,
        lat - event.dy * sensitivity
      ]);
      // Re-render paths with new projection
      svg.selectAll("path").attr("d", path);
      renderAirports();
    })
    .on("end", () => isDragging = false );;

  // Rotate every frame on a timer
  d3.timer(() => {
    if (isDragging) return;

    const rotation = projection.rotate();
    projection.rotate([rotation[0] - 0.25, rotation[1]]);
    svg.selectAll("path").attr("d", path);
    renderAirports();
  });

  // Apply drag to the SVG
  svg.call(drag);

  renderAirports();
}

drawGlobe();