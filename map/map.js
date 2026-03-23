// Map logic: D3 force simulation, straight links, hover cascade.
// Viewport keeping mirrors map.1760008371.js (WebCoLa): fixed TL/BR + separation gap on x/y,
// implemented as a custom force so we stay on d3-force only (no cola.js).

const overflow = 250

/** Same shape as reference cola file: margin.sides/top/bottom around the vis box */
function viewportMargin() {
  return { sides: 0, top: 0, bottom: 0 }
}

/** Reference uses nodeRadius 50; scales down on narrow widths (see map.1760008371.js) */
function separationGap(width) {
  if (width < 550) return 40
  if (width < 700) return 45
  return 50
}

/** Link length scaling from the same reference */
function linkDistanceForWidth(width) {
  if (width < 550) return 28
  if (width < 700) return 40
  if (width > 768) return 70
  return 30
}

/**
 * Cola encodes bounds as four separations per node: min x/y from TL corner, max x/y from BR corner.
 * TL = (margin.sides, margin.top), BR = (width - margin.sides, height - margin.bottom) in ref.
 * We add each node's collision radius so label centers (translate -50% -50%) stay inside.
 */
function forceColaViewportBounds(width, height, margin, gap) {
  let nodes
  const pull = 0.78

  function force(alpha) {
    const k = pull * Math.pow(alpha, 0.55)
    const brX = margin.sides + (width - 2 * margin.sides)
    const brY = margin.top + (height - margin.top - margin.bottom)

    for (const d of nodes) {
      const r = d.radius || 40
      const minX = margin.sides + gap + r
      const maxX = brX - gap - r
      const minY = margin.top + gap + r
      const maxY = brY - gap - r
      if (minX > maxX || minY > maxY) continue
      if (d.x < minX) d.x += (minX - d.x) * k
      else if (d.x > maxX) d.x += (maxX - d.x) * k
      if (d.y < minY) d.y += (minY - d.y) * k
      else if (d.y > maxY) d.y += (maxY - d.y) * k
    }
  }
  force.initialize = (n) => {
    nodes = n
  }
  return force
}

