// Cloudflare Pages Function to proxy Jisho.org API
// This avoids CORS issues when calling from the browser

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const keyword = url.searchParams.get('keyword');

  if (!keyword) {
    return new Response(JSON.stringify({ error: 'keyword parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Use jisho.org API
    const jishoUrl = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(keyword)}`;

    const response = await fetch(jishoUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KanjiApp/1.0)',
        'Accept': 'application/json',
      },
      cf: {
        // Cloudflare-specific options to help with SSL issues
        cacheTtl: 86400,
        cacheEverything: true,
      }
    });

    if (!response.ok) {
      // If jisho.org fails, return empty result instead of error
      // This allows the user to manually enter the data
      return new Response(JSON.stringify({
        meta: { status: 200 },
        data: []
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300'
        }
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (error) {
    // On error, return empty result so UI can handle gracefully
    return new Response(JSON.stringify({
      meta: { status: 200 },
      data: [],
      _error: error.message
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
