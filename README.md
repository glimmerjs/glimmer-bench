# glimmer-bench

Benchmarks for Glimmer and Glimmer VM. Currently it uses [chrome-tracing](https://github.com/krisselden/chrome-tracing) to launch Chrome and collect diagnostics. This runs two synthetic environments: "Established Markets" and "Emerging Markets".

### Established Markets
We use the network and CPU throttle values from [LightHouse](https://github.com/GoogleChrome/lighthouse). We feel that these are representative of a typical mobile user in countries where the population of internet users have fairly good telecoms infrastructure and mid to high range phones.

### Emerging Markets
We use a the 3G Emerging Markets (400KBPS, 400MS RTT) as indicated on [WebPageTest](https://webpagetest.org) along with a 10X CPU throttle. This is to create a synthetic environment in emerging markets like India.

## Basic Usage
The basic usage is to compare master (used as a baseline) and a linked version of the Glimmer VM.

```
yarn run link:bench
```

This will first build master, move it to `baseline-dist`, link the VM packages, then build the experiment. Once it has built the 2 apps it will run the benchmarks.

At the end of the benchmarks you will get some output that looks like the following:

```
Insignificant U Value For compile: [406.5,493.5]

compile baseline vs. experiment

baseline      ·•[---[=====|====]---]    •·
experiment    ·•[---[======|=====]-----]     •·


Insignificant U Value For run: [484,416]

run baseline vs. experiment

baseline       ·•[[|]]•·
experiment    ·•[[|]----]                    •·


Insignificant U Value For js: [533,367]

js baseline vs. experiment

baseline        ·•[[==|===]-] •·
experiment    ·•[[==|====]----------]        •·
...
```

This will tell you if your changes had an significance on various statistics collected during the benchmarks. It will also print a box plot to understand the distribution of results.


## CI Usage

TODO
