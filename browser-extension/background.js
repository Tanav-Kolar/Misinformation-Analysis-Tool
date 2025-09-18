// --- CONFIGURATION ---
// TODO: Replace these two values with your details.
const API_GATEWAY_URL = 'https://misinfo-checker.free.beeceptor.com'; // Paste your Beeceptor URL here
const API_KEY = 'test-api-key-12345'; // You can use any placeholder key for testing
// --------------------

// Create the context menu item when the extension is installed.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyzeSelection",
    title: "Analyze selection for misinformation",
    contexts: ["page", "selection", "image"] // Show menu on pages, selections, and images
  });
});

// Listen for a click on our context menu item.
chrome.contextMenus.onClicked.addListener((info, tab) => {
  // Check if the clicked menu item is the one we created.
  if (info.menuItemId === "analyzeSelection") {
    // Inject the selection script into the active tab.
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['selection.js']
    });
  }
});

// Listen for the message from the selection script (this part remains the same).
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'capture') {
    captureAndSend(request.area, sender.tab);
  }
  return true; 
});


async function captureAndSend(area, tab) {
  try {
    // 1. Capture the visible area of the active tab
    const screenshotDataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    
    // 2. Crop the captured image to the user's selected area
    const croppedDataUrl = await cropImage(screenshotDataUrl, area);
    
    // 3. Prepare the JSON payload to send to the API
    const payload = {
      source_url: tab.url,
      image_b64: croppedDataUrl
    };

    console.log('Sending data to API:', API_GATEWAY_URL);

    // 4. Send the data to the API endpoint using fetch
    const response = await fetch(API_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY // This header will be visible in Beeceptor
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    console.log('Success! Request was received by Beeceptor.');

    //const result = await response.json();
    //console.log('Success! API responded:', result);
    
  } catch (error) {
    console.error('Error in capture and send process:', error);
  }
}

// ============================================================================
// MODIFIED FUNCTION: This is the new version that works in a Service Worker
// ============================================================================

async function cropImage(dataUrl, area) {
  // 1. Fetch the data URL and convert it to a blob
  const response = await fetch(dataUrl);
  const imageBlob = await response.blob();
  
  // 2. Create an ImageBitmap from the blob. This is a lightweight image object for workers.
  const imageBitmap = await createImageBitmap(imageBlob, {
    resizeWidth: area.width,
    resizeHeight: area.height,
    resizeQuality: 'high',
  });

  // 3. Create an OffscreenCanvas, which works without a visible page.
  const canvas = new OffscreenCanvas(area.width, area.height);
  const context = canvas.getContext('2d');
  
  // 4. Draw the cropped portion of the original image onto the canvas
  context.drawImage(
    imageBitmap,
    area.x, area.y,           // Source x, y from the original image
    area.width, area.height,  // Source width, height
    0, 0,                     // Destination x, y on the canvas
    area.width, area.height   // Destination width, height
  );

  // 5. Get the cropped image as a blob from the canvas
  const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });

  // 6. Convert the blob back to a Base64 data URL to send in the JSON
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(croppedBlob);
  });
}
