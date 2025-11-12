import { PrismaClient } from "@prisma/client"
import * as fs from "fs"
import * as path from "path"

const prisma = new PrismaClient()

interface ApartmentJSON {
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
  beds?: string
  baths?: string
  sqft?: string
  models?: any[]
  transitAndPOI?: any[]
  scores?: any
  amenities?: any[]
  fees?: any[]
  schools?: any
  contact?: any
  photos?: string[]
  description?: string
  neighborhoodDescription?: string
  isVerified?: boolean
  scrapedAt: string
  breadcrumbs?: string[]
}

async function importApartments() {
  try {
    console.log("Reading apartments.json...")
    const filePath = path.join(process.cwd(), "apartments.json")
    const fileContents = fs.readFileSync(filePath, "utf8")
    const apartments: ApartmentJSON[] = JSON.parse(fileContents)

    console.log(`Found ${apartments.length} apartments to import`)

    // Clear existing data
    console.log("Clearing existing apartments...")
    await prisma.apartment.deleteMany()

    // Import in batches to avoid memory issues
    const batchSize = 100
    let imported = 0

    for (let i = 0; i < apartments.length; i += batchSize) {
      const batch = apartments.slice(i, i + batchSize)

      console.log(`Importing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(apartments.length / batchSize)}...`)

      await prisma.apartment.createMany({
        data: batch.map((apt) => ({
          id: apt.id,
          propertyName: apt.propertyName,
          url: apt.url,
          fullAddress: apt.location.fullAddress,
          state: apt.location.state,
          city: apt.location.city,
          neighborhood: apt.location.neighborhood,
          postalCode: apt.location.postalCode,
          streetAddress: apt.location.streetAddress,
          latitude: apt.coordinates.latitude,
          longitude: apt.coordinates.longitude,
          rentMin: apt.rent.min || null,
          rentMax: apt.rent.max || null,
          beds: apt.beds || null,
          baths: apt.baths || null,
          sqft: apt.sqft || null,
          models: apt.models || undefined,
          transitAndPOI: apt.transitAndPOI || undefined,
          scores: apt.scores || undefined,
          amenities: apt.amenities || undefined,
          fees: apt.fees || undefined,
          schools: apt.schools || undefined,
          contact: apt.contact || undefined,
          photos: apt.photos || undefined,
          description: apt.description || null,
          neighborhoodDescription: apt.neighborhoodDescription || null,
          isVerified: apt.isVerified || false,
          scrapedAt: new Date(apt.scrapedAt)
        }))
      })

      imported += batch.length
      console.log(`Imported ${imported}/${apartments.length} apartments`)
    }

    console.log("✅ Import complete!")

    // Verify import
    const count = await prisma.apartment.count()
    const studiosCount = await prisma.apartment.count({
      where: {
        beds: {
          contains: "studio",
          mode: "insensitive"
        }
      }
    })

    console.log(`\nTotal apartments in database: ${count}`)
    console.log(`Studio apartments: ${studiosCount}`)

  } catch (error) {
    console.error("❌ Error importing apartments:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

importApartments()
