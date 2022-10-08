const { Cluster } = require('puppeteer-cluster');

// base64 => imgdata
const imgCache = new Map();
let cluster;

(async () => {
  cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 4,
  });
  await cluster.task(async ({ page, data: url }) => {
    await page.goto(url);
    return page.screenshot({'type': 'webp', 'quality': 10});
  });
})();

module.exports = {
    // A unique ID for this API
    'id': 'sp-api',
    // The port on which Express is to listen
    'port': 7050,
    // Whether or not to log incoming requests to the console (default: true)
    'log': true,
    'routes': {
        '/api': {
            'get': async (req, res, next) => {
                if(req.query && req.query.url){
                    const urlobj = new URL(decodeURIComponent(req.query.url));
                    const url = urlobj.origin;
                    if( !imgCache.has(url) ) {
                        imgCache.set(url, await cluster.execute(url));
                    }
                    if( imgCache.has(url) ) {
                        res.writeHead(200, {'Content-Type': 'image/webp'});
                        return res.end(imgCache.get(url));
                    }
                }
                return res.status(404).send("Not Found");
            }
        }
    }
};

