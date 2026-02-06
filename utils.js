var cfg = require('./config');
var formidable = require('formidable');
var cheerio = require('cheerio');

function compile(filePath, req, cb) {
    vmCtx.http.method = req.method;
    vmCtx.http.status = 200;
    if(req.method == 'POST') {
        var form = new formidable.IncomingForm();
        form.uploadDir = cfg.uploadDir;
        form.keepExtensions = true;
        form.parse(req, function(error, data, files) {
            if(error) {
                vmCtx.http.formData = {};
                vmCtx.http.files = {};
                vmCtx.http.formError = true;
            } else {
                vmCtx.http.formData = data;
                vmCtx.http.files = files;
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
    var $ = cheerio.load(fs.readFileSync(e, 'utf8'));
    $('script[for="server"]').each((function (e) {
        var $elmnt = $(this);
        var $html;
        if($elmnt.attr("src")) {
            $html = fs.readFileSync(path.join(cfg.httpDir, $elmnt.attr("src")), 'utf8');
        } else {
            $html = $elmnt.html().trim();
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

function compileWrapper(url, req) {
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

module.exports = compileWrapper;