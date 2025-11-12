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
    description?: string
    price?: number
    address?: string
    neighborhood?: string
    priceRange?: string
    url?: string
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
  const [studiosData, setStudiosData] = useState<GeoJSONData | null>(null)
  const [visibleCategories, setVisibleCategories] = useState({
    nightclubs: true,
    squatGyms: true,
    bjj: true,
    studios: true
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

  // Fetch studio apartments from API
  useEffect(() => {
    async function fetchStudios() {
      try {
        console.log("Fetching studios from API...")
        const response = await fetch("/api/studios")
        if (!response.ok) {
          throw new Error(`Failed to fetch studios: ${response.status}`)
        }

        const data: GeoJSONData = await response.json()
        console.log(`Loaded ${data.features.length} studio apartments`)
        setStudiosData(data)
      } catch (err) {
        console.error("Error fetching studios:", err)
        // Don't set error state - just log it, studios are optional
      }
    }

    fetchStudios()
  }, [])

  useEffect(() => {
    if (!mapContainer.current) return
    if (!mapboxgl.accessToken) {
      console.error("Mapbox token missing. Set NEXT_PUBLIC_MAPBOX_TOKEN.")
      return
    }
    if (!geojsonData || !studiosData) return // wait for both data sets
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

      // Add studios source and layer
      map.addSource("studios", {
        type: "geojson",
        data: studiosData
      })

      // Studios: orange/yellow
      map.addLayer({
        id: "studios",
        type: "circle",
        source: "studios",
        filter: ["==", ["get", "category"], "studio"],
        paint: {
          "circle-color": "#f77f00",
          "circle-radius": 8,
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1
        }
      })

      // show popup on point click (works for all four layers)
      const showPopup = (e: mapboxgl.MapMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["nightclub", "squat", "bjj", "studios"]
        })
        if (!features.length) return
        const f = features[0]
        const coords = (f.geometry as any).coordinates.slice()
        const props = f.properties || {}

        let popupHtml = ""
        if (props.category === "studio") {
          popupHtml = `
            <strong>${props.name}</strong>
            <p><strong>Price:</strong> $${props.price?.toLocaleString() || "N/A"}</p>
            <p>${props.address || ""}</p>
            <p><em>${props.neighborhood || ""}</em></p>
            ${props.url ? `<p><a href="${props.url}" target="_blank">View listing →</a></p>` : ""}
          `
        } else {
          popupHtml = `<strong>${props.name}</strong><p>${props.description || ""}</p><p><em>${props.category}</em></p>`
        }

        new mapboxgl.Popup({ offset: 12 }).setLngLat(coords).setHTML(popupHtml).addTo(map)
      }

      map.on("click", showPopup)

      // change cursor on hover
      ;["nightclub", "squat", "bjj", "studios"].forEach((layerId) => {
        map.on("mouseenter", layerId, () => map.getCanvas().style.cursor = "pointer")
        map.on("mouseleave", layerId, () => map.getCanvas().style.cursor = "")
      })

      setMapLoaded(true)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [geojsonData, studiosData])

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
    map.setLayoutProperty(
      "studios",
      "visibility",
      visibleCategories.studios ? "visible" : "none"
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

  const stats = {
    nightclubs: geojsonData ? geojsonData.features.filter(f => f.properties.category === "nightclub").length : 0,
    gyms: geojsonData ? geojsonData.features.filter(f => f.properties.category === "squat_gym").length : 0,
    bjj: geojsonData ? geojsonData.features.filter(f => f.properties.category === "bjj").length : 0,
    studios: studiosData ? studiosData.features.length : 0,
    poiTotal: geojsonData ? geojsonData.features.length : 0
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.sidebar}>
        <h3>Downtown Chicago — Layers</h3>

        <div className={styles.stats}>
          <p className={styles.statsText}>
            {stats.poiTotal} POIs from OpenStreetMap
          </p>
          <p className={styles.statsText}>
            {stats.studios} Studio Apartments
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
        <label className={styles.filterLabel}>
          <input
            type="checkbox"
            checked={visibleCategories.studios}
            onChange={(e) => setVisibleCategories(s => ({ ...s, studios: e.target.checked }))}
          />{" "}
          Studio Apartments ({stats.studios})
        </label>

        <div className={styles.legend}>
          <div><span className={styles.legendSwatch} style={{background:"#e63946"}}/> Nightclub</div>
          <div><span className={styles.legendSwatch} style={{background:"#2a9d8f"}}/> Gym/Fitness</div>
          <div><span className={styles.legendSwatch} style={{background:"#6a4c93"}}/> BJJ</div>
          <div><span className={styles.legendSwatch} style={{background:"#f77f00"}}/> Studio Apt</div>
        </div>

        <small className={styles.dataSource}>
          Data sources: OpenStreetMap (POIs) • Apartments.com (Studios)
        </small>
      </div>

      <div ref={mapContainer} className={styles.mapContainer} />
    </div>
  )
}
