/**
 * Cloudflare Worker entry point for webgl-particle-engine
 * 
 * This is a minimal Worker that serves static assets from the public directory.
 * It can be extended in the future to add dynamic functionality like:
 * - API endpoints
 * - Authentication
 * - Server-side rendering
 * - Edge caching strategies
 */

export default {
  async fetch(request, env) {
    // Get the URL from the request
    const url = new URL(request.url);
    
    // Serve static assets from the ASSETS binding (if configured)
    if (env.ASSETS) {
      try {
        // Try to fetch the asset from the static assets
        return await env.ASSETS.fetch(request);
      } catch (e) {
        // Log the error for debugging
        console.error('Asset fetch failed:', e);
        // Return a 404 with error details
        return new Response(`Not found: ${url.pathname}`, { status: 404 });
      }
    }
    
    // Fallback response if ASSETS binding is not configured
    // This allows pure static deployment via `wrangler pages deploy`
    return new Response('Static assets served directly via Cloudflare Pages', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};
