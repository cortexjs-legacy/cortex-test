'use strict';

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
var express = require('express');
var _ = require('underscore');
var localtunnel = require('localtunnel');

function generateScripts(config) {
  return function(done) {
    var build_config = {
      cwd:config.cwd,
      pkg:config.pkg
    };
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

function generateTree(config){
  var shrinkwrap = require('cortex-shrinkwrap');
  var neurontree = require('neuron-tree');
  var profile = require('cortex-profile');
  var shrinked = require('shrinked');

  return function(done){
    var p = profile().init();

    shrinkwrap.shrinktree(config.pkg, p.get('cache_root'), {
      dev: true
    }, function(err, json){
      if(err){return done(err);}
      var tree = shrinked.parse(json,{
        dependencyKeys:['dependencies','devDependencies','asyncDependencies']
      });
      tree = neurontree.parse(tree);
      done(null, tree);
    });
  };
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
    generateScripts(options),
    generateTree(options),
  ], function(err, results) {
    if (err) {
      return done(err);
    }

    var template = results[0];
    var html = results[1];
    var scripts = results[2].scripts;
    var file = results[2].file;
    var tree = results[3];
    var cwd = options.cwd;
    var mode = options.mode;
    var adapter = options.adapter;

    var name = options.pkg.name;
    var version = options.pkg.version;
    var test = fileToMod(file, cwd);

    var root = options.root;
    var modpath = options.modpath || "/mod";

    var result = ejs.render(template, {
      html: html,
      mode: mode,
      name: name,
      version: version,
      test: test,
      tree: tree,
      scripts: scripts,
      host: options.host
    });


    if (options.adapter.inject) {
      adapter.inject(result, done);
    } else {
      done(null, result);
    }
  });
}

var app = null;

function serverAddPath(options, done) {
  options.port || (options.port = 1976);
  prepare(options, function(err) {
    if (err) {
      return done(err);
    }

    var html_path = '/' + path.basename(options.file).replace(/\.js$/, '.html');
    app.get(html_path, function(req, res) {
      generatePage(_.extend(options, {
        host: req.headers.host
      }), function(err, result) {
        if (err) {
          return res.send(500, result);
        }
        res.send(200, result);
      });
    });

    var local_url = url.format({
      protocol: "http",
      hostname: "127.0.0.1",
      pathname: html_path,
      port: options.port
    });

    if (options.mode == "local") {
      done(null, local_url);
    } else {
      localtunnel(options.port, function(err, tunnel) {
        if (err) {
          return done(err);
        }
        done(null, tunnel.url + html_path);
      });
    }
  });
}


function prepare(options, callback) {
  if (app) {
    return callback();
  }

  console.log("serve static", options.cwd);
  app = express()
    .use(express.static(options.cwd))
    .use(express.static(path.join(__dirname, '../')))
    .get('/neurons/neuron/neuron.js',function(req,res){
      var filepath = path.join(__dirname,'..','node_modules','neuron','dist','neuron.js');
      res.sendfile(filepath);
    });
    
  app.listen(options.port);
  callback(null);
}


exports.build = serverAddPath;
