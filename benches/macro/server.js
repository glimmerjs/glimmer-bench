const _HARRemix = require('har-remix');
const HARRemix = _HARRemix.default;
const HAR = HARRemix.HAR;
const ServerDelegate = HARRemix.ServerDelegate;
const url = require('url');
const http = require('http');
const fs = require('fs');
const glob = require('glob').sync;

const config = JSON.parse(fs.readFileSync("./benches/macro/config.json", "utf8"));

module.exports = function startServers() {
  config.servers.forEach(server => {
    startServer(server.name, config.har, server.port, (key, text) => {
      if (key === 'GET/') {
        let indexFile = `./${server.dist}/index.html`;
        console.log(`Replacing GET/ with ${indexFile}`);
        return fs.readFileSync(indexFile, 'utf8')
          // remove hashes from url
          .replace(/app-[0-9a-fA-F]{32}\.(js|css)/g, 'app.$1')
      }

      if (key === 'GET/app.js') {
        let [appFile] = glob(`./${server.dist}/app-*.js`);
        console.log(`Replacing GET/app.js with ${appFile}`);
        return fs.readFileSync(appFile, 'utf8');
      }

      return text;
    });
  });
}

function key(method, url) {
  if (method === 'GET') {
    if (url.pathname === '/') {
      return 'GET/';
    }
    // convert hashed keys to plain.
    let match = /app-[0-9a-fA-F]{32}\.(js|css)/.exec(url.pathname);
    if (match) {
      return `GET/app.${match[1]}`;
    }
  }
  return method + url.path;
}

function replaceProtocolAndDomain(text, host) {
  return text.replace(/https:\/\//g, "http://");
}

function startServer(name, archivePath, port, vary) {
  let host = `localhost:${port}`;

  function keyForArchiveEntry(entry) {
    let { request, response } = entry;
    let { status } = response;
    if (status >= 200 && status < 300 && request.method !== "OPTIONS") {
      return key(request.method, url.parse(request.url));
    }
  }

  function keyForServerRequest(request) {
    return key(request.method, url.parse(request.url));
  }

  function textFor(entry, key, text) {
    console.log('textFor', key);

    if (entry.request.method !== "GET") return text;

    text = vary(key, text);

    return replaceProtocolAndDomain(text, host);
  }

  let harRemix = new HARRemix({ keyForArchiveEntry, keyForServerRequest, textFor });

  harRemix.loadArchive(archivePath);
  let favicon = Buffer.from("AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFuD+ABbg/gHWoP4RFqD96Bag/fbWoP39VqD9/Vag/fbWoP3n1qD+ERbg/gHW4P4AAAAAAAAAAAAXo77AFqD9wBahPgWWoP3jFqD9+pag/f/W4P3/1mC9/9ag/f/WoP3/1qD9/9ag/fqWoP3jFqE+BZag/cAXo77AFqD9wBahPgXWoP3q1qD9/1Xgff/Y4r3/6zB+/+AoPn/XIT3/6G4+v+Dovn/WYL3/1qD9/1ag/erWoT4F1qD9wBchPkFWoP3jFqD9/1gh/f/kKz6/3ma+P/C0fz/4+r+/4Sj+f+etvr/gaD5/1iB9/9Ygvf/WoP3/VqD94xchPkFWoP4RVqD9+lZgvf/Yon3/83a/f/V4P3/gqH5/8bU/P/j6v7/gKD5/1eB9/9xlPj/f5/5/1uE9/9ag/fpWoP4RVqD959Zgvf/bJH4/5qz+v9+nvn/1+H9/8/b/f90lvj/xdP8/+Pq/v9/n/n/k676/+nv/v+QrPr/WYL3/1qD959ag/faWYL3/3OW+P+xxfv/Z434/3WX+P+dtfr/aY74/3KV+P/F0/z/4+r+/4qn+f+pvvv/nLX6/1qD9/9ag/faWoP39VqD9/9Zgvf/WIH3/42q+v+3yfz/ZYv4/5Su+v/N2f3/gqH5/8TS/P/j6v7/g6L5/1qD9/9ag/f/WoP39VqD9/VZgvf/bZL4/46q+v+Fo/n/5Or+/8bU/P+AoPn/1d/9/9fg/f+Bofn/wtL8/+Xr/v+Dovn/WYL3/1qD9/Vag/fbWIL3/36e+f/p7v7/scX7/4il+f/j6v7/xdT8/4Gg+f/U3/3/1+H9/4Kh+f++zvz/qb/7/1uD9/9ag/fbWoP3n1qD9/9bhPf/k676/+zx/v+swPv/gqH5/+Pq/v/F0/z/gaD5/9Tf/f/Y4v3/eZr5/2CI9/9ag/f/WoP3n1qD+EVag/fpWoP3/1qD9/+Pq/r/oLj6/2iN+P+GpPn/4+r+/8bU/P+Cofn/yNX8/46q+f9Ygff/WoP36VqD+EVchPkFWoP3jFqD9/1ag/f/WYL3/2CH9/+9zvz/jKj5/36e+f/e5v3/mbL6/1+H9/9ehvf/WoP3/VqD94xchPkFWoT3AFqE+Bdag/erWoP3/VqD9/9chPf/gJ/5/2yR+P9Zgvf/b5L4/2iO+P9Zgvf/WoP3/VqD96tahPgXWoP3AF6O+wBag/cAW4T4FlqD94xag/fqWoP3/1iC9/9Zgvf/WoP3/1mC9/9Zgvf/WoP36lqD94xbhPgWWoP3AF6O+wAAAAAAAAAAAFuD+ABbg/gHWoP4RFqD959ag/fbWoP39VqD9/Vag/fbWoP3n1qD+ERbg/gHW4P4AAAAAAAAAAAA4AcAAMADAACAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIABAADAAwAA4AcAAA==", "base64");
  harRemix.setResponse("GET/favicon.ico", harRemix.buildResponse(200, "image/x-icon", favicon, false));

  console.log(`starting ${name}`);
  let server = harRemix.createServer();
  server.on("listening", () => {
    if (typeof gc !== 'undefined') {
      console.log('GC');
      gc(true);
    }
    console.log(`${name} started at http://localhost:${port}/`);
  });
  server.on("error", (e) => console.error(e));
  server.listen(port);
}
