"use strict";

const yargs = require('yargs');
const { spawn } = require("child_process");

var _yarnCmd = "yarn";
if (process.platform === "win32") {
    _yarnCmd = "yarn.cmd";
}
const YARN = _yarnCmd;

const argv = yargs
    // .command('lyr', 'Tells whether an year is leap year or not', {
    //     year: {
    //         description: 'the year to check for',
    //         alias: 'y',
    //         type: 'number',
    //     }
    // })
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
        default: "onepage",
    })
    .help()
    .alias('help', 'h')
    .argv;

function process_command(cmd)
{
    var retcode = -1;
    cmd.stdout.on("data", data => { console.log(`${data}`); });
    cmd.stderr.on("data", data => { console.log(`${data}`); });
    cmd.on('error', (error) => { console.log(`${error.message}`); });
    cmd.on("close", code => { retcode = code; console.log(`child process exited with code ${code}`); });
    return retcode;
}

function build_onepage()
{
    var retcode = -1;
    const cmd = spawn(YARN, ["cross-env", `DECK=${argv.deck}`, "MDXP_MODE=onepage", "webpack", "--stats-children", "--mode", "production"])
    retcode = process_command(cmd);

    if (retcode == 0) {
        const rm = spawn(YARN, ["rimraf", `dist/${argv.deck}/onepage/*.js`, `dist/${argv.deck}/onepage/*.css`])
        return process_command(rm);
    }

    return retcode;
}

function build_web()
{
    const cmd = spawn(YARN, ["cross-env", `DECK=${argv.deck}`, "MDXP_MODE=web", "PUBLIC_PATH=./", "ANALYZE=true", "webpack", "--stats-children", "--mode", "production"])
    return process_command(cmd);
}


function build_pdf()
{
    build_onepage();

    const cmd = spawn(YARN, ["pdf", "-u", `./dist/${argv.deck}/onepage/index.html`, `./dist/${argv.deck}/presentation.pdf`])
    return process_command(cmd);
}

if (argv.format === "onepage") {
    build_onepage();
}
else if (argv.format === "web") {
    build_web();
}
else if (argv.format === "pdf") {
    build_pdf();
}


