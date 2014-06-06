#!/usr/bin/env node

"use strict";
var program = require('optimist')
    .usage('test your cortex module against multi browsers')
    .alias("R", "reporter")
    .describe("R", "test reporter")
    .default("R", "base")
    .alias("m", "mode")
    .default("m", "local")
    .alias("r", "root")
    .describe("r", "static root, such as `http://i2.dpfile.com/mod`")
    .alias("V", "verbose")
    .describe("V")
    .alias("v", "version")
    .describe("v", "check version")
    .alias("h", "help")
    .describe("h");

var argv = program.argv;
var util = require('util');
var path = require('path');
var fs = require('fs');
var logger = require('./lib/logger');
var jf = require('jsonfile');
var async = require('async');
var _ = require('underscore');
var glob = require('glob');
var readPackageJson = require("read-cortex-json");

var cwd = argv.cwd || process.cwd();

var builder = require("./lib/builder");

var mode = argv.mode;

var readPackage = readPackageJson.get_original_package;

var Adapter = loadAdapter();
var Reporter = loadReporter();

function containsInArgv(arg) {
    return arg in argv;
}


function buildPage(file) {
    return function(done) {
        readPackage(cwd, function(err, pkg) {
            if (err) {
                return done(err);
            }
            builder.build(_.extend({
                build_mode: Adapter.build_mode,
                pkg: pkg,
                file: file,
                targetVersion: "latest",
                cwd: cwd
            }, argv), function(err, result) {
                done(err, result && result.path);
            });
        });
    }
}

function testPage(htmlpath, done) {
    var option = _.extend({
        cwd: cwd,
        path: htmlpath
    }, argv);
    var test;

    if (mode == "local") {
        Adapter.test(option);
        done();
    } else {
        test = new Adapter(option).on('error', function(err) {
            logger.error(err);
        }).on('log', function(info) {
            logger.verbose(info);
        }).test();
        var reporter = new Reporter(test);
        reporter.once("done", function(fail) {
            done(fail);
        });
    }
}


function loadModule(type, name) {
    var module_name = "cortex-test-" + name + "-" + type;
    try {
        module = require(module_name);
    } catch (e) {
        try {
            module = require(path.join(cwd, "node_modules", module_name));
        } catch (e) {
            throw new Error(util.format("%s \"%s\" not found.\n" + "Type `npm install %s -g` to install.\n",
                type,
                name,
                module_name,
                module_name
            ));
        }
    }

    return module;
}

function loadAdapter() {
    if (mode == "local") {
        return require("./lib/adapters/local");
    } else {
        return loadModule("adapter", mode);
    }
}

function loadReporter() {
    var reporter = argv.reporter;
    if (reporter == "base") {
        return require("./lib/reporters/base");
    } else {
        return loadModule("reporter", argv.reporter);
    }
}


if (argv.version) {
    console.log(require("./package.json").version);
    return;
}

if (argv.help) {
    console.log(program.help());
    return;
}

logger.info("cortex test in %s mode", mode);

glob(cwd + '/test/**/*.js', function(err, matches) {
    async.mapSeries(matches, function(file, done) {
        buildPage(file)(function(err, htmlpath) {
            if (err) {
                return done(err);
            }
            testPage(htmlpath, done);
        });
    }, function(err) {
        if (err) {
            logger.error(err.stack || err.message || err);
            process.exit(1);
        } else {
            if (mode !== "local") {
                process.exit(0);
            }
        }
    });

});