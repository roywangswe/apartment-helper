import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// Force Node.js runtime to use fs module
export const runtime = "nodejs"

interface Apartment {
  id: string
  propertyName: string
  url: string
  location: {
    fullAddress: string
    state: string
    city: string
    neighborhood: string
    postalCode: string
    streetAddress: string
  }
  coordinates: {
    latitude: number
    longitude: number
  }
  rent: {
    min: number
    max: number
  }
  beds: string
  baths: string
  sqft: string
  models?: Array<{
    modelName: string
    rentLabel: string
    details: string[]
  }>
}

export async function GET() {
  try {
    console.log("Fetching studio apartments from apartments.json...")

    // Read apartments.json from project root
    const filePath = path.join(process.cwd(), "apartments.json")
    const fileContents = fs.readFileSync(filePath, "utf8")
    const apartments: Apartment[] = JSON.parse(fileContents)

    // Filter for apartments that have studios
    const studiosData = apartments
      .filter((apt) => apt.beds && apt.beds.toLowerCase().includes("studio"))
      .map((apt) => {
        // Try to find studio-specific pricing from models array
        let studioPrice = apt.rent.min
        if (apt.models && apt.models.length > 0) {
          const studioModel = apt.models.find((model) =>
            model.details.some((detail) => detail.toLowerCase() === "studio")
          )
          if (studioModel && studioModel.rentLabel) {
            // Extract price from rentLabel (e.g., "$1,950" -> 1950)
            const priceMatch = studioModel.rentLabel.match(/[\d,]+/)
            if (priceMatch) {
              studioPrice = parseInt(priceMatch[0].replace(/,/g, ""))
            }
          }
        }

        return {
          type: "Feature" as const,
          properties: {
            id: apt.id,
            name: apt.propertyName,
            address: apt.location.fullAddress,
            neighborhood: apt.location.neighborhood,
            price: studioPrice,
            priceRange: `$${apt.rent.min.toLocaleString()} - $${apt.rent.max.toLocaleString()}`,
            beds: apt.beds,
            baths: apt.baths,
            sqft: apt.sqft,
            url: apt.url,
            category: "studio"
          },
          geometry: {
            type: "Point" as const,
            coordinates: [apt.coordinates.longitude, apt.coordinates.latitude] as [number, number]
          }
        }
      })

    const geojson = {
      type: "FeatureCollection" as const,
      features: studiosData
    }

    console.log(`Returning ${studiosData.length} studio apartments`)
    return NextResponse.json(geojson)
  } catch (error) {
    console.error("Error fetching studio apartments:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to fetch studio apartments", details: errorMessage },
      { status: 500 }
    )
  }
}
