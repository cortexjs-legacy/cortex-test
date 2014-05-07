var MochaBase = require("mocha/lib/reporters").Base;
var Nyan = require("mocha/lib/reporters").Nyan;

function Base(runner){
    var m = new Nyan(runner);
    runner.on('done', function(result) {
        var browser = result.browser;
        var data = result.data;
        var passes = data.passes;
        var failures = data.failures;

        function toMochaErr(failure){
            return {
                title: failure.title,
                fullTitle: function(){
                    return failure.fullTitle
                },
                err: new Error(failure.error)
            }
        }

        m.stats = {
            passes: passes.length,
            failures: failures.length,
            duration: 0
        };


        console.log("==============================");
        console.log("%s %s %s",browser.name,browser.version,browser.os);
        console.log("==============================");
        if(failures.length){
            MochaBase.list(failures.map(toMochaErr));
        }
        // console.log(JSON.stringify(m.stats))
        m.epilogue();
    }).on('complete', function() {
        process.exit(0);
    }).on('error',function(error){
        logger.error(error.message);
    });
}


module.exports = Base;
