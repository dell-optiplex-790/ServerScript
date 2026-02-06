// decompiled webpack structure: dependencies
var fs = require('fs');
var vm = require('vm');
var http = require('http');
var mime = require('mime');
var path = require('path');
var { URL } = require('url');
var cfg = require('./config');
var compileWrapper = require('./utils');

// context for node:vm
var vmCtx = {
    script: {
        exports: '',
        log: ''
    },
    debug: {
        log: function(msg) {
            script.log += msg + "\n";
        }
    },
    http: {
        formData: {},
        files: {},
        formError: false,
        method: '',
        status: 200,
        query: {}
    },
    base64: {
        encode: btoa,
        decode: atob
    },
    filesystem: fs,
    path: path,
    publicDir: cfg.httpDir,
    jsdir: __dirname
};

// you know what this is so WHY SHOULD I EXPLAIN IT
vm.createContext(vmCtx);

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
            compileWrapper(url, req)
        }
        if(fs.existsSync(path.join(cfg.httpDir, url))) {
            var type = mime.lookup(url);
            if(!type) {
                type = "application/octet-stream";
            }
            if(type == "text/html") {
                compileWrapper(url, req)
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
            if(vmCtx.http.redirect) {
                res.writeHead(301, {
                    "Content-Type": "text/html",
                    Location: vmCtx.http.redirect
                });
                res.end();
            } else {
                res.writeHead(vmCtx.http.status, {
                    "Content-Type": "text/html"
                });
                res.end(e);
            }
        } else {
            res.writeHead(404, {
                "Content-Type": "text/html"
            });
            res.end("<h1>404 - Not found</h1><p>The resource you requested could not be found.");
        }
    }
}).listen(cfg.port, "0.0.0.0");