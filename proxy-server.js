const http = require("http");

const PORT = Number(process.env.PORT || 8787);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/proxy") {
    sendJson(res, 404, { error: { message: "Not Found" } });
    return;
  }

  try {
    const raw = await readBody(req);
    const body = JSON.parse(raw || "{}");
    const { targetUrl, apiKey, payload } = body;

    if (!targetUrl || !payload || !apiKey) {
      sendJson(res, 400, { error: { message: "targetUrl, apiKey, payload 均为必填。" } });
      return;
    }

    const upstreamResponse = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const text = await upstreamResponse.text();
    const contentType = upstreamResponse.headers.get("content-type") || "application/json; charset=utf-8";

    res.writeHead(upstreamResponse.status, {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });
    res.end(text);
  } catch (error) {
    sendJson(res, 500, {
      error: {
        message: error instanceof Error ? error.message : String(error)
      }
    });
  }
});

server.listen(PORT, () => {
  console.log(`Proxy server listening on http://localhost:${PORT}/proxy`);
});
