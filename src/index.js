// src/server.js
const app = require('./app');
const config = require('./config/config');

app.listen(config.port, () => {
    console.log(`🌐🔄 Server running on port 🚀: ${config.port} 🌐🔧`);
});
