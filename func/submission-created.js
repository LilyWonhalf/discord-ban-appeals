const fetch = require("node-fetch");
let archiveDuration;

const { API_ENDPOINT, MAX_EMBED_FIELD_CHARS } = require("./helpers/discord-helpers.js");
const { decodeJwt } = require("./helpers/jwt-helpers.js");

const react = async (messageId, emojiData, channelId = encodeURIComponent(process.env.APPEALS_CHANNEL)) => {
    return await fetch(
        `${API_ENDPOINT}/channels/${channelId}/messages/${messageId}/reactions/${emojiData.name}:${emojiData.id}/@me`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`
            }
        }
    );
};

const sleep = (milliseconds = 200) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, milliseconds);
    });
};

exports.handler = async function (event, context) {
    let payload;

    if (process.env.USE_NETLIFY_FORMS) {
        payload = JSON.parse(event.body).payload.data;
    } else {
        if (event.httpMethod !== "POST") {
            return {
                statusCode: 405
            };
        }

        let params;

        try {
            params = JSON.parse(event.body).payload.data;
            archiveDuration = 1440;

            payload = {
                banReason: params.banReason || undefined,
                appealText: params.appealText || undefined,
                futureActions: params.futureActions|| undefined,
                token: params.token || undefined
            }
        } catch (error) {
            params = new URLSearchParams(event.body);
            archiveDuration = 10080;

            payload = {
                banReason: params.get("banReason") || undefined,
                appealText: params.get("appealText") || undefined,
                futureActions: params.get("futureActions") || undefined,
                token: params.get("token") || undefined
            };
        }
    }

    if (payload.banReason !== undefined &&
        payload.appealText !== undefined &&
        payload.futureActions !== undefined &&
        payload.token !== undefined) {

        const userInfo = decodeJwt(payload.token);

        const embedFields = [
            {
                name: "Submitter",
                value: `<@${userInfo.id}> (${userInfo.username}#${userInfo.discriminator})`
            },
            {
                name: "Why were you banned?",
                value: payload.banReason.slice(0, MAX_EMBED_FIELD_CHARS)
            },
            {
                name: "Why do you feel you should be unbanned?",
                value: payload.appealText.slice(0, MAX_EMBED_FIELD_CHARS)
            },
            {
                name: "What will you do to avoid being banned in the future?",
                value: payload.futureActions.slice(0, MAX_EMBED_FIELD_CHARS)
            }
        ];

        let result = await fetch(`${API_ENDPOINT}/channels/${encodeURIComponent(process.env.APPEALS_CHANNEL)}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`
            },
            body: JSON.stringify({
                embed: {
                    title: "New appeal submitted!",
                    timestamp: new Date().toISOString(),
                    fields: embedFields
                }
            })
        });

        if (!result.ok) {
            return {
                statusCode: 400
            };
        }

        const message = await result.json();

        result = await fetch(`${API_ENDPOINT}/channels/${encodeURIComponent(process.env.APPEALS_CHANNEL)}/messages/${message.id}/threads`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`
            },
            body: JSON.stringify({
                name: `Appeal: ${userInfo.username}#${userInfo.discriminator}`,
                auto_archive_duration: archiveDuration
            })
        });

        if (!result.ok) {
            return {
                statusCode: 400
            }
        }

        const threadChannel = await result.json();

        result = await fetch(`${API_ENDPOINT}/channels/${threadChannel.id}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`
            },
            body: JSON.stringify({
                content: `<@&254476057455886337> <@${userInfo.id}>`
            })
        });

        if (!result.ok) {
            return {
                statusCode: 400
            }
        }

        const reactEmojis = [
            { name: 'sondagecontre', id: '751191664994942987' },
            { name: 'plutotnon', id: '799325839359606784' },
            { name: 'sondageneutre', id: '637766278299516950' },
            { name: 'plutotoui', id: '799325839211888730' },
            { name: 'sondagepour', id: '637766278739918858' }
        ];

        for (const emoji of reactEmojis) {
            await react(message.id, emoji);
            await sleep();
        }

        if (process.env.USE_NETLIFY_FORMS) {
            return {
                statusCode: 200
            };
        } else {
            return {
                statusCode: 303,
                headers: {
                    "Location": "/success"
                }
            };
        }
    } else {
        console.log(await result.json());
        throw new Error("Failed to submit message");
    }
}
