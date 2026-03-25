function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sendJson(res, statusCode, payload) {
  setCors(res);
  res.status(statusCode).json(payload);
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    setCors(res);
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: { message: "Method Not Allowed" } });
    return;
  }

  try {
    const { targetUrl, apiKey, payload } = req.body || {};

    if (!targetUrl || !apiKey || !payload) {
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

    setCors(res);
    res.setHeader("Content-Type", contentType);
    res.status(upstreamResponse.status).send(text);
  } catch (error) {
    sendJson(res, 500, {
      error: {
        message: error instanceof Error ? error.message : String(error)
      }
    });
  }
};
