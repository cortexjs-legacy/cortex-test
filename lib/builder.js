'use strict';

var logger = require('./logger');
var async = require('async');
var Parser = require("neuron-builder").Parser;
var glob = require('glob');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var url = require('url');
var express = require('express');
var _ = require('underscore');
var localtunnel = require('localtunnel');
var neuronjs = require('neuronjs');

function generateScripts(config) {
  return function(done) {
    var build_config = {
      cwd:config.cwd,
      pkg:config.pkg
    };
    var cwd = config.cwd;
    var test_file = config.file;
    build_config.pkg.main = './' + path.relative( cwd, test_file);
    var parser = new Parser(build_config);

    parser.parse(test_file, done);
  }
}

function generateTree(config){
  var neurontree = require('neuron-tree');

  return function(done){
    neurontree(config.pkg, {
      cwd: config.cwd,
      dependencyKeys: ["dependencies","devDependencies","asyncDependencies"],
      built_root: path.join(config.cwd, 'neurons'),
      ignore_shrink_file: true
    }, done);
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
  var runner_template = path.join(__dirname, "../assets/runner.tpl");
  fs.readFile(runner_template, 'utf8', done);
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
    var scripts = results[2];
    var tree = results[3];
    var cwd = options.cwd;
    var mode = options.mode;
    var adapter = options.adapter;

    var name = options.pkg.name;
    var version = options.pkg.version;

    var modpath = options.modpath || "/mod";
    var neuron_version = neuronjs.version();

    var result = _.template(template, {
      html: html,
      mode: mode,
      name: name,
      version: version,
      neuron_version: neuron_version,
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
          return res.send(500, err.toString());
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

    if (options.adapter.isLocal == true) {
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

  app = express()
    .use(express.static(options.cwd))
    .use(express.static(path.join(__dirname, '../node_modules')))
    .use('/neurons/neuron.js', function(req,res){
      neuronjs.content(function(err, content){
        if(err){return res.send(500,err);}
        res.type('js');
        res.send(content);
      });
    });

  app.listen(options.port);
  callback(null);


}


exports.build = serverAddPath;
