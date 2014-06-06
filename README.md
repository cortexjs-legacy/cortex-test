#CLI

###Usage:
    Usage: cortex test [options]

    Options:
      -R, --reporter  test reporter                                     [default: "base"]
      -r, --root      static root, such as `http://i2.dpfile.com/mod`
      -V, --verbose   see verbose info
      -H, --help
      -m, --mode                                                        [default: "local"]
        
###Run in local mode

    cortex test

your browser will open on `http://127.0.0.1:1976/`. you can check mocha tests on your own


###Multi browser test with browserman:
    npm install cortex-test-browserman-adapter -g
    cortex test -m browserman -r http://i2.static.dp/mod --browser "firefox,chrome,internet explorer@>8.0.0"
    
you will see:

      ----------------------------------------
        firefox 29.0.0 windows
      ----------------------------------------

      ✓ should return instance of Mbox
      ✓ should open and close properly
      ✓ should be able to open multi mboxes

        3 passing
    
      ----------------------------------------
        chrome 34.0.0 windows
      ----------------------------------------

      ✓ should return instance of Mbox
      ✓ should open and close properly
      ✓ should be able to open multi mboxes

        3 passing

      ----------------------------------------
        internet explorer 9.0.0 windows
      ----------------------------------------

      ✓ should return instance of Mbox
      ✓ should open and close properly
      ✓ should be able to open multi mboxes

        3 passing

###Learn more

- [Writing an adapter](docs/writing-an-adapter.md)
- [Writing a reporter](docs/writing-a-reporter.md)

