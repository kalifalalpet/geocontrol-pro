import jsPDF from 'jspdf'
import 'jspdf-autotable'
import JSZip from 'jszip'
import { SitePoint } from '../data/sampleData'

// Helper to download a blob
const downloadBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ═══ 1. CSV EXPORT ═══
export const exportToCSV = (points: SitePoint[]) => {
  const headers = ['ID', 'Type', 'Section', 'Easting', 'Northing', 'Latitude', 'Longitude', 'Elevation', 'Target Depth', 'Status', 'Survey Status']
  const rows = points.map(p => [
    p.id,
    p.type,
    p.section,
    p.easting?.toFixed(4) || '',
    p.northing?.toFixed(4) || '',
    p.lat.toFixed(7),
    p.lng.toFixed(7),
    p.elevation?.toFixed(2) || '0.00',
    p.targetDepth,
    p.status,
    p.surveyStatus
  ])

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `GeoPortal_Survey_Data_${new Date().toISOString().split('T')[0]}.csv`)
}

// ═══ 2. PDF EXPORT ═══
export const exportToPDF = (points: SitePoint[]) => {
  const doc = new jsPDF('l', 'mm', 'a4')
  
  // Header
  doc.setFontSize(18)
  doc.setTextColor(19, 27, 46)
  doc.text('ACTS GEOPORTAL - SURVEY DATA REPORT', 14, 20)
  
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text(`Project: Qiddiya Coastal Development`, 14, 28)
  doc.text(`Export Date: ${new Date().toLocaleString()}`, 14, 33)
  doc.text(`Total Records: ${points.length}`, 14, 38)
  
  // Table
  const tableData = points.map(p => [
    p.id,
    p.type,
    `Sec ${p.section}`,
    p.easting?.toFixed(2) || '-',
    p.northing?.toFixed(2) || '-',
    `${p.targetDepth}m`,
    p.status.toUpperCase(),
    p.surveyStatus.toUpperCase()
  ])

  ;(doc as any).autoTable({
    startY: 45,
    head: [['Point ID', 'Type', 'Section', 'Easting', 'Northing', 'Depth', 'Status', 'Survey']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [100, 161, 238], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8, cellPadding: 2 },
  })

  doc.save(`GeoPortal_Report_${new Date().toISOString().split('T')[0]}.pdf`)
}

// ═══ 3. DXF EXPORT (ASCII) ═══
export const exportToDXF = (points: SitePoint[]) => {
  let dxf = "0\nSECTION\n2\nENTITIES\n"

  points.forEach(p => {
    const x = p.easting || 0
    const y = p.northing || 0
    const z = p.elevation || 0
    const layer = p.type // BH, CPT, PLT

    // POINT
    dxf += `0\nPOINT\n8\n${layer}\n10\n${x}\n20\n${y}\n30\n${z}\n`
    
    // TEXT (Label)
    dxf += `0\nTEXT\n8\n${layer}_LABELS\n10\n${x + 0.5}\n20\n${y + 0.5}\n30\n${z}\n40\n0.8\n1\n${p.id}\n`
  })

  dxf += "0\nENDSEC\n0\nEOF\n"
  const blob = new Blob([dxf], { type: 'application/dxf' })
  downloadBlob(blob, `GeoPortal_Survey_${new Date().toISOString().split('T')[0]}.dxf`)
}

// ═══ 4. KMZ EXPORT (KML + ZIP) ═══
export const exportToKMZ = async (points: SitePoint[], activePolygons?: Record<string, any>) => {
  const zip = new JSZip()
  
  let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>ACTS GeoPortal Export</name>
    <Style id="bh_style">
      <IconStyle><color>ffbec6e0</color><scale>1.1</scale><Icon><href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href></Icon></IconStyle>
    </Style>
    <Style id="cpt_style">
      <IconStyle><color>ff5fb9ff</color><scale>1.1</scale><Icon><href>http://maps.google.com/mapfiles/kml/shapes/placemark_square.png</href></Icon></IconStyle>
    </Style>
    <Style id="plt_style">
      <IconStyle><color>ffa3de4e</color><scale>1.1</scale><Icon><href>http://maps.google.com/mapfiles/kml/shapes/polygon.png</href></Icon></IconStyle>
    </Style>
    <Style id="poly_style">
      <PolyStyle><color>405fb9ff</color><fill>1</fill><outline>1</outline></PolyStyle>
      <LineStyle><color>ff5fb9ff</color><width>2</width></LineStyle>
    </Style>
`

    // Points
    points.forEach(p => {
      const style = p.type === 'BH' ? '#bh_style' : p.type === 'CPT' ? '#cpt_style' : '#plt_style'
      kml += `    <Placemark>
      <name>${p.id}</name>
      <description>Type: ${p.type} | Section: ${p.section} | Depth: ${p.targetDepth}m</description>
      <styleUrl>${style}</styleUrl>
      <Point><coordinates>${p.lng},${p.lat},${p.elevation || 0}</coordinates></Point>
    </Placemark>\n`
    })

    // Polygons
    if (activePolygons) {
      Object.entries(activePolygons).forEach(([id, geojson]) => {
        if (geojson && geojson.features && geojson.features[0]) {
          const coords = geojson.features[0].geometry.coordinates[0]
            .map((c: [number, number]) => `${c[0]},${c[1]},0`)
            .join(' ')
          
          kml += `    <Placemark>
      <name>Section ${id}</name>
      <styleUrl>#poly_style</styleUrl>
      <Polygon>
        <outerBoundaryIs><LinearRing><coordinates>${coords}</coordinates></LinearRing></outerBoundaryIs>
      </Polygon>
    </Placemark>\n`
        }
      })
    }

  kml += `  </Document>
</kml>`

  zip.file("doc.kml", kml)
  const content = await zip.generateAsync({ type: "blob" })
  downloadBlob(content, `GeoPortal_Survey_${new Date().toISOString().split('T')[0]}.kmz`)
}
