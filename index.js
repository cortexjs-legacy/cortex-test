#!/usr/bin/env node
var program = require('optimist')
    .usage('test your cortex module against multi browsers')
    .alias("R","reporter")
    .describe("R","test reporter")
    .default("R","base")
    .alias("m","mode")
    .default("m","local")
    .alias("r","root")
    .describe("r","static root, such as `http://i2.dpfile.com/mod`")
    .alias("b","browser")
    .describe("b","browser list, such as `firefox,chrome,ie@>8.0.0`")
    .alias("V","version")
    .describe("V","check version")
    .describe("v")
    .alias("h","help")
    .describe("h");
var argv = program.argv;
var path = require('path');
var fs = require('fs');
var logger = require('./lib/logger');
var jf = require('jsonfile');
var async = require('async');
var _ = require('underscore');
var readPackageJson = require("read-cortex-json");


var cwd = argv.cwd || process.cwd();

var builder = require("./lib/builder");

var mode = argv.mode;

var runner = mode == "local" ? require("./lib/runners/local") : require("cortex-test-" + mode + "-adapter");

var readPackage = readPackageJson.get_original_package;

function containsInArgv(arg){
    return arg in argv;
}

function buildPage(done){
    readPackage(cwd, function(err, pkg){
        if(err){return done(err);}
        builder.build( _.extend({
            mode: mode,
            pkg : pkg,
            targetVersion : "latest",
            cwd : cwd
        },argv),function(err,result){
            done(err, result && result.path);
        });
    });
}

function testPage(htmlpath, done){
    var option = _.extend({
        cwd: cwd,
        path: htmlpath
    },argv);
    var test;


    if(mode == "local"){
        runner.test(option);
        return;
    }else{
        test = runner(option)
            .on('error',function(err){
                logger.error(err);
                done(err);
            })
            .on('log', function(info){
                logger.verbose(info);
            })
            .test();


        var Reporter = loadReporter();
        new Reporter(test);
    }
}

function loadReporter(){
    var name = argv.reporter;
    var reporter;

    try{
        reporter = require("./lib/reporters/" + name);
    }catch(e){
        reporter = require("cortex-test-" + name + "-reporter");
    }
    return reporter;
}


if(argv.version){
    console.log(require("./package.json").version);
    return;
}

if(argv.help){
    console.log(program.help());
    return;
}

logger.info("cortex test in %s mode",mode);
async.waterfall([buildPage,testPage],function(err){
    if(err){
        logger.error(err.message || err);
        logger.error(err.stack);
        process.exit(1);
    }
});