document.addEventListener("DOMContentLoaded", function () {
  const layoutKey =
    window.innerWidth > 768
      ? "levan_map_layout_desktop_v4"
      : "levan_map_layout_mobile_v4"

  function createStraightPath(source, target) {
    return `M${source.x + overflow},${source.y + overflow} L${target.x + overflow},${target.y + overflow}`
  }

  const createVisualisation = () => {
    const container = document.querySelector(".map__vis")
    container.innerHTML = ""

    let nodes = structuredClone(initialNodes)
    const nodesMap = nodes.reduce((acc, n) => {
      acc[n.id] = n
      return acc
    }, {})

    const links = initialLinks
      .filter((l) => nodesMap[l.source] && nodesMap[l.target])
      .map((l) => {
        const source = nodesMap[l.source]
        const target = nodesMap[l.target]
        if (!source.links) source.links = []
        if (!target.links) target.links = []
        source.links.push(target.id)
        target.links.push(source.id)
        return { source, target }
      })

    const width = container.getBoundingClientRect().width
    const height = container.getBoundingClientRect().height
    const margin = viewportMargin()
    const gap = separationGap(width)

    const distance = linkDistanceForWidth(width)

    // Seed positions from saved layout so layout is stable across refreshes
    try {
      const raw = window.localStorage && window.localStorage.getItem(layoutKey)
      if (raw) {
        const saved = JSON.parse(raw)
        nodes.forEach((n) => {
          const p = saved[n.id]
          if (p && typeof p.x === "number" && typeof p.y === "number") {
            n.x = p.x
            n.y = p.y
          }
        })
      }
    } catch (e) {}

    // SVG for links (reference: .map-lines)
    const svg = d3
      .select(container)
      .append("svg")
      .attr("class", "links")
      .attr("width", width + overflow * 2)
      .attr("height", height + overflow * 2)
      .append("g")

    const link = svg
      .selectAll(".link")
      .data(links)
      .join("path")
      .attr("class", "link")
      .attr("data-from", (d) => d.source.id)
      .attr("data-to", (d) => d.target.id)

    const node = d3
      .select(container)
      .selectAll(".node")
      .data(nodes)
      .join("div")
      .attr("class", (d) => `node node--${d.type || "field"}`)
      .attr("data-id", (d) => d.id)
      .each(function (d, i) {
        const el = d3.select(this)
        let scale = 1 - (1 - (d.weight || 1)) * 0.6
        if (d.type === "movement" || d.type === "person") scale = 1
        nodes[i].scale = scale
        // Collision radius so nodes don't overlap (approx half-width of label + padding)
        nodes[i].radius = Math.max(36, 18 + (d.name || "").length * 2.2) * scale
        el.attr(
          "style",
          `--scale: ${scale}; transform: translate(0px, 0px) translate(-50%, -50%);`
        )
          .append("div")
          .attr("class", "node__body")
          .text(d.name)
          .on("pointerenter", function () {
            container.classList.add("map__vis--hover")
            document
              .querySelectorAll(
                `.link[data-from="${d.id}"], .link[data-to="${d.id}"]`
              )
              .forEach((e) => e.classList.add("link--hover"))
            this.closest(".node").classList.add("node--hover")
            ;(d.links || []).forEach((id) => {
              document.querySelectorAll(`.node[data-id="${id}"]`).forEach((e) => e.classList.add("node--hover-1"))
              document
                .querySelectorAll(`.link[data-from="${id}"], .link[data-to="${id}"]`)
                .forEach((e) => e.classList.add("link--hover-1"))
              const n1 = nodes.find((n) => n.id === id)
              if (n1) {
                ;(n1.links || []).forEach((id2) => {
                  document.querySelectorAll(`.node[data-id="${id2}"]`).forEach((e) => e.classList.add("node--hover-2"))
                  document
                    .querySelectorAll(`.link[data-from="${id2}"], .link[data-to="${id2}"]`)
                    .forEach((e) => e.classList.add("link--hover-2"))
                  const n2 = nodes.find((n) => n.id === id2)
                  ;((n2 && n2.links) || []).forEach((id3) => {
                    document.querySelectorAll(`.node[data-id="${id3}"]`).forEach((e) => e.classList.add("node--hover-3"))
                    document
                      .querySelectorAll(`.link[data-from="${id3}"], .link[data-to="${id3}"]`)
                      .forEach((e) => e.classList.add("link--hover-3"))
                  })
                })
              }
            })
          })
          .on("pointerleave", function () {
            container.classList.remove("map__vis--hover")
            container.querySelectorAll(".link").forEach((e) => {
              e.classList.remove("link--hover", "link--hover-1", "link--hover-2", "link--hover-3")
            })
            container.querySelectorAll(".node").forEach((e) => {
              e.classList.remove("node--hover", "node--hover-1", "node--hover-2", "node--hover-3")
            })
          })
      })

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink(links).id((d) => d.id).distance(distance).strength(0.1)
      )
      .force(
        "charge",
        d3.forceManyBody().strength(-400).distanceMax(300).distanceMin(10)
      )
      .force(
        "collision",
        d3.forceCollide().radius((d) => d.radius || 40)
      )
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("colaBounds", forceColaViewportBounds(width, height, margin, gap))
      .on("tick", () => {
        link.attr("d", (d) => createStraightPath(d.source, d.target))
        node.attr(
          "style",
          (d) =>
            `--scale: ${d.scale}; transform: translate(${d.x}px, ${d.y}px) translate(-50%, -50%);`
        )
      })
      .on("end", () => {
        document.querySelector(".map__vis-loading")?.remove()
        // Do not hard-clamp here — that was snapping the whole graph onto the inset
        // rectangle right as the simulation cooled (looked great mid-run, then collapsed).
        try {
          const toSave = {}
          nodes.forEach((d) => {
            if (d.id) toSave[d.id] = { x: d.x, y: d.y }
          })
          if (window.localStorage) {
            window.localStorage.setItem(layoutKey, JSON.stringify(toSave))
          }
        } catch (e) {}
      })
  }

  createVisualisation()

  function debounce(fn, ms) {
    let t
    return (...args) => {
      clearTimeout(t)
      t = setTimeout(() => fn.apply(this, args), ms)
    }
  }

  window.addEventListener("resize", debounce(createVisualisation, 200))
})
