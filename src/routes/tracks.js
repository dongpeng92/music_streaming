// 3rd party
const assert = require('better-assert')
const router = require('koa-router')()
const debug = require('debug')('app:routes:index')
// 1st party
const db_tracks = require('../db/db_tracks')
const pre = require('../presenters')
const mw = require('../middleware')
const config = require('../config')
const belt = require('../belt')

/**
 * Play a track.
 */
router.get('/playtrack', mw.ifLogin(), async ctx => {
    ctx
        .validateQuery('tid')
        .required('Which track do you want to play?')
        .isString()
        .trim()

    ctx
        .validateQuery('pid')
        .optional()
        .isString()
        .trim()

    tracktable = await db_tracks.insertTracksPlaying(ctx.currUser.username, ctx.vals.tid)

    if(ctx.vals.pid) {
        playlisttable = await db_tracks.insertPlaylistsPlaying(ctx.currUser.username, ctx.vals.pid)
    }
    else {
        playlisttable = true
    }
    if(tracktable && playlisttable) {
        await ctx.render('playtrack', {
            tid: ctx.vals.tid
        })
    }
    else {
        await ctx.render('playtrack', {
            error: "Error Play Track."
        })
    }
})

/**
 * get all ratings of an user.
 */
router.get('/rating/:username', mw.ifLogin(), async ctx => {
    ctx
        .validateParam('username')
        .required()
        .isString()
        .trim()

    const ratings = await db_tracks.getRatingsByUsername(ctx.vals.username)
    await ctx.render('rating', {
        ratings: ratings
    })
})


/**
 * Rate a track.
 */
router.post('/rating', mw.ifLogin(), async ctx => {
    ctx
        .validateBody('tid')
        .required('Which track do you want to play?')
        .isString()
        .trim()

    ctx
        .validateBody('score')
        .required()

    const score = Number.parseInt(ctx.vals.score)

    if (await db_tracks.insertRating(ctx.currUser.username, ctx.vals.tid, score)) {
        ctx.flash = {message: ["success", "Successfully rating the track."]}
    }
    else {
        ctx.flash = {message: ["danger", "Failed rating the track."]}
    }
    ctx.redirect('back')
})

module.exports = router