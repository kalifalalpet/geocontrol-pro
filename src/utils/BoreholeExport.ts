import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { BoreholeLog } from '../types/enterprise'

export class BoreholeExport {
  /**
   * Export borehole data to a standardized multi-sheet Excel workbook.
   */
  static exportToExcel(log: BoreholeLog) {
    const wb = XLSX.utils.book_new()

    // 1. PROJECT SHEET (Metadata)
    const projData = [
      ['SECTION', 'VALUE'],
      ['PROJECT ID', log.projectId || 'Unknown'],
      ['PROJECT NAME', log.projectName || '—'],
      ['CLIENT', log.projectClient || '—'],
      ['LOCATION', log.projectLocation || '—'],
      ['BOREHOLE ID', log.boreholeId],
      ['TOTAL DEPTH (m)', log.totalDepth],
      ['EASTING', log.location.easting],
      ['NORTHING', log.location.northing],
      ['ELEVATION (GL)', log.location.elevation],
      ['DRILLED DATE', log.drilledDate || '—'],
      ['METHODS', log.method || '—']
    ]
    const projWS = XLSX.utils.aoa_to_sheet(projData)
    XLSX.utils.book_append_sheet(wb, projWS, 'PROJ')

    // 2. GEOL SHEET (Lithology)
    const geolHeader = ['DEPTH TOP (m)', 'DEPTH BASE (m)', 'USCS', 'DESCRIPTION', 'FORMATION']
    const geolData = log.lithology.map(g => [
      g.top, g.base, g.uscs, g.description, g.formation || ''
    ])
    const geolWS = XLSX.utils.aoa_to_sheet([geolHeader, ...geolData])
    XLSX.utils.book_append_sheet(wb, geolWS, 'GEOL')

    // 3. ISPT SHEET (SPT Data)
    const isptHeader = ['DEPTH (m)', 'N-VALUE', 'INC 1', 'INC 2', 'INC 3', 'INC 4', 'INC 5', 'INC 6', 'PENETRATION (mm)', 'REPORT']
    const isptData = log.sptResults.map(s => [
      s.depth, s.nValue, ...s.increments, s.penetration, s.report
    ])
    const isptWS = XLSX.utils.aoa_to_sheet([isptHeader, ...isptData])
    XLSX.utils.book_append_sheet(wb, isptWS, 'ISPT')

    // Download
    XLSX.writeFile(wb, `${log.boreholeId}_standard_export.xlsx`)
  }

  /**
   * Export visual report to professional PDF.
   */
  static async exportToPDF(log: BoreholeLog, canvases: { spt: HTMLCanvasElement | null, inc: HTMLCanvasElement | null }) {
    console.log('[BoreholeExport] Starting capture for:', log.boreholeId)
    
    // Small delay to ensure the canvas is painted after possible tab switch or data update
    await new Promise(resolve => setTimeout(resolve, 300))

    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 15

    // --- Header ---
    doc.setFillColor(30, 41, 59)
    doc.rect(0, 0, pageWidth, 40, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22); doc.setFont('helvetica', 'bold'); doc.text('BOREHOLE LOG REPORT', margin, 18)
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text(`Project: ${log.projectId}`, margin, 28)
    
    // --- Page 1: Metadata ---
    doc.setTextColor(30, 41, 59); doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text(`BOREHOLE: ${log.boreholeId}`, margin, 52)
    
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    const metaY = 62
    doc.text(`Easting: ${log.location.easting.toFixed(2)}`, margin, metaY)
    doc.text(`Northing: ${log.location.northing.toFixed(2)}`, margin + 60, metaY)
    doc.text(`Elevation: ${log.location.elevation.toFixed(3)} m`, margin + 120, metaY)
    doc.text(`Depth: ${log.totalDepth} m`, margin, metaY + 8)
    doc.text(`Method: ${log.method}`, margin + 60, metaY + 8)

    // Lithology Table
    autoTable(doc, {
      startY: 75,
      head: [['Top (m)', 'Base (m)', 'USCS', 'Description']],
      body: log.lithology.map(g => [g.top.toFixed(2), g.base.toFixed(2), g.uscs, g.description]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
      margin: { left: margin, right: margin }
    })

    // --- Page 2: Charts ---
    doc.addPage()
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('SUBSURFACE PROFILES', margin, 20)

    if (canvases.spt) {
      try {
        doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text('SPT N-Value Profile Analysis', margin, 32)
        const sptImg = canvases.spt.toDataURL('image/png')
        doc.addImage(sptImg, 'PNG', margin, 36, 180, 100)
      } catch (err) {
        console.error('SPT Capture Error:', err)
        doc.text('[Chart capture error - check console]', margin, 50)
      }
    }

    if (canvases.inc) {
      try {
        doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text('75mm Drive Blow Count Increments', margin, 145)
        const incImg = canvases.inc.toDataURL('image/png')
        doc.addImage(incImg, 'PNG', margin, 150, 180, 80)
      } catch (err) {
        console.error('Inc Capture Error:', err)
        doc.text('[Chart capture error - check console]', margin, 160)
      }
    }

    // Numbering
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8); doc.setTextColor(150); doc.text(`GeoControl Pro · Page ${i} of ${totalPages}`, pageWidth/2, 285, { align: 'center' })
    }

    const safeName = (log.boreholeId || 'BH').replace(/[^a-z0-9_-]/gi, '_')
    doc.save(`${safeName}_Standard_Log.pdf`)
    console.log('[BoreholeExport] PDF Export Complete.')
  }
}
