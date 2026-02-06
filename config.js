var vm = require('vm');
var fs = require('fs');
var path = require('path');
var cfg;
try {
    cfg = JSON.parse(fs.readFileSync("config.json", 'utf8'));
} catch {
    console.warn('Invalid config')
    cfg = {
        uploadDir: "uploads",
        port: 3000,
        httpDir: "public"
    }
}
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
        query: {},
        cookies: {}
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
module.exports = {cfg, vmCtx};