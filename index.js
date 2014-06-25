#!/usr/bin/env node
"use strict";
var _ = require('underscore');
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

cortexTest(_.extend({
    cwd: argv.cwd || process.cwd(),
    mode: argv.mode,
    reporter: argv.reporter
},argv)).test(tests)
.on('error',logger.error)
.on('log',logger.info);