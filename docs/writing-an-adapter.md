#Write an adapter

`cortex-test` adapter is used to run the built page against one browser or more, and give reports to your command line. 

##Naming
    
    your package should be name as `cortex-test-<name>-adapter`.
    then it will be use by `cortex test --mode <name>` 

##Read options from `cortex-test` command
    
    module.exports = function (options){
        new MyAdapter(options);
    }

##Default options
    
- `path` the html path built from raw test codes
- `cwd` the current working directory

##Inherits EventEmitter

    util.inherits(MyAdapter,require('events').EventEmitter); 

##Implement the "test" function

    ```js
    MyAdapter.prototype.test = function(){
        var testRunner = new Runner();
        // an test instance should be returned
        return testRunner;
    }
    ```

##Event:'log'

will cause `cortex-test` to print in `verbose` mode
   
##Event:'error'

will cause `cortex-test` to print in error message

##The "Runner" instance

should implements the events given below, so our reporter can be feeded happily.

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