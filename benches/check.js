const startServers = require('./macro/server');
const trace = require('./macro/index');

(async () => {
  await startServers();
})().catch(e => console.error(e));
