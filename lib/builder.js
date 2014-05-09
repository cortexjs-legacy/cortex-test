var logger = require('./logger');
var async = require('async');
var neuronBuilder = require("neuron-builder");
var glob = require('glob');
var ejs = require('ejs');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var url = require('url');
var temp = require('temp');

function generateTasks(config, done){
    var build_config = config;
    var cwd = config.cwd;
    var main_file = path.join(cwd, config.pkg.main || "index.js");
    var tasks = [function(done){
        neuronBuilder.parse(main_file , build_config, done);
    }];

    glob( path.join(cwd, "test/*.js"), function (err, files) {
        if(err){return done(err);}
        files.forEach(function(file){
            tasks.push(function(done){
                neuronBuilder.parse(file , build_config, done);
            });
        });

        done(null, {
            files: files,
            tasks: tasks
        });

    });
}

function generateScripts(config){
    return function(done){
        generateTasks(config, function(err, result){
            if(err){return done(err);}
            var files = result.files;
            var tasks = result.tasks;
            async.parallel(tasks, function(err, scripts){
                if(err){return done(err);}
                done(null, {
                    files: files,
                    scripts: scripts
                });
            });
        });   
    }
}

function readTemplate(done){
    var runner_template = path.join(__dirname,"../assets/runner.ejs");
    fs.readFile(runner_template,'utf8',done);
}


function fileToMod(name,cwd){
    return function(file){
        return "./" + path.relative(cwd,file).replace(/.js$/,'');
    }
}

function writeFile(file,result,done){
    logger.verbose("write", file);
    fs.writeFile(file, result, function(err){
        if(err){
            done(err);
        }else{
            done(null,{
                path: file,
                content: result
            });
        }
    });
}

function generatePage(options, done){

    async.parallel([
        readTemplate,
        generateScripts(options)
    ],function(err,results){
        if(err){
            return done(err);
        }
        var template = results[0];
        var scripts = results[1].scripts;
        var files = results[1].files;
        var cwd = options.cwd;
        var mode = options.mode;

        var test_dir = temp.path();
        var runner_file = path.join(test_dir, "runner.html");

        var name = options.pkg.name;
        var tests = files.map(fileToMod(name,cwd));

        var cortexserver = options.cortexserver;

        var result = ejs.render(template,{
            mode: mode,
            server: "http://" + cortexserver,
            name: name,
            tests: tests,
            scripts: scripts.join("\n")
        });

        fs.exists(test_dir, function(exist){
            if(!exist){
                mkdirp(test_dir, function(err){
                    if(err){return done(err)}
                    writeFile(runner_file,result,done);
                });
            }else{
                writeFile(runner_file,result,done);
            }
        });
    });
}


exports.build = generatePage;