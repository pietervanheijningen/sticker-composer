addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
  })
  
  async function handleRequest(request) {
    // Define the allowed origin
    const allowedOrigin = 'https://signature-checker.pages.dev';
    
    // Set CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
      // Check the Origin header
      const origin = request.headers.get("Origin") || "";
      if (origin !== allowedOrigin) {
        // Return an error or a CORS-related response if the origin is not allowed
        return new Response("Forbidden", { status: 403 });
      }
  
    if (request.method === "GET") {
      const url = new URL(request.url);
      const input = url.searchParams.get("input").toLowerCase();
      const isBackwards = url.searchParams.get("isBackwards") === 'true'; // Retrieve and interpret the isBackwards parameter
  
      const response = await fetch('https://signature-checker.pages.dev/stickers.json');
      const data = await response.json();
  
      let results = [];
      let remainingInput = input;
      let iterations = 0;
  
      let filteredItems = [];
  
  while (remainingInput.length > 0 && iterations < 5) {
    let foundMatch = false;
    let matchPart = "";
  
    // Reset filteredItems at the start of each iteration
    filteredItems = [];
  
    for (let length = remainingInput.length; length >= 1; length--) {
      const partialInput = isBackwards ? remainingInput.slice(-length) : remainingInput.substring(0, length);
  
      filteredItems = data.filter(item => {
        const parts = item.name.split('|').map(part => part.trim());
        if (parts.length === 3 && item.description.toLowerCase().includes("autographed")) {
          const middlePart = parts[1].toLowerCase();
          const middlePartMain = middlePart.split(' ')[0];
  
          return isBackwards ? middlePartMain.endsWith(partialInput) : middlePartMain.startsWith(partialInput);
        }
        return false;
      });
  
      if (filteredItems.length > 0) {
        foundMatch = true;
        matchPart = partialInput;
        remainingInput = isBackwards ? remainingInput.slice(0, -length) : remainingInput.substring(length);
        break;
      }
    }
  
    if (foundMatch) {
      results.push({
        matchedPart: matchPart,
        stickers: filteredItems.map(item => ({
          name: item.name,
          image: item.image
        }))
      });
    }
  
    if (!foundMatch || remainingInput.length === 0) {
      break;
    }
  
    iterations++;
      }
  
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }
  }
  