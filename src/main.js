import * as d3 from "d3";
import { feature } from "topojson-client";

// load in our data
const geography = await d3.json("/data/sa3.topo.json");
const vaccinations = await d3.csv("/data/vaccination.csv");

let currentAge = "2 Year olds";

// lookup data by age group
function buildLookup(ageGroup) {
  return new Map(
    vaccinations
      .filter((d) => d["Age Group"] === ageGroup)
      .map((d) => [d.SA3_Code, +d["% Fully"]]),
  );
}

// 2. Convert topojson -> geojson

const regions = feature(geography, geography.objects["sa3.raw"]);

// 3. Create a map of SA3 codes to vaccination rates
let vaccinationMap = buildLookup("2 Year olds");

function updateMap(ageGroup) {
  vaccinationMap = buildLookup(ageGroup);

  g.selectAll("path")
    .transition()
    .duration(400)
    .attr("fill", (d) => {
      const value = vaccinationMap.get(d.properties.SA3_CODE_2021);

      return value ? colour(value) : "#ddd";
    });
}

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

const g = svg.append("g");
const zoom = d3
  .zoom()
  .scaleExtent([1, 15])
  .on("zoom", (event) => {
    g.attr("transform", event.transform);
  });

svg.call(zoom);

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

g.selectAll("path")
  .data(regions.features)
  .join("path")
  .attr("stroke", "#fff")
  .attr("stroke-width", 0.5)
  .attr("d", path)
  .attr("fill", (d) => {
    const value = vaccinationMap.get(d.properties.SA3_CODE_2021);
    return value ? colour(value) : "#ccc";
  })
  .attr("vector-effect", "non-scaling-stroke")

  .on("mouseover", function (event, d) {
    // outline selected region with a black border

    d3.select(this)
      .raise()
      .attr("stroke", "#222")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round");

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
  // .on("mouseout", function () {
  //   d3.select(this).attr("stroke", "#fff").attr("stroke-width", 0.5);
  //   tooltip.style("opacity", 0);
  // })
  .on("mouseleave", () => {
    g.selectAll("path").attr("stroke", "#fff").attr("stroke-width", 0.5);

    tooltip.style("opacity", 0);
  });

d3.select("#age").on("change", function () {
  currentAge = this.value;
  updateMap(currentAge);
});
