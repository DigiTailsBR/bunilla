import ReactDOMServer from "react-dom/server";

export async function render(filePath: string, ctx: any) {
  const path = filePath + "?n=" + Date.now(); // force render again
  const html = ReactDOMServer.renderToString((await import(path)).default(ctx));
  return html;
}
