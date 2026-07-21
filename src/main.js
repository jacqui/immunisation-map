import * as d3 from "d3";
import { feature } from "topojson-client";

// load in our data
const geography = await d3.json("/data/sa3.topo.json");
const vaccinations = await d3.csv("/data/vaccination.csv");

const currentAge = "2 Year olds";

// 2. Convert topojson -> geojson

const regions = feature(geography, geography.objects["sa3.raw"]);

// 3. Create a map of SA3 codes to vaccination rates
const vaccinationMap = new Map(
  vaccinations
    .filter((d) => d["Age Group"] === currentAge)
    .map((d) => [d.SA3_Code, +d["% Fully"]]),
);

// 4. Colour scale for the map
const colour = d3
  .scaleDiverging()
  .domain([80, 95, 100])
  .interpolator(d3.interpolateRdYlGn);

// 5. Create the map

const width = 900;
const height = 700;

const svg = d3
  .select("#map")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`);

const tooltip = d3
  .select("body")
  .append("div")
  .style("position", "absolute")
  .style("opacity", 0)
  .style("pointer-events", "none")
  .style("background", "white")
  .style("padding", "10px 12px")
  .style("border", "1px solid #ccc")
  .style("border-radius", "6px")
  .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)")
  .style("font", "13px system-ui, sans-serif");

// scale the map to fit the svg
const projection = d3.geoMercator().fitSize([width, height], regions);
const path = d3.geoPath(projection);

svg
  .selectAll("path")
  .data(regions.features)
  .join("path")
  .attr("d", path)
  .attr("fill", (d) => {
    const value = vaccinationMap.get(d.properties.SA3_CODE_2021);
    return value ? colour(value) : "#ccc";
  })
  .on("mouseover", function (event, d) {
    const value = vaccinationMap.get(d.properties.SA3_CODE_2021);

    tooltip.style("opacity", 1).html(`
      <strong>${d.properties.SA3_NAME_2021}</strong><br>
      ${currentAge}<br>
      <strong>${value.toFixed(1)}%</strong> fully vaccinated
    `);
  })
  .on("mousemove", function (event) {
    tooltip
      .style("left", `${event.pageX + 15}px`)
      .style("top", `${event.pageY + 15}px`);
  })
  .on("mouseout", function () {
    tooltip.style("opacity", 0);
  });
