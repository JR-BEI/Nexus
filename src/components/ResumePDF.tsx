import {
  Document,
  Page,
  Text,
  View,
  StyleSheet
} from '@react-pdf/renderer'
import type { Meta, MatchedBlock, Repository } from '@/types'
import type { ParsedResume } from '@/lib/parseResume'

interface ResumePDFProps {
  meta: Meta
  parsedResume: ParsedResume
  matchedBlocks: MatchedBlock[]
  repository: Repository
}

const styles = StyleSheet.create({
  page: {
    padding: '0.85in',
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: '#333333'
  },
  // HEADER STYLES
  header: {
    marginBottom: 2,
    paddingBottom: 6
  },
  name: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 17,
    marginBottom: 2,
    color: '#000000'
  },
  contactLine: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#666666',
    marginTop: 0,
    marginBottom: 0
  },
  headerRule: {
    borderBottom: '0.5pt solid #CCCCCC',
    marginTop: 0,
    marginBottom: 10
  },
  // SECTION HEADER STYLES
  sectionHeader: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#000000',
    marginTop: 16,
    marginBottom: 8
  },
  // SUMMARY STYLES
  summaryText: {
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: '#333333',
    lineHeight: 1.4,
    marginBottom: 4
  },
  // POSITION STYLES
  positionBlock: {
    marginBottom: 14
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 1
  },
  companyName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10.5,
    color: '#000000'
  },
  dates: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#666666'
  },
  positionTitle: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333333',
    marginBottom: 6
  },
  // BULLET STYLES
  bulletContainer: {
    marginLeft: 12,
    marginTop: 0
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 3.5
  },
  bulletPoint: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#333333',
    width: 6,
    marginRight: 6
  },
  bulletText: {
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: '#333333',
    flex: 1,
    lineHeight: 1.35
  },
  // EDUCATION STYLES
  educationBlock: {
    marginBottom: 8
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 1
  },
  educationDegree: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#000000'
  },
  educationYear: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#666666'
  },
  educationSchool: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#666666'
  }
})

export default function ResumePDF({
  meta,
  parsedResume,
  matchedBlocks,
  repository
}: ResumePDFProps) {
  // Build complete list of positions from matched blocks
  // Group matched blocks by position
  const positionMap = new Map<string, {
    id: string
    title: string
    company: string
    dates: string
    bullets: string[]
  }>()

  matchedBlocks.forEach((block) => {
    const position = repository.positions.find((p) => p.id === block.position_id)
    if (!position) return

    // Format dates (use regular hyphen, not en-dash)
    const startDate = formatDate(position.start_date)
    const endDate = position.end_date ? formatDate(position.end_date) : 'Present'
    const dates = `${startDate} - ${endDate}`

    if (!positionMap.has(block.position_id)) {
      positionMap.set(block.position_id, {
        id: block.position_id,
        title: block.position_title,
        company: position.company,
        dates,
        bullets: []
      })
    }

    // Add the statement to this position's bullets (filter out en/em-dashes)
    const pos = positionMap.get(block.position_id)!
    const cleanStatement = block.statement_text
      .replace(/—/g, '-')  // Replace em-dashes with regular hyphens
      .replace(/–/g, '-')  // Replace en-dashes with regular hyphens
    if (!pos.bullets.includes(cleanStatement)) {
      pos.bullets.push(cleanStatement)
    }
  })

  // Convert map to array and sort by date (most recent first)
  const enrichedPositions = Array.from(positionMap.values()).sort((a, b) => {
    const posA = repository.positions.find(p => p.id === a.id)
    const posB = repository.positions.find(p => p.id === b.id)
    if (!posA || !posB) return 0

    // Compare start dates, most recent first
    return posB.start_date.localeCompare(posA.start_date)
  })

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.name}>{meta.name}</Text>
          <Text style={styles.contactLine}>
            {meta.location} | {meta.email} | {meta.phone} | {meta.linkedin}
          </Text>
        </View>
        <View style={styles.headerRule} />

        {/* PROFESSIONAL SUMMARY */}
        {parsedResume.summary && (
          <View>
            <Text style={styles.sectionHeader}>PROFESSIONAL SUMMARY</Text>
            <Text style={styles.summaryText}>{parsedResume.summary}</Text>
          </View>
        )}

        {/* EXPERIENCE SECTION */}
        <View>
          <Text style={styles.sectionHeader}>EXPERIENCE</Text>
          {enrichedPositions.map((position, index) => (
            <View key={index} style={styles.positionBlock}>
              {/* Company name and dates on same line */}
              <View style={styles.positionHeader} wrap={false}>
                <Text style={styles.companyName}>{position.company}</Text>
                <Text style={styles.dates}>{position.dates}</Text>
              </View>
              {/* Job title below */}
              <Text style={styles.positionTitle}>{position.title}</Text>
              {/* Bullets */}
              <View style={styles.bulletContainer}>
                {position.bullets.map((bullet, bulletIndex) => (
                  <View key={bulletIndex} style={styles.bullet}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* EDUCATION SECTION */}
        <View>
          <Text style={styles.sectionHeader}>EDUCATION</Text>
          {meta.education.map((edu, index) => (
            <View key={index} style={styles.educationBlock}>
              <View style={styles.educationHeader}>
                <Text style={styles.educationDegree}>{edu.degree}</Text>
                <Text style={styles.educationYear}>{edu.year}</Text>
              </View>
              <Text style={styles.educationSchool}>{edu.school}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}

// Helper to format YYYY-MM to "Month YYYY"
function formatDate(dateString: string): string {
  const [year, month] = dateString.split('-')
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const monthIndex = parseInt(month, 10) - 1
  return `${monthNames[monthIndex]} ${year}`
}
