import { access, constants, mkdir } from "node:fs/promises";

export async function verifyDir(dir: string, attemptToCreate = false) {
    try {
        await access(dir, constants.W_OK);
        return true;
    } catch (e) {
        if (attemptToCreate) {
            try {
                await mkdir(dir, { recursive: true });
                return true;
            } catch (e2) {
                throw new Error(`Couldn't create the path:${dir}`, {
                    cause: e2,
                });
            }
        }

        throw new Error(`Couldn't access the path:${dir}`, { cause: e });
    }
}
