interface Env {
  ASSETS: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  };
}

interface EventContext {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
}

export const onRequest = async (context: EventContext): Promise<Response> => {
  const res = await context.next();

  if (res.status !== 404) {
    return res;
  }

  const accept = context.request.headers.get('accept') || '';
  if (accept.includes('text/html')) {
    const url = new URL('/', context.request.url);
    const index = await context.env.ASSETS.fetch(url);
    return new Response(index.body, {
      status: 200,
      headers: index.headers,
    });
  }

  return res;
};
