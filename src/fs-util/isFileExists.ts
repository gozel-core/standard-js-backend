import { access, constants } from "node:fs/promises";

export async function isFileExists(file: string) {
    try {
        await access(file, constants.W_OK);
        return true;
    } catch (e) {
        return false;
    }
}
