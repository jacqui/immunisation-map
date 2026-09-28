<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { feature } from "topojson-client";

  const AGE_GROUPS = ["1 Year olds", "2 Year olds", "5 Year olds"];
  let currentAge = $state("2 Year olds");
  let regions = $state(null);
  let vaccinations = $state([]);
  let hovered = $state(null); // { name, value, x, y } | null

  onMount(async () => {
    const [geography, csv] = await Promise.all([
      d3.json("/data/sa3.topo.json"),
      d3.csv("/data/vaccination.csv"),
    ]);
    regions = feature(geography, geography.objects["sa3.raw"]).features;
    vaccinations = csv;
  });

  const colour = d3.scaleSequential(d3.interpolateYlGnBu).domain([80, 100]);

  function lookup(code) {
    if (!vaccinations.length) return null;
    const row = vaccinations.find(
      (d) => d.SA3_Code === code && d["Age Group"] === currentAge
    );
    if (!row || row["% Fully"] === "") return null;
    return +row["% Fully"];
  }

  const width = 900;
  const height = 700;

  let projection = $derived(
    regions ? d3.geoMercator().fitSize([width, height], { type: "FeatureCollection", features: regions }) : null
  );
  let path = $derived(projection ? d3.geoPath(projection) : null);
</script>

<header>
  <h1>How close is your community to the vaccination target?</h1>
  <p>
    Childhood vaccination rates vary across Australia. This map shows the
    proportion of children by selected age group who were fully vaccinated in
    each Statistical Area Level 3 (SA3). The
    <a href="https://www.health.gov.au/topics/immunisation/immunisation-data/childhood-immunisation-coverage#our-target">
      national target is 95%</a
    >.
  </p>
</header>

<div class="controls">
  <label for="age">Age group:</label>
  <select id="age" bind:value={currentAge}>
    {#each AGE_GROUPS as age}<option value={age}>{age}</option>{/each}
  </select>
</div>

<div class="map-wrap">
  {#if regions}
<svg viewBox="0 0 {width} {height}" preserveAspectRatio="xMinYMid meet">
          {#each regions as d}
        {@const value = lookup(d.properties.SA3_CODE_2021)}
        <path
          d={path(d)}
          fill={value !== null ? colour(value) : "#e5e5e5"}
          stroke="#fff"
          stroke-width="0.5"
          vector-effect="non-scaling-stroke"
          onmouseenter={(e) =>
            (hovered = {
              name: d.properties.SA3_NAME_2021,
              value,
              x: e.clientX,
              y: e.clientY,
            })}
          onmousemove={(e) => hovered && (hovered = { ...hovered, x: e.clientX, y: e.clientY })}
          onmouseleave={() => (hovered = null)}
        />
      {/each}
    </svg>
  {:else}
    <p>Loading map…</p>
  {/if}

  {#if hovered}
    <div class="tooltip" style="left:{hovered.x + 15}px; top:{hovered.y + 15}px;">
      <strong>{hovered.name}</strong><br />
      {currentAge}<br />
      {#if hovered.value !== null}
        <strong>{hovered.value.toFixed(1)}%</strong> fully vaccinated
      {:else}
        Data not available
      {/if}
    </div>
  {/if}
</div>