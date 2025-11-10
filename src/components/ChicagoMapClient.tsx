"use client"

import dynamic from "next/dynamic"

const ChicagoMap = dynamic(() => import("./ChicagoMap"), { ssr: false })

export default function ChicagoMapClient() {
  return <ChicagoMap />
}
