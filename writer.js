const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src', 'app', 'dashboard', 'history');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
