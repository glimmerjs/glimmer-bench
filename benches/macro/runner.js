const { mkdirSync, readFileSync } = require('fs');
const execa = require('execa');
const ora = require('ora');
const trace = require('./index');
const startServer = require('./server');
const argv = require('minimist')(process.argv.slice(2));
const GLIMMER_PACKAGES = ['runtime', 'reference', 'object-reference', 'runtime', 'util', 'compiler', 'wire-format', 'syntax'].map(pkg => `@glimmer/${pkg}`);

function cmd(instructions) {
  console.log(instructions);
  return execa.shell(`${instructions}`).then((r) => r.stdout, (r) => r.stderr);
}

function mkdir(dir) {
  return cmd(`mkdir -p ${dir}`);
}

function git(command) {
  return cmd(`git ${command}`);
}

function build() {
  return cmd(`ember build --environment=production`);
}

function moveDist(dest) {
  return cmd(`rm -rf ${dest} && mv dist ${dest}`);
}

function link() {
  return cmd(`yarn link ${GLIMMER_PACKAGES.join(' ')}`);
}

function unlink() {
  return cmd(`yarn unlink ${GLIMMER_PACKAGES.join(' ')}`);
}

function yarn() {
  return cmd(`yarn`);
}

function logger(message) {
  logger = ora(message).start();
  return (message, color = 'cyan', done) => {
    if (done) {
      logger.succeed([message]);
    } else {
      logger.text = message;
      logger.color = color;
    }
  }
}

async function run() {
  const HEAD = await git('rev-parse HEAD');
  const MASTER_HEAD = await git('rev-parse master');
  const COMMIT_BRANCH = await git('symbolic-ref --short HEAD');
  let log = logger(`Checking out master@${MASTER_HEAD}`);

  if (argv.ci) {
    await git(`checkout ${MASTER_HEAD}`);
  }

  log(`Building master@${MASTER_HEAD}`);

  if (argv.link) {
    await unlink();
    await yarn();
  }

  await build();

  log(`Moving baseline to ./baseline-dist`);

  await moveDist('baseline-dist');

  if (argv.link) {
    await link();
  } else {
    log(`Checking out HEAD@${HEAD}`);

    await git(`checkout ${HEAD}`);
  }

  await build();

  if (argv.link) {
    log(`Linked and Built Successfully`, 'green', true);
  } else {
    log(`Built master@${MASTER_HEAD} & HEAD@${HEAD}`, 'green', true);
  }

  startServer();

  if (argv.ci) {
    return await trace();
  } else {
    await trace();
  }

  if (argv.link) {
    return Promise.resolve();
  }

  return await git(`checkout ${COMMIT_BRANCH}`);
}

run().catch((err) => {
  console.error(err.stack);
  process.exit(1);
});;
