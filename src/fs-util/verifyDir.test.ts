import { test, expect, afterAll } from "vitest";
import { verifyDir } from "./verifyDir";
import { access, constants, rmdir } from "node:fs/promises";

afterAll(async () => {
    try {
        await rmdir("./abcdefu");
    } catch (e) {}
});

test("verify dir", async () => {
    await expect(() => verifyDir("./abcdefu")).rejects.toThrowError();
    expect(await verifyDir("./src")).toBe(true);
});

test("verify dir with create attempt", async () => {
    await verifyDir("./abcdefu", true);
    await expect(access("./abcdefu", constants.W_OK)).resolves.toBe(undefined);
});
