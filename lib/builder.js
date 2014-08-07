'use strict';

var logger = require('./logger');
var async = require('async');
var glob = require('glob');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var url = require('url');
var express = require('express');
var _ = require('underscore');
var localtunnel = require('localtunnel');
var DemoMaker = require('demo-maker');

function generatePage(options, done) {
  var demo = new DemoMaker({
    template:"cortex-test",
    options: {
      cwd: options.cwd,
      pkg: options.pkg,
      modpath: "/neurons",
      mochaJs: "/mocha/mocha.js",
      mochaCss:"/mocha/mocha.css"
    }
  });

  demo.build(options.file, function(err, result){
    if(err){return done(err);}
    var adapter = options.adapter;
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
      generatePage(options, function(err, result) {
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

    if (options.adapter.isLocal === true) {
      done(null, local_url);
    } else {
      localtunnel(options.port, {
        host: options.localtunnel
      },function(err, tunnel) {
        if (err) {
          return done(err);
        }
        done(null, tunnel.url.replace("https://","http://") + html_path);
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

  app.listen(options.port);
  callback(null);


}


exports.build = serverAddPath;
