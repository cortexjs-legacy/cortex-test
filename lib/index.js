var cortexJson = require("read-cortex-json");
var jf = require('jsonfile');
var async = require('async');
var _ = require('underscore');
var glob = require('glob');
var util = require('util');
var path = require('path');
var fs = require('fs');
var events = require('events');
var builder = require("./builder");


util.inherits(cortexTest, events.EventEmitter);


function cortexTest(options) {  
  this.options = options;
  this.cwd = options.cwd;
  this.mode = options.mode || "local";
  this.Adapter = this.loadModule("adapter", this.mode);
  this.Reporter = this.loadModule("reporter", options.reporter || "base");

}

cortexTest.prototype.loadModule = function (type, name) {
  var module_name = "cortex-test-" + name + "-" + type;
  try {
    module = require("./" + type + "s/" + name);
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

cortexTest.prototype.testPage = function (url, done) {
  var cwd = this.cwd;
  var runner_option = _.extend({
    cwd: cwd,
    url: url,
    app: require(path.join(cwd, 'package.json')).name
  }, this.options);

  var test = new this.Adapter.runner(runner_option).on('error', function (err) {
    self.emit('error', err);
  }).on('log', function (info) {
    self.emit('log', info);
  }).run();

  var reporter = new this.Reporter(test);
  reporter.once("done", function (fail) {
    done(fail);
  });
}

cortexTest.prototype.getTestFiles = function (tests, callback) {
  var cwd = this.cwd;
  async.map(tests, function (test, done) {
    var testPath = path.join(cwd, test);
    fs.stat(testPath, function (err, stats) {
      if (err) {
        return done(err);
      }
      if (stats.isFile()) {
        done(null, [testPath]);
      } else if (stats.isDirectory()) {
        glob(path.join(test, "**.js"), function (err, matches) {
          if (err) {
            return done(err);
          }
          done(null, matches.map(function (item) {
            return path.join(cwd, item);
          }));
        });
      } else {
        done(null);
      }
    });
  }, function (err, files) {
    files = _.flatten(files).filter(function (file) {
      return file;
    });
    callback(null, files);
  });
}


cortexTest.prototype.buildPage = function (file) {
  var self = this;
  var cwd = this.cwd;
  var mode = this.mode;
  
  return function (done) {
    cortexJson.read(cwd, function (err, pkg) {
      if (err) {
        return done(err);
      }
      builder.build({
        mode: mode,
        pkg: pkg,
        file: file,
        adapter: self.Adapter,
        cwd: cwd
      }, function (err, result) {
        done(err, result);
      });
    });
  }
}


cortexTest.prototype.test = function (tests) {
  var self = this;
  self.emit("cortex test in %s mode " + this.mode);

  self.getTestFiles(tests, function (err, matches) {
    async.mapSeries(matches, function (file, done) {
        self.emit('log',  "Testing " + path.relative(self.cwd, file));
        self.buildPage(file)(function (err, url) {
          if (err) {
            return done(err);
          }
          self.testPage(url, done);
        });
      },
      function (err) {
        if (err) {
          self.emit('error',err.stack || err.message || err);
          process.exit(1);
        } else {
          process.exit(0);
        }
      });
  });

  return this;
}

module.exports = function(options){
  return new cortexTest(options);
};