import { API_FOLDER } from "./config";
import { join } from "path";

export const router = new Bun.FileSystemRouter({
  style: "nextjs",
  dir: join(process.cwd(), API_FOLDER),
});