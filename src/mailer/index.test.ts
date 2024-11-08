import { expect, test } from "vitest";
import { mailer } from "./index";

test("init", async () => {
    const m = await mailer({
        serviceConfig: { name: "postmark", serverToken: "invalid" },
    });
    const composer = m.getComposer();
    composer.setProduct("My Product Ltd", "https://example.com");
    composer.addTitle("My Title");
    composer.addText("Lorem ipsum");
    composer.addInlinedKeyValueSet({ firstname: "John", lastname: "Doe" });
    composer.addFooterText("This is footer.");

    const plain = composer.getPlainEmail();
    expect(plain.includes("{{")).toBe(false);
    expect(plain.includes("}}")).toBe(false);
    expect(plain.includes("My Product Ltd")).toBe(true);
    expect(plain.includes("My Title")).toBe(true);
    expect(plain.includes("Lorem ipsum")).toBe(true);
    expect(plain.includes("firstname: John")).toBe(true);
    expect(plain.includes("lastname: Doe")).toBe(true);
    expect(plain.includes("This is footer.")).toBe(true);

    const html = composer.getHtmlEmail();
    expect(html.includes("My Product Ltd")).toBe(true);
    expect(html.includes("My Title")).toBe(true);
    expect(html.includes("Lorem ipsum")).toBe(true);
    expect(html.includes("This is footer.")).toBe(true);
    expect(html.includes("{{")).toBe(false);
    expect(html.includes("}}")).toBe(false);
});
