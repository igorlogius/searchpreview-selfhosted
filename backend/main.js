const { Cluster } = require('puppeteer-cluster');
const express = require('express');
const fs = require('fs');
const app = express();
const sqlite3 = require('sqlite3').verbose();

const depricationTime = 60*60*24; // 1 day invalidate


let db = (() => {

    const thumbDBPath = 'previews.sqlite3';

    if(fs.existsSync(thumbDBPath)){
        return new sqlite3.Database(thumbDBPath);
    }

    let db = new sqlite3.Database(thumbDBPath);

    db.serialize(() => {
        db.run("CREATE TABLE thumbs (url TEXT PRIMARY KEY, thumb BLOB, updated INTEGER)");
    });

    return db;


})();

const insert_stmt = db.prepare("INSERT INTO thumbs (url, thumb, updated) VALUES(?,?,unixepoch()) ON CONFLICT(url) DO UPDATE SET thumb = ?, updated=unixepoch()");
const select_stmt = db.prepare("SELECT thumb,(unixepoch()-updated) as blub FROM thumbs WHERE url = (?) AND blub < " + depricationTime);


// return promise(row) on success
function getThumb(url){
    return new Promise( (resolve,reject) => {
        select_stmt.get(url, (err,row) => {
            if(err){
                reject(err);
            }else{
                if(typeof row !== 'undefined' && typeof row.thumb !== 'undefined'){
                    console.log('>> getThumb', row.blub);
                    resolve(row.thumb);
                }else{
                    resolve(null);
                }
            }
        });
    });
}

// return Promise(null) on success
function setThumb(url,thumb){
    console.log('setThumb', url);
    return new Promise( (resolve,reject) => {
        insert_stmt.run(url,thumb,thumb, (err) => {
            if(err !== null){
                reject(err);
            }else{
                resolve(err);
            }
        });
    });
}

// base64 => imgdata
let cluster;

(async () => {
  cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 4,
    puppeteerOptions: {
        args: ['--no-sandbox']
    }
  });
  await cluster.task(async ({ page, data: url }) => {
    await page.setJavaScriptEnabled(false); // disable JS execution
    await page.goto(url);
    return page.screenshot({'type': 'webp', 'quality': 10});
  });
})();

app.get('/api', async (req, res) => {
    try {
        if(req.query && req.query.url){
            const urlobj = new URL(decodeURIComponent(req.query.url));
            const url = urlobj.origin + urlobj.pathname;
            let thumb = await getThumb(url);
            if( thumb === null) {
                console.log('creating preview image for',url);
                thumb = await cluster.execute(url);
                setThumb(url,thumb);
            }
            res.writeHead(200, {'Content-Type': 'image/webp'});
            return res.end(thumb);
        }
    }catch(e){
        console.error(e);
    }
    return res.status(404).send("Not Found");
})

app.listen(7050);
