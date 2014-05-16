#Writing a reporter


##Naming

    your package should be name as `cortex-test-<name>-reporter`.
    after `npm install cortex-test-<name>-reporter -g` it can be use by `--reporter <name>`.

##Handle events

you should handle events to print funny things to your terminal. and assure to exit with correct code on `complete`.

see [Writing an adapter](writing-an-adapter.md#the-runner-instance) to learn the data structure for events

##Sample code from built-in BaseReporter
```js
function Base(runner){
    var self = this;
    self.hasFailure = false;

    runner.on('done', function(result) {
        var browser = result.browser;
        var data = result.data;

        self.logs(data.logs);
        self.browser(result.browser);
        self.passes(data.passes);
        self.failures(data.failures);
        self.conclusion(data);
    }).on('complete', function() {
        process.exit(self.hasFailure?1:0);
    }).on('error',function(error){
        logger.error(error);
        self.hasFailure = true;
        logger.error(error.message);
    });
}
```
