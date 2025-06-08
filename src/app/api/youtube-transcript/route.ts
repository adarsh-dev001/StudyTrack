
import { YoutubeTranscript } from 'youtube-transcript';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const videoUrl = body.videoUrl;

    if (!videoUrl || typeof videoUrl !== 'string') {
      return NextResponse.json({ error: 'Invalid videoUrl provided. Please enter a valid YouTube video URL.' }, { status: 400 });
    }

    // Basic check for common YouTube URL patterns
    if (!videoUrl.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/)) {
        return NextResponse.json({ error: 'Invalid YouTube URL format.' }, { status: 400 });
    }
    
    const transcriptEntries = await YoutubeTranscript.fetchTranscript(videoUrl);
    
    if (!transcriptEntries || transcriptEntries.length === 0) {
      return NextResponse.json({ error: 'No transcript found for this video. This might be because transcripts are disabled, the video is private/unavailable, or it is a live stream without saved captions.' }, { status: 404 });
    }

    const transcriptText = transcriptEntries.map(entry => entry.text).join(' ');
    return NextResponse.json({ transcript: transcriptText });

  } catch (error: any) {
    console.error('API Error fetching transcript:', error);
    let errorMessage = 'An unexpected error occurred while fetching the transcript. Please try again or paste the transcript manually.';
    let statusCode = 500;

    if (error.message) {
        const lowerErrorMessage = error.message.toLowerCase();
        if (lowerErrorMessage.includes('no transcript found') || 
            lowerErrorMessage.includes('transcriptsdisabled') ||
            lowerErrorMessage.includes('does not have a transcript') ||
            lowerErrorMessage.includes('no transcripts are available for this video') ) {
          errorMessage = 'No transcript found. Transcripts might be disabled for this video, or it could be private/unavailable.';
          statusCode = 404;
        } else if (lowerErrorMessage.includes('invalid url') || lowerErrorMessage.includes('invalid video id')) {
            errorMessage = 'The YouTube URL or Video ID provided is invalid. Please check the URL and try again.';
            statusCode = 400;
        } else if (lowerErrorMessage.includes('failed to fetch') || lowerErrorMessage.includes('network error')) {
            errorMessage = 'Could not connect to YouTube to fetch the transcript. Please check your internet connection or the video URL.';
            statusCode = 503; // Service Unavailable or Bad Gateway type error
        }
        // If none of the specific messages match, we use the generic one defined initially.
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
