import { BoreholeLog, LithologyLayer, SPTDataPoint } from '../types/enterprise'

/**
 * Robust AGS 4.x Parser
 * Handles REAL AGS format:
 *   **GROUP_NAME   → group header
 *   *COL1,*COL2    → column headings  
 *   <UNITS>,m,mm   → units row (skipped)
 *   "BH-ID","val"  → data rows
 *   <CONT>         → continuation of previous data row
 *
 * Also accepts standard AGS with GROUP/HEADING/DATA prefixes as fallback.
 */
export class AGSParser {
  static parse(content: string): Partial<BoreholeLog>[] {
    // 0. Initial cleanup (remove BOM if present, trim)
    const cleanContent = content.replace(/^\uFEFF/, '').trim()
    const lines = cleanContent.split(/\r?\n/).filter(l => l.trim().length > 0)
    
    const groups: Record<string, { headers: string[]; rows: Record<string, string>[] }> = {}

    let currentGroup = ''
    let currentHeaders: string[] = []

    for (let li = 0; li < lines.length; li++) {
      const raw = lines[li].trim()
      const parts = this.splitCSV(raw)
      if (parts.length === 0) continue

      // Clean the first part to detect meta-tags (strip quotes and trim)
      const firstPart = parts[0].trim().replace(/^"|"$/g, '')

      // ── Group Detection (e.g., "**LOCA" or "GROUP","LOCA") ──
      if (firstPart.startsWith('**')) {
        currentGroup = firstPart.replace(/^\*\*/, '').trim().toUpperCase()
        groups[currentGroup] = { headers: [], rows: [] }
        currentHeaders = []
        continue
      }
      
      if (firstPart.toUpperCase() === 'GROUP') {
        currentGroup = (parts[1] || '').trim().replace(/^"|"$/g, '').toUpperCase()
        if (currentGroup) {
          groups[currentGroup] = { headers: [], rows: [] }
          currentHeaders = []
        }
        continue
      }

      // ── Header Detection (e.g., "*LOCA_ID" or "HEADING","LOCA_ID") ──
      if (firstPart.startsWith('*') || firstPart.toUpperCase() === 'HEADING') {
        const isMetaHeading = firstPart.toUpperCase() === 'HEADING'
        const newHeaders = parts
          .map(h => h.trim().replace(/^"|"$/g, '').replace(/^\*/, '').toUpperCase())
          .filter(h => h !== 'HEADING' && h.length > 0)
        
        if (currentGroup && groups[currentGroup]) {
          // Append if headers span multiple lines
          if (groups[currentGroup].headers.length > 0) {
            currentHeaders = [...groups[currentGroup].headers, ...newHeaders]
          } else {
            currentHeaders = newHeaders
          }
          groups[currentGroup].headers = currentHeaders
        } else {
          currentHeaders = newHeaders
        }
        continue
      }

      // ── Units row skip (e.g., "<UNITS>" or "UNIT") ──
      if (firstPart === '<UNITS>' || firstPart.toUpperCase() === 'UNIT') {
        continue
      }

      // ── TYPE row skip ──
      if (firstPart.toUpperCase() === 'TYPE') continue

      // ── Continuation row handling (<CONT>) ──
      if (raw.includes('<CONT>')) {
        if (currentGroup && groups[currentGroup]?.rows.length > 0) {
          const prevRow = groups[currentGroup].rows[groups[currentGroup].rows.length - 1]
          parts.forEach((val, idx) => {
            const cleanVal = val.trim().replace(/^"|"$/g, '')
            if (cleanVal && cleanVal !== '<CONT>' && currentHeaders[idx]) {
              const key = currentHeaders[idx]
              if (prevRow[key]) {
                prevRow[key] += cleanVal
              } else {
                prevRow[key] = cleanVal
              }
            }
          })
        }
        continue
      }

      // ── Data row (everything else inside a group) ──
      if (currentGroup && currentHeaders.length > 0) {
        // Standard data format or starts with DATA prefix
        const startIdx = firstPart.toUpperCase() === 'DATA' ? 1 : 0
        const dataRow: Record<string, string> = {}
        
        parts.slice(startIdx).forEach((val, idx) => {
          const key = currentHeaders[idx]
          if (key) {
            dataRow[key] = val.trim().replace(/^"|"$/g, '')
          }
        })

        if (Object.keys(dataRow).length > 0) {
          groups[currentGroup].rows.push(dataRow)
        }
      }
    }

    // ── Build BoreholeLog objects from extracted groups ──
    return this.buildLogs(groups)
  }

  private static splitCSV(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
        current += ch // Keep quotes for the detection logic above to strip
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    result.push(current.trim())
    return result
  }

