/**
 * @preserve Neuron JavaScript Framework
 *   author i@kael.me
 */

// Goal
// 1. Implement safe native ecma5 methods for they are basic requirements which, nevertheless, is pluggable
// 2. Manage module dependencies and initialization 

// Non-goal
// > What neuron will never do
// 1. Neuron will never care about non-browser environment
// 2. Neuron core will never care about module loading

'use strict';

// version 5.0.0
// build 2014-05-04

// @param {Window|Object} ENV environment
// @param {undefined=} undefined
;(function(ENV, undefined){

var DOC = document;

// Create new `neuron` object or use the existing one
var neuron = ENV.neuron || (ENV.neuron = {});

neuron.version = '5.0.0';



// ## ECMAScript5 implementation


// - methods native object implemented
// - methods native object extends

// codes from mootools, MDC or by Kael Zhang

// ## Indexes

// ### Array.prototype
// - indexOf
// - lastIndexOf
// - filter
// - forEach
// - every
// - map
// - some
// - reduce
// - reduceRight

// ### Object
// - keys
// - create: removed

// ### String.prototype
// - trim
// - trimLeft
// - trimRight

// ## Specification

// ### STANDALONE language enhancement

// - always has no dependencies on Neuron
// - always follow ECMA standard strictly, including logic, exception type
// - throw the same error hint as webkit on a certain exception


function extend(host, methods) {
  for (var name in methods) {
    if (!host[name]) {
      host[name] = methods[name];
    }
  }
}


function implement(host, methods) {
  extend(host.prototype, methods);
}


var TYPE_ERROR = TypeError;


// ref: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array
implement(Array, {

  // Accessor methods ------------------------

  indexOf: function(value, from) {
    var len = this.length >>> 0;

    from = Number(from) || 0;
    from = Math[from < 0 ? 'ceil' : 'floor'](from);

    if (from < 0) {
      from = Math.max(from + len, 0);
    }

    for (; from < len; from++) {
      if (from in this && this[from] === value) {
        return from;
      }
    }

    return -1;
  },

  lastIndexOf: function(value, from) {
    var len = this.length >>> 0;

    from = Number(from) || len - 1;
    from = Math[from < 0 ? 'ceil' : 'floor'](from);

    if (from < 0) {
      from += len;
    }

    from = Math.min(from, len - 1);

    for (; from >= 0; from--) {
      if (from in this && this[from] === value) {
        return from;
      }
    }

    return -1;
  },


  // Iteration methods -----------------------

  filter: function(fn, thisObject) {
    var ret = [];
    for (var i = 0, len = this.length; i < len; i++) {

      // Kael:
      // Some people might ask: "why we use a `i in this` here?".
      // ECMA:
      // > callback is invoked only for indexes of the array which have assigned values; 
      // > it is not invoked for indexes which have been deleted or which have never been assigned values

      // Besides, `filter` method is not always used with real Arrays, invocations below might happen:

      //     var obj = {length: 4}; obj[3] = 1;
      //     Array.prototype.filter.call({length: 4});
      //     Array.prototype.filter.call($('body'));

      // as well as the lines below
      if ((i in this) && fn.call(thisObject, this[i], i, this)) {
        ret.push(this[i]);
      }
    }

    return ret;
  },

  forEach: function(fn, thisObject) {
    for (var i = 0, len = this.length; i < len; i++) {
      if (i in this) {

        // if fn is not callable, it will throw
        fn.call(thisObject, this[i], i, this);
      }
    }
  },

  every: function(fn, thisObject) {
    for (var i = 0, len = this.length; i < len; i++) {
      if ((i in this) && !fn.call(thisObject, this[i], i, this)) {
        return false;
      }
    }
    return true;
  },

  map: function(fn, thisObject) {
    var ret = [],
      i = 0,
      l = this.length;

    for (; i < l; i++) {

      // if the subject of the index i is deleted, index i should not be contained in the result of array.map()
      if (i in this) {
        ret[i] = fn.call(thisObject, this[i], i, this);
      }
    }
    return ret;
  },

  some: function(fn, thisObject) {
    for (var i = 0, l = this.length; i < l; i++) {
      if ((i in this) && fn.call(thisObject, this[i], i, this)) {
        return true;
      }
    }
    return false;
  },

  reduce: function(fn) {
    if (typeof fn !== 'function') {
      throw new TYPE_ERROR(fn + ' is not an function');
    }

    var self = this,
      len = self.length >>> 0,
      i = 0,
      ret;

    if (arguments.length > 1) {
      ret = arguments[1];

    } else {
      do {
        if (i in self) {
          ret = self[i++];
          break;
        }

        // if array contains no values, no initial value to return
        if (++i >= len) {
          throw new TYPE_ERROR('Reduce of empty array with on initial value');
        }
      } while (true);
    }

    for (; i < len; i++) {
      if (i in self) {
        ret = fn.call(null, ret, self[i], i, self);
      }
    }

    return ret;
  },

  reduceRight: function(fn) {
    if (typeof fn !== 'function') {
      throw new TYPE_ERROR(fn + ' is not an function');
    }

    var self = this,
      len = self.length >>> 0,
      i = len - 1,
      ret;

    if (arguments.length > 1) {
      ret = arguments[1];

    } else {
      do {
        if (i in self) {
          ret = self[i--];
          break;
        }
        // if array contains no values, no initial value to return
        if (--i < 0) {
          throw new TYPE_ERROR('Reduce of empty array with on initial value');
        }

      } while (true);
    }

    for (; i >= 0; i--) {
      if (i in self) {
        ret = fn.call(null, ret, self[i], i, self);
      }
    }

    return ret;
  }

});


extend(Object, {

  // ~ https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/create ~
  // create: function(o){
  //    if(o !== Object(o) && o !== null){
  //        throw new TYPE_ERROR('Object prototype may only be an Object or null');
  //    }

  //    function F() {}
  //    F.prototype = o;

  //    return new F();
  // },

  // refs:
  // http://ejohn.org/blog/ecmascript-5-objects-and-properties/
  // http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
  // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/keys
  // https://developer.mozilla.org/en/ECMAScript_DontEnum_attribute
  // http://msdn.microsoft.com/en-us/library/adebfyya(v=vs.94).aspx
  keys: (function() {
    var hasOwnProperty = Object.prototype.hasOwnProperty,
      has_dontEnumBug = !{
        toString: ''
      }.propertyIsEnumerable('toString'),

      // In some old browsers, such as OLD IE, keys below might not be able to iterated with `for-in`,
      // even if each of them is one of current object's own properties  
      NONT_ENUMS = [
        'toString',
        'toLocaleString',
        'valueOf',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'constructor'
      ],

      NONT_ENUMS_LENGTH = NONT_ENUMS.length;

    return function(o) {
      if (o !== Object(o)) {
        throw new TYPE_ERROR('Object.keys called on non-object');
      }

      var ret = [],
        name;

      for (name in o) {
        if (hasOwnProperty.call(o, name)) {
          ret.push(name);
        }
      }

      if (has_dontEnumBug) {
        for (var i = 0; i < NONT_ENUMS_LENGTH; i++) {
          if (hasOwnProperty.call(o, NONT_ENUMS[i])) {
            ret.push(NONT_ENUMS[i]);
          }
        }
      }

      return ret;
    };

  })()

  // for our current OOP pattern, we don't reply on Object based inheritance
  // so Neuron has not implemented the methods of Object such as Object.defineProperty, etc.
});


implement(String, {
  trimLeft: function() {
    return this.replace(/^\s+/, '');
  },

  trimRight: function() {
    return this.replace(/\s+$/, '');
  },

  trim: function() {
    return this.trimLeft().trimRight();
  }
});



/**
 change log:
 
 2012-09-23  Kael:
 - remove implementation of Object.create, due to the failure of imitating ECMA standard with old JavaScript methods
 
 2012-09-22  Kael:
 TODO:
 X A. second argument of Object.create
 
 2012-09-21  Kael:
 - will no longer throw error if there're more than one parameters for Object.create, according to ECMA.
 
 2012-04-05  Kael:
 - use trimLeft and trimRight to do a entire trim
 
 2012-03-02  Kael:
 - Optimize the performance of String.trim method for IE who always do a bad work with regular expressions.
     It may even cause IE browsers(IE6-8) expectedly crash if use `/^\s+|\s+$/` to trim a big string which contains a lot of whitespaces.
 
 */

// common code slice
// ----
//     - constants
//     - common methods


// A very simple `mix` method
// copy all properties in the supplier to the receiver
// @param {Object} receiver
// @param {Object} supplier
// @returns {mixed} receiver
function mix(receiver, supplier) {
  var c;
  for (c in supplier) {
    receiver[c] = supplier[c];
  }
}


// greedy match:
var REGEX_DIR_MATCHER = /.*(?=\/.*$)/;

// Get the current directory from the location
//
// http://jsperf.com/regex-vs-split/2
// vs: http://jsperf.com/regex-vs-split
function dirname(uri) {
  var m = uri.match(REGEX_DIR_MATCHER);

  // abc/def  -> abc
  // abc      -> abc  // which is different with `path.dirname` of node.js
  // abc/     -> abc
  return m ? m[0] : uri;
}


// Canonicalize path
// similar to path.resolve() of node.js
// NOTICE that the difference between `pathResolve` and `path.resolve` of node.js is:
// `pathResolve` treats paths which dont begin with './' and '../' as top level paths,
// but node.js as a relative path.

// For example:
// pathResolve('a', 'b')    -> 'b'
// node_path.resolve('a', 'b')   -> 'a/b'

// pathResolve('a/b', './c')    -> 'a/b/c'
// pathResolve('a/b', '../c')   -> 'a/c'
// pathResolve('a//b', './c')   -> 'a//b/c'   - for 'a//b/c' is a valid uri

// #75: 
// pathResolve('../abc', './c') -> '../abc/'
function pathResolve(from, to) {
  // relative
  if (isPathRelative(to)) {
    var parts = (dirname(from) + '/' + to).split('/');
    to = normalizeArray(parts).join('/');
  }

  return to;
}


// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  var i = parts.length - 1;
  for (; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);

    } else if (last === '..') {
      parts.splice(i, 1);
      up++;

    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  while (up--) {
    parts.unshift('..');
  }

  return parts;
}


// @param {string} path
function isPathRelative(path) {
  return path.indexOf('./') === 0 || path.indexOf('../') === 0;
}

// # Neuron Core 

// ## CommonJS
// Neuron 3.x or newer is not the implementation of any CommonJs proposals
// but [module/1.0](http://wiki.commonjs.org/wiki/Modules/1.0), one of the stable CommonJs standards only.
// And by using neuron and [cortex](http://github.com/kaelzhang/cortex), user could write module/1.0 modules.

// ## Naming Conventions
// All naming of variables should accord to this.
// `'a@1.0.0/relative'`

// ### package 
// The package which the current module belongs to.
// - name or package name: {string}  package `name`: 'a'
// - package or package id: {string}    contains package `name` and `version` and the splitter `'@'`. 'a@1.0.0' for instance.

// ### module
// A package is consist of several module objects.
// - mod: {object} the module object. use `mod` instead of `module` to avoid confliction
// - id or module id: the descripter that contains package name, version, and path information
//      {string} for example, `'a@1.0.0/relative'` is a module id(entifier)

// ### version
// Package version: '1.0.0'

// ### main entry
// The module of a package that designed to be accessed from the outside


// map -> identifier: module
// Expose the object for debugging
// @expose
var mods = neuron.mods = {};


// module define
// ---------------------------------------------------------------------------------------------------

// Method to define a module, `define` has no fault tolerance in neuron 2.0,
// because `define` method is no longer designed for human to use.
// `define` should be generated by some develop environment such as [cortex](http://ctx.io)
// @private

// **NOTICE** that `define` method is not used by developers directly,
// so there's no type checking, and no fault tolerance.

// @param {string} identifier (optional) module identifier
// @param {Array.<string>} dependencies ATTENSION! `dependencies` must be array of standard module identifier and
//    there will be NO fault tolerance for argument `dependencies`. Be carefull!
// @param {function(...[*])} factory
// @param {Object=} options

// @return {undefined}
function define(identifier, dependencies, factory, options) {
  options = options || {};

  var mod = getModuleById(identifier, null, options.main);
  mix(mod, options);

  // a single module might be defined more than once.
  // use this trick to prevent module redefining, avoiding the subsequent side effect.
  // mod.f        -> already defined
  // X mod.exports  -> the module initialization is done
  if (!mod.f) {
    mod.f = factory;

    // if has dependencies
    if (dependencies.length) {
      mod.deps = dependencies;

      // ['a@0.0.1']  -> {'a' -> 'a@0.0.1'}
      generateModuleVersionMap(dependencies, mod.v);
      if (options.asyncDeps) {
        generateModuleVersionMap(options.asyncDeps, mod.v);
      }

      // pending
      loadDependencies(dependencies, function() {
        ready(mod);
        // emit(mod, 'ready');
      }, mod);

    } else {
      // for standalone modules, run factory immediately.
      // emit(mod, 'ready');
      ready(mod);
    }

    // emit(mod, 'define');
  }
}


function ready (mod) {
  // execute pending callbacks and clean
  mod.c.forEach(function(c) {
    c(mod);
  });
  mod.c.length = 0;
  delete mod.c;

  // never delete `mod.v`, coz `require` method might be executed after module factory executed
  // ```js
  // module.exports = {
  //    abc: function() {
  //        return require('b'); 
  //    }
  // }
  // ```
}


// @private
// create version info of the dependencies of current module into current sandbox
// @param {Array.<string>} modules no type detecting
// @param {Object} host

// ['a@~0.1.0', 'b@~2.3.9']
// -> 
// {
//     a: '~0.1.0',
//     b: '~2.3.9'
// }
function generateModuleVersionMap(modules, host) {
  modules.forEach(function(mod) {
    var name = mod.split('@')[0];
    host[name] = mod;
  });
}


// Generate the exports
// @param {Object} mod
function getExports(mod) {
  if (mod.loaded) {

    // In node.js, if there are circular dependencies, `module.exports` will be `{}` by default,
    // while `mod.exports` will be undefined in neuron,
    // which is different from here.

    // Actually, neuron(~5.0.0) could not handle static circular dependencies, 
    // in which situation, method `ready(mod)` will never be called.
    // But, static circular dependencies is a piece of cake for builders, such like [cortex](http://github.com/cortexjs/cortex)

    // If `'exports'` is not in mod, we treated it as a circular dependency suspectedly.
    if (!('exports' in mod)) {
      neuron.emit('circular', {
        mod: mod
      });
    }

    return mod.exports;
  }

  // #82: since 4.5.0, a module only initialize factory functions when `require()`d.
  // A single module might
  return generateExports(mod);
}


function generateExports (mod) {
  var exports = {};
  // @expose
  var module = {
    exports: exports
  };

  // # 85
  // before module factory being invoked, mark the module as `loaded`
  // so we will not execute the factory function again
  mod.loaded = true;

  // to keep the object mod away from the executing context of factory,
  // use `factory` instead `mod.f`,
  // preventing user from fetching runtime data by 'this'
  var factory = mod.f;
  factory(createRequire(mod), exports, module);
  // delete mod.f;

  // during the execution of `factory`, `module.exports` might be changed
  // exports:
  // TWO ways to define the exports of a module
  // 1. 
  // exports.method1 = method1;
  // exports.method2 = method2;

  // 2.
  // module.exports = {
  //        method1: method1,
  //        method2: method2
  // }

  // priority: 2 > 1
  return mod.exports = module.exports;
}


// function emit (mod, type) {
//   neuron.emit(type, {
//     mod: mod
//   });
// }


// module load
// ---------------------------------------------------------------------------------------------------


// @private
// @param {Array.<String>} dependencies
// @param {(function()} callback
// @param {Object} env Environment for cyclic detecting and generating the uri of child modules
// {
//     r: {string} the uri that its child dependent modules referring to
//     n: {string} namespace of the current module
// }
function loadDependencies(dependencies, callback, env) {
  var counter = dependencies.length;

  dependencies.forEach(function(id) {
    if (id) {
      var mod = getModuleById(id, env);
      registerModuleLoadCallback(mod, function() {
        if (--counter === 0) {
          callback();

          // prevent memleak
          callback = null;
        }
      }, env);

      // Prevent bad dependencies
    } else {
      --counter;
    }
  });
}


function useModule (mod, callback) {
  registerModuleLoadCallback(mod, function (mod) {
    callback(getExports(mod));
  });
}


// provide a module
// method to provide a module
// @param {Object} mod
// @param {function()} callback
function registerModuleLoadCallback(mod, callback) {
  mod.c
    ? mod.c.push(callback)
    : callback(mod);

  // everytime we encounter a module which is depended by the other module, `'use'` event fires 
  neuron.emit('use', {
    mod: mod,

    // prevent duplicate loading
    // @type {boolean=} whether the module is already fetched, i.e. we don't need to fetch it from the remote server
    defined: !! mod.f
  });
}


// use the sandbox to specify the environment for every id that required in the current module 
// @param {Object} env The object of the current module.
// @return {function}
function createRequire(env) {
  var require = function(id) {
    var mod = getModuleById(env.v[id] || id, env, null, true);
    return getExports(mod);
  };

  // @param {string} id Module identifier. 
  // Since 4.2.0, we only allow to asynchronously load a single module
  require.async = function(id, callback) {
    var mod = getModuleById(id, env);

    if (!mod.main) {
      if (isPathRelative(id)) {
        // If user try to load a non-entry module, it will get a 404 response
        mod.async = true;
      } else {
        // We only allow to `require.async` main module or entries of the current package 
        return;
      }
    }

    useModule(mod, callback);
  };

  return require;
}


// cases:

// 1. calculate relative paths 
// 2. load modules

// ```
// 'a@0.0.1/b.js'
// -> define('a@0.0.1/b', ['./c'], factory, {main: true});
// if main entry is not 
// -> {
//     'a@0.0.1/b': mod_b,
//     'a@0.0.1': mod_b
// }
// -> 'a/0.0.1/a.js'

// 'a@0.0.1/c'
// -> define('a@0.0.1/c', [], factory, {});
// -> {
//     'a@0.0.1/c': mod_c
// }
// ```

// get a module by id. if not exists, a ghost module(which will be filled after its first `define`) will be created
// @param {string} id
// @param {Object} env the environment module, 
// @param {boolean=} is_main_definition When it is defining a main entry.
// @param {boolean=} strict If true, if a module is not found, it will throw errors instead of creating a new module 
function getModuleById(id, env, is_main_definition, strict) {
  var parsed;

  // `env` exists, which means the module is accessed by requiring within another module.
  if (env) {
    // pathResolve('align', 'jquery')   -> 'jquery'
    // pathResolve('align', './')
    id = pathResolve(env.id, id);
  }

  // 'a@1.0.0'    -> 'a@1.0.0'
  // 'a'          -> 'a@latest'
  // 'a/inner'    -> 'a@latest/inner'
  parsed = parseModuleId(id);

  // Suppose:
  // {
  //     'a': {
  //         '~1.2.3': '1.2.12'
  //     }
  // }

  // We route a package of certain range to a specific version, 
  // so several modules may point to a same exports

  // `NEURON_CONF` is generated by `neuron.config`
  parsed.v = NEURON_CONF.transform(parsed.v, parsed.n);
  id = formatModuleId(parsed);

  var mod = mods[id];
  if (!mod) {
    if (strict) {
      throw new Error("Cannot find module '" + id + "'");
    }

    var pkg = formatPackageId(parsed);

    // In this case, `getModuleById` is invoked by `define`.
    if (is_main_definition) {
      mod =
        mods[id] =
        mods[pkg] =

      // The module id of main entry is the package id.
      mods[pkg] || createModule(parsed, id, pkg);

      // There is only posibility to run `getModuleById` with `isMain` set by `true`:
      // ```
      // define(id, dependencies, factory, {main: true}). 
      // ```
      // And, before this,
      // `mods[pkg]` might have already been assigned with a falsy `id` property.

      // For example
      // {
      //     name: 'a',
      //     version: '0.0.1',
      //     main: 'lib/index.js'
      // }

      // 1. `getModuleById('a@0.0.1')`, and load 'a/0.0.1/a.js'
      // {
      //     id: 'a@0.0.1',
      //     pkg: 'a@0.0.1'
      // }

      // 2. (in a.js), define('a@0.0.1/lib/index', [], factory, {main: true})
      // Then, `getModuleById('a@0.0.1/lib/index')` will get the result of the 1st step.
      // Obviously, 
      // 'a@0.0.1' is not the real module id of the main entry,
      // while 'a@0.0.1/lib/index' is, so:
      mod.id = id;

    } else {
      mod = mods[id] = createModule(parsed, id, pkg);

      if (id === pkg) {
        mod.main = true;
      }
    }
  }

  return mod;
}


function createModule(parsed, id, pkg) {
  return {
    // package name: 'a'
    name: parsed.n,
    // package version: '1.1.0'
    version: parsed.v,
    // module path: '/b'
    path: parsed.p,
    // module id: 'a@1.1.0/b'
    id: id,
    // package id: 'a@1.1.0'
    pkg: pkg,
    // @type {Array.<function()>} callbacks
    c: [],
    // @type {Object} version map of the current module
    v: {}
  };
}


// @const
// 'a@1.2.3/abc' -> 
// ['a@1.2.3/abc', 'a', '1.2.3', '/abc']

//                    01            2         3
var REGEX_PARSE_ID = /^([^\/]+?)(?:@([^\/]+))?(\/.*)?$/;

// @param {string} resolved path-resolved module identifier
function parseModuleId(resolved) {
  var match = resolved.match(REGEX_PARSE_ID);
  var name = match[1];

  // 'a/inner' -> 'a@latest/inner'
  var version = match[2] || 'latest';
  var path = match[3] || '';

  // There always be matches
  return {
    n: name,
    v: version,
    p: path
  };
}


// Format package id 
function formatPackageId(parsed) {
  return parsed.n + '@' + parsed.v;
}


// Format module id
function formatModuleId(parsed) {
  return formatPackageId(parsed) + parsed.p;
}


// @public
// ----------------------------------------------------------------------------------

// event support
// mix(loader, Event);


/**
 change log:
 
 import ./ChangeLog.md;
 
 */

// @param {this} self
// @param {string} type
// @returns {Array.<function()>}
function getEventStorageByType(type) {
  var storage = neuron.__ev || (neuron.__ev = {});

  return type ? storage[type] || (storage[type] = []) : [];
}


// @expose
neuron.on = function(type, fn) {
  if (fn) {
    var storage = getEventStorageByType(type);
    storage.push(fn);
  }

  return neuron;
};


// @expose
neuron.emit = function(type, data) {
  getEventStorageByType(type).forEach(function(fn) {
    fn(data);
  });
};

/**
 change log
 
 2012-08-02  Kael:
 - improved the stablility of function overloading, prevent user mistakes
 - optimized calling chain
 
 2011-02-24  Kael:
 TODO:
 A. add .after and .before
 */

// <script 
// src="http://localhost:8765/mod/neuronjs/2.0.1/neuron.js" 
// id="neuron-js" 
// data-path="mod"
// data-server="localhost:8765"
// ></script>

// never use `document.body` which might be null during downloading of the document.
var HEAD = DOC.getElementsByTagName('head')[0];

function loadJS(src) {
  var node = DOC.createElement('script');

  node.src = src;
  node.async = true;

  jsOnload(node, function() {
    HEAD.removeChild(node);
  });

  HEAD.insertBefore(node, HEAD.firstChild);
}


var jsOnload = DOC.createElement('script').readyState

/**
 * @param {DOMElement} node
 * @param {!function()} callback asset.js makes sure callback is not null
 */
  ? function(node, callback) {
    node.onreadystatechange = function() {
      var rs = node.readyState;
      if (rs === 'loaded' || rs === 'complete') {
        node.onreadystatechange = null;
        callback.call(this);
      }
    };
  }

  : function(node, callback) {
    node.addEventListener('load', callback, false);
  };

// Manage configurations

// Never use `location.hash` to store configurations.
// Evil guys may use that to obtain user private informations or execute authorized commands
//      by using hash configurations to inject remote modules and sending these urls to
//      the other users

// @return {Object}
function getAllConfigFromCookie() {
  // neuron=path=localhost
  // a=3; neuron=path=localhost
  var match = DOC.cookie.match(/(?:^|;)\s*neuron=([^;]*)/);
  return match ? parseQuery(match[1]) : {};
}


// 'path=localhost,ext=.min.js' 
// -> { path: 'localhost', ext: '.min.js' }
// @param {!string} str The string of search query
function parseQuery(str) {
  var obj = {};

  decodeURIComponent(str).split(',').forEach(function(key_value) {
    var pair = key_value.split('=');
    obj[pair[0]] = pair[1];
  });

  return obj;
}


// Ref: [semver](http://semver.org/)
// note that we must use '\-' rather than '-', becase '-' presents a range within brackets
// @const
var REGEX_MATCH_SEMVER = /^(\D*)((\d+)\.(\d+))\.(\d+)([a-z0-9\.\-+]*)$/i;
//                       0  1   2 3      4       5    6              

// @return {Object} parsed semver object
function parseSemver(version) {
  if (Object(version) === version) {
    return version;
  }

  var ret = null;

  if (version) {
    ret = {
      origin: version
    };

    var match = version.match(REGEX_MATCH_SEMVER);

    // For example:
    // '~1.3.9-alpha/lang'
    if (match) {
      ret.decorator = match[1];

      // minor version
      // '1.3'
      ret.vminor = match[2];

      // ret.major = match[3];
      // ret.minor = match[4];
      // ret.patch = match[5];

      // // version.extra contains `-<pre-release>+<build>`
      // ret.extra = match[6];
    }
  }

  return ret;
}


// var neuron_loaded = [];
var NEURON_CONF = neuron.conf = {
  loaded: [],

  // By default, we only cook ranges
  transform: getBaseRange
};


function getBaseRange(version) {
  var parsed = parseSemver(version);
  return parsed.decorator ?
  // Only deal with ranges
  // '~1.2.3'     -> '~1.2.0'
  parsed.decorator + parsed.vminor + '.0' :

  // Do not transcribe explicit semver
  // '1.2.3'      -> '1.2.3'
  version;
}


// @return {false}
function returnFalse() {
  return false;
}


function justReturn(subject) {
  return subject;
}


// @const
// #81: We restricts protocol to 'http' and 'https', 
//    because if it is possible for webviews to define their own protocol, 
//    allowing to set `path` with custom protocol will be extremely dangerous
var REGEX_IS_LOCALHOST = /^(?:http|https)?\/\/localhost/;

var CONF_ATTRIBUTES = {

  // The server where loader will fetch modules from
  // if use `'localhost'` as `base`, switch on debug mode
  'path': {
    // Setter function
    S: function(path) {
      // Make sure 
      // - there's one and only one slash at the end
      // - `conf.path` is a directory 
      return path.replace(/\/*$/, '/');
    },

    // Cookie checker
    C: function(path) {

      // For the sake of security, 
      // we only support to set path to '%://localhost%' in cookie.
      // If there's a XSS bug in a single page, 
      // attackers could use this cookie to redirect all javascript module to anything they want
      return REGEX_IS_LOCALHOST.test(path);
    }
  },

  // We don't allow this, just use facade configurations and manage it on your own
  // 'vars',
  // var: {
  // },

  'loaded': {
    S: justReturn,
    C: returnFalse
  },

  'ranges': {
    S: function(map) {
      if (map) {
        NEURON_CONF.transform = rangeMapping;
        cleanRanges(map);
        range_map = map;
      }

      return map;
    },

    C: returnFalse
  },

  'ext': {
    S: justReturn
  },

  'depTree': {
    S: justReturn
  },

  'combo': {
    S: justReturn
  }
};


var CONF_ATTRIBUTE_LIST = Object.keys(CONF_ATTRIBUTES);
var range_map = {};

// This transformer will be used if any range map is specified and configured.
function rangeMapping(range, name) {
  // '~1.2.3' -> '~1.2.0'
  var base = getBaseRange(range);
  var ranges = range_map[name] || {};

  // Two purpose:
  // - map: range -> version
  // - globally control and inject the specified version
  return ranges[base] ||

  // if `range` is a normal version, or not specified, remain the origin.
  range;
}


function cleanRanges(ranges) {
  var name;

  for (name in ranges) {
    cleanRangeMap(ranges[name]);
  }
}


function cleanRangeMap(map) {
  var range;
  var key;

  for (range in map) {
    // '1.2.3'  -> '1.2.3'
    // '~1.2.3' -> '~1.2.0'
    // 'latest' -> 'latest'
    key = getBaseRange(range);
    if (!(key in map)) {
      map[key] = map[range];
    }
  }
}


var cookie_conf = getAllConfigFromCookie();

// Santitize cookie configurations
CONF_ATTRIBUTE_LIST.forEach(function(key) {
  var cookie_checker;

  if ( 
    (key in cookie_conf)
    && (cookie_checker = CONF_ATTRIBUTES[key].C)
    && !cookie_checker(cookie_conf[key])
  ) {
      delete cookie_conf[key];
  }
});


function config(conf) {
  mix(conf, cookie_conf);

  CONF_ATTRIBUTE_LIST.forEach(function(key) {
    if ( key in conf ) {
      var result = CONF_ATTRIBUTES[key].S(conf[key]);

      if (result !== undefined) {
        NEURON_CONF[key] = result;
      }
    }
  });
}


// @expose
neuron.config = config;



// NEURON_CONF.depTree
// {
//     "a": {
//         "1.2.3": [
//             // sync dependencies
//             {
//                 "sync": "~3.0.0"
//             },
//             // async dependencies
//             {
//                 "async": "~2.1.2"
//             }
//         ]
//     }
// }
function getAllUnloadedSyncDeps(name, version) {
  var tree = NEURON_CONF.depTree || {};
  var loaded = NEURON_CONF.loaded;
  var found = [];

  // Parse dependencies
  parseDeps(name, version, found, loaded, tree);
  return found;
}


// - parse the dependency tree
// - get all dependencies of a package including recursive dependencies
// - filter out already loaded packages
// @param {Array} found
// @param {Array} loaded 
// @param {Object} tree
function parseDeps(name, version, found, loaded, tree) {
  var pkg = name + '@' + version;
  if (!~loaded.indexOf(pkg)) {
    found.push({
      pkg: pkg,
      name: name,
      version: version
    });
    loaded.push(pkg);

    var sync_deps = getSyncDeps(name, version, tree);
    var dep_name;
    var dep_version;

    for (dep_name in sync_deps) {
      dep_version = NEURON_CONF.transform(sync_deps[dep_name], dep_name);
      // recursively
      parseDeps(dep_name, dep_version, found, loaded, tree);
    }
  }
}


// Get the synchronous dependencies of a certain package
function getSyncDeps(name, version, tree) {
  var versions = tree[name] || {};
  var deps = versions[version] || [];
  var sync = deps[0] || {};
  return sync;
}

// Explode public methods

// @expose
ENV.define = define;

// @expose
ENV.facade = facade;

// legacy
// ENV.loader =

// private methods only for testing
// avoid using this method in product environment
// @expose
ENV._use = function (id, callback) {
  useModuleById(id, callback);
};

// @expose
ENV._load = loadJS;


// Attach a module for business facade, for configurations of inline scripts
// if you want a certain biz module to be initialized automatically, the module's exports should contain a method named 'init'
// ### Usage 
// ```
// <code>
//     // require biz modules with configs
//     facade({
//         mod: 'app-main-header-bar',
//         data: {
//             icon: 'http://kael.me/u/2012-03/icon.png'
//         }
//     });
// </code>
//  ```
function facade(item) {
  useModuleById(item.mod, function(method) {
    method.init && method.init(item.data);
  });
}


function useModuleById (id, callback) {
  var mod = getModuleById(id);
  useModule(mod, callback);
}

// The logic to load the javascript file of a package
// NOTICE that this is NOT part of neuron core

// server: 'http://localhost/abc',
// -> http://localhost/abc/<relative>
// @param {string} relative relative module url
function absolutizeURL(pathname) {
  var base = NEURON_CONF.path;
  if (!base) {
    throw new Error('neuron: config.path must be specified');
  }

  base = base.replace('{n}', pathname.length % 3 + 1);

  return pathResolve(base, pathname);
}


// This function should be defined with neuron.config({combo: fn})
// neuron.conf.combo = 
// function generateComboURL (mods) {
//     return '../concat/' + mods.map(function (mod) {
//         return '~mod~' + (mod.pkg + '/' + mod.name).replace(/\/|@/g, '~') + '.js';
//     }).join(',');
// }


// Load the script file of a module into the current document
// @param {string} id module identifier
function loadByModule(mod) {
  var loaded = NEURON_CONF.loaded;
  var pathname;

  if (~loaded.indexOf(mod.pkg)) {
    // If the main entrance of the package is already loaded 
    // and the current module is not an async module, skip loading.
    // see: declaration of `require.async`
    if (mod.async) {
      pathname = generateModulePathname(mod);
    } else {
      return;
    }

    // load packages
  } else {
    var combine = NEURON_CONF.combo;

    if (combine) {
      var modules = getAllUnloadedSyncDeps(mod.name, mod.version);

      if (modules.length > 1) {
        pathname = combine(modules);
      }

      // `getAllUnloadedSyncDeps` will push loaded.
    } else {
      loaded.push(mod.pkg);
    }

    // If no combine configuration, or there's less than 2 packages,
    // load the package file directly
    pathname = pathname || generateModulePathname(mod);
  }

  loadJS(absolutizeURL(pathname));
}


function generateModulePathname(mod) {
  return './' + (
    mod.main
    // if is a main module, we will load the source file by package

    // 1.
    // on use: 'a@1.0.0' (async or sync)
    // -> 'a/1.0.0/a.js'

    // 2.
    // on use: 'a@1.0.0/relative' (sync)
    // -> not an async module, so the module is already packaged inside:
    // -> 'a/1.0.0/a.js'
    ? mod.pkg + '/' + mod.name

    // if is an async module, we will load the source file by module id
    : mod.id

  ).replace('@', '/') + (NEURON_CONF.ext || '.js');
}


neuron.on('use', function(e) {
  !e.defined && loadByModule(e.mod);
});


// Simply use `this`, and never detect the current environment
})(this);
