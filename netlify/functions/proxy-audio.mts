// Netlify Function version of the /api/proxy-audio route in server.ts.
// Streams a Google Drive file to the browser, passing Range requests through so audio can seek.
export default async (req: Request) => {
  const driveId = new URL(req.url).searchParams.get("id");
  if (!driveId || !/^[A-Za-z0-9_-]+$/.test(driveId)) {
    return new Response("Missing or invalid id", { status: 400 });
  }

  const headers: HeadersInit = {};
  const range = req.headers.get("range");
  if (range) headers["Range"] = range;

  try {
    const upstream = await fetch(
      `https://drive.google.com/uc?export=download&id=${driveId}`,
      { headers }
    );

    if (!upstream.ok && upstream.status !== 206) {
      return new Response("Error from drive", { status: upstream.status });
    }

    const out = new Headers({
      "Content-Type": upstream.headers.get("content-type") || "audio/wav",
      "Access-Control-Allow-Origin": "*",
      "Accept-Ranges": "bytes",
    });
    for (const h of ["content-range", "content-length"]) {
      const v = upstream.headers.get(h);
      if (v) out.set(h, v);
    }

    return new Response(upstream.body, { status: upstream.status, headers: out });
  } catch (err) {
    console.error(err);
    return new Response("Server proxy error", { status: 500 });
  }
};

export const config = { path: "/api/proxy-audio" };
