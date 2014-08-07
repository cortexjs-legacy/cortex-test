#!/usr/bin/env node
"use strict";
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var program = require('optimist')
    .usage('test your cortex module against multi browsers')
    .alias("R", "reporter")
    .describe("R", "test reporter")
    .alias("m", "mode")
    .alias("V", "verbose")
    .describe("V")
    .alias("v", "version")
    .describe("v", "check version")
    .alias("h", "help")
    .describe("h");

var argv = program.argv;
var yaml = require('js-yaml');

var cortexTest = require('./lib/');
var logger = require('./lib/logger');

if (argv.version) {
    console.log(require("./package.json").version);
    return;
}

if (argv.help) {
    console.log(program.help());
    return;
}


var tests = argv._.length ? argv._ : ["test"];

function die(err){
    logger.error(err.stack || err.message || err);
    process.exit(1);
}

var cwd = argv.cwd || process.cwd();

var project_configs = {};
try {
  project_configs = yaml.safeLoad(fs.readFileSync( path.join(cwd, ".cortextest.yml") , 'utf8'));
} catch (e) {
    console.log(e);
  project_configs = {};
}

var args = _.extend({
    cwd: argv.cwd || process.cwd(),
    mode: argv.mode,
    reporter: argv.reporter
},project_configs);
args = _.extend(args,argv);

cortexTest(args)
.test(tests)
.on('complete',process.exit)
.on('error',die)
.on('log',logger.info);