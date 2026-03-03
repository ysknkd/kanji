// Cloudflare Pages Function to proxy Jisho.org API
// This avoids CORS issues when calling from the browser

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const keyword = url.searchParams.get('keyword');
  const debug = url.searchParams.get('debug') === '1';

  if (!keyword) {
    return new Response(JSON.stringify({ error: 'keyword parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const jishoUrl = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(keyword)}`;

  try {
    const response = await fetch(jishoUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({
        _debug: debug ? {
          status: response.status,
          statusText: response.statusText,
          url: jishoUrl
        } : undefined,
        _error: `HTTP ${response.status}: ${response.statusText}`,
        data: []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
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
    return new Response(JSON.stringify({
      _debug: debug ? {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        url: jishoUrl
      } : undefined,
      _error: `${error.name}: ${error.message}`,
      data: []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
