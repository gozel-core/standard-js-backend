import { test, expect } from "vitest";
import { isFileExists } from "./isFileExists";

test("is file exists", async () => {
    await expect(isFileExists("./package.json")).resolves.toBe(true);
    await expect(isFileExists("./abcdefu.json")).resolves.toBe(false);
});
