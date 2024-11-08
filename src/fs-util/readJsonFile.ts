import { readFile } from "node:fs/promises";

export async function readJsonFile<T extends object>(file: string): Promise<T> {
    return JSON.parse(await readFile(file, "utf8"));
}
