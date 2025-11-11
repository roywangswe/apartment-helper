import { NextResponse } from "next/server"

// Downtown Chicago bounding box
const CHICAGO_BOUNDS = {
  south: 41.85,
  west: -87.68,
  north: 41.92,
  east: -87.60
}

interface OverpassElement {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: {
    name?: string
    amenity?: string
    leisure?: string
    sport?: string
    [key: string]: string | undefined
  }
}

interface OverpassResponse {
  elements: OverpassElement[]
}

export async function GET() {
  try {
    console.log("Fetching POIs from Overpass API...")

    const { south, west, north, east } = CHICAGO_BOUNDS
    const bbox = `${south},${west},${north},${east}`

    // Overpass QL query for nightclubs, gyms, and BJJ
    const query = `
      [out:json][timeout:25];
      (
        // Nightclubs
        node["amenity"="nightclub"](${bbox});
        way["amenity"="nightclub"](${bbox});

        // Gyms and fitness centers
        node["amenity"="gym"](${bbox});
        way["amenity"="gym"](${bbox});
        node["leisure"="fitness_centre"](${bbox});
        way["leisure"="fitness_centre"](${bbox});

        // BJJ academies
        node["sport"="brazilian_jiu_jitsu"](${bbox});
        way["sport"="brazilian_jiu_jitsu"](${bbox});
        node["name"~"BJJ|jiu.?jitsu",i](${bbox});
        way["name"~"BJJ|jiu.?jitsu",i](${bbox});
      );
      out center;
    `

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    })

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`)
    }

    const data: OverpassResponse = await response.json()
    console.log(`Fetched ${data.elements.length} POIs from Overpass API`)

    // Transform to GeoJSON
    const features = data.elements
      .map((element) => {
        // Get coordinates
        const lat = element.lat ?? element.center?.lat
        const lon = element.lon ?? element.center?.lon

        if (!lat || !lon) return null

        const tags = element.tags || {}
        const name = tags.name || "Unnamed"

        // Determine category
        let category = "unknown"
        let description = ""

        if (tags.amenity === "nightclub") {
          category = "nightclub"
          description = "Nightclub"
        } else if (tags.sport === "brazilian_jiu_jitsu" || name.match(/bjj|jiu.?jitsu/i)) {
          category = "bjj"
          description = "Brazilian Jiu-Jitsu Academy"
        } else if (tags.amenity === "gym" || tags.leisure === "fitness_centre") {
          category = "squat_gym"
          description = tags.sport ? `Gym - ${tags.sport}` : "Fitness Center"
        }

        return {
          type: "Feature" as const,
          properties: {
            id: `osm-${element.type}-${element.id}`,
            name,
            category,
            description,
            amenity: tags.amenity,
            leisure: tags.leisure,
            sport: tags.sport
          },
          geometry: {
            type: "Point" as const,
            coordinates: [lon, lat] as [number, number]
          }
        }
      })
      .filter((f) => f !== null)

    const geojson = {
      type: "FeatureCollection" as const,
      features
    }

    console.log(`Returning ${features.length} features`)
    console.log("Categories:", {
      nightclubs: features.filter((f) => f?.properties.category === "nightclub").length,
      gyms: features.filter((f) => f?.properties.category === "squat_gym").length,
      bjj: features.filter((f) => f?.properties.category === "bjj").length
    })

    return NextResponse.json(geojson)
  } catch (error) {
    console.error("Error fetching POIs:", error)
    return NextResponse.json(
      { error: "Failed to fetch POIs" },
      { status: 500 }
    )
  }
}
