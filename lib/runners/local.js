var connect = require('connect');
var http = require('http');
var logger = require('../logger');
var fs = require('fs');
var node_path = require('path');
var url = require('url');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

function openUrl(url){
    switch (process.platform) {
        case "darwin":
          exec('open ' + url);
          break;
        case "win32":
          exec('start ' + url);
          break;
        default:
          spawn('xdg-open', [url]);
        // I use `spawn` since `exec` fails on my machine (Linux i386).
        // I heard that `exec` has memory limitation of buffer size of 512k.
        // http://stackoverflow.com/a/16099450/222893
        // But I am not sure if this memory limit causes the failure of `exec`.
        // `xdg-open` is specified in freedesktop standard, so it should work on
        // Linux, *BSD, solaris, etc.
      }
}

var paths = [];
exports.test = function(config){
    var path = config.path;
    var port = config.port || 1976;

    if(!paths.length){
        var app = connect()
            .use(function(req, res, next){
                var match = false;
                paths.forEach(function(path){
                    if(path.match(req.url)){
                        fs.readFile(path,'utf8',function(err,content){
                            res.end(content);
                        });
                        match = true;
                    }
                });

                if(!match){
                    next();
                }
            })
            .use(connect.static( node_path.join(__dirname, '../../') ))
            .use(connect.static( config.cwd ))

        http.createServer(app).listen(port);
    }
    paths.push(path);

    var test_url = url.format({
        protocol: "http",
        hostname: "127.0.0.1",
        pathname: node_path.basename(path),
        port: port
    });

    logger.info("open browser to visit %s", test_url);
    openUrl(test_url);
}