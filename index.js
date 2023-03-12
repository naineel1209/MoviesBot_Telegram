require('dotenv').config();
const { Bot, webhookCallback } = require("grammy");
const express = require("express");
const { Telegraf, Context } = require('telegraf');
const axios = require('axios');
const bot = new Telegraf(process.env.BOT_KEY);
// const bot = new Bot(process.env.BOT_KEY);
const searchUrl = 'https://search.imdbot.workers.dev/?q=';
const notFound = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQoIJoq9m_zd5OQ3hEAJs1ZjB4x0bhV6t92WeEJYjQ&s"
// const replaceUrl = titleUrl.replace('?', "tt1375666");
const imdbSearchUrl = `https://imdb-api.com/en/API/Title/${process.env.IMDB_KEY || process.key.IMDB_KEY2}/?/FullActor,Posters,Trailer,Ratings,`

bot.command('start', (ctx, next) => {
    ctx.crypticmessage = "Hello";
    let msg = `<strong>Welcome to the Movies Bot.</strong> \n We provide information about Movies. \n @BotKindBot movie <strong><i>**Your_Fav_Movie_Name**</i></strong>`

    ctx.reply(msg, {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Movie Bot', switch_inline_query_current_chat: 'movie' }],
                [{ text: 'Credits', callback_data: 'credits' }],
                [{ text: 'API Source', url: 'https://imdb-api.com/api' }]
            ]
        },
        parse_mode: 'HTML'
    });
});

//answering the inline_query
bot.on("inline_query", async (ctx, next) => {
    try {
        let query = ctx.inlineQuery.query.split(" ").splice(1).join(' ');

        if (query.length < 1) return;

        console.log(searchUrl + query);

        let results = await axios.get(`${searchUrl + query}`)
            .then(res => res.data.description)
            .catch((e) => {
                console.log(e.message);
            });

        let returnQuery = [];
        returnQuery = results.map((res, id) => {
            if (res["#IMDB_ID"]) {
                return {
                    type: "photo",
                    id: res["#IMDB_ID"],
                    photo_url: res["#IMG_POSTER"] || `${notFound}`,
                    thumbnail_url: res["#IMG_POSTER"] || `${notFound}`,
                    photo_width: 500,
                    photo_height: 400,
                    caption: `<a href="${res["#IMG_POSTER"]}"> Large Image </a>`,
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard:
                            [
                                [
                                    {
                                        text: `Share ${res["#TITLE"]}`, switch_inline_query: `movie ${res["#TITLE"]}`
                                    },
                                ]
                            ]
                    },
                };
            }
        });

        await ctx.answerInlineQuery(returnQuery);

    } catch (error) {
        console.log(error.message);
    }
});

bot.on('chosen_inline_result', async (ctx) => {
    const resultId = ctx.update.chosen_inline_result.result_id;
    const inlineMsgId = ctx.update.chosen_inline_result.inline_message_id;

    console.log(resultId, inlineMsgId);
    const imdb2 = imdbSearchUrl.replace('?', resultId);
    const response = await axios.get(imdb2).then(res => res.data);

    let msgContent =
        `📚<b>Title</b>: ${response.fullTitle} \n🎥<b>ReleaseDate</b>: ${response.releaseDate} \n🎞️<b>Runtime</b>: ${response.runtimeStr} \n🌃<b>Plot</b>: ${response.plot} \n🏆<b>Awards</b>: ${response.awards} \n<b>Directed By: </b>: ${response.directors} \n👨‍🎤<b>Stars</b>: ${response.stars} \n<b>Ratings</b>: <a href="https://www.imdb.com/title/${response.id}/">${response.ratings.imDb || response.ratings.metacritic || response.ratings.theMovieDb || response.ratings.filmAffinity}</a>\n`
        ;

    await ctx.editMessageText(msgContent, {
        inline_message_id: inlineMsgId,
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard:
                [[
                    {
                        text: `Show Trailer for ${response.title}`,
                        callback_data: `video ${response.id}`
                    }
                ],
                [
                    {
                        text: `Share ${response.title} To Others`, switch_inline_query: `movie ${response.title}`
                    },
                ]]
        },
    });
});

bot.on('callback_query', async (ctx) => {
    let respId = ctx.update.callback_query.data.split(' ');
    if (respId[0] === 'video') {
        respId = respId[1];
        await ctx.editMessageMedia(ctx.update.callback_query.inline_message_id, {
            media: {
                type: 'video',
                media: `http://media.imdbot.workers.dev/${respId}`,
            },
            reply_markup: {
                inline_keyboard:
                    [[
                        {
                            text: `Search Other Movies`, switch_inline_query_current_chat: `movie `
                        },
                    ]]
            }
        })
    } else {
        await ctx.answerCbQuery("Hello No Links Present Currently");
    }
})

//launching the bot


// Start the server
{
    // Use Long Polling for development
    // bot.start();
    bot.launch();
}


process.once("SIGINT", () => { bot.stop("SIGINT"); })
process.once("SIGTERM", () => { bot.stop("SIGTERM"); })