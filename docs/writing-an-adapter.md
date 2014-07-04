#Writing an adapter

`cortex-test` adapter is used to run the built page against one browser or more, and to give reports to your command line.

##Naming

    your package should be named as `cortex-test-<name>-adapter`.
    after `npm install cortex-test-<name>-adapter -g` it can be use by `--mode <name>`.

## Exports `inject` (optional)

    It's a function which will take the content of request body, and gives you chance to modify it.

    Example:

    ```
    function(content, callback){
      callback(null, content);
    };
    ```

## Exports `isLocal` (optional)

## Exports `runner`
exports.runner = require("./runner")

## Implement Runner

## Inherits EventEmitter

    util.inherits(Runner,require('events').EventEmitter);

### Get config from command line

    function Runner(config) {
      this.config = config;
    }

#### Default options

- `path` the html path built from raw test codes
- `cwd` the current working directory

##Implement the "run" function

    ```js
    Runner.prototype.run = function(){
        /* here is your code */
    }
    ```

##Fire events properly

###Event: 'log'

will cause `cortex-test` to print infos when `verbose` is specified

###Event:'done'

emits when test done in one browser

- result `Object`
    - result
        - browser `Object`
            - name
            - version
            - os
        - logs `Array.<String>` array of log strings from test code
        - passes `Array.<Pass>` array of struct `Pass`
        - failures `Array.<Failure>` array of struct `Failure`

- Failure
    - title
    - err
        - message
        - stack

- Pass
    - title
    - fullTitle

###Event:'error'

emits when error occurs

- event `Object`
    - message
    - stack

###Event:'complete'

emits when all tests done