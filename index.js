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
    .describe("test-dir", "check version")
    .alias("h", "help")
    .describe("h");

var argv = program.argv;
var gaze = require('gaze');
var util = require('util');
var path = require('path');
var fs = require('fs');
var logger = require('./lib/logger');
var jf = require('jsonfile');
var async = require('async');
var _ = require('underscore');
var glob = require('glob');
var readPackageJson = require("read-cortex-json");

var tests = argv._.length ? argv._ : ["test"];

var cwd = argv.cwd || process.cwd();
var testDir = argv["test-dir"] || "test";
var builder = require("./lib/builder");

var mode = argv.mode;

var readPackage = readPackageJson.get_original_package;

var Adapter = loadModule("adapter", argv.mode);
var Reporter = loadModule("reporter", argv.reporter);

function buildPage(file, destPath) {
    return function(done) {
        readPackage(cwd, function(err, pkg) {
            if (err) {
                return done(err);
            }
            builder.build(_.extend({
                mode: mode,
                pkg: pkg,
                file: file,
                destPath: destPath,
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
        path: htmlpath,
        app: require(path.join(cwd, 'package.json')).name
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
        module = require("./lib/" + type + "s/" + name);
    } catch (e) {
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
    }

    return module;
}

function getTestFiles(callback) {
    async.map(tests, function(test, done) {
        var testPath = path.join(cwd, test);
        fs.stat(testPath, function(err, stats) {
            if (err) {
                return done(err);
            }
            if (stats.isFile()) {
                done(null, [testPath]);
            } else if (stats.isDirectory()) {
                glob(path.join(test, "**.js"), function(err, matches) {
                    if (err) {
                        return done(err);
                    }
                    done(null, matches.map(function(item) {
                        return path.join(cwd, item);
                    }));
                });
            } else {
                done(null);
            }
        });
    }, function(err, files) {
        files = _.flatten(files).filter(function(file) {
            return file;
        });
        callback(null, files);
    });
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

getTestFiles(function(err, matches) {
    async.mapSeries(matches, function(file, done) {
            var built_html = null;
            logger.info("Testing", path.relative(cwd, file));
            buildPage(file)(function(err, htmlpath) {
                if (err) {
                    return done(err);
                }
                built_html = htmlpath;
                testPage(htmlpath, done);
            });
            if (mode == "local") {
                gaze(file, function() {
                    this.on('changed', function() {
                        console.log("changed", file);
                        built_html && buildPage(file, built_html)(function(err) {});
                    });
                });
            }
        },
        function(err) {
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