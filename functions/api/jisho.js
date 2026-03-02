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
    const jishoUrl = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(keyword)}`;
    const response = await fetch(jishoUrl, {
      headers: {
        'User-Agent': 'Kanji App (educational)'
      }
    });

    if (!response.ok) {
      throw new Error(`Jisho API returned ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400' // Cache for 1 day
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
