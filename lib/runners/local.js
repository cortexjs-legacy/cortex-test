var connect = require('connect');
var http = require('http');
var logger = require('../logger');
var fs = require('fs');
var node_path = require('path');
var url = require('url');
var exec = require('child_process').exec;

exports.test = function(config){
    var path = config.path;
    var port = config.port || 1976;
    var app = connect()
        .use(function(req, res, next){
            if(req.url == "/"){
                fs.readFile(path,'utf8',function(err,content){
                    res.end(content);
                });
            }else{
                next();
            }
        })
        .use(connect.static( node_path.join(__dirname, '../../') ))
        .use(connect.static( config.cwd ))

    var test_url = url.format({
        protocol: "http",
        hostname: "127.0.0.1",
        port: port
    });

    http.createServer(app).listen(port);
    logger.info("open browser to visit %s", test_url);
    if(process.platform == "darwin"){
        exec('open ' + test_url);
    }
}