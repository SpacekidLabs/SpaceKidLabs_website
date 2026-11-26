import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Readable } from "stream";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API route for proxying audio
  app.get("/api/proxy-audio", async (req, res) => {
    try {
      const driveId = req.query.id as string;
      if (!driveId) {
        res.status(400).send('Missing id');
        return;
      }
      
      const targetUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
      
      const fetchHeaders: HeadersInit = {};
      if (req.headers.range) {
        fetchHeaders['Range'] = req.headers.range;
      }

      const fetchRes = await fetch(targetUrl, { headers: fetchHeaders });
      
      if (!fetchRes.ok && fetchRes.status !== 206) {
        res.status(fetchRes.status).send('Error from drive');
        return;
      }

      const contentType = fetchRes.headers.get('content-type') || 'audio/wav';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Accept-Ranges', 'bytes');
      
      if (fetchRes.status === 206) {
        res.status(206);
        const contentRange = fetchRes.headers.get('content-range');
        if (contentRange) res.setHeader('Content-Range', contentRange);
        const contentLength = fetchRes.headers.get('content-length');
        if (contentLength) res.setHeader('Content-Length', contentLength);
      }
      
      if (fetchRes.body) {
        const readable = Readable.fromWeb(fetchRes.body as any);
        readable.pipe(res);
      } else {
        res.status(500).send('No response body');
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Server proxy error');
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production (bundled to dist/server.cjs), __dirname is the dist folder
    const distPath = __dirname;
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
