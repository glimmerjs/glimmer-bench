const { mkdirSync } = require('fs');
const execa = require('execa');
const ora = require('ora');


function cmd(instructions) {
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
  return cmd(`rm -rf ${dest} && mkdir -p ${dest} && mv dist/ ${dest}`);
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
  const MASTER_HEAD = await git('rev-parse master')
  let log = logger(`Checking out master@${MASTER_HEAD}`);

  await git(`checkout ${MASTER_HEAD}`);

  log(`Building master@${MASTER_HEAD}`);

  await build();

  log(`Moving baseline to ./baseline-dist`);

  await moveDist('baseline-dist');

  log(`Checking out HEAD@${HEAD}`);

  await git(`checkout ${HEAD}`);

  log(`Building HEAD@${HEAD}`);

  return build().then(() => log(`Built master@${MASTER_HEAD} & HEAD@${HEAD}`, 'green', true));
}

run();
