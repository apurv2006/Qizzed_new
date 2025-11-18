// api/index.js
const createHandler = require("azure-function-express").createHandler;
const app = require("./server");

module.exports = createHandler(app);
