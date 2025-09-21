
'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { AnalysisResult } from '@/types';


// --- Zod schema and toDataURI function ---
const formSchema = z.object({
  text: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  image: z.any().optional(),
});

function toDataURI(buffer: ArrayBuffer, mimeType: string): string {
  const b64 = Buffer.from(buffer).toString('base64');
  return `data:${mimeType};base64,${b64}`;
}
// ---

export async function handleTextAnalysis(
  prevState: any,
  formData: FormData
): Promise<{ result: AnalysisResult | null; error: string | null }> {
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);

  // --- 1. Form validation and input preparation ---
  const rawFormData = {
    text: formData.get('text'),
    url: formData.get('url'),
    image: formData.get('image'),
  };

  const validatedFields = formSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      result: null,
      error: validatedFields.error.errors.map((e) => e.message).join(', '),
    };
  }
  
  const { text, url, image } = validatedFields.data;
  
  const claimToTest = [text, url].filter(Boolean).join(' ');

  if (!claimToTest && (!image || image.size === 0)) {
    return {
      result: null,
      error: 'Please provide text, a URL, or an image to analyze.',
    };
  }


  // --- 2. Get API Configuration from Environment Variables ---
  const baseUrl = process.env.EXTERNAL_ANALYSIS_API_URL;
  const appName = process.env.MISINFORMATION_APP_NAME;
  
  if (!baseUrl || !appName) {
    console.error('API URL or App Name environment variables are not set.');
    return {
      result: null,
      error: 'The analysis service is not configured correctly. Please contact support.',
    };
  }
  
  const userId = "user"; 
  let sessionId: string | null = null;

  try {
    // --- STEP 1: Create a new session ---
    console.log("▶️  Step 1: Creating a new session...");
    const createSessionUrl = `${baseUrl}/apps/${appName}/users/${userId}/sessions`;
    
    const sessionResponse = await fetch(createSessionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Empty payload
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      throw new Error(`Failed to create session. Status: ${sessionResponse.status}, Details: ${errorText}`);
    }

    const sessionData = await sessionResponse.json();
    sessionId = sessionData.id;
    console.log(`✅ Session created successfully! ID: ${sessionId}`);

    // --- STEP 2: Send message and process the SSE stream ---
    if (!sessionId) {
      throw new Error('Session ID is null after creation.');
    }

    console.log("\n▶️  Step 2: Sending claim and waiting for final report...");
    const runSseUrl = `${baseUrl}/run_sse`;
    
    const payload: { text: string; image: string } = {
        text: claimToTest,
        image: ''
    };

    if (image && image.size > 0) {
      const arrayBuffer = await image.arrayBuffer();
      payload.image = toDataURI(arrayBuffer, image.type);
    }
    
    const messagePayload = {
      appName: appName,
      userId: userId,
      sessionId: sessionId,
      newMessage: {
        role: "user",
        parts: [{ "text": JSON.stringify(payload) }]
      }
    };

    const sseResponse = await fetch(runSseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messagePayload),
    });

    if (!sseResponse.ok || !sseResponse.body) {
      const errorText = await sseResponse.text();
      throw new Error(`API request failed with status ${sseResponse.status}, Details: ${errorText}`);
    }

    let finalReportObject: AnalysisResult | null = null;

    const reader = sseResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; 

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const eventJson = line.substring('data: '.length);
                    if (eventJson.trim()) {
                        const event = JSON.parse(eventJson);

                        if (event.author === "report_generator_agent") {
                            const reportString = event.content?.parts?.[0]?.text;
                            if (reportString) {
                                finalReportObject = JSON.parse(reportString);
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Could not parse SSE event line:', line, e);
                }
            }
        }
    }

    console.log("\n✅ Stream finished. Final Report found.");

    if (!finalReportObject) {
      throw new Error("Could not find the final report from 'report_generator_agent' in the response stream.");
    }

    // --- 3. Save the result to Supabase ---
    const { data: { user } } = await supabase.auth.getUser();

    const { error: dbError } = await supabase.from('analyses').insert([{
      user_id: user?.id,
      text_input: text,
      url_input: url,
      summary: finalReportObject.overall_summary,
      analysis_details: finalReportObject as any, 
      sources: finalReportObject.analyzed_claims.flatMap(claim => claim.fact_checking_results.map(res => res.url))
    }]);

    if (dbError) {
      console.error('Error saving to Supabase:', dbError);
    }
    
    return { result: finalReportObject, error: null };

  } catch (e: any) {
    console.error(e);
    return {
      result: null,
      error: e.message || 'An unexpected error occurred during analysis.',
    };
  }
}
