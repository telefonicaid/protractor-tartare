# Protractor Tartare Framework

**The Tartare family:**
[tartare](https://github.com/telefonicaid/tartare/) |
[tartare-chai](https://github.com/telefonicaid/tartare-chai/) |
[tartare-mock](https://github.com/telefonicaid/tartare-mock/) |
[tartare-util](https://github.com/telefonicaid/tartare-util/) |
[tartare-collections](https://github.com/telefonicaid/tartare-collections/) |
[tartare-logs](https://github.com/telefonicaid/tartare-logs/)

---

This framework allows you to use [Protractor](http://angular.github.io/protractor) 
along with [Tartare](https://github.com/telefonicaid/tartare), so you can code tests for your
[AngularJS](https://angularjs.org/) application using the BDD/Gherkin syntax provided by Tartare. 


## Install
This plugin is available as an NPM module.

```bash
$ npm install protractor-tartare
```

## Usage
To use the Tartare framework in Protractor, configure it as a Protractor custom framework:
 
```js
exports.config = {
  framework: 'custom',
  frameworkPath: require.resolve('protractor-tartare'),
  tartareOpts: {
    reporter: 'gherkin',
    timeout: 15000
  }
};
```

You can use any Tartare option as described in the 
[Tartare documentation](https://github.com/telefonicaid/tartare#using-tartare-programmatically).

For more details about using the Tartare framework with Protractor, go 
[here](https://github.com/telefonicaid/tartare#testing-web-apps-with-tartare--protractor).

For general information about writing tests with Tartare read the 
[full documentation](https://github.com/telefonicaid/tartare#tartare---code-driven-testing).
