
const homeTool = require('../home/home.js');

exports.get = (req) => homeTool.renderHome(req, 'false');
