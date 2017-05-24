const DEFAULT_OPTIONS = {
  "cpu": 4,
  "runtimeStats": false,
  "network": {
    "latency": 400,
    "uploadThroughput": 51200,
    "downloadThroughput": 51200,
    "offline": false
  }
}

module.exports = function(options) {
  let servers = options.servers;
  return Object.assign({}, DEFAULT_OPTIONS, options, {
    "servers": [{
      "name": "baseline",
      "port": 8879,
      "dist": "baseline-dist"
    }, ...servers]
  })
}


