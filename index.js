// decompiled webpack structure: dependencies
var fs = require('fs');
var cheerio = require('cheerio');
var vm = require('vm');
var http = require('http');
var mime = require('mime');
var path = require('path');
var { URL } = require('url');
var formidable = require('formidable');

// insecure; gonna be flattened into a JSON in the updated (master) branch
var cfg = eval(fs.readFileSync("./config.js").toString())();


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

function compile(filePath, req, cb) {
    vmCtx.http.method = req.method;
    vmCtx.http.status = 200;
    if(req.method == 'POST') {
        var form = new formidable.IncomingForm();
        form.uploadDir = cfg.uploadDir;
        form.keepExtensions = true;
        form.parse(req, function(error, i, s) {
            if(error) {
                vmCtx.http.formData = {};
                vmCtx.http.files = {};
                vmCtx.http.formError = true;
            } else {
                vmCtx.http.formData = i;
                vmCtx.http.files = s;
                vmCtx.http.formError = false;
            }
            cb(processHTML(filePath))
        });
    } else {
        vmCtx.http.formData = {};
        vmCtx.http.files = {};
        vmCtx.http.formError = false;
        cb(processHTML(filePath));
    }
}

function processHTML(e) {
    vmCtx.script.log = "";
    vmCtx.script.exports = "";
    var $ = cheerio.load(fs.readFileSync(e).toString());
    $('code[lang="serverscript"]').each((function (e) {
        var $elmnt = $(this);
        var $html;
        if($elmnt.attr("src")) {
            $html = fs.readFileSync(path.join(cfg.httpDir, $elmnt.attr("src"))).toString();
        } else {
            $html = $elmnt.html();

            // this should be refactored into `$html = $elmnt.html().trim();`
            if($html.startsWith("\n")) {
                $html = $html.slice(1);
            }
            if($html.endsWith("\n")) {
                $html = $html.slice(0, -1);
            }
        }
        try {
            vm.runInContext($html, vmCtx), $(this).replaceWith(vmCtx.script.exports)
        } catch (e) {
            // did a SPIDER write this code?!
            $(this).replaceWith('<pre style="color:red;background-color:#ddd;display:inline-block">Error:\n' + e.toString() + "</pre>")
        }
        // i have no words..... WHY DON'T YOU JUST CONSOLE.LOG IT INSTEAD OF APPENDING IT TO A MASTER LOG?!
        console.log(vmCtx.script.log);
    }));
    return $.html();
}

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
            compile(path.join(cfg.httpDir, url + ".html"), req, (e => {
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
            }));
        }
        if(fs.existsSync(path.join(cfg.httpDir, url))) {
            var type = mime.lookup(url);
            if(!type) {
                type = "application/octet-stream";
            }
            if(type == "text/html") {
                compile(path.join(cfg.httpDir, url), req, (e => {
                    if(vmCtx.http.redirect) {
                        res.writeHead(301, {
                            "Content-Type": type,
                            Location: vmCtx.http.redirect
                        });
                        res.end();
                    } else {
                        res.writeHead(vmCtx.http.status, {
                            "Content-Type": type
                        })
                        res.end(e);
                    }
                }))
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