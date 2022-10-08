const { Cluster } = require('puppeteer-cluster');
const express = require('express');
const app = express();

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

app.get('/api', async (req, res) => {
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
})

app.listen(7050);
