#!/usr/bin/env node

var program = require('commander');
var hum = require("hum");
var ejs = require("ejs");
var fs_sync = require("fs-sync");
var path_extra = require("path-extra");
var node_path = require("path");
var putin = require("put-in");
var multi_profile = require("multi-profile");

var profile = multi_profile({
    path            : "~/.cortex", 
    schema          : {
        builder         : {
            value       : 'neuron',
            type        : {
                validator : function (v) {
                    return typeof v === 'string' && v.trim() !== '';
                }
            }
        }
    }
}).init();


var pkg = fs_sync.readJSON( node_path.join(process.cwd(),"package.json") );

var builder = profile.get('builder');


var pkg_name = "grunt-cortex-" + builder + "-test";

function run_task(task_dir){
    var init_config = {};
    init_config[builder + "-test"] = {all:{}};
    var hum_instance = hum({
        path: node_path.join(task_dir,"node_modules")
    })
    .npmTasks(pkg_name)
    .task(builder + "-test")
    .init(init_config)
    .options({
        force: true
    }).done(function(err){});
}

require("nodepath").get(function(NODE_LIB_PATH){
    var task_dir = node_path.join(NODE_LIB_PATH,"lib");
    console.log("tsk dir",task_dir);
    if(fs_sync.exists(node_path.join(task_dir,"node_modules",pkg_name))){
        run_task(task_dir);
    }else{
        putin(task_dir).install(pkg_name, function(){
            run_task(task_dir)
        });
    }
});