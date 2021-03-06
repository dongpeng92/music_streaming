// Load env vars from .env, always run this early
require('dotenv').config()

// 3rd party
const debug = require('debug')('app:index')
const Koa = require('koa')
const helmet = require('koa-helmet')
const compress = require('koa-compress')
const serveStatic = require('koa-better-static2')
const koalogger = require('koa-logger')
const bodyParser = require('koa-bodyparser')
const bouncer = require('koa-bouncer')
const koaNunjucks = require('koa-nunjucks-2');

// 1st party
const config = require('./config')
const mw = require('./middleware')
const belt = require('./belt')
const logger = require('./logging')

// //////////////////////////////////////////////////////////

const app = new Koa()
app.poweredBy = false
app.proxy = config.TRUST_PROXY

// //////////////////////////////////////////////////////////
// Middleware
// //////////////////////////////////////////////////////////


app.use(helmet())
app.use(compress())
// TODO: You would set a high maxage on static assets if they had their hash in their filename.
// This project currently has no static asset build system setup.
app.use(serveStatic('public', { maxage: 0 }))
app.use(koalogger())
app.use(bodyParser())
app.use(mw.methodOverride()) // Must come after body parser
app.use(mw.ensureReferer()) // must come after methodOverride
app.use(mw.removeTrailingSlash())
app.use(mw.wrapCurrUser())
app.use(mw.wrapFlash())
app.use(bouncer.middleware())
app.use(mw.handleBouncerValidationError()) // Must come after bouncer.middleware()
app.use(koaNunjucks({
  path: require('path').join(__dirname, 'views'),
  nunjucksConfig: {
    trimBlocks: true,
    noCache: true
  }
}));

// logger
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  logger.info(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

// //////////////////////////////////////////////////////////
// Routes
// //////////////////////////////////////////////////////////

app.use(require('./routes').routes())
app.use(require('./routes/authentication').routes())
app.use(require('./routes/search').routes())
app.use(require('./routes/favorite').routes())
app.use(require('./routes/follow').routes())
app.use(require('./routes/playlists').routes())
app.use(require('./routes/tracks').routes())
app.use(require('./routes/users').routes())
app.use(require('./routes/albums').routes())


// //////////////////////////////////////////////////////////

app.start = function(port = config.PORT) {
    app.listen(port, () => {
        logger.info(`Listening on http://localhost:${port}`)
    })
}

module.exports = app