  private static buildLogs(
    groups: Record<string, { headers: string[]; rows: Record<string, string>[] }>
  ): Partial<BoreholeLog>[] {
    const logs: Partial<BoreholeLog>[] = []

    const projRows = groups['PROJ']?.rows || [{}]
    const locaRows = groups['LOCA']?.rows || []
    const geolRows = groups['GEOL']?.rows || []
    const isptRows = groups['ISPT']?.rows || []
    const detlRows = groups['DETL']?.rows || []
    const sampRows = groups['SAMP']?.rows || []

    // Extract project-level metadata
    const proj = projRows[0] || {}
    const projectName = proj['PROJ_NAME'] || proj['PROJ_ID'] || ''
    const projectLocation = proj['PROJ_LOC'] || ''
    const projectClient = proj['PROJ_CLNT'] || ''

    for (const loc of locaRows) {
      const boreholeId = loc['LOCA_ID'] || ''
      if (!boreholeId) continue

      // ── Lithology ──
      const lithology: LithologyLayer[] = geolRows
        .filter(g => g['LOCA_ID'] === boreholeId)
        .map(g => ({
          top: parseFloat(g['GEOL_TOP'] || '0'),
          base: parseFloat(g['GEOL_BASE'] || '0'),
          description: g['GEOL_DESC'] || '',
          uscs: this.legendToUSCS(g['GEOL_LEG'] || ''),
          geolCode: g['GEOL_GEOL'] || '',
          color: this.getColorForLegend(g['GEOL_LEG'] || ''),
          formation: g['GEOL_FORM'] || g['GEOL_STAT'] || ''
        }))

      // ── SPT Results ──
      const sptResults: SPTDataPoint[] = isptRows
        .filter(s => s['LOCA_ID'] === boreholeId)
        .map(s => {
          const rawN = (s['ISPT_NVAL'] || '0').trim()
          const nValue: number | string = rawN.startsWith('>') || rawN.startsWith('R')
            ? rawN
            : parseInt(rawN) || 0

          return {
            depth: parseFloat(s['ISPT_TOP'] || '0'),
            nValue,
            report: s['ISPT_REP'] || '',
            increments: [
              parseInt(s['ISPT_INC1'] || '0'),
              parseInt(s['ISPT_INC2'] || '0'),
              parseInt(s['ISPT_INC3'] || '0'),
              parseInt(s['ISPT_INC4'] || '0'),
              parseInt(s['ISPT_INC5'] || '0'),
              parseInt(s['ISPT_INC6'] || '0')
            ],
            penetration: parseInt(s['ISPT_NPEN'] || '450')
          }
        })

      // ── Determine total depth ──
      const locaDepth = parseFloat(loc['LOCA_FDEP'] || '0')
      const maxGeolBase = lithology.length > 0 ? Math.max(...lithology.map(l => l.base)) : 0
      const totalDepth = locaDepth || maxGeolBase || 0

      // ── Determine drilling method ──
      const method = loc['LOCA_TYPE'] || ''
      const drilledDate = loc['LOCA_STAR'] || ''

      logs.push({
        boreholeId,
        projectId: proj['PROJ_ID'] || 'unknown',
        location: {
          easting: parseFloat(loc['LOCA_NATE'] || loc['LOCA_X'] || loc['LOCA_LOCX'] || '0'),
          northing: parseFloat(loc['LOCA_NATN'] || loc['LOCA_Y'] || loc['LOCA_LOCY'] || '0'),
          elevation: parseFloat(loc['LOCA_GL'] || loc['LOCA_Z'] || loc['LOCA_LOCZ'] || '0')
        },
        totalDepth,
        drilledDate,
        method,
        lithology,
        sptResults,
        // Extra metadata for display
        projectName,
        projectLocation,
        projectClient
      })
    }

    return logs
  }

  /** Map AGS legend codes (e.g. "412", "403") to USCS classifications */
  private static legendToUSCS(legend: string): string {
    const map: Record<string, string> = {
      '412': 'SM', '403': 'SP-SM', '401': 'SP', '411': 'SM',
      '501': 'CL', '502': 'CH', '301': 'GP', '302': 'GW',
      '601': 'ML', '602': 'MH'
    }
    // If already a USCS code, return as-is
    if (['SM', 'SP-SM', 'SP', 'CL', 'CH', 'ML', 'MH', 'GP', 'GW', 'SC', 'SW'].includes(legend.toUpperCase())) {
      return legend.toUpperCase()
    }
    return map[legend] || legend
  }

  /** Map AGS legend codes to colors */
  private static getColorForLegend(legend: string): string {
    const uscs = this.legendToUSCS(legend)
    const colorMap: Record<string, string> = {
      'SM': '#c9a958', 'SP-SM': '#b09060', 'SP': '#d4a93a',
      'CL': '#7a8b99', 'CH': '#4a5568', 'ML': '#a0aec0',
      'MH': '#718096', 'GP': '#ecc94b', 'GW': '#f6e05e',
      'SC': '#a07848', 'SW': '#c8b060'
    }
    return colorMap[uscs] || '#26304a'
  }
}
