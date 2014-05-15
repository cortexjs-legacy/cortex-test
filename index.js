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
    .alias("V","verbose")
    .describe("V")
    .alias("v","version")
    .describe("v","check version")
    .alias("h","help")
    .describe("h");
var argv = program.argv;
var util = require('util');
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

    var runner;

    loadRunner(function(err,runner){
        if(err){return done(err);}

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

        
            loadReporter(function(err,Reporter){
                if(err){return done(err);}
                new Reporter(test); 
            });
        }


    });

}


function loadModule(type,name,callback){
    var module_name = "cortex-test-" + name + "-" + type;
    try{
        module = require(module_name);
    }catch(e){
        try{
            module = require(path.join(cwd,"node_modules",module_name));
        }catch(e){
            return callback(new Error(util.format("%s \"%s\" not found. type `npm install %s --save-dev` to install.",type,name,module_name)));
        }
    }
    callback(null,module);
}

function loadRunner(callback){
    if(mode == "local"){
        callback(null,require("./lib/runners/local"));
    }else{
        loadModule("adapter",mode,callback);
    }
}

function loadReporter(callback){
    var reporter = argv.reporter;
    if(reporter == "base"){
        return callback(null, require("./lib/reporters/base"))
    }
    loadModule("reporter",argv.reporter,callback);
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
        logger.error(err.stack || err.message || err);
        process.exit(1);
    }
});