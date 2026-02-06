// decompiled webpack structure: dependencies
var fs = require('fs');
var http = require('http');
var mime = require('mime');
var path = require('path');
var { URL } = require('url');
var { cfg, vmCtx } = require('./config');
var compileWrapper = require('./utils');

// make the http server i guess :/
http.createServer(function(req, res) {
    var url = req.url.split("?")[0].split("#")[0]; // total spider code
    var pu = new URL(req.url, `http://${req.headers.host}`); // also spiderweb code
    var query = pu.searchParams;
    var params = {};
    query.forEach(((e, i) => {
        params[i] = e;
    }));
    vmCtx.http.query = params;
    if(vmCtx.http.redirect) {
        delete vmCtx.http.redirect
    }
    if(url != "/") {
        if(fs.existsSync(path.join(cfg.httpDir, url + ".html"))) {
            compileWrapper(url, req, res)
        }
        if(fs.existsSync(path.join(cfg.httpDir, url))) {
            var type = mime.lookup(url);
            if(!type) {
                type = "application/octet-stream";
            }
            if(type == "text/html") {
                compileWrapper(url, req, res)
            } else {
                res.writeHead(200, {
                    "Content-Type": type
                });
                fs.createReadStream(path.join(cfg.httpDir, url)).pipe(res);
            }
        } else {
            res.writeHead(404, {
                "Content-Type": "text/html"
            });
            res.end("<h1>404 - Not found</h1><p>The resource you requested could not be found.")
        }
    } else {
        if(fs.existsSync(path.join(cfg.httpDir, "index.html"))) {
            compileWrapper('/index', req, res);
        } else {
            res.writeHead(404, {
                "Content-Type": "text/html"
            });
            res.end("<h1>404 - Not found</h1><p>The resource you requested could not be found.");
        }
    }
}).listen(cfg.port, "0.0.0.0");