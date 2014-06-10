var logger = require('./logger');
var async = require('async');
var builder = require("neuron-builder");
var glob = require('glob');
var ejs = require('ejs');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var url = require('url');
var temp = require('temp');


function generateScripts(config) {
    return function(done) {
        var build_config = config;
        var cwd = config.cwd;
        var test_file = config.file;
        var main_file = path.join(cwd, config.pkg.main || "index.js");
        var tasks = [

            function(done) {
                builder(main_file, build_config, done);
            },
            function(done) {
                builder(test_file, build_config, done);
            }
        ];

        async.parallel(tasks, function(err, scripts) {
            if (err) {
                return done(err);
            }
            done(null, {
                file: config.file,
                scripts: scripts
            });
        });
    }
}

function readHtml(config) {
    return function(done) {
        var htmlfile = config.file.replace(/\.js$/, '.html');
        fs.exists(htmlfile, function(exists) {
            if (exists) {
                fs.readFile(htmlfile, 'utf8', done);
            } else {
                done(null, '');
            }
        });
    }
}

function readTemplate(done) {
    var runner_template = path.join(__dirname, "../assets/runner.ejs");
    fs.readFile(runner_template, 'utf8', done);
}


function fileToMod(file, cwd) {
    return "./" + path.relative(cwd, file).replace(/.js$/, '');
}

function writeFile(file, result, done) {
    logger.verbose("write", file);
    fs.writeFile(file, result, function(err) {
        if (err) {
            done(err);
        } else {
            done(null, {
                path: file,
                content: result
            });
        }
    });
}

function generatePage(options, done) {

    async.parallel([
        readTemplate,
        readHtml(options),
        generateScripts(options)
    ], function(err, results) {
        if (err) {
            return done(err);
        }
        var template = results[0];
        var html = results[1];
        var scripts = results[2].scripts;
        var file = results[2].file;
        var cwd = options.cwd;
        var mode = options.mode;

        var test_dir = temp.path();
        var runner_file = options.destPath || path.join(test_dir, path.basename(options.file, ".js") + ".html");

        var name = options.pkg.name;
        var test = fileToMod(file, cwd);

        var root = options.root;
        var modpath = options.modpath || "/mod";

        if (!root && mode !== "local") {
            logger.error("argument `root` is required.");
            process.exit(1);
        }

        var result = ejs.render(template, {
            html: html,
            mode: mode,
            root: root,
            name: name,
            test: test,
            scripts: scripts
        });

        console.log('test', test)
        fs.exists(test_dir, function(exist) {
            if (!exist) {
                mkdirp(test_dir, function(err) {
                    if (err) {
                        return done(err)
                    }
                    writeFile(runner_file, result, done);
                });
            } else {
                writeFile(runner_file, result, done);
            }
        });
    });
}

exports.build = generatePage;