class Collector {
  constructor() {
    this.results = {};
  }

  push(set, type, value) {
    if (this.results[set] === undefined) {
      this.results[set] = {};
    }

    if (this.results[set][type] === undefined) {
      this.results[set][type] = [value];
    } else {
      this.results[set][type].push(value);
    }
  }

  get(type) {
    let results = this.results;
    let keys = Object.keys(results);

    return {
      keys: keys,
      values: keys.map((result) => {
        return [...results[result][type]]
      })
    }
  }
}


const stats = module.exports.stats = ['compile', 'run', 'js', 'gc', 'callFunction', 'parseOnBackground', 'duration'];
const gcStats = module.exports.gcStats = ['usedHeapSizeBefore', 'usedHeapSizeAfter'];


module.exports.collectCallStats = (raw) => {
  let collector = new Collector();

  raw.forEach(result => {
    let set = result.set;

    result.samples.forEach(sample => {
      stats.forEach((stat) => {
        collector.push(set, stat, (sample[stat] / 1000));
      });

      sample.gcSamples.forEach(sample => {
        gcStats.forEach(stat => {
          collector.push(set, stat, (sample[stat] / 1000));
        });
      });
    });
  });

  return collector;
}

module.exports.collectPhases = (raw) => {
  let cumulativeCollector = new Collector();
  let selfCollector = new Collector();

  raw.forEach(result => {
    let set = result.set;

    result.samples.forEach(sample => {
      sample.phaseSamples.forEach(phaseSample => {
        cumulativeCollector.push(set, phaseSample.phase, (phaseSample.cumulative / 1000));
        selfCollector.push(set, phaseSample.phase, (phaseSample.self / 1000));
      });
    });
  });


  return [selfCollector, cumulativeCollector];
}
