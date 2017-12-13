const ChromeTracing = require('chrome-tracing');
const Runner = ChromeTracing.Runner;
const InitialRenderBenchmark = ChromeTracing.InitialRenderBenchmark;
const fs = require('fs');
const mkdirp = require('mkdirp').sync;
const mannWhitney = require('mann-whitney-utest');
const { collectCallStats, collectPhases, stats, gcStats } = require('../lib/collect');
const boxPlot = require('ascii-boxplot');
const { green, yellow, magenta } = require('chalk');
const { mean, median, mode } = require('simple-statistics');

const ITERATIONS = 50;

let browserOpts = {
  type: "canary",
  additionalArguments: [ "--headless", "--disable-gpu", "--hide-scrollbars", "--mute-audio" ],
};

const config = JSON.parse(fs.readFileSync("./benches/macro/config.json", "utf8"));

const LIGHTHOUSE_NETWORK_CONDTIONS = {
  latency: 150, // 150ms
  downloadThroughput: Math.floor(1.6 * 1024 * 1024 / 8), // 1.6Mbps
  uploadThroughput: Math.floor(750 * 1024 / 8), // 750Kbps
  offline: false
};

const markers = [
  { start: "navigationStart", label: "load" },
  { start: "beforeRender", label: "render" },
  { start: "afterRender", label: "fetch" },
  { start: "didFetch", label: "update" },
  { start: "didUpdate", label: "paint" },
]

const phases = markers.map(mark => mark.label);

const LIGHTHOUSE_CPU_THROTTLE = 4.5;

function emerging() {
  console.log(magenta('Running Emerging Markets:\n'))

  let emergingMarkets = config.servers.map(({ name, port }) => new InitialRenderBenchmark({
    name,
    url: `http://localhost:${port}/?perf.tracing`,
    markers,
    cpuThrottleRate: 10,
    runtimeStats: false,
    networkConditions: {
      "latency": 400,
      "uploadThroughput": 51200,
      "downloadThroughput": 51200,
      "offline": false
    },
    browser: browserOpts
  }));

  let emergingMarketsRunner = new Runner(emergingMarkets);

  return emergingMarketsRunner.run(ITERATIONS).then((results) => {
    fs.writeFileSync('results-emerging.json', JSON.stringify(results, null, 2));
    return produceStats(results);
  }).catch((err) => {
    console.error(err.stack);
    process.exit(1);
  });
}

function produceStats(results) {
  let callStatResults = collectCallStats(results);
  let [ selfResults, cumulativeResults ] = collectPhases(results);

  [...stats, ...gcStats].forEach(stat => {
    significance(callStatResults.get(stat), stat);
  });

  phases.forEach(phase => {
    console.log('Self');
    significance(selfResults.get(phase), phase);
    console.log('Cumulative');
    significance(cumulativeResults.get(phase), phase);
  });
}

function established() {
  console.log(magenta('Running Established Markets:\n'))
  let establishedMarkets = config.servers.map(({ name, port }) => new InitialRenderBenchmark({
    name,
    url: `http://localhost:${port}/?perf.tracing`,
    markers,
    cpuThrottleRate: LIGHTHOUSE_CPU_THROTTLE,
    runtimeStats: false,
    networkConditions: LIGHTHOUSE_NETWORK_CONDTIONS,
    browser: browserOpts
  }));

  let establishedMarketsRunner = new Runner(establishedMarkets);

  return establishedMarketsRunner.run(ITERATIONS).then((results) => {
    fs.writeFileSync('results-established.json', JSON.stringify(results, null, 2));
    return produceStats(results);
  }).catch((err) => {
    console.error(err.stack);
    process.exit(1);
  });
}

function significance(pairs, type) {
  let keys = pairs.keys;
  let samples = pairs.values;
  let u = mannWhitney.test(samples);

  if (mannWhitney.significant(u, samples)) {
    console.log(green(`Significant U Value For ${type}: [${u}]\n`))
  } else {
    console.log(yellow(`Insignificant U Value For ${type}: [${u}]\n`));
  }

  let args = {};

  keys.forEach((key, i) => args[key] = samples[i].sort((a, b) => a - b));

  console.log(`${type} ${keys.join(' vs. ')}\n`);
  boxPlot(args, { cols: 50 });

  Object.keys(args).forEach((key) => {
    let results = args[key];
    console.log(`${key}: Mean: %d Median: %d Mode: %d`, mean(results), median(results), mode(results));
  });

  console.log(`\n`);
}

module.exports = async function trace() {
  await established()
  return await emerging().then(() => {
    process.exit();
  });
}
