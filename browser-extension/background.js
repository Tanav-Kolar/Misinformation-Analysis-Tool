import { BASE_URL, APP_NAME, USER_ID } from './config.js';

/**
 * This function runs when the extension is first installed or updated.
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyzeSelection",
    title: "Analyze selection for misinformation",
    contexts: ["page", "selection", "image", "video"]
  });
});

/**
 * This listener waits for a user to click on our context menu item.
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "analyzeSelection") {
    chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["display.css"] });
    chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["display.js"] });
    chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["selection.js"] });
  }
});

/**
 * This listener waits for a message from the selection.js script.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'capture') {
    startAnalysisProcess(request.area, sender.tab);
  }
  return true; // Indicate async response
});


/**
 * **MODIFIED FUNCTION**
 * Handles the live multi-step process, now with a payload structure that matches your actions.ts file.
 * @param {object} area - The {x, y, width, height} of the selected area.
 * @param {object} tab - The tab object where the capture was initiated.
 */
async function startAnalysisProcess(area, tab) {
  try {
    // Immediately show the loading state on the page
    chrome.tabs.sendMessage(tab.id, { type: 'showLoading' });

    // --- STEP 0: Capture and crop the screenshot ---
    const croppedDataUrl = await cropImage(
      await chrome.tabs.captureVisibleTab(null, { format: 'png' }),
      area
    );
    
    // --- STEP 1: Create a new session ---
    console.log("▶️  Step 1: Creating a new session...");
    const createSessionUrl = `${BASE_URL}/apps/${APP_NAME}/users/${USER_ID}/sessions`;
    
    const sessionResponse = await fetch(createSessionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (!sessionResponse.ok) {
      throw new Error(`Failed to create session. Status: ${sessionResponse.status}`);
    }
    const sessionData = await sessionResponse.json();
    const sessionId = sessionData.id;
    if (!sessionId) throw new Error('Session ID was not returned from the API.');
    console.log(`✅ Session created successfully! ID: ${sessionId}`);

    // --- STEP 2: Send message and process the SSE stream ---
    console.log("\n▶️  Step 2: Sending claim and waiting for final report...");
    const runSseUrl = `${BASE_URL}/run_sse`;
    
    // **NEW PAYLOAD STRUCTURE**
    // Create the inner payload with text and image, matching actions.ts
    const innerPayload = {
        text: tab.url, // Concatenate URL and any other text here if needed
        image: croppedDataUrl // This is already a data URI string
    };
    
    // Create the final message payload, stringifying the inner payload
    const messagePayload = {
      appName: APP_NAME,
      userId: USER_ID,
      sessionId: sessionId,
      newMessage: {
        role: "user",
        parts: [{ "text": JSON.stringify(innerPayload) }] // The inner payload is sent as a string
      }
    };

    const sseResponse = await fetch(runSseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messagePayload),
    });

    if (!sseResponse.ok || !sseResponse.body) {
      throw new Error(`API request failed with status ${sseResponse.status}`);
    }

    // --- STEP 3: Read the live stream to find the final report ---
    const reader = sseResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalReportObject = null;

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
                                console.log("✅ Final report found in stream!");
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Could not parse SSE event line:', line, e);
                }
            }
        }
        if (finalReportObject) break;
    }

    if (!finalReportObject) {
      throw new Error("Could not find the final report from 'report_generator_agent' in the response stream.");
    }
    
    // --- STEP 4: Display the result ---
    chrome.tabs.sendMessage(tab.id, { type: 'displayResult', data: finalReportObject });

  } catch (error) {
    console.error('Error during analysis process:', error);
    chrome.tabs.sendMessage(tab.id, { 
        type: 'displayResult', 
        data: { tag: "Error", overall_summary: `Could not complete the analysis. Details: ${error.message}` }
    });
  }
}

/**
 * Crops an image from a data URL using worker-safe APIs.
 */
async function cropImage(dataUrl, area) {
    const response = await fetch(dataUrl);
    const imageBlob = await response.blob();
    const imageBitmap = await createImageBitmap(imageBlob);
    const canvas = new OffscreenCanvas(area.width, area.height);
    const context = canvas.getContext('2d');
    context.drawImage(
        imageBitmap,
        area.x, area.y, area.width, area.height,
        0, 0, area.width, area.height
    );
    const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(croppedBlob);
    });
}

