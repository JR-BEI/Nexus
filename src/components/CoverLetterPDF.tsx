import {
  Document,
  Page,
  Text,
  View,
  StyleSheet
} from '@react-pdf/renderer'
import type { Meta } from '@/types'

interface CoverLetterPDFProps {
  meta: Meta
  coverLetterText: string
  companyName?: string
}

const styles = StyleSheet.create({
  page: {
    padding: '1in',
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    color: '#333333'
  },
  // HEADER STYLES
  header: {
    marginBottom: 0
  },
  name: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    color: '#000000',
    marginBottom: 2
  },
  contactLine: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#666666',
    marginBottom: 0
  },
  headerRule: {
    borderBottom: '0.5pt solid #CCCCCC',
    marginTop: 0,
    marginBottom: 10
  },
  // DATE STYLES
  date: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333333',
    marginBottom: 12
  },
  // GREETING STYLES
  greeting: {
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    color: '#333333',
    marginBottom: 12
  },
  // BODY STYLES
  paragraph: {
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    color: '#333333',
    lineHeight: 1.5,
    marginBottom: 10,
    textAlign: 'justify'
  },
  // CLOSING STYLES
  closing: {
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    color: '#333333',
    marginTop: 12,
    marginBottom: 16
  },
  signature: {
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    color: '#333333'
  }
})

export default function CoverLetterPDF({
  meta,
  coverLetterText,
  companyName
}: CoverLetterPDFProps) {
  // Format current date
  const today = new Date()
  const dateString = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Parse cover letter into paragraphs, stripping markdown
  const paragraphs = parseCoverLetter(coverLetterText)

  // Generate greeting
  const greeting = companyName
    ? `Dear ${companyName} Hiring Team,`
    : 'Dear Hiring Manager,'

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

        {/* DATE */}
        <Text style={styles.date}>{dateString}</Text>

        {/* GREETING */}
        <Text style={styles.greeting}>{greeting}</Text>

        {/* BODY PARAGRAPHS */}
        {paragraphs.map((paragraph, index) => (
          <Text key={index} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}

        {/* CLOSING */}
        <Text style={styles.closing}>Sincerely,</Text>
        <Text style={styles.signature}>{meta.name}</Text>
      </Page>
    </Document>
  )
}

// Helper to parse cover letter markdown into clean paragraphs
function parseCoverLetter(markdown: string): string[] {
  // Split by double newlines to get paragraphs
  const paragraphs = markdown
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  // Clean each paragraph
  return paragraphs.map((paragraph) => {
    // Remove markdown headers (## or ###)
    let cleaned = paragraph.replace(/^#+\s+/gm, '')

    // Remove bold/italic markers (**text** or *text*)
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1')
    cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1')

    // Remove bullet points and list markers
    cleaned = cleaned.replace(/^[-*]\s+/gm, '')

    // Replace newlines within paragraph with spaces
    cleaned = cleaned.replace(/\n/g, ' ')

    // Replace em dashes with commas or periods
    cleaned = cleaned.replace(/\s*—\s*/g, ', ')

    // Clean up extra spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim()

    return cleaned
  })
}
