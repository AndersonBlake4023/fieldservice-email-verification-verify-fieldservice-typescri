import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { InfraiError } from "./infrai_email.js";
import { processSignup, signupSchema } from "./fieldservice_signup.js";

const port = Number(process.env.PORT ?? "3000");

function reply(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/signup") {
    reply(response, 404, { error: "route_not_found" });
    return;
  }

  try {
    const parsed = signupSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      reply(response, 400, { error: "invalid_request", issues: parsed.error.issues });
      return;
    }

    const result = await processSignup(parsed.data, false);
    reply(response, 202, result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      reply(response, 400, { error: "invalid_json" });
      return;
    }
    if (error instanceof InfraiError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      reply(response, status, { error: error.code, message: error.message });
      return;
    }
    console.error(error);
    reply(response, 500, { error: "internal_error" });
  }
});

server.listen(port, () => {
  console.log(`field-service signup listening on http://localhost:${port}`);
});
