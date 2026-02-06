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
module.exports = cfg;