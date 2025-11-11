// components/ChicagoMap.tsx
"use client"

import React, { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import styles from "./ChicagoMap.module.css"

// Make sure NEXT_PUBLIC_MAPBOX_TOKEN is set in env
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

interface GeoJSONFeature {
  type: "Feature"
  properties: {
    id: string
    name: string
    category: string
    description: string
    [key: string]: any
  }
  geometry: {
    type: "Point"
    coordinates: [number, number]
  }
}

interface GeoJSONData {
  type: "FeatureCollection"
  features: GeoJSONFeature[]
}

export default function ChicagoMap() {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [geojsonData, setGeojsonData] = useState<GeoJSONData | null>(null)
  const [visibleCategories, setVisibleCategories] = useState({
    nightclubs: true,
    squatGyms: true,
    bjj: true
  })

  // Fetch POI data from API
  useEffect(() => {
    async function fetchPOIs() {
      try {
        setLoading(true)
        setError(null)
        console.log("Fetching POIs from API...")

        const response = await fetch("/api/pois")
        if (!response.ok) {
          throw new Error(`Failed to fetch POIs: ${response.status}`)
        }

        const data: GeoJSONData = await response.json()
        console.log(`Loaded ${data.features.length} POIs`)
        setGeojsonData(data)
      } catch (err) {
        console.error("Error fetching POIs:", err)
        setError(err instanceof Error ? err.message : "Failed to load places")
      } finally {
        setLoading(false)
      }
    }

    fetchPOIs()
  }, [])

  useEffect(() => {
    if (!mapContainer.current) return
    if (!mapboxgl.accessToken) {
      console.error("Mapbox token missing. Set NEXT_PUBLIC_MAPBOX_TOKEN.")
      return
    }
    if (!geojsonData) return // wait for data
    if (mapRef.current) return // init once

    console.log("Initializing map with data...")

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-87.6298, 41.8781], // downtown Chicago center
      zoom: 13
    })

    mapRef.current = map

    map.on("load", () => {
      console.log("Map loaded, adding source and layers...")

      // add source without clustering
      map.addSource("places", {
        type: "geojson",
        data: geojsonData
      })

      // Individual points per category: nightclubs, squat_gym, bjj
      // Nightclubs: red
      map.addLayer({
        id: "nightclub",
        type: "circle",
        source: "places",
        filter: ["==", ["get", "category"], "nightclub"],
        paint: {
          "circle-color": "#e63946",
          "circle-radius": 8,
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1
        }
      })

      // Squat gyms: green
      map.addLayer({
        id: "squat",
        type: "circle",
        source: "places",
        filter: ["==", ["get", "category"], "squat_gym"],
        paint: {
          "circle-color": "#2a9d8f",
          "circle-radius": 8,
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1
        }
      })

      // BJJ: purple
      map.addLayer({
        id: "bjj",
        type: "circle",
        source: "places",
        filter: ["==", ["get", "category"], "bjj"],
        paint: {
          "circle-color": "#6a4c93",
          "circle-radius": 8,
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1
        }
      })

      // show popup on point click (works for all three layers)
      const showPopup = (e: mapboxgl.MapMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["nightclub", "squat", "bjj"]
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
      ;["nightclub", "squat", "bjj"].forEach((layerId) => {
        map.on("mouseenter", layerId, () => map.getCanvas().style.cursor = "pointer")
        map.on("mouseleave", layerId, () => map.getCanvas().style.cursor = "")
      })

      setMapLoaded(true)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [geojsonData])

  // Toggle categories by setting layer visibility
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    map.setLayoutProperty(
      "nightclub",
      "visibility",
      visibleCategories.nightclubs ? "visible" : "none"
    )
    map.setLayoutProperty(
      "squat",
      "visibility",
      visibleCategories.squatGyms ? "visible" : "none"
    )
    map.setLayoutProperty(
      "bjj",
      "visibility",
      visibleCategories.bjj ? "visible" : "none"
    )
  }, [visibleCategories, mapLoaded])

  // Loading state
  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading places from OpenStreetMap...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>Error: {error}</p>
          <button
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const stats = geojsonData ? {
    nightclubs: geojsonData.features.filter(f => f.properties.category === "nightclub").length,
    gyms: geojsonData.features.filter(f => f.properties.category === "squat_gym").length,
    bjj: geojsonData.features.filter(f => f.properties.category === "bjj").length,
    total: geojsonData.features.length
  } : { nightclubs: 0, gyms: 0, bjj: 0, total: 0 }

  return (
    <div className={styles.wrapper}>
      <div className={styles.sidebar}>
        <h3>Downtown Chicago — Layers</h3>

        <div className={styles.stats}>
          <p className={styles.statsText}>
            Showing {stats.total} places from OpenStreetMap
          </p>
        </div>

        <label className={styles.filterLabel}>
          <input
            type="checkbox"
            checked={visibleCategories.nightclubs}
            onChange={(e) => setVisibleCategories(s => ({ ...s, nightclubs: e.target.checked }))}
          />{" "}
          Nightclubs ({stats.nightclubs})
        </label>
        <label className={styles.filterLabel}>
          <input
            type="checkbox"
            checked={visibleCategories.squatGyms}
            onChange={(e) => setVisibleCategories(s => ({ ...s, squatGyms: e.target.checked }))}
          />{" "}
          Gyms & Fitness ({stats.gyms})
        </label>
        <label className={styles.filterLabel}>
          <input
            type="checkbox"
            checked={visibleCategories.bjj}
            onChange={(e) => setVisibleCategories(s => ({ ...s, bjj: e.target.checked }))}
          />{" "}
          BJJ Academies ({stats.bjj})
        </label>

        <div className={styles.legend}>
          <div><span className={styles.legendSwatch} style={{background:"#e63946"}}/> Nightclub</div>
          <div><span className={styles.legendSwatch} style={{background:"#2a9d8f"}}/> Gym/Fitness</div>
          <div><span className={styles.legendSwatch} style={{background:"#6a4c93"}}/> BJJ</div>
        </div>

        <small className={styles.dataSource}>
          Data source: OpenStreetMap contributors via Overpass API
        </small>
      </div>

      <div ref={mapContainer} className={styles.mapContainer} />
    </div>
  )
}
