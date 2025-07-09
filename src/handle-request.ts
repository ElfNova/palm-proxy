import { NextRequest } from "next/server";

declare const process: any;


const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "*",
  "access-control-allow-headers": "*",
};

export default async function handleRequest(request: NextRequest & { nextUrl?: URL }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: CORS_HEADERS,
    });
  }

  const { pathname, searchParams } = request.nextUrl ? request.nextUrl : new URL(request.url);

  if(pathname === "/") {
    let blank_html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Google PaLM API proxy on Vercel Edge</title>
</head>
<body>
  <h1 id="google-palm-api-proxy-on-vercel-edge">Google PaLM API proxy on Vercel Edge</h1>
  <p>Tips: This project uses a reverse proxy to solve problems such as location restrictions in Google APIs. </p>
  <p>If you have any of the following requirements, you may need the support of this project.</p>
  <ol>
  <li>When you see the error message &quot;User location is not supported for the API use&quot; when calling the Google PaLM API</li>
  <li>You want to customize the Google PaLM API</li>
  </ol>
  <p>For technical discussions, please visit <a href="https://simonmy.com/posts/使用vercel反向代理google-palm-api.html">https://simonmy.com/posts/使用vercel反向代理google-palm-api.html</a></p>
</body>
</html>
    `
    return new Response(blank_html, {
      headers: {
        ...CORS_HEADERS,
        "content-type": "text/html"
      },
    });
  }
  // curl \
  // -H 'Content-Type: application/json' \
  // -d '{ "prompt": { "text": "Write a story about a magic backpack"} }' \
  // "https://generativelanguage.googleapis.com/v1beta3/models/text-bison-001:generateText?key={YOUR_KEY}"

  const API_HOST = typeof process.env.API_HOST === "string" ? process.env.API_HOST : "generativelanguage.googleapis.com";
  const url = new URL(pathname, `https://${API_HOST}`);
  searchParams.delete("_path");

  searchParams.forEach((value: string, key: string) => {
    url.searchParams.append(key, value);
  });

  const headers = new Headers(request.headers);
  headers.set("host", API_HOST);

  const response = await fetch(url.toString(), {
    body: request.body,
    method: request.method,
    headers,
    // @ts-ignore
    duplex: "half",
  });

  const responseHeaders = {
    ...CORS_HEADERS,
    ...Object.fromEntries(response.headers)
  };

  return new Response(response.body, {
    headers: responseHeaders,
    status: response.status
  });
}
