// components/ChicagoMap.tsx
"use client"

import React, { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import styles from "./ChicagoMap.module.css"

// Make sure NEXT_PUBLIC_MAPBOX_TOKEN is set in env
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

const geojsonData = {
  type: "FeatureCollection" as const,
  features: [
    // --- Nightclubs ---
    {
      type: "Feature" as const,
      properties: {
        id: "nc1",
        name: "Nightclub A",
        category: "nightclub",
        description: "Dance floor & live DJs"
      },
      geometry: { type: "Point" as const, coordinates: [-87.6278, 41.8850] as [number, number] }
    },
    {
      type: "Feature" as const,
      properties: {
        id: "nc2",
        name: "Nightclub B",
        category: "nightclub",
        description: "Late-night spot"
      },
      geometry: { type: "Point" as const, coordinates: [-87.6240, 41.8730] as [number, number] }
    },
    {
      type: "Feature" as const,
      properties: {
        id: "nc3",
        name: "Nightclub C",
        category: "nightclub",
        description: "Cocktails + music"
      },
      geometry: { type: "Point" as const, coordinates: [-87.6340, 41.8780] as [number, number] }
    },

    // --- Squat-rack gyms ---
    {
      type: "Feature" as const,
      properties: {
        id: "gym1",
        name: "Squat Rack Gym 1",
        category: "squat_gym",
        description: "Free weights, squat racks"
      },
      geometry: { type: "Point" as const, coordinates: [-87.6270, 41.8800] as [number, number] }
    },
    {
      type: "Feature" as const,
      properties: {
        id: "gym2",
        name: "Squat Rack Gym 2",
        category: "squat_gym",
        description: "Powerlifting-friendly"
      },
      geometry: { type: "Point" as const, coordinates: [-87.6320, 41.8750] as [number, number] }
    },
    {
      type: "Feature" as const,
      properties: {
        id: "gym3",
        name: "Squat Rack Gym 3",
        category: "squat_gym",
        description: "24/7 access"
      },
      geometry: { type: "Point" as const, coordinates: [-87.6200, 41.8820] as [number, number] }
    },

    // --- BJJ gyms ---
    {
      type: "Feature" as const,
      properties: {
        id: "bjj1",
        name: "BJJ Dojo 1",
        category: "bjj",
        description: "Brazilian jiu-jitsu classes"
      },
      geometry: { type: "Point" as const, coordinates: [-87.6280, 41.8790] as [number, number] }
    },
    {
      type: "Feature" as const,
      properties: {
        id: "bjj2",
        name: "BJJ Dojo 2",
        category: "bjj",
        description: "Gi & no-gi lessons"
      },
      geometry: { type: "Point" as const, coordinates: [-87.6350, 41.8810] as [number, number] }
    },
    {
      type: "Feature" as const,
      properties: {
        id: "bjj3",
        name: "BJJ Dojo 3",
        category: "bjj",
        description: "Open mat nights"
      },
      geometry: { type: "Point" as const, coordinates: [-87.6220, 41.8740] as [number, number] }
    }
  ]
}

export default function ChicagoMap() {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [visibleCategories, setVisibleCategories] = useState({
    nightclubs: true,
    squatGyms: true,
    bjj: true
  })

  useEffect(() => {
    if (!mapContainer.current) return
    if (!mapboxgl.accessToken) {
      console.error("Mapbox token missing. Set NEXT_PUBLIC_MAPBOX_TOKEN.")
      return
    }
    if (mapRef.current) return // init once

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-87.6298, 41.8781], // downtown Chicago center
      zoom: 13
    })

    mapRef.current = map

    map.on("load", () => {
      // add source with clustering enabled
      map.addSource("places", {
        type: "geojson",
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50 // pixels
      })

      // cluster circles
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "places",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#51bbd6",
            5,
            "#f1f075",
            10,
            "#f28cb1"
          ],
          "circle-radius": ["step", ["get", "point_count"], 15, 5, 20, 10, 25]
        }
      })

      // cluster count label
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "places",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12
        }
      })

      // unclustered points per category: nightclubs, squat_gym, bjj
      // Nightclubs: red
      map.addLayer({
        id: "unclustered-nightclub",
        type: "circle",
        source: "places",
        filter: ["all", ["!=", ["get", "cluster"], true], ["==", ["get", "category"], "nightclub"]],
        paint: {
          "circle-color": "#e63946",
          "circle-radius": 8,
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1
        }
      })

      // Squat gyms: green
      map.addLayer({
        id: "unclustered-squat",
        type: "circle",
        source: "places",
        filter: ["all", ["!=", ["get", "cluster"], true], ["==", ["get", "category"], "squat_gym"]],
        paint: {
          "circle-color": "#2a9d8f",
          "circle-radius": 8,
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1
        }
      })

      // BJJ: purple
      map.addLayer({
        id: "unclustered-bjj",
        type: "circle",
        source: "places",
        filter: ["all", ["!=", ["get", "cluster"], true], ["==", ["get", "category"], "bjj"]],
        paint: {
          "circle-color": "#6a4c93",
          "circle-radius": 8,
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1
        }
      })

      // click cluster to zoom
      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })
        if (!features.length) return
        const clusterId = features[0].properties?.cluster_id
        const source = map.getSource("places") as mapboxgl.GeoJSONSource
        if (!source) return
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom == null) return
          map.easeTo({ center: (features[0].geometry as any).coordinates, zoom })
        })
      })

      // show popup on unclustered point click (works for all three layers)
      const showPopup = (e: mapboxgl.MapMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["unclustered-nightclub", "unclustered-squat", "unclustered-bjj"]
        })
        if (!features.length) return
        const f = features[0]
        const coords = (f.geometry as any).coordinates.slice()
        const props = f.properties || {}
        const popupHtml = `<strong>${props.name}</strong><p>${props.description || ""}</p><p><em>${props.category}</em></p>`
        new mapboxgl.Popup({ offset: 12 }).setLngLat(coords).setHTML(popupHtml).addTo(map)
      }

      map.on("click", showPopup)

      // change cursor on hover
      map.on("mouseenter", "clusters", () => map.getCanvas().style.cursor = "pointer")
      map.on("mouseleave", "clusters", () => map.getCanvas().style.cursor = "")
      ;["unclustered-nightclub", "unclustered-squat", "unclustered-bjj"].forEach((layerId) => {
        map.on("mouseenter", layerId, () => map.getCanvas().style.cursor = "pointer")
        map.on("mouseleave", layerId, () => map.getCanvas().style.cursor = "")
      })

      setMapLoaded(true)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Toggle categories by setting layer visibility
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    map.setLayoutProperty(
      "unclustered-nightclub",
      "visibility",
      visibleCategories.nightclubs ? "visible" : "none"
    )
    map.setLayoutProperty(
      "unclustered-squat",
      "visibility",
      visibleCategories.squatGyms ? "visible" : "none"
    )
    map.setLayoutProperty(
      "unclustered-bjj",
      "visibility",
      visibleCategories.bjj ? "visible" : "none"
    )
  }, [visibleCategories, mapLoaded])

  return (
    <div className={styles.wrapper}>
      <div className={styles.sidebar}>
        <h3>Downtown Chicago — Layers</h3>
        <label className={styles.filterLabel}>
          <input
            type="checkbox"
            checked={visibleCategories.nightclubs}
            onChange={(e) => setVisibleCategories(s => ({ ...s, nightclubs: e.target.checked }))}
          />{" "}
          Nightclubs
        </label>
        <label className={styles.filterLabel}>
          <input
            type="checkbox"
            checked={visibleCategories.squatGyms}
            onChange={(e) => setVisibleCategories(s => ({ ...s, squatGyms: e.target.checked }))}
          />{" "}
          Squat rack gyms
        </label>
        <label className={styles.filterLabel}>
          <input
            type="checkbox"
            checked={visibleCategories.bjj}
            onChange={(e) => setVisibleCategories(s => ({ ...s, bjj: e.target.checked }))}
          />{" "}
          BJJ gyms
        </label>

        <div className={styles.legend}>
          <div><span className={styles.legendSwatch} style={{background:"#e63946"}}/> Nightclub</div>
          <div><span className={styles.legendSwatch} style={{background:"#2a9d8f"}}/> Squat Gym</div>
          <div><span className={styles.legendSwatch} style={{background:"#6a4c93"}}/> BJJ</div>
        </div>

        <small>
          Note: this is mock data for downtown Chicago. Replace `geojsonData.features` with your
          real feed or API call.
        </small>
      </div>

      <div ref={mapContainer} className={styles.mapContainer} />
    </div>
  )
}
