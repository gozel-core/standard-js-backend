import { test, expect } from "vitest";
import { readJsonFile } from "./readJsonFile";

test("read json file", async () => {
    const json = await readJsonFile("./package.json");
    expect(json).toMatchObject({
        name: "@gozel-core/standard-js-backend",
    });
});
