import * as d3 from "d3";
import { feature } from "topojson-client";

const width = 1000;
const height = 700;

const svg = d3
  .select("#map")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`);

// load in our data
const geography = await d3.json("/data/sa3.topo.json");
const vaccinations = await d3.csv("/data/vaccination.csv");

// convert the topojson to geojson
const regions = feature(geography, geography.objects.sa3);

// scale the map to fit the svg
const projection = d3.geoMercator().fitSize([width, height], regions);
const path = d3.geoPath(projection);

// draw the map
svg.selectAll("path").data(regions.features).join("path").attr("d", path);
