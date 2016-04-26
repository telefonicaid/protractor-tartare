'use strict';

var q = require('q');
var promise = protractor.promise;
var flow = promise.controlFlow();

/**
 * Wraps a function on Tartare interface so it runs inside a
 * WebDriver Control Flow and waits for the flow to complete
 * before continuing.
 *
 * @param {!Function} interfaceFn The function to wrap.
 * @return {!Function} The new function.
 */
function wrap(interfaceFn) {
  function _wrapRunnableFn(fn) {
    var wrappedFn = function(done) {
      // Modify the Runnable callback to reset the Control Flow before calling the callback
      var cb = this.runnable().callback;
      this.runnable().callback = function() {
        flow.reset();
        return cb.apply(this, arguments);
      };

      var runnableFn = fn.bind(this);  // Ignore any argument passed to fn
      flow.execute(function() {
        var done = promise.defer();
        promise.asap(runnableFn(done.reject), done.fulfill, done.reject);
        return done.promise;
      }).then(done.bind(this), done);
    };

    wrappedFn.toString = function() {
      return fn.toString();
    };

    return wrappedFn;
  }

  return function() {
    var args = Array.prototype.slice.call(arguments);
    var fn  = args.pop();
    if (fn instanceof Function) {
      fn = _wrapRunnableFn(fn);
    }
    args.push(fn);
    return interfaceFn.apply(this, args);
  };
}

/**
 * @param {Runner} runner The Protractor runner instance.
 * @param {Array.<string>} specs A list of absolute filenames.
 * @return {q.Promise} Promise resolved with the test results.
 */
exports.run = function(runner, specs) {
  var Tartare = require('tartare'),
      tartare = new Tartare(runner.getConfig().tartareOpts);

  var deferred = q.defer();

  // Mocha doesn't set up the interface until the pre-require event,
  // so wait until then to wrap steps and hooks functions.
  tartare.mocha.suite.on('pre-require', function(context) {
    try {
      // Wrap steps functions to run them inside a WebDriver Control Flow
      ['given', 'when', 'then', 'and', 'but'].forEach(function(step) {
        var originalStepManual = context[step].manual;
        var originalStepSkip = context[step].skip;
        var originalStepManualSkip = context[step].manual.skip;
        context[step] = wrap(context[step]);
        context[step].async = context[step];  // Backwards compatibility
        context[step].manual = originalStepManual;
        context[step].skip = originalStepSkip;
        context[step].manual.skip = originalStepManualSkip;
      });

      // Wrap hooks functions to run them inside a WebDriver Control Flow
      [
        'beforeAll', 'beforeFeature', 'beforeEachScenario', 'beforeScenario', 'beforeEachVariant',
        'afterAll', 'afterFeature', 'afterEachScenario', 'afterScenario', 'afterEachVariant'
      ].forEach(function(hook) {
        context[hook] = wrap(context[hook]);
        context[hook].async = context[hook];  // Backwards compatibility
      });
    } catch (err) {
      deferred.reject(err);
    }
  });

  tartare.mocha.loadFiles();

  runner.runTestPreparer().then(function() {
    tartare.addFiles(specs);

    var testResult = [];

    var mochaRunner = tartare.mocha.run(function(failures) {
      try {
        var completed = q();
        if (runner.getConfig().onComplete) {
          completed = q(runner.getConfig().onComplete());
        }
        completed.then(function() {
          deferred.resolve({
            failedCount: failures,
            specResults: testResult
          });
        });
      } catch (err) {
        deferred.reject(err);
      }
    });

    mochaRunner.on('variant end', function(variant) {
      var testInfo = {
        name: variant.parent.title + ' --> ' + variant.title,  // Scenario + Variant titles
        category: variant.parent.parent.title  // Feature title
      };
      if (!variant.buggy) {
        runner.emit('testPass', testInfo);
        testResult.push({
          description: testInfo.name,
          assertions: [{
            passed: true
          }],
          duration: variant.duration
        });
      } else {
        var failedStep = null;
        // Find the first failed step
        variant.tests.every(function(step) {
          if (step.state === 'failed') {
            failedStep = step;
            return false;
          }
          return true;
        });
        runner.emit('testFail', testInfo);
        testResult.push({
          description: testInfo.name + ' --> ' + failedStep.title,  // Add the failed step title
          assertions: [{
            passed: false,
            errorMsg: failedStep.err.message,
            stackTrace: failedStep.err.stack
          }],
          duration: variant.duration
        });
      }
    });
  }).catch(function(reason) {
    deferred.reject(reason);
  });

  return deferred.promise;
};
