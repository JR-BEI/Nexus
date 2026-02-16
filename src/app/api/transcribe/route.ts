import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@deepgram/sdk'

const deepgram = createClient(process.env.DEEPGRAM_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    // Get audio file from form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as Blob

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Convert Blob to Buffer
    const buffer = Buffer.from(await audioFile.arrayBuffer())

    // Transcribe with Deepgram
    const { result } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        model: 'nova-2',
        smart_format: true,
        punctuate: true,
        paragraphs: true
      }
    )

    // Extract transcript
    const transcript = result.results?.channels[0]?.alternatives[0]?.transcript

    if (!transcript) {
      return NextResponse.json(
        { error: 'No transcript generated' },
        { status: 500 }
      )
    }

    return NextResponse.json({ transcript })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    )
  }
}
