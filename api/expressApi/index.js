// api/expressApi/index.js
const createHandler = require('azure-function-express').createHandler;
const app = require('./server'); // exports the express app
module.exports = createHandler(app);
