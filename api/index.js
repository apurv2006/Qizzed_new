const createAzureFunctionHandler = require("@azure/functions-server").createHandler;
const app = require("./server");

module.exports = createAzureFunctionHandler(app);