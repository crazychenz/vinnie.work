"use strict";

// "start": "webpack serve --mode development",
//     "build:web": "webpack --mode production --env MDXP_MODE=web --env PUBLIC_PATH=./ --env ANALYZE=true",
//     "build:onepage": "webpack --mode development --env MDXP_MODE=onepage",
//     "build:pdf": "pdf -u ./dist/onepage/index.html ./dist/presentation.pdf"

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { spawn } from 'child_process';

var _yarnCmd = "yarn";
if (process.platform === "win32") {
    _yarnCmd = "yarn.cmd";
}
const YARN = _yarnCmd;

function process_command(cmd, postAction = (code) => {console.log(`child process exited with code ${code}`); return 0;})
{
  var retcode = -1;
  //cmd.stdout.on("data", data => { process.stdout.write(data); });
  //cmd.stderr.on("data", data => { process.stdout.write(data); });
  cmd.on('error', (error) => { console.error(`${error.message}`); });
  cmd.on("close", code => { retcode = code; return postAction(code); });
  return retcode;
}

function build_onepage(mode, deck, postAction)
{
  const cmd = spawn(YARN, ["webpack", "--mode", mode, "--env", `DECK=${deck}`, "--env", "MDXP_MODE=onepage"], {stdio: 'inherit'});
  return process_command(cmd, postAction);
}

function build_web(mode, deck)
{
  const cmd = spawn(YARN, ["webpack", "--mode", mode, "--env", `DECK=${deck}`, "--env", "MDXP_MODE=web", "--env", "PUBLIC_PATH=./", "--env", "ANALYZE=true"], {stdio: 'inherit'})
  return process_command(cmd);
}

function _build_pdf(deck)
{
  const cmd = spawn(YARN, ["pdf", "-u", `./dist/${deck}/onepage/index.html`, `./dist/${deck}/presentation.pdf`], {stdio: 'inherit'})
  return process_command(cmd);
}

function build_pdf(mode, deck) {
  build_onepage(mode, deck, (code) => {if (code == 0) return _build_pdf(deck);});
}

function start_dev_server(mode, deck)
{
  const cmd = spawn(YARN, ["webpack", "serve", "--mode", mode, "--env", `DECK=${deck}`], {stdio: 'inherit'})
  return process_command(cmd);
}

var argv = {};

yargs(hideBin(process.argv))
  .command(
    'serve',
    'Build with dev server.',
    (yargs) => {
      yargs.option('dev', {
        type: 'boolean',
        description: 'Run with development mode (default: production)'
      })
      .option('deck', {
        alias: 'd',
        description: 'Folder name of deck.',
        type: 'string',
        demandOption: true,
      })
    },
    (_argv) => {
      argv = _argv;
    })
  .command(
    'build',
    'Build presentation.',
    (yargs) => {
      yargs.option('dev', {
        type: 'boolean',
        description: 'Run with development mode (default: production)'
      })
      .option('deck', {
        alias: 'd',
        description: 'Folder name of deck.',
        type: 'string',
        demandOption: true,
      })
      .option('format', {
        alias: 'f',
        description: 'Output Format',
        choices: ['onepage', 'web', 'pdf'],
        default: "web",
      })
    },
    (_argv) => {
      argv = _argv
    })
  .help()
  .alias('help', 'h')
  .argv;

var mode = "production";
if (argv.dev) {
  mode = "development";
}

//console.log("Mine: ", argv);

if (argv._[0] == 'build') {
  if (argv.format === "onepage") {
    build_onepage(mode, argv.deck);
  }
  else if (argv.format === "web") {
    build_web(mode, argv.deck);
  }
  else if (argv.format === "pdf") {
    build_pdf(mode, argv.deck);
  }
}
else if (argv._[0] == 'serve') {
  start_dev_server(mode, argv.deck);
}


