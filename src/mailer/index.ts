import { EOL } from "node:os";
import postmark from "postmark";
import { simple } from "./layouts";

export async function mailer(config: MailerConfig) {
    if (!config || !config.serviceConfig || !config.serviceConfig.name) {
        throw new Error(`Invalid config.`);
    }

    const client = await getClient();

    async function send(sendConfig: MailerSendConfig) {
        if (!client) {
            throw new Error(`There is no client configured.`);
        }

        if (config.serviceConfig.name === "postmark") {
            const payload: postmark.Models.Message = {
                From: sendConfig.from,
                To:
                    typeof sendConfig.to === "string"
                        ? sendConfig.to
                        : sendConfig.to.join(","),
                Subject: sendConfig.subject,
            };

            if (sendConfig.htmlBody) payload.HtmlBody = sendConfig.htmlBody;
            else if (sendConfig.plainBody)
                payload.TextBody = sendConfig.plainBody;
            else throw new Error(`Both of htmlBody and plainBody is missing.`);

            if (sendConfig.cc) payload.Cc = sendConfig.cc.join(",");
            if (sendConfig.bcc) payload.Bcc = sendConfig.bcc.join(",");

            return await client.sendEmail(payload);
        }

        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(
            `Invalid or unsupported email service: ${config.serviceConfig.name}`,
        );
    }

    async function getClient() {
        if (config.serviceConfig.name === "postmark") {
            return new postmark.ServerClient(config.serviceConfig.serverToken);
        }

        return;
    }

    function getComposer() {
        const layout = { html: simple.html, plain: simple.plain };
        const contentItemsHtml: string[] = [];
        const contentItemsPlain: string[] = [];
        const footerItemsHtml: string[] = [];
        const footerItemsPlain: string[] = [];
        const layoutTagValues: MailerComposeLayoutTags = {
            product_url: "",
            product_name: "",
            content: "",
            footer: "",
        };

        function setProduct(name: string | MailerProductImage, url: string) {
            layoutTagValues.product_url = url;

            if (typeof name === "string") {
                layoutTagValues.product_name = name;
            } else {
                layoutTagValues.product_name = `<img src="${name.url}" width="${name.width}" height="${name.height}" alt="${name.name}" />`;
            }
        }

        function addTitle(title: string) {
            contentItemsHtml.push(
                `<h1 style="margin-top: 0; color: #333333; font-size: 22px; font-weight: bold; text-align: left;" align="left">${title}</h1>`,
            );
            contentItemsPlain.push(title);
        }

        function addText(text: string) {
            contentItemsHtml.push(
                `<p style="font-size: 16px; line-height: 1.625; color: #333; margin: .4em 0 1.1875em;">${text}</p>`,
            );
            contentItemsPlain.push(text);
        }

        function addButton(text: string, url: string) {
            contentItemsHtml.push(
                `<table class="body-action" align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; -premailer-width: 100%; -premailer-cellpadding: 0; -premailer-cellspacing: 0; text-align: center; margin: 30px auto; padding: 0;"><tr><td align="center" style="word-break: break-word; font-family: &quot;Nunito Sans&quot;, Helvetica, Arial, sans-serif; font-size: 16px;"><table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center" style="word-break: break-word; font-family: &quot;Nunito Sans&quot;, Helvetica, Arial, sans-serif; font-size: 16px;"><a href="${url}" class="f-fallback button" target="_blank" style="color: #FFF; background-color: #3869D4; display: inline-block; text-decoration: none; border-radius: 3px; box-shadow: 0 2px 3px rgba(0, 0, 0, 0.16); -webkit-text-size-adjust: none; box-sizing: border-box; border-color: #3869D4; border-style: solid; border-width: 10px 18px;">${text}</a></td></tr></table></td></tr></table>`,
            );
            contentItemsPlain.push(`${text}: ${url}`);
        }

        function addInlinedKeyValueSet(items: Record<string, string>) {
            let html = `<table class="attributes" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 21px;"><tr><td class="attributes_content" style="word-break: break-word; font-family: &quot;Nunito Sans&quot;, Helvetica, Arial, sans-serif; font-size: 16px; background-color: #F4F4F7; padding: 16px;" bgcolor="#F4F4F7"><table width="100%" cellpadding="0" cellspacing="0" role="presentation">`;
            let plain = "";
            const keys = Object.keys(items);
            const total = keys.length;
            let counter = 0;
            for (const key of keys) {
                html += `<tr><td class="attributes_item" style="word-break: break-word; font-family: &quot;Nunito Sans&quot;, Helvetica, Arial, sans-serif; font-size: 16px; padding: 0;"><span class="f-fallback"><strong>${key}</strong> ${items[key]}</span></td></tr>`;
                plain += `${key}: ${items[key]}${counter + 1 === total ? "" : EOL}`;
                counter += 1;
            }
            html += `</table></td></tr></table>`;
            contentItemsHtml.push(html);
            contentItemsPlain.push(plain);
        }

        function addCopyrightText(text = "All rights reserved.") {
            addFooterText(
                `&copy; ${new Date().getUTCFullYear().toString()} ${layoutTagValues.product_name ?? ""}. ${text}`,
            );
        }

        function addFooterText(text: string) {
            footerItemsHtml.push(
                `<p class="f-fallback sub align-center">${text}</p>`,
            );
            footerItemsPlain.push(text);
        }

        function getHtmlEmail() {
            const re = /(?=\{\{)(.*?)(?<=\}\})/g;
            let html = layout.html;
            layoutTagValues.content = contentItemsHtml.join(EOL);
            layoutTagValues.footer = footerItemsHtml.join(EOL);
            const matches = html.match(re);
            if (!matches) return html;
            for (const tag of matches) {
                const _tag = tag.replace("{{", "").replace("}}", "");
                html = html.replace(
                    tag,
                    layoutTagValues[_tag as keyof typeof layoutTagValues],
                );
            }
            return html;
        }

        function getPlainEmail() {
            const re = /(?=\{\{)(.*?)(?<=\}\})/g;
            let plain = layout.plain;
            layoutTagValues.content = contentItemsPlain.join(EOL);
            layoutTagValues.footer = footerItemsPlain.join(EOL);
            const matches = plain.match(re);
            if (!matches) return plain;
            for (const tag of matches) {
                const _tag = tag.replace("{{", "").replace("}}", "");
                plain = plain.replace(
                    tag,
                    layoutTagValues[_tag as keyof typeof layoutTagValues],
                );
            }
            return plain;
        }

        return {
            setProduct,
            addTitle,
            addText,
            addButton,
            addInlinedKeyValueSet,
            addCopyrightText,
            addFooterText,
            getHtmlEmail,
            getPlainEmail,
        };
    }

    return {
        client,
        getComposer,
        send,
    };
}

export type Mailer = AsyncReturnType<ReturnType<typeof mailer>>;
export type AsyncReturnType<T> = T extends Promise<infer U> ? U : T;

export interface MailerSendConfig {
    from: string;
    to: string | string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    htmlBody?: string;
    plainBody?: string;
}

export interface MailerConfig {
    serviceConfig: MailerServiceConfig;
}

export interface MailerServiceConfig {
    name: "postmark";
    serverToken: string;
}

export interface MailerComposeLayoutTags {
    product_name: string;
    product_url: string;
    content: string;
    footer: string;
}

export interface MailerProductImage {
    name: string;
    url: string;
    width: number;
    height: number;
}
