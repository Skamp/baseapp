import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { createServer } from "node:http";

const port = Number(process.env.PORT || 4173);
const root = process.cwd();

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function resolvePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const cleanPath = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  return join(root, cleanPath);
}

async function findFile(urlPath) {
  let filePath = resolvePath(urlPath);
  const fileStat = await stat(filePath).catch(() => null);

  if (fileStat?.isDirectory()) {
    filePath = join(filePath, "index.html");
  }

  return filePath;
}

createServer(async (request, response) => {
  try {
    if (request.url === "/tonicapp" || request.url === "/appoclock") {
      response.writeHead(301, { Location: `${request.url}/` });
      response.end();
      return;
    }

    const filePath = await findFile(request.url || "/");
    const fileStat = await stat(filePath).catch(() => null);

    if (!fileStat?.isFile()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream",
    });
    createReadStream(filePath).pipe(response);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error instanceof Error ? error.message : "Internal server error");
  }
}).listen(port, () => {
  console.log(`BaseApp available at http://localhost:${port}`);
});
