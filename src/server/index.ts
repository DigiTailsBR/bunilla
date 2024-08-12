import { join } from "path";
import { PORT, PUBLIC_FOLDER } from "./config";
import { router } from "./router";

function getPublicFilePath(path: string) {
  return join(process.cwd(), PUBLIC_FOLDER, path);
}

export function paramsToObject(params: URLSearchParams) {
  const result: { [key: string]: any } = {};
  for (const [key, value] of params.entries()) {
    if (key.endsWith("[]")) {
      if (!result[key]) result[key] = [];
      result[key].push(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export interface ServerContext {
  req: Request;
  params: { [key: string]: string };
  query: { [key: string]: string };
  res: {
    send: (body?: BodyInit | null, init?: ResponseInit) => Response;
    json: (data: any, init?: ResponseInit) => Response;
    redirect: (url: string, statusCode: number) => Response;
  };
}

async function getPublicFile(path: string) {
  let publicFile = Bun.file(getPublicFilePath(path));
  if (await publicFile.exists()) {
    return publicFile;
  }
  publicFile = Bun.file(getPublicFilePath(path + "/index.html"));
  if (await publicFile.exists()) {
    return publicFile;
  }
  return false;
}

export const server = Bun.serve({
  async fetch(req): Promise<Response> {
    // try upgrade req to ws
    // const cookies = parseCookies(req.headers.get("Cookie"));
    const success = server.upgrade(req, {
      // example of upgrade with data from server
      // data: {
      //   createdAt: Date.now(),
      //   channelId: new URL(req.url).searchParams.get("channelId"),
      //   authToken: cookies["X-Token"],
      // },
    });
    if (success) {
      return new Response("ok");
    }
    //
    const url = new URL(req.url);
    const routerMatch = router.match(url.pathname);
    const publicFile = await getPublicFile(url.pathname);
    // prepare context
    const ctx: ServerContext = {
      req,
      params: routerMatch?.params || {},
      query: paramsToObject(url.searchParams),
      res: {
        send: (body?: BodyInit | null, init?: ResponseInit) =>
          new Response(body, init),
        json: (data: any, init?: ResponseInit) => Response.json(data, init),
        redirect: (url: string, statusCode: number) =>
          Response.redirect(url, statusCode),
      },
    };
    // FileSystemRouter fails
    if (!routerMatch && publicFile) {
      return new Response(publicFile);
    }
    if (routerMatch) {
      try {
        let response;
        // JSX Renderer
        if (routerMatch.filePath.endsWith(".tsx")) {
        }
        // Default behavior
        response = (
          await import(routerMatch.filePath + "?n=" + Date.now())
        ).default(ctx);
        if (response) return response;
      } catch (error) {
        //@ts-expect-error
        throw new Error(error.toString());
      }
    }
    // 404s
    return new Response("Page not found", { status: 404 });
  },
  //   error() {
  //     return new Response(null, { status: 404 });
  //   },
  websocket: {
    open(ws) {
      // ws.subscribe("the-group-chat");
      // server.publish("the-group-chat", msg);
    },
    async message(ws, message) {
      // server.publish("the-group-chat", `${ws.data.username}: ${message}`);
    },
    close() {
      // const msg = `${ws.data.username} has left the chat`;
      // ws.unsubscribe("the-group-chat");
      // server.publish("the-group-chat", msg);
    },
  },
  port: PORT,
});
