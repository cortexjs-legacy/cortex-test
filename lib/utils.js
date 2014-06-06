exports.openUrl = function(url) {
  switch (process.platform) {
    case "darwin":
      exec('open ' + url);
      break;
    case "win32":
      exec('start ' + url);
      break;
    default:
      spawn('xdg-open', [url]);
      // I use `spawn` since `exec` fails on my machine (Linux i386).
      // I heard that `exec` has memory limitation of buffer size of 512k.
      // http://stackoverflow.com/a/16099450/222893
      // But I am not sure if this memory limit causes the failure of `exec`.
      // `xdg-open` is specified in freedesktop standard, so it should work on
      // Linux, *BSD, solaris, etc.
  }
}