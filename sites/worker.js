const serveAsset = (request, env) => env.ASSETS.fetch(request)

export default {
  async fetch(request, env) {
    const response = await serveAsset(request, env)

    if (response.status !== 404 || request.method !== 'GET') {
      return response
    }

    const accept = request.headers.get('accept') ?? ''
    if (!accept.includes('text/html')) {
      return response
    }

    const indexUrl = new URL('/index.html', request.url)
    return serveAsset(new Request(indexUrl, request), env)
  },
}
