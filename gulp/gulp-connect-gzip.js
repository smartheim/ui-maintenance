/*!
 * Ext JS Connect
 * Copyright(c) 2010 Sencha Inc.
 * MIT Licensed
 */

var spawn = require('child_process').spawn;

/**
 * Connect middleware providing gzip compression on the fly. By default, it
 * compresses requests with mime types that match the expression
 * /text|javascript|json/.
 *
 * Options:
 *
 *  - `matchType`   Regular expression matching mime types to be compressed
 *  - `flags`       String of flags passed to the binary. Nothing by default
 *  - `bin`         Binary executable defaulting to "gzip"
 *
 * @param {Object} options
 * @api public
 */

module.exports = function (options) {
  var options = options || {},
    matchType = options.matchType || /text|javascript|json/,
    bin = options.bin || 'gzip', // Can also be "brotli" for example
    encoding = options.encoding || 'gzip', // Can also be "br" for example
    flags = options.flags || '';

  if (!matchType.test) throw new Error('option matchType must be a regular expression');

  flags = (flags) ? '-c ' + flags : '-c';
  flags = flags.split(' ');

  return function (req, res, next) {
    var defaults = {writeHead: res.writeHead, write: res.write, end: res.end};
    var accept = req.headers['accept-encoding'] || '';
    var type = res.getHeader('content-type') || '';
    var reqEncoding = res.getHeader('content-encoding');

    if (req.method === 'HEAD' || code !== 200 || !~accept.indexOf(encoding) || !matchType.test(type) || reqEncoding) {
      next();
      return;
    }

    res.writeHead = function (code) {
      var args = arguments.slice(0);
      if (args.length > 1) {
        var headers = args.pop();
        for (var key in headers) {
          res.setHeader(key, headers[key]);
        }
      }

      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Vary', 'Accept-Encoding');
      res.removeHeader('Content-Length');

      var gzip = spawn(bin, flags);

      res.write = (chunk, encoding) => gzip.stdin.write(chunk, encoding);

      res.end = (chunk, encoding) => {
        if (chunk) {
          res.write(chunk, encoding);
        }
        gzip.stdin.end();
      };

      gzip.stdout.addListener('data', chunk => res.write(chunk));

      gzip.addListener('exit', () => {
        res.write = defaults.write;
        res.end = defaults.end;
        res.end();
      });

      res.writeHead = defaults.writeHead;
      res.writeHead(args);
    };

    next();
  };
};

/*
if (res.writeHead !== writeHead) {
  res.writeHead(res.statusCode);
}
*/