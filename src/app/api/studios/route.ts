import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Ensure we use Node.js runtime for database access
export const runtime = "nodejs"

export async function GET() {
  try {
    console.log("Fetching studio apartments from database...")

    // Query studios from database
    const apartments = await prisma.apartment.findMany({
      where: {
        beds: {
          contains: "studio",
          mode: "insensitive"
        }
      },
      select: {
        id: true,
        propertyName: true,
        url: true,
        fullAddress: true,
        neighborhood: true,
        latitude: true,
        longitude: true,
        rentMin: true,
        rentMax: true,
        beds: true,
        baths: true,
        sqft: true,
        models: true
      }
    })

    // Map to GeoJSON features
    const studiosData = apartments.map((apt) => {
      // Try to find studio-specific pricing from models array
      let studioPrice = apt.rentMin ?? null
      if (apt.models && Array.isArray(apt.models)) {
        const models = apt.models as Array<{
          modelName?: string
          rentLabel?: string
          details?: string[]
        }>
        const studioModel = models.find((model) =>
          model.details?.some((detail) => detail.toLowerCase() === "studio")
        )
        if (studioModel && studioModel.rentLabel) {
          // Extract price from rentLabel (e.g., "$1,950" -> 1950)
          const priceMatch = studioModel.rentLabel.match(/[\d,]+/)
          if (priceMatch) {
            studioPrice = parseInt(priceMatch[0].replace(/,/g, ""))
          }
        }
      }

      const priceRange = apt.rentMin && apt.rentMax
        ? `$${apt.rentMin.toLocaleString()} - $${apt.rentMax.toLocaleString()}`
        : apt.rentMin
        ? `$${apt.rentMin.toLocaleString()}`
        : "Contact for pricing"

      return {
        type: "Feature" as const,
        properties: {
          id: apt.id,
          name: apt.propertyName,
          address: apt.fullAddress,
          neighborhood: apt.neighborhood,
          price: studioPrice,
          priceRange,
          beds: apt.beds,
          baths: apt.baths,
          sqft: apt.sqft,
          url: apt.url,
          category: "studio"
        },
        geometry: {
          type: "Point" as const,
          coordinates: [apt.longitude, apt.latitude] as [number, number]
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
