(function() {
	var path = require('path')
	var httpDir = path.join(__dirname, 'public');
	return {
		uploadDir: path.join(httpDir, 'uploads'),
		port: 3000,
		httpDir
	}
})