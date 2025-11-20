exports.id = 468;
exports.ids = [468];
exports.modules = {
  /***/ 6323: /***/ module => {
    var isMergeableObject = function isMergeableObject(value) {
      return isNonNullObject(value) && !isSpecial(value);
    };

    function isNonNullObject(value) {
      return !!value && typeof value === 'object';
    }

    function isSpecial(value) {
      var stringValue = Object.prototype.toString.call(value);

      return (
        stringValue === '[object RegExp]' ||
        stringValue === '[object Date]' ||
        isReactElement(value)
      );
    }

    // see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25
    var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
    var REACT_ELEMENT_TYPE = canUseSymbol
      ? Symbol.for('react.element')
      : 0xeac7;

    function isReactElement(value) {
      return value.$$typeof === REACT_ELEMENT_TYPE;
    }

    function emptyTarget(val) {
      return Array.isArray(val) ? [] : {};
    }

    function cloneUnlessOtherwiseSpecified(value, options) {
      return options.clone !== false && options.isMergeableObject(value)
        ? deepmerge(emptyTarget(value), value, options)
        : value;
    }

    function defaultArrayMerge(target, source, options) {
      return target
        .concat(source)
        .map(element => cloneUnlessOtherwiseSpecified(element, options));
    }

    function getMergeFunction(key, options) {
      if (!options.customMerge) {
        return deepmerge;
      }
      var customMerge = options.customMerge(key);
      return typeof customMerge === 'function' ? customMerge : deepmerge;
    }

    function getEnumerableOwnPropertySymbols(target) {
      return Object.getOwnPropertySymbols
        ? Object.getOwnPropertySymbols(target).filter(symbol =>
            Object.propertyIsEnumerable.call(target, symbol)
          )
        : [];
    }

    function getKeys(target) {
      return Object.keys(target).concat(
        getEnumerableOwnPropertySymbols(target)
      );
    }

    function propertyIsOnObject(object, property) {
      try {
        return property in object;
      } catch (_) {
        return false;
      }
    }

    // Protects from prototype poisoning and unexpected merging up the prototype chain.
    function propertyIsUnsafe(target, key) {
      return (
        propertyIsOnObject(target, key) && // Properties are safe to merge if they don't exist in the target yet,
        !(
          Object.hasOwn(target, key) && // unsafe if they exist up the prototype chain,
          Object.propertyIsEnumerable.call(target, key)
        )
      ); // and also unsafe if they're nonenumerable.
    }

    function mergeObject(target, source, options) {
      var destination = {};
      if (options.isMergeableObject(target)) {
        getKeys(target).forEach(key => {
          destination[key] = cloneUnlessOtherwiseSpecified(
            target[key],
            options
          );
        });
      }
      getKeys(source).forEach(key => {
        if (propertyIsUnsafe(target, key)) {
          return;
        }

        if (
          propertyIsOnObject(target, key) &&
          options.isMergeableObject(source[key])
        ) {
          destination[key] = getMergeFunction(key, options)(
            target[key],
            source[key],
            options
          );
        } else {
          destination[key] = cloneUnlessOtherwiseSpecified(
            source[key],
            options
          );
        }
      });
      return destination;
    }

    function deepmerge(target, source, options) {
      options = options || {};
      options.arrayMerge = options.arrayMerge || defaultArrayMerge;
      options.isMergeableObject =
        options.isMergeableObject || isMergeableObject;
      // cloneUnlessOtherwiseSpecified is added to `options` so that custom arrayMerge()
      // implementations can use it. The caller may not replace it.
      options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;

      var sourceIsArray = Array.isArray(source);
      var targetIsArray = Array.isArray(target);
      var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

      if (!sourceAndTargetTypesMatch) {
        return cloneUnlessOtherwiseSpecified(source, options);
      } else if (sourceIsArray) {
        return options.arrayMerge(target, source, options);
      } else {
        return mergeObject(target, source, options);
      }
    }

    deepmerge.all = function deepmergeAll(array, options) {
      if (!Array.isArray(array)) {
        throw new Error('first argument should be an array');
      }

      return array.reduce((prev, next) => deepmerge(prev, next, options), {});
    };

    var deepmerge_1 = deepmerge;

    module.exports = deepmerge_1;

    /***/
  },

  /***/ 7356: /***/ module => {
    module.exports = clone;

    var getPrototypeOf = Object.getPrototypeOf || (obj => obj.__proto__);

    function clone(obj) {
      if (obj === null || typeof obj !== 'object') return obj;

      if (obj instanceof Object) var copy = { __proto__: getPrototypeOf(obj) };
      else var copy = Object.create(null);

      Object.getOwnPropertyNames(obj).forEach(key => {
        Object.defineProperty(
          copy,
          key,
          Object.getOwnPropertyDescriptor(obj, key)
        );
      });

      return copy;
    }

    /***/
  },

  /***/ 7758: /***/ (module, __unused_webpack_exports, __webpack_require__) => {
    var fs = __webpack_require__(7147);
    var polyfills = __webpack_require__(263);
    var legacy = __webpack_require__(3086);
    var clone = __webpack_require__(7356);

    var util = __webpack_require__(3837);

    /* istanbul ignore next - node 0.x polyfill */
    var gracefulQueue;
    var previousSymbol;

    /* istanbul ignore else - node 0.x polyfill */
    if (typeof Symbol === 'function' && typeof Symbol.for === 'function') {
      gracefulQueue = Symbol.for('graceful-fs.queue');
      // This is used in testing by future versions
      previousSymbol = Symbol.for('graceful-fs.previous');
    } else {
      gracefulQueue = '___graceful-fs.queue';
      previousSymbol = '___graceful-fs.previous';
    }

    function noop() {}

    function publishQueue(context, queue) {
      Object.defineProperty(context, gracefulQueue, {
        get: () => queue
      });
    }

    var debug = noop;
    if (util.debuglog) debug = util.debuglog('gfs4');
    else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ''))
      debug = function () {
        var m = util.format.apply(util, arguments);
        m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ');
        console.error(m);
      };

    // Once time initialization
    if (!fs[gracefulQueue]) {
      // This queue can be shared by multiple loaded instances
      var queue = global[gracefulQueue] || [];
      publishQueue(fs, queue);

      // Patch fs.close/closeSync to shared queue version, because we need
      // to retry() whenever a close happens *anywhere* in the program.
      // This is essential when multiple graceful-fs instances are
      // in play at the same time.
      fs.close = (fs$close => {
        function close(fd, cb) {
          return fs$close.call(fs, fd, function (err) {
            // This function uses the graceful-fs shared queue
            if (!err) {
              resetQueue();
            }

            if (typeof cb === 'function') cb.apply(this, arguments);
          });
        }

        Object.defineProperty(close, previousSymbol, {
          value: fs$close
        });
        return close;
      })(fs.close);

      fs.closeSync = (fs$closeSync => {
        function closeSync(fd) {
          // This function uses the graceful-fs shared queue
          fs$closeSync.apply(fs, arguments);
          resetQueue();
        }

        Object.defineProperty(closeSync, previousSymbol, {
          value: fs$closeSync
        });
        return closeSync;
      })(fs.closeSync);

      if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
        process.on('exit', () => {
          debug(fs[gracefulQueue]);
          __webpack_require__(9491).equal(fs[gracefulQueue].length, 0);
        });
      }
    }

    if (!global[gracefulQueue]) {
      publishQueue(global, fs[gracefulQueue]);
    }

    module.exports = patch(clone(fs));
    if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs.__patched) {
      module.exports = patch(fs);
      fs.__patched = true;
    }

    function patch(fs) {
      // Everything that references the open() function needs to be in here
      polyfills(fs);
      fs.gracefulify = patch;

      fs.createReadStream = createReadStream;
      fs.createWriteStream = createWriteStream;
      var fs$readFile = fs.readFile;
      fs.readFile = readFile;
      function readFile(path, options, cb) {
        if (typeof options === 'function') (cb = options), (options = null);

        return go$readFile(path, options, cb);

        function go$readFile(path, options, cb, startTime) {
          return fs$readFile(path, options, function (err) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([
                go$readFile,
                [path, options, cb],
                err,
                startTime || Date.now(),
                Date.now()
              ]);
            else {
              if (typeof cb === 'function') cb.apply(this, arguments);
            }
          });
        }
      }

      var fs$writeFile = fs.writeFile;
      fs.writeFile = writeFile;
      function writeFile(path, data, options, cb) {
        if (typeof options === 'function') (cb = options), (options = null);

        return go$writeFile(path, data, options, cb);

        function go$writeFile(path, data, options, cb, startTime) {
          return fs$writeFile(path, data, options, function (err) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([
                go$writeFile,
                [path, data, options, cb],
                err,
                startTime || Date.now(),
                Date.now()
              ]);
            else {
              if (typeof cb === 'function') cb.apply(this, arguments);
            }
          });
        }
      }

      var fs$appendFile = fs.appendFile;
      if (fs$appendFile) fs.appendFile = appendFile;
      function appendFile(path, data, options, cb) {
        if (typeof options === 'function') (cb = options), (options = null);

        return go$appendFile(path, data, options, cb);

        function go$appendFile(path, data, options, cb, startTime) {
          return fs$appendFile(path, data, options, function (err) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([
                go$appendFile,
                [path, data, options, cb],
                err,
                startTime || Date.now(),
                Date.now()
              ]);
            else {
              if (typeof cb === 'function') cb.apply(this, arguments);
            }
          });
        }
      }

      var fs$copyFile = fs.copyFile;
      if (fs$copyFile) fs.copyFile = copyFile;
      function copyFile(src, dest, flags, cb) {
        if (typeof flags === 'function') {
          cb = flags;
          flags = 0;
        }
        return go$copyFile(src, dest, flags, cb);

        function go$copyFile(src, dest, flags, cb, startTime) {
          return fs$copyFile(src, dest, flags, function (err) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([
                go$copyFile,
                [src, dest, flags, cb],
                err,
                startTime || Date.now(),
                Date.now()
              ]);
            else {
              if (typeof cb === 'function') cb.apply(this, arguments);
            }
          });
        }
      }

      var fs$readdir = fs.readdir;
      fs.readdir = readdir;
      var noReaddirOptionVersions = /^v[0-5]\./;
      function readdir(path, options, cb) {
        if (typeof options === 'function') (cb = options), (options = null);

        var go$readdir = noReaddirOptionVersions.test(process.version)
          ? function go$readdir(path, options, cb, startTime) {
              return fs$readdir(
                path,
                fs$readdirCallback(path, options, cb, startTime)
              );
            }
          : function go$readdir(path, options, cb, startTime) {
              return fs$readdir(
                path,
                options,
                fs$readdirCallback(path, options, cb, startTime)
              );
            };

        return go$readdir(path, options, cb);

        function fs$readdirCallback(path, options, cb, startTime) {
          return function (err, files) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([
                go$readdir,
                [path, options, cb],
                err,
                startTime || Date.now(),
                Date.now()
              ]);
            else {
              if (files && files.sort) files.sort();

              if (typeof cb === 'function') cb.call(this, err, files);
            }
          };
        }
      }

      if (process.version.substr(0, 4) === 'v0.8') {
        var legStreams = legacy(fs);
        ReadStream = legStreams.ReadStream;
        WriteStream = legStreams.WriteStream;
      }

      var fs$ReadStream = fs.ReadStream;
      if (fs$ReadStream) {
        ReadStream.prototype = Object.create(fs$ReadStream.prototype);
        ReadStream.prototype.open = ReadStream$open;
      }

      var fs$WriteStream = fs.WriteStream;
      if (fs$WriteStream) {
        WriteStream.prototype = Object.create(fs$WriteStream.prototype);
        WriteStream.prototype.open = WriteStream$open;
      }

      Object.defineProperty(fs, 'ReadStream', {
        get: () => ReadStream,
        set: val => {
          ReadStream = val;
        },
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(fs, 'WriteStream', {
        get: () => WriteStream,
        set: val => {
          WriteStream = val;
        },
        enumerable: true,
        configurable: true
      });

      // legacy names
      var FileReadStream = ReadStream;
      Object.defineProperty(fs, 'FileReadStream', {
        get: () => FileReadStream,
        set: val => {
          FileReadStream = val;
        },
        enumerable: true,
        configurable: true
      });
      var FileWriteStream = WriteStream;
      Object.defineProperty(fs, 'FileWriteStream', {
        get: () => FileWriteStream,
        set: val => {
          FileWriteStream = val;
        },
        enumerable: true,
        configurable: true
      });

      function ReadStream(path, options) {
        if (this instanceof ReadStream)
          return fs$ReadStream.apply(this, arguments), this;
        else
          return ReadStream.apply(
            Object.create(ReadStream.prototype),
            arguments
          );
      }

      function ReadStream$open() {
        open(this.path, this.flags, this.mode, (err, fd) => {
          if (err) {
            if (this.autoClose) this.destroy();

            this.emit('error', err);
          } else {
            this.fd = fd;
            this.emit('open', fd);
            this.read();
          }
        });
      }

      function WriteStream(path, options) {
        if (this instanceof WriteStream)
          return fs$WriteStream.apply(this, arguments), this;
        else
          return WriteStream.apply(
            Object.create(WriteStream.prototype),
            arguments
          );
      }

      function WriteStream$open() {
        open(this.path, this.flags, this.mode, (err, fd) => {
          if (err) {
            this.destroy();
            this.emit('error', err);
          } else {
            this.fd = fd;
            this.emit('open', fd);
          }
        });
      }

      function createReadStream(path, options) {
        return new fs.ReadStream(path, options);
      }

      function createWriteStream(path, options) {
        return new fs.WriteStream(path, options);
      }

      var fs$open = fs.open;
      fs.open = open;
      function open(path, flags, mode, cb) {
        if (typeof mode === 'function') (cb = mode), (mode = null);

        return go$open(path, flags, mode, cb);

        function go$open(path, flags, mode, cb, startTime) {
          return fs$open(path, flags, mode, function (err, fd) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([
                go$open,
                [path, flags, mode, cb],
                err,
                startTime || Date.now(),
                Date.now()
              ]);
            else {
              if (typeof cb === 'function') cb.apply(this, arguments);
            }
          });
        }
      }

      return fs;
    }

    function enqueue(elem) {
      debug('ENQUEUE', elem[0].name, elem[1]);
      fs[gracefulQueue].push(elem);
      retry();
    }

    // keep track of the timeout between retry() calls
    var retryTimer;

    // reset the startTime and lastTime to now
    // this resets the start of the 60 second overall timeout as well as the
    // delay between attempts so that we'll retry these jobs sooner
    function resetQueue() {
      var now = Date.now();
      for (var i = 0; i < fs[gracefulQueue].length; ++i) {
        // entries that are only a length of 2 are from an older version, don't
        // bother modifying those since they'll be retried anyway.
        if (fs[gracefulQueue][i].length > 2) {
          fs[gracefulQueue][i][3] = now; // startTime
          fs[gracefulQueue][i][4] = now; // lastTime
        }
      }
      // call retry to make sure we're actively processing the queue
      retry();
    }

    function retry() {
      // clear the timer and remove it to help prevent unintended concurrency
      clearTimeout(retryTimer);
      retryTimer = undefined;

      if (fs[gracefulQueue].length === 0) return;

      var elem = fs[gracefulQueue].shift();
      var fn = elem[0];
      var args = elem[1];
      // these items may be unset if they were added by an older graceful-fs
      var err = elem[2];
      var startTime = elem[3];
      var lastTime = elem[4];

      // if we don't have a startTime we have no way of knowing if we've waited
      // long enough, so go ahead and retry this item now
      if (startTime === undefined) {
        debug('RETRY', fn.name, args);
        fn.apply(null, args);
      } else if (Date.now() - startTime >= 60000) {
        // it's been more than 60 seconds total, bail now
        debug('TIMEOUT', fn.name, args);
        var cb = args.pop();
        if (typeof cb === 'function') cb.call(null, err);
      } else {
        // the amount of time between the last attempt and right now
        var sinceAttempt = Date.now() - lastTime;
        // the amount of time between when we first tried, and when we last tried
        // rounded up to at least 1
        var sinceStart = Math.max(lastTime - startTime, 1);
        // backoff. wait longer than the total time we've been retrying, but only
        // up to a maximum of 100ms
        var desiredDelay = Math.min(sinceStart * 1.2, 100);
        // it's been long enough since the last retry, do it again
        if (sinceAttempt >= desiredDelay) {
          debug('RETRY', fn.name, args);
          fn.apply(null, args.concat([startTime]));
        } else {
          // if we can't do this job yet, push it to the end of the queue
          // and let the next iteration check again
          fs[gracefulQueue].push(elem);
        }
      }

      // schedule our next run if one isn't already scheduled
      if (retryTimer === undefined) {
        retryTimer = setTimeout(retry, 0);
      }
    }

    /***/
  },

  /***/ 3086: /***/ (module, __unused_webpack_exports, __webpack_require__) => {
    var Stream = __webpack_require__(2781).Stream;

    module.exports = legacy;

    function legacy(fs) {
      return {
        ReadStream: ReadStream,
        WriteStream: WriteStream
      };

      function ReadStream(path, options) {
        if (!(this instanceof ReadStream)) return new ReadStream(path, options);

        Stream.call(this);

        this.path = path;
        this.fd = null;
        this.readable = true;
        this.paused = false;

        this.flags = 'r';
        this.mode = 438; /*=0666*/
        this.bufferSize = 64 * 1024;

        options = options || {};

        // Mixin options into this
        var keys = Object.keys(options);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index];
          this[key] = options[key];
        }

        if (this.encoding) this.setEncoding(this.encoding);

        if (this.start !== undefined) {
          if ('number' !== typeof this.start) {
            throw TypeError('start must be a Number');
          }
          if (this.end === undefined) {
            this.end = Infinity;
          } else if ('number' !== typeof this.end) {
            throw TypeError('end must be a Number');
          }

          if (this.start > this.end) {
            throw new Error('start must be <= end');
          }

          this.pos = this.start;
        }

        if (this.fd !== null) {
          process.nextTick(() => {
            this._read();
          });
          return;
        }

        fs.open(this.path, this.flags, this.mode, (err, fd) => {
          if (err) {
            this.emit('error', err);
            this.readable = false;
            return;
          }

          this.fd = fd;
          this.emit('open', fd);
          this._read();
        });
      }

      function WriteStream(path, options) {
        if (!(this instanceof WriteStream))
          return new WriteStream(path, options);

        Stream.call(this);

        this.path = path;
        this.fd = null;
        this.writable = true;

        this.flags = 'w';
        this.encoding = 'binary';
        this.mode = 438; /*=0666*/
        this.bytesWritten = 0;

        options = options || {};

        // Mixin options into this
        var keys = Object.keys(options);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index];
          this[key] = options[key];
        }

        if (this.start !== undefined) {
          if ('number' !== typeof this.start) {
            throw TypeError('start must be a Number');
          }
          if (this.start < 0) {
            throw new Error('start must be >= zero');
          }

          this.pos = this.start;
        }

        this.busy = false;
        this._queue = [];

        if (this.fd === null) {
          this._open = fs.open;
          this._queue.push([
            this._open,
            this.path,
            this.flags,
            this.mode,
            undefined
          ]);
          this.flush();
        }
      }
    }

    /***/
  },

  /***/ 263: /***/ (module, __unused_webpack_exports, __webpack_require__) => {
    var constants = __webpack_require__(2057);

    var origCwd = process.cwd;
    var cwd = null;

    var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;

    process.cwd = () => {
      if (!cwd) cwd = origCwd.call(process);
      return cwd;
    };
    try {
      process.cwd();
    } catch (er) {}

    // This check is needed until node.js 12 is required
    if (typeof process.chdir === 'function') {
      var chdir = process.chdir;
      process.chdir = d => {
        cwd = null;
        chdir.call(process, d);
      };
      if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir);
    }

    module.exports = patch;

    function patch(fs) {
      // (re-)implement some things that are known busted or missing.

      // lchmod, broken prior to 0.6.2
      // back-port the fix here.
      if (
        Object.hasOwn(constants, 'O_SYMLINK') &&
        process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)
      ) {
        patchLchmod(fs);
      }

      // lutimes implementation, or no-op
      if (!fs.lutimes) {
        patchLutimes(fs);
      }

      // https://github.com/isaacs/node-graceful-fs/issues/4
      // Chown should not fail on einval or eperm if non-root.
      // It should not fail on enosys ever, as this just indicates
      // that a fs doesn't support the intended operation.

      fs.chown = chownFix(fs.chown);
      fs.fchown = chownFix(fs.fchown);
      fs.lchown = chownFix(fs.lchown);

      fs.chmod = chmodFix(fs.chmod);
      fs.fchmod = chmodFix(fs.fchmod);
      fs.lchmod = chmodFix(fs.lchmod);

      fs.chownSync = chownFixSync(fs.chownSync);
      fs.fchownSync = chownFixSync(fs.fchownSync);
      fs.lchownSync = chownFixSync(fs.lchownSync);

      fs.chmodSync = chmodFixSync(fs.chmodSync);
      fs.fchmodSync = chmodFixSync(fs.fchmodSync);
      fs.lchmodSync = chmodFixSync(fs.lchmodSync);

      fs.stat = statFix(fs.stat);
      fs.fstat = statFix(fs.fstat);
      fs.lstat = statFix(fs.lstat);

      fs.statSync = statFixSync(fs.statSync);
      fs.fstatSync = statFixSync(fs.fstatSync);
      fs.lstatSync = statFixSync(fs.lstatSync);

      // if lchmod/lchown do not exist, then make them no-ops
      if (fs.chmod && !fs.lchmod) {
        fs.lchmod = (path, mode, cb) => {
          if (cb) process.nextTick(cb);
        };
        fs.lchmodSync = () => {};
      }
      if (fs.chown && !fs.lchown) {
        fs.lchown = (path, uid, gid, cb) => {
          if (cb) process.nextTick(cb);
        };
        fs.lchownSync = () => {};
      }

      // on Windows, A/V software can lock the directory, causing this
      // to fail with an EACCES or EPERM if the directory contains newly
      // created files.  Try again on failure, for up to 60 seconds.

      // Set the timeout this long because some Windows Anti-Virus, such as Parity
      // bit9, may lock files for up to a minute, causing npm package install
      // failures. Also, take care to yield the scheduler. Windows scheduling gives
      // CPU to a busy looping process, which can cause the program causing the lock
      // contention to be starved of CPU by node, so the contention doesn't resolve.
      if (platform === 'win32') {
        fs.rename =
          typeof fs.rename !== 'function'
            ? fs.rename
            : (fs$rename => {
                function rename(from, to, cb) {
                  var start = Date.now();
                  var backoff = 0;
                  fs$rename(from, to, function CB(er) {
                    if (
                      er &&
                      (er.code === 'EACCES' ||
                        er.code === 'EPERM' ||
                        er.code === 'EBUSY') &&
                      Date.now() - start < 60000
                    ) {
                      setTimeout(() => {
                        fs.stat(to, (stater, st) => {
                          if (stater && stater.code === 'ENOENT')
                            fs$rename(from, to, CB);
                          else cb(er);
                        });
                      }, backoff);
                      if (backoff < 100) backoff += 10;
                      return;
                    }
                    if (cb) cb(er);
                  });
                }
                if (Object.setPrototypeOf)
                  Object.setPrototypeOf(rename, fs$rename);
                return rename;
              })(fs.rename);
      }

      // if read() returns EAGAIN, then just try it again.
      fs.read =
        typeof fs.read !== 'function'
          ? fs.read
          : (fs$read => {
              function read(fd, buffer, offset, length, position, callback_) {
                var callback;
                if (callback_ && typeof callback_ === 'function') {
                  var eagCounter = 0;
                  callback = function (er, _, __) {
                    if (er && er.code === 'EAGAIN' && eagCounter < 10) {
                      eagCounter++;
                      return fs$read.call(
                        fs,
                        fd,
                        buffer,
                        offset,
                        length,
                        position,
                        callback
                      );
                    }
                    callback_.apply(this, arguments);
                  };
                }
                return fs$read.call(
                  fs,
                  fd,
                  buffer,
                  offset,
                  length,
                  position,
                  callback
                );
              }

              // This ensures `util.promisify` works as it does for native `fs.read`.
              if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read);
              return read;
            })(fs.read);

      fs.readSync =
        typeof fs.readSync !== 'function'
          ? fs.readSync
          : (fs$readSync => (fd, buffer, offset, length, position) => {
              var eagCounter = 0;
              while (true) {
                try {
                  return fs$readSync.call(
                    fs,
                    fd,
                    buffer,
                    offset,
                    length,
                    position
                  );
                } catch (er) {
                  if (er.code === 'EAGAIN' && eagCounter < 10) {
                    eagCounter++;
                    continue;
                  }
                  throw er;
                }
              }
            })(fs.readSync);

      function patchLchmod(fs) {
        fs.lchmod = (path, mode, callback) => {
          fs.open(
            path,
            constants.O_WRONLY | constants.O_SYMLINK,
            mode,
            (err, fd) => {
              if (err) {
                if (callback) callback(err);
                return;
              }
              // prefer to return the chmod error, if one occurs,
              // but still try to close, and report closing errors if they occur.
              fs.fchmod(fd, mode, err => {
                fs.close(fd, err2 => {
                  if (callback) callback(err || err2);
                });
              });
            }
          );
        };

        fs.lchmodSync = (path, mode) => {
          var fd = fs.openSync(
            path,
            constants.O_WRONLY | constants.O_SYMLINK,
            mode
          );

          // prefer to return the chmod error, if one occurs,
          // but still try to close, and report closing errors if they occur.
          var threw = true;
          var ret;
          try {
            ret = fs.fchmodSync(fd, mode);
            threw = false;
          } finally {
            if (threw) {
              try {
                fs.closeSync(fd);
              } catch (er) {}
            } else {
              fs.closeSync(fd);
            }
          }
          return ret;
        };
      }

      function patchLutimes(fs) {
        if (Object.hasOwn(constants, 'O_SYMLINK') && fs.futimes) {
          fs.lutimes = (path, at, mt, cb) => {
            fs.open(path, constants.O_SYMLINK, (er, fd) => {
              if (er) {
                if (cb) cb(er);
                return;
              }
              fs.futimes(fd, at, mt, er => {
                fs.close(fd, er2 => {
                  if (cb) cb(er || er2);
                });
              });
            });
          };

          fs.lutimesSync = (path, at, mt) => {
            var fd = fs.openSync(path, constants.O_SYMLINK);
            var ret;
            var threw = true;
            try {
              ret = fs.futimesSync(fd, at, mt);
              threw = false;
            } finally {
              if (threw) {
                try {
                  fs.closeSync(fd);
                } catch (er) {}
              } else {
                fs.closeSync(fd);
              }
            }
            return ret;
          };
        } else if (fs.futimes) {
          fs.lutimes = (_a, _b, _c, cb) => {
            if (cb) process.nextTick(cb);
          };
          fs.lutimesSync = () => {};
        }
      }

      function chmodFix(orig) {
        if (!orig) return orig;
        return (target, mode, cb) =>
          orig.call(fs, target, mode, function (er) {
            if (chownErOk(er)) er = null;
            if (cb) cb.apply(this, arguments);
          });
      }

      function chmodFixSync(orig) {
        if (!orig) return orig;
        return (target, mode) => {
          try {
            return orig.call(fs, target, mode);
          } catch (er) {
            if (!chownErOk(er)) throw er;
          }
        };
      }

      function chownFix(orig) {
        if (!orig) return orig;
        return (target, uid, gid, cb) =>
          orig.call(fs, target, uid, gid, function (er) {
            if (chownErOk(er)) er = null;
            if (cb) cb.apply(this, arguments);
          });
      }

      function chownFixSync(orig) {
        if (!orig) return orig;
        return (target, uid, gid) => {
          try {
            return orig.call(fs, target, uid, gid);
          } catch (er) {
            if (!chownErOk(er)) throw er;
          }
        };
      }

      function statFix(orig) {
        if (!orig) return orig;
        // Older versions of Node erroneously returned signed integers for
        // uid + gid.
        return (target, options, cb) => {
          if (typeof options === 'function') {
            cb = options;
            options = null;
          }
          function callback(er, stats) {
            if (stats) {
              if (stats.uid < 0) stats.uid += 0x100000000;
              if (stats.gid < 0) stats.gid += 0x100000000;
            }
            if (cb) cb.apply(this, arguments);
          }
          return options
            ? orig.call(fs, target, options, callback)
            : orig.call(fs, target, callback);
        };
      }

      function statFixSync(orig) {
        if (!orig) return orig;
        // Older versions of Node erroneously returned signed integers for
        // uid + gid.
        return (target, options) => {
          var stats = options
            ? orig.call(fs, target, options)
            : orig.call(fs, target);
          if (stats) {
            if (stats.uid < 0) stats.uid += 0x100000000;
            if (stats.gid < 0) stats.gid += 0x100000000;
          }
          return stats;
        };
      }

      // ENOSYS means that the fs doesn't support the op. Just ignore
      // that, because it doesn't matter.
      //
      // if there's no getuid, or if getuid() is something other
      // than 0, and the error is EINVAL or EPERM, then just ignore
      // it.
      //
      // This specific case is a silent failure in cp, install, tar,
      // and most other unix tools that manage permissions.
      //
      // When running as root, or if other types of errors are
      // encountered, then it's strict.
      function chownErOk(er) {
        if (!er) return true;

        if (er.code === 'ENOSYS') return true;

        var nonroot = !process.getuid || process.getuid() !== 0;
        if (nonroot) {
          if (er.code === 'EINVAL' || er.code === 'EPERM') return true;
        }

        return false;
      }
    }

    /***/
  },

  /***/ 2527: /***/ module => {
    /**
     * @preserve
     * JS Implementation of incremental MurmurHash3 (r150) (as of May 10, 2013)
     *
     * @author <a href="mailto:jensyt@gmail.com">Jens Taylor</a>
     * @see http://github.com/homebrewing/brauhaus-diff
     * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
     * @see http://github.com/garycourt/murmurhash-js
     * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
     * @see http://sites.google.com/site/murmurhash/
     */
    (() => {
      var cache;

      // Call this function without `new` to use the cached object (good for
      // single-threaded environments), or with `new` to create a new object.
      //
      // @param {string} key A UTF-16 or ASCII string
      // @param {number} seed An optional positive integer
      // @return {object} A MurmurHash3 object for incremental hashing
      function MurmurHash3(key, seed) {
        var m = this instanceof MurmurHash3 ? this : cache;
        m.reset(seed);
        if (typeof key === 'string' && key.length > 0) {
          m.hash(key);
        }

        if (m !== this) {
          return m;
        }
      }

      // Incrementally add a string to this hash
      //
      // @param {string} key A UTF-16 or ASCII string
      // @return {object} this
      MurmurHash3.prototype.hash = function (key) {
        var h1, k1, i, top, len;

        len = key.length;
        this.len += len;

        k1 = this.k1;
        i = 0;
        switch (this.rem) {
          case 0:
            k1 ^= len > i ? key.charCodeAt(i++) & 0xffff : 0;
          case 1:
            k1 ^= len > i ? (key.charCodeAt(i++) & 0xffff) << 8 : 0;
          case 2:
            k1 ^= len > i ? (key.charCodeAt(i++) & 0xffff) << 16 : 0;
          case 3:
            k1 ^= len > i ? (key.charCodeAt(i) & 0xff) << 24 : 0;
            k1 ^= len > i ? (key.charCodeAt(i++) & 0xff00) >> 8 : 0;
        }

        this.rem = (len + this.rem) & 3; // & 3 is same as % 4
        len -= this.rem;
        if (len > 0) {
          h1 = this.h1;
          while (1) {
            k1 = (k1 * 0x2d51 + (k1 & 0xffff) * 0xcc9e0000) & 0xffffffff;
            k1 = (k1 << 15) | (k1 >>> 17);
            k1 = (k1 * 0x3593 + (k1 & 0xffff) * 0x1b870000) & 0xffffffff;

            h1 ^= k1;
            h1 = (h1 << 13) | (h1 >>> 19);
            h1 = (h1 * 5 + 0xe6546b64) & 0xffffffff;

            if (i >= len) {
              break;
            }

            k1 =
              (key.charCodeAt(i++) & 0xffff) ^
              ((key.charCodeAt(i++) & 0xffff) << 8) ^
              ((key.charCodeAt(i++) & 0xffff) << 16);
            top = key.charCodeAt(i++);
            k1 ^= ((top & 0xff) << 24) ^ ((top & 0xff00) >> 8);
          }

          k1 = 0;
          switch (this.rem) {
            case 3:
              k1 ^= (key.charCodeAt(i + 2) & 0xffff) << 16;
            case 2:
              k1 ^= (key.charCodeAt(i + 1) & 0xffff) << 8;
            case 1:
              k1 ^= key.charCodeAt(i) & 0xffff;
          }

          this.h1 = h1;
        }

        this.k1 = k1;
        return this;
      };

      // Get the result of this hash
      //
      // @return {number} The 32-bit hash
      MurmurHash3.prototype.result = function () {
        var k1, h1;

        k1 = this.k1;
        h1 = this.h1;

        if (k1 > 0) {
          k1 = (k1 * 0x2d51 + (k1 & 0xffff) * 0xcc9e0000) & 0xffffffff;
          k1 = (k1 << 15) | (k1 >>> 17);
          k1 = (k1 * 0x3593 + (k1 & 0xffff) * 0x1b870000) & 0xffffffff;
          h1 ^= k1;
        }

        h1 ^= this.len;

        h1 ^= h1 >>> 16;
        h1 = (h1 * 0xca6b + (h1 & 0xffff) * 0x85eb0000) & 0xffffffff;
        h1 ^= h1 >>> 13;
        h1 = (h1 * 0xae35 + (h1 & 0xffff) * 0xc2b20000) & 0xffffffff;
        h1 ^= h1 >>> 16;

        return h1 >>> 0;
      };

      // Reset the hash object for reuse
      //
      // @param {number} seed An optional positive integer
      MurmurHash3.prototype.reset = function (seed) {
        this.h1 = typeof seed === 'number' ? seed : 0;
        this.rem = this.k1 = this.len = 0;
        return this;
      };

      // A cached object to use. This can be safely used if you're in a single-
      // threaded environment, otherwise you need to create new hashes to use.
      cache = new MurmurHash3();

      if (true) {
        module.exports = MurmurHash3;
      } else {
      }
    })();

    /***/
  },

  /***/ 7908: /***/ function (
    __unused_webpack_module,
    exports,
    __webpack_require__
  ) {
    // Generated by CoffeeScript 1.12.7
    (() => {
      var JSONStorage,
        KEY_FOR_EMPTY_STRING,
        LocalStorage,
        MetaKey,
        QUOTA_EXCEEDED_ERR,
        StorageEvent,
        _emptyDirectory,
        _escapeKey,
        _rm,
        createMap,
        events,
        fs,
        path,
        writeSync,
        extend = (child, parent) => {
          for (var key in parent) {
            if (hasProp.call(parent, key)) child[key] = parent[key];
          }
          function ctor() {
            this.constructor = child;
          }
          ctor.prototype = parent.prototype;
          child.prototype = new ctor();
          child.__super__ = parent.prototype;
          return child;
        },
        hasProp = {}.hasOwnProperty;

      path = __webpack_require__(1017);

      fs = __webpack_require__(7147);

      events = __webpack_require__(2361);

      writeSync = __webpack_require__(2671).sync;

      KEY_FOR_EMPTY_STRING = '---.EMPTY_STRING.---';

      _emptyDirectory = target => {
        var i, len, p, ref, results;
        ref = fs.readdirSync(target);
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          p = ref[i];
          results.push(_rm(path.join(target, p)));
        }
        return results;
      };

      _rm = target => {
        if (fs.statSync(target).isDirectory()) {
          _emptyDirectory(target);
          return fs.rmdirSync(target);
        } else {
          return fs.unlinkSync(target);
        }
      };

      _escapeKey = key => {
        var newKey;
        if (key === '') {
          newKey = KEY_FOR_EMPTY_STRING;
        } else {
          newKey = '' + key;
        }
        return newKey;
      };

      QUOTA_EXCEEDED_ERR = (superClass => {
        extend(QUOTA_EXCEEDED_ERR, superClass);

        function QUOTA_EXCEEDED_ERR(message) {
          this.message = message != null ? message : 'Unknown error.';
          QUOTA_EXCEEDED_ERR.__super__.constructor.call(this);
          if (Error.captureStackTrace != null) {
            Error.captureStackTrace(this, this.constructor);
          }
          this.name = this.constructor.name;
        }

        QUOTA_EXCEEDED_ERR.prototype.toString = function () {
          return this.name + ': ' + this.message;
        };

        return QUOTA_EXCEEDED_ERR;
      })(Error);

      StorageEvent = (() => {
        function StorageEvent(key1, oldValue1, newValue1, url, storageArea) {
          this.key = key1;
          this.oldValue = oldValue1;
          this.newValue = newValue1;
          this.url = url;
          this.storageArea = storageArea != null ? storageArea : 'localStorage';
        }

        return StorageEvent;
      })();

      MetaKey = (() => {
        function MetaKey(key1, index1) {
          this.key = key1;
          this.index = index1;
          if (!(this instanceof MetaKey)) {
            return new MetaKey(this.key, this.index);
          }
        }

        return MetaKey;
      })();

      createMap = () => {
        var Map;
        Map = () => {};
        Map.prototype = Object.create(null);
        return new Map();
      };

      LocalStorage = (superClass => {
        var instanceMap;

        extend(LocalStorage, superClass);

        instanceMap = {};

        function LocalStorage(_location, quota) {
          var handler;
          this._location = _location;
          this.quota = quota != null ? quota : 5 * 1024 * 1024;
          LocalStorage.__super__.constructor.call(this);
          if (!(this instanceof LocalStorage)) {
            return new LocalStorage(this._location, this.quota);
          }
          this._location = path.resolve(this._location);
          if (instanceMap[this._location] != null) {
            return instanceMap[this._location];
          }
          this.length = 0;
          this._bytesInUse = 0;
          this._keys = [];
          this._metaKeyMap = createMap();
          this._eventUrl = 'pid:' + process.pid;
          this._init();
          this._QUOTA_EXCEEDED_ERR = QUOTA_EXCEEDED_ERR;
          if (typeof Proxy !== 'undefined' && Proxy !== null) {
            handler = {
              set: (_this => (receiver, key, value) => {
                if (_this[key] != null) {
                  return (_this[key] = value);
                } else {
                  return _this.setItem(key, value);
                }
              })(this),
              get: (_this => (receiver, key) => {
                if (_this[key] != null) {
                  return _this[key];
                } else {
                  return _this.getItem(key);
                }
              })(this)
            };
            instanceMap[this._location] = new Proxy(this, handler);
            return instanceMap[this._location];
          }
          instanceMap[this._location] = this;
          return instanceMap[this._location];
        }

        LocalStorage.prototype._init = function () {
          var _MetaKey, _decodedKey, _keys, e, i, index, k, len, stat;
          try {
            stat = fs.statSync(this._location);
            if (stat != null && !stat.isDirectory()) {
              throw new Error(
                "A file exists at the location '" +
                  this._location +
                  "' when trying to create/open localStorage"
              );
            }
            this._bytesInUse = 0;
            this.length = 0;
            _keys = fs.readdirSync(this._location);
            for (index = i = 0, len = _keys.length; i < len; index = ++i) {
              k = _keys[index];
              _decodedKey = decodeURIComponent(k);
              this._keys.push(_decodedKey);
              _MetaKey = new MetaKey(k, index);
              this._metaKeyMap[_decodedKey] = _MetaKey;
              stat = this._getStat(k);
              if ((stat != null ? stat.size : void 0) != null) {
                _MetaKey.size = stat.size;
                this._bytesInUse += stat.size;
              }
            }
            this.length = _keys.length;
          } catch (error) {
            e = error;
            if (e.code !== 'ENOENT') {
              throw e;
            }
            try {
              fs.mkdirSync(this._location, {
                recursive: true
              });
            } catch (error) {
              e = error;
              if (e.code !== 'EEXIST') {
                throw e;
              }
            }
          }
        };

        LocalStorage.prototype.setItem = function (key, value) {
          var encodedKey,
            evnt,
            existsBeforeSet,
            filename,
            hasListeners,
            metaKey,
            oldLength,
            oldValue,
            valueString,
            valueStringLength;
          hasListeners = this.listenerCount('storage');
          oldValue = null;
          if (hasListeners) {
            oldValue = this.getItem(key);
          }
          key = _escapeKey(key);
          encodedKey = encodeURIComponent(key)
            .replace(/[!'()]/g, escape)
            .replace(/\*/g, '%2A');
          filename = path.join(this._location, encodedKey);
          valueString = '' + value;
          valueStringLength = valueString.length;
          metaKey = this._metaKeyMap[key];
          existsBeforeSet = !!metaKey;
          if (existsBeforeSet) {
            oldLength = metaKey.size;
          } else {
            oldLength = 0;
          }
          if (this._bytesInUse - oldLength + valueStringLength > this.quota) {
            throw new QUOTA_EXCEEDED_ERR();
          }
          writeSync(filename, valueString, {
            encoding: 'utf8'
          });
          if (!existsBeforeSet) {
            metaKey = new MetaKey(encodedKey, this._keys.push(key) - 1);
            metaKey.size = valueStringLength;
            this._metaKeyMap[key] = metaKey;
            this.length += 1;
            this._bytesInUse += valueStringLength;
          }
          if (hasListeners) {
            evnt = new StorageEvent(key, oldValue, value, this._eventUrl);
            return this.emit('storage', evnt);
          }
        };

        LocalStorage.prototype.getItem = function (key) {
          var filename, metaKey;
          key = _escapeKey(key);
          metaKey = this._metaKeyMap[key];
          if (metaKey) {
            filename = path.join(this._location, metaKey.key);
            return fs.readFileSync(filename, 'utf8');
          } else {
            return null;
          }
        };

        LocalStorage.prototype._getStat = function (key) {
          var filename;
          key = _escapeKey(key);
          filename = path.join(this._location, encodeURIComponent(key));
          try {
            return fs.statSync(filename);
          } catch (error) {
            return null;
          }
        };

        LocalStorage.prototype.removeItem = function (key) {
          var evnt, filename, hasListeners, k, meta, metaKey, oldValue, ref, v;
          key = _escapeKey(key);
          metaKey = this._metaKeyMap[key];
          if (metaKey) {
            hasListeners = this.listenerCount('storage');
            oldValue = null;
            if (hasListeners) {
              oldValue = this.getItem(key);
            }
            delete this._metaKeyMap[key];
            this.length -= 1;
            this._bytesInUse -= metaKey.size;
            filename = path.join(this._location, metaKey.key);
            this._keys.splice(metaKey.index, 1);
            ref = this._metaKeyMap;
            for (k in ref) {
              v = ref[k];
              meta = this._metaKeyMap[k];
              if (meta.index > metaKey.index) {
                meta.index -= 1;
              }
            }
            _rm(filename);
            if (hasListeners) {
              evnt = new StorageEvent(key, oldValue, null, this._eventUrl);
              return this.emit('storage', evnt);
            }
          }
        };

        LocalStorage.prototype.key = function (n) {
          var rawKey;
          rawKey = this._keys[n];
          if (rawKey === KEY_FOR_EMPTY_STRING) {
            return '';
          } else {
            return rawKey;
          }
        };

        LocalStorage.prototype.clear = function () {
          var evnt;
          _emptyDirectory(this._location);
          this._metaKeyMap = createMap();
          this._keys = [];
          this.length = 0;
          this._bytesInUse = 0;
          if (this.listenerCount('storage')) {
            evnt = new StorageEvent(null, null, null, this._eventUrl);
            return this.emit('storage', evnt);
          }
        };

        LocalStorage.prototype._getBytesInUse = function () {
          return this._bytesInUse;
        };

        LocalStorage.prototype._deleteLocation = function () {
          delete instanceMap[this._location];
          _rm(this._location);
          this._metaKeyMap = {};
          this._keys = [];
          this.length = 0;
          return (this._bytesInUse = 0);
        };

        return LocalStorage;
      })(events.EventEmitter);

      JSONStorage = (superClass => {
        extend(JSONStorage, superClass);

        function JSONStorage() {
          return JSONStorage.__super__.constructor.apply(this, arguments);
        }

        JSONStorage.prototype.setItem = function (key, value) {
          var newValue;
          newValue = JSON.stringify(value);
          return JSONStorage.__super__.setItem.call(this, key, newValue);
        };

        JSONStorage.prototype.getItem = function (key) {
          return JSON.parse(JSONStorage.__super__.getItem.call(this, key));
        };

        return JSONStorage;
      })(LocalStorage);

      exports.LocalStorage = LocalStorage;

      exports.JSONStorage = JSONStorage;

      exports.QUOTA_EXCEEDED_ERR = QUOTA_EXCEEDED_ERR;
    }).call(this);

    /***/
  },

  /***/ 2671: /***/ (module, __unused_webpack_exports, __webpack_require__) => {
    module.exports = writeFile;
    module.exports.sync = writeFileSync;
    module.exports._getTmpname = getTmpname; // for testing

    var fs = __webpack_require__(7758);
    var chain = __webpack_require__(6029).chain;
    var MurmurHash3 = __webpack_require__(2527);
    var extend = Object.assign || __webpack_require__(3837)._extend;

    var invocations = 0;
    function getTmpname(filename) {
      return (
        filename +
        '.' +
        MurmurHash3(__filename)
          .hash(String(process.pid))
          .hash(String(++invocations))
          .result()
      );
    }

    function writeFile(filename, data, options, callback) {
      if (options instanceof Function) {
        callback = options;
        options = null;
      }
      if (!options) options = {};
      fs.realpath(filename, (_, realname) => {
        _writeFile(realname || filename, data, options, callback);
      });
    }
    function _writeFile(filename, data, options, callback) {
      var tmpfile = getTmpname(filename);

      if (options.mode && options.chown) {
        return thenWriteFile();
      } else {
        // Either mode or chown is not explicitly set
        // Default behavior is to copy it from original file
        return fs.stat(filename, (err, stats) => {
          if (err || !stats) return thenWriteFile();

          options = extend({}, options);
          if (!options.mode) {
            options.mode = stats.mode;
          }
          if (!options.chown && process.getuid) {
            options.chown = { uid: stats.uid, gid: stats.gid };
          }
          return thenWriteFile();
        });
      }

      function thenWriteFile() {
        chain(
          [
            [
              writeFileAsync,
              tmpfile,
              data,
              options.mode,
              options.encoding || 'utf8'
            ],
            options.chown && [
              fs,
              fs.chown,
              tmpfile,
              options.chown.uid,
              options.chown.gid
            ],
            options.mode && [fs, fs.chmod, tmpfile, options.mode],
            [fs, fs.rename, tmpfile, filename]
          ],
          err => {
            err
              ? fs.unlink(tmpfile, () => {
                  callback(err);
                })
              : callback();
          }
        );
      }

      // doing this instead of `fs.writeFile` in order to get the ability to
      // call `fsync`.
      function writeFileAsync(file, data, mode, encoding, cb) {
        fs.open(file, 'w', options.mode, (err, fd) => {
          if (err) return cb(err);
          if (Buffer.isBuffer(data)) {
            return fs.write(fd, data, 0, data.length, 0, syncAndClose);
          } else if (data != null) {
            return fs.write(
              fd,
              String(data),
              0,
              String(encoding),
              syncAndClose
            );
          } else {
            return syncAndClose();
          }
          function syncAndClose(err) {
            if (err) return cb(err);
            fs.fsync(fd, err => {
              if (err) return cb(err);
              fs.close(fd, cb);
            });
          }
        });
      }
    }

    function writeFileSync(filename, data, options) {
      if (!options) options = {};
      try {
        filename = fs.realpathSync(filename);
      } catch (ex) {
        // it's ok, it'll happen on a not yet existing file
      }
      var tmpfile = getTmpname(filename);

      try {
        if (!options.mode || !options.chown) {
          // Either mode or chown is not explicitly set
          // Default behavior is to copy it from original file
          try {
            var stats = fs.statSync(filename);
            options = extend({}, options);
            if (!options.mode) {
              options.mode = stats.mode;
            }
            if (!options.chown && process.getuid) {
              options.chown = { uid: stats.uid, gid: stats.gid };
            }
          } catch (ex) {
            // ignore stat errors
          }
        }

        var fd = fs.openSync(tmpfile, 'w', options.mode);
        if (Buffer.isBuffer(data)) {
          fs.writeSync(fd, data, 0, data.length, 0);
        } else if (data != null) {
          fs.writeSync(fd, String(data), 0, String(options.encoding || 'utf8'));
        }
        fs.fsyncSync(fd);
        fs.closeSync(fd);
        if (options.chown)
          fs.chownSync(tmpfile, options.chown.uid, options.chown.gid);
        if (options.mode) fs.chmodSync(tmpfile, options.mode);
        fs.renameSync(tmpfile, filename);
      } catch (err) {
        try {
          fs.unlinkSync(tmpfile);
        } catch (e) {}
        throw err;
      }
    }

    /***/
  },

  /***/ 4976: /***/ module => {
    /*
usage:

// do something to a list of things
asyncMap(myListOfStuff, function (thing, cb) { doSomething(thing.foo, cb) }, cb)
// do more than one thing to each item
asyncMap(list, fooFn, barFn, cb)

*/

    module.exports = asyncMap;

    function asyncMap() {
      var steps = Array.prototype.slice.call(arguments),
        list = steps.shift() || [],
        cb_ = steps.pop();
      if (typeof cb_ !== 'function')
        throw new Error('No callback provided to asyncMap');
      if (!list) return cb_(null, []);
      if (!Array.isArray(list)) list = [list];
      var n = steps.length,
        data = [], // 2d array
        errState = null,
        l = list.length,
        a = l * n;
      if (!a) return cb_(null, []);
      function cb(er) {
        if (er && !errState) errState = er;

        var argLen = arguments.length;
        for (var i = 1; i < argLen; i++)
          if (arguments[i] !== undefined) {
            data[i - 1] = (data[i - 1] || []).concat(arguments[i]);
          }
        // see if any new things have been added.
        if (list.length > l) {
          var newList = list.slice(l);
          a += (list.length - l) * n;
          l = list.length;
          process.nextTick(() => {
            newList.forEach(ar => {
              steps.forEach(fn => {
                fn(ar, cb);
              });
            });
          });
        }

        if (--a === 0) cb_.apply(null, [errState].concat(data));
      }
      // expect the supplied cb function to be called
      // "n" times for each thing in the array.
      list.forEach(ar => {
        steps.forEach(fn => {
          fn(ar, cb);
        });
      });
    }

    /***/
  },

  /***/ 1412: /***/ module => {
    module.exports = bindActor;
    function bindActor() {
      var args = Array.prototype.slice.call(arguments), // jswtf.
        obj = null,
        fn;
      if (typeof args[0] === 'object') {
        obj = args.shift();
        fn = args.shift();
        if (typeof fn === 'string') fn = obj[fn];
      } else fn = args.shift();
      return cb => {
        fn.apply(obj, args.concat(cb));
      };
    }

    /***/
  },

  /***/ 3660: /***/ (module, __unused_webpack_exports, __webpack_require__) => {
    module.exports = chain;
    var bindActor = __webpack_require__(1412);
    chain.first = {};
    chain.last = {};
    function chain(things, cb) {
      var res = [];
      (function LOOP(i, len) {
        if (i >= len) return cb(null, res);
        if (Array.isArray(things[i]))
          things[i] = bindActor.apply(
            null,
            things[i].map(i =>
              i === chain.first
                ? res[0]
                : i === chain.last
                  ? res[res.length - 1]
                  : i
            )
          );
        if (!things[i]) return LOOP(i + 1, len);
        things[i]((er, data) => {
          if (er) return cb(er, res);
          if (data !== undefined) res = res.concat(data);
          LOOP(i + 1, len);
        });
      })(0, things.length);
    }

    /***/
  },

  /***/ 6029: /***/ (__unused_webpack_module, exports, __webpack_require__) => {
    /* unused reexport */ __webpack_require__(4976);
    /* unused reexport */ __webpack_require__(1412);
    exports.chain = __webpack_require__(3660);

    /***/
  },

  /***/ 7527: /***/ (module, exports, __webpack_require__) => {
    function _typeof(o) {
      '@babel/helpers - typeof';
      return (
        (_typeof =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? o => typeof o
            : o =>
                o &&
                'function' == typeof Symbol &&
                o.constructor === Symbol &&
                o !== Symbol.prototype
                  ? 'symbol'
                  : typeof o),
        _typeof(o)
      );
    }
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = void 0;
    var _toDate = _interopRequireDefault(__webpack_require__(3834));
    var _toFloat = _interopRequireDefault(__webpack_require__(2429));
    var _toInt = _interopRequireDefault(__webpack_require__(5237));
    var _toBoolean = _interopRequireDefault(__webpack_require__(1960));
    var _equals = _interopRequireDefault(__webpack_require__(6356));
    var _contains = _interopRequireDefault(__webpack_require__(6025));
    var _matches = _interopRequireDefault(__webpack_require__(9189));
    var _isEmail = _interopRequireDefault(__webpack_require__(1324));
    var _isURL = _interopRequireDefault(__webpack_require__(1793));
    var _isMACAddress = _interopRequireDefault(__webpack_require__(7912));
    var _isIP = _interopRequireDefault(__webpack_require__(8253));
    var _isIPRange = _interopRequireDefault(__webpack_require__(6896));
    var _isFQDN = _interopRequireDefault(__webpack_require__(4972));
    var _isDate = _interopRequireDefault(__webpack_require__(4845));
    var _isTime = _interopRequireDefault(__webpack_require__(9527));
    var _isBoolean = _interopRequireDefault(__webpack_require__(2276));
    var _isLocale = _interopRequireDefault(__webpack_require__(4513));
    var _isAbaRouting = _interopRequireDefault(__webpack_require__(9639));
    var _isAlpha = _interopRequireWildcard(__webpack_require__(899));
    var _isAlphanumeric = _interopRequireWildcard(__webpack_require__(8317));
    var _isNumeric = _interopRequireDefault(__webpack_require__(3769));
    var _isPassportNumber = _interopRequireDefault(__webpack_require__(33));
    var _isPort = _interopRequireDefault(__webpack_require__(5985));
    var _isLowercase = _interopRequireDefault(__webpack_require__(6509));
    var _isUppercase = _interopRequireDefault(__webpack_require__(6413));
    var _isIMEI = _interopRequireDefault(__webpack_require__(9927));
    var _isAscii = _interopRequireDefault(__webpack_require__(4433));
    var _isFullWidth = _interopRequireDefault(__webpack_require__(2619));
    var _isHalfWidth = _interopRequireDefault(__webpack_require__(2176));
    var _isVariableWidth = _interopRequireDefault(__webpack_require__(8678));
    var _isMultibyte = _interopRequireDefault(__webpack_require__(2672));
    var _isSemVer = _interopRequireDefault(__webpack_require__(2493));
    var _isSurrogatePair = _interopRequireDefault(__webpack_require__(4901));
    var _isInt = _interopRequireDefault(__webpack_require__(7205));
    var _isFloat = _interopRequireWildcard(__webpack_require__(3158));
    var _isDecimal = _interopRequireDefault(__webpack_require__(597));
    var _isHexadecimal = _interopRequireDefault(__webpack_require__(6262));
    var _isOctal = _interopRequireDefault(__webpack_require__(9193));
    var _isDivisibleBy = _interopRequireDefault(__webpack_require__(4098));
    var _isHexColor = _interopRequireDefault(__webpack_require__(1992));
    var _isRgbColor = _interopRequireDefault(__webpack_require__(8329));
    var _isHSL = _interopRequireDefault(__webpack_require__(429));
    var _isISRC = _interopRequireDefault(__webpack_require__(9032));
    var _isIBAN = _interopRequireWildcard(__webpack_require__(8111));
    var _isBIC = _interopRequireDefault(__webpack_require__(5776));
    var _isMD = _interopRequireDefault(__webpack_require__(3084));
    var _isHash = _interopRequireDefault(__webpack_require__(9841));
    var _isJWT = _interopRequireDefault(__webpack_require__(8300));
    var _isJSON = _interopRequireDefault(__webpack_require__(9812));
    var _isEmpty = _interopRequireDefault(__webpack_require__(2585));
    var _isLength = _interopRequireDefault(__webpack_require__(2041));
    var _isByteLength = _interopRequireDefault(__webpack_require__(3189));
    var _isUUID = _interopRequireDefault(__webpack_require__(6455));
    var _isMongoId = _interopRequireDefault(__webpack_require__(1296));
    var _isAfter = _interopRequireDefault(__webpack_require__(471));
    var _isBefore = _interopRequireDefault(__webpack_require__(9367));
    var _isIn = _interopRequireDefault(__webpack_require__(2353));
    var _isLuhnNumber = _interopRequireDefault(__webpack_require__(5912));
    var _isCreditCard = _interopRequireDefault(__webpack_require__(1419));
    var _isIdentityCard = _interopRequireDefault(__webpack_require__(9778));
    var _isEAN = _interopRequireDefault(__webpack_require__(7597));
    var _isISIN = _interopRequireDefault(__webpack_require__(9187));
    var _isISBN = _interopRequireDefault(__webpack_require__(8254));
    var _isISSN = _interopRequireDefault(__webpack_require__(7609));
    var _isTaxID = _interopRequireDefault(__webpack_require__(578));
    var _isMobilePhone = _interopRequireWildcard(__webpack_require__(8648));
    var _isEthereumAddress = _interopRequireDefault(__webpack_require__(7938));
    var _isCurrency = _interopRequireDefault(__webpack_require__(5429));
    var _isBtcAddress = _interopRequireDefault(__webpack_require__(6185));
    var _isISO = __webpack_require__(7446);
    var _isISO2 = _interopRequireDefault(__webpack_require__(7242));
    var _isISO3 = _interopRequireDefault(__webpack_require__(3790));
    var _isRFC = _interopRequireDefault(__webpack_require__(7397));
    var _isISO31661Alpha = _interopRequireDefault(__webpack_require__(3442));
    var _isISO31661Alpha2 = _interopRequireDefault(__webpack_require__(5923));
    var _isISO4 = _interopRequireDefault(__webpack_require__(909));
    var _isBase = _interopRequireDefault(__webpack_require__(6135));
    var _isBase2 = _interopRequireDefault(__webpack_require__(2207));
    var _isBase3 = _interopRequireDefault(__webpack_require__(7003));
    var _isDataURI = _interopRequireDefault(__webpack_require__(2977));
    var _isMagnetURI = _interopRequireDefault(__webpack_require__(8693));
    var _isMailtoURI = _interopRequireDefault(__webpack_require__(4149));
    var _isMimeType = _interopRequireDefault(__webpack_require__(6914));
    var _isLatLong = _interopRequireDefault(__webpack_require__(1607));
    var _isPostalCode = _interopRequireWildcard(__webpack_require__(5517));
    var _ltrim = _interopRequireDefault(__webpack_require__(7622));
    var _rtrim = _interopRequireDefault(__webpack_require__(8213));
    var _trim = _interopRequireDefault(__webpack_require__(3495));
    var _escape = _interopRequireDefault(__webpack_require__(9722));
    var _unescape = _interopRequireDefault(__webpack_require__(2224));
    var _stripLow = _interopRequireDefault(__webpack_require__(1117));
    var _whitelist = _interopRequireDefault(__webpack_require__(6235));
    var _blacklist = _interopRequireDefault(__webpack_require__(2316));
    var _isWhitelisted = _interopRequireDefault(__webpack_require__(2124));
    var _normalizeEmail = _interopRequireDefault(__webpack_require__(1733));
    var _isSlug = _interopRequireDefault(__webpack_require__(2140));
    var _isLicensePlate = _interopRequireDefault(__webpack_require__(3109));
    var _isStrongPassword = _interopRequireDefault(__webpack_require__(1792));
    var _isVAT = _interopRequireDefault(__webpack_require__(4551));
    function _getRequireWildcardCache(e) {
      if ('function' != typeof WeakMap) return null;
      var r = new WeakMap(),
        t = new WeakMap();
      return (_getRequireWildcardCache = function _getRequireWildcardCache(e) {
        return e ? t : r;
      })(e);
    }
    function _interopRequireWildcard(e, r) {
      if (!r && e && e.__esModule) return e;
      if (null === e || ('object' != _typeof(e) && 'function' != typeof e))
        return { default: e };
      var t = _getRequireWildcardCache(r);
      if (t && t.has(e)) return t.get(e);
      var n = { __proto__: null },
        a = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var u in e)
        if ('default' !== u && Object.hasOwn(e, u)) {
          var i = a ? Object.getOwnPropertyDescriptor(e, u) : null;
          i && (i.get || i.set)
            ? Object.defineProperty(n, u, i)
            : (n[u] = e[u]);
        }
      return (n.default = e), t && t.set(e, n), n;
    }
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var version = '13.12.0';
    var validator = {
      version: version,
      toDate: _toDate.default,
      toFloat: _toFloat.default,
      toInt: _toInt.default,
      toBoolean: _toBoolean.default,
      equals: _equals.default,
      contains: _contains.default,
      matches: _matches.default,
      isEmail: _isEmail.default,
      isURL: _isURL.default,
      isMACAddress: _isMACAddress.default,
      isIP: _isIP.default,
      isIPRange: _isIPRange.default,
      isFQDN: _isFQDN.default,
      isBoolean: _isBoolean.default,
      isIBAN: _isIBAN.default,
      isBIC: _isBIC.default,
      isAbaRouting: _isAbaRouting.default,
      isAlpha: _isAlpha.default,
      isAlphaLocales: _isAlpha.locales,
      isAlphanumeric: _isAlphanumeric.default,
      isAlphanumericLocales: _isAlphanumeric.locales,
      isNumeric: _isNumeric.default,
      isPassportNumber: _isPassportNumber.default,
      isPort: _isPort.default,
      isLowercase: _isLowercase.default,
      isUppercase: _isUppercase.default,
      isAscii: _isAscii.default,
      isFullWidth: _isFullWidth.default,
      isHalfWidth: _isHalfWidth.default,
      isVariableWidth: _isVariableWidth.default,
      isMultibyte: _isMultibyte.default,
      isSemVer: _isSemVer.default,
      isSurrogatePair: _isSurrogatePair.default,
      isInt: _isInt.default,
      isIMEI: _isIMEI.default,
      isFloat: _isFloat.default,
      isFloatLocales: _isFloat.locales,
      isDecimal: _isDecimal.default,
      isHexadecimal: _isHexadecimal.default,
      isOctal: _isOctal.default,
      isDivisibleBy: _isDivisibleBy.default,
      isHexColor: _isHexColor.default,
      isRgbColor: _isRgbColor.default,
      isHSL: _isHSL.default,
      isISRC: _isISRC.default,
      isMD5: _isMD.default,
      isHash: _isHash.default,
      isJWT: _isJWT.default,
      isJSON: _isJSON.default,
      isEmpty: _isEmpty.default,
      isLength: _isLength.default,
      isLocale: _isLocale.default,
      isByteLength: _isByteLength.default,
      isUUID: _isUUID.default,
      isMongoId: _isMongoId.default,
      isAfter: _isAfter.default,
      isBefore: _isBefore.default,
      isIn: _isIn.default,
      isLuhnNumber: _isLuhnNumber.default,
      isCreditCard: _isCreditCard.default,
      isIdentityCard: _isIdentityCard.default,
      isEAN: _isEAN.default,
      isISIN: _isISIN.default,
      isISBN: _isISBN.default,
      isISSN: _isISSN.default,
      isMobilePhone: _isMobilePhone.default,
      isMobilePhoneLocales: _isMobilePhone.locales,
      isPostalCode: _isPostalCode.default,
      isPostalCodeLocales: _isPostalCode.locales,
      isEthereumAddress: _isEthereumAddress.default,
      isCurrency: _isCurrency.default,
      isBtcAddress: _isBtcAddress.default,
      isISO6346: _isISO.isISO6346,
      isFreightContainerID: _isISO.isFreightContainerID,
      isISO6391: _isISO2.default,
      isISO8601: _isISO3.default,
      isRFC3339: _isRFC.default,
      isISO31661Alpha2: _isISO31661Alpha.default,
      isISO31661Alpha3: _isISO31661Alpha2.default,
      isISO4217: _isISO4.default,
      isBase32: _isBase.default,
      isBase58: _isBase2.default,
      isBase64: _isBase3.default,
      isDataURI: _isDataURI.default,
      isMagnetURI: _isMagnetURI.default,
      isMailtoURI: _isMailtoURI.default,
      isMimeType: _isMimeType.default,
      isLatLong: _isLatLong.default,
      ltrim: _ltrim.default,
      rtrim: _rtrim.default,
      trim: _trim.default,
      escape: _escape.default,
      unescape: _unescape.default,
      stripLow: _stripLow.default,
      whitelist: _whitelist.default,
      blacklist: _blacklist.default,
      isWhitelisted: _isWhitelisted.default,
      normalizeEmail: _normalizeEmail.default,
      toString: toString,
      isSlug: _isSlug.default,
      isStrongPassword: _isStrongPassword.default,
      isTaxID: _isTaxID.default,
      isDate: _isDate.default,
      isTime: _isTime.default,
      isLicensePlate: _isLicensePlate.default,
      isVAT: _isVAT.default,
      ibanLocales: _isIBAN.locales
    };
    var _default = (exports['default'] = validator);
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 2644: /***/ (__unused_webpack_module, exports) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports.farsiLocales =
      exports.englishLocales =
      exports.dotDecimal =
      exports.decimal =
      exports.commaDecimal =
      exports.bengaliLocales =
      exports.arabicLocales =
      exports.alphanumeric =
      exports.alpha =
        void 0;
    var alpha = (exports.alpha = {
      'en-US': /^[A-Z]+$/i,
      'az-AZ': /^[A-VXYZÇƏĞİıÖŞÜ]+$/i,
      'bg-BG': /^[А-Я]+$/i,
      'cs-CZ': /^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+$/i,
      'da-DK': /^[A-ZÆØÅ]+$/i,
      'de-DE': /^[A-ZÄÖÜß]+$/i,
      'el-GR': /^[Α-ώ]+$/i,
      'es-ES': /^[A-ZÁÉÍÑÓÚÜ]+$/i,
      'fa-IR': /^[ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]+$/i,
      'fi-FI': /^[A-ZÅÄÖ]+$/i,
      'fr-FR': /^[A-ZÀÂÆÇÉÈÊËÏÎÔŒÙÛÜŸ]+$/i,
      'it-IT': /^[A-ZÀÉÈÌÎÓÒÙ]+$/i,
      'ja-JP': /^[ぁ-んァ-ヶｦ-ﾟ一-龠ー・。、]+$/i,
      'nb-NO': /^[A-ZÆØÅ]+$/i,
      'nl-NL': /^[A-ZÁÉËÏÓÖÜÚ]+$/i,
      'nn-NO': /^[A-ZÆØÅ]+$/i,
      'hu-HU': /^[A-ZÁÉÍÓÖŐÚÜŰ]+$/i,
      'pl-PL': /^[A-ZĄĆĘŚŁŃÓŻŹ]+$/i,
      'pt-PT': /^[A-ZÃÁÀÂÄÇÉÊËÍÏÕÓÔÖÚÜ]+$/i,
      'ru-RU': /^[А-ЯЁ]+$/i,
      'kk-KZ':
        /^[А-ЯЁ\u04D8\u04B0\u0406\u04A2\u0492\u04AE\u049A\u04E8\u04BA]+$/i,
      'sl-SI': /^[A-ZČĆĐŠŽ]+$/i,
      'sk-SK': /^[A-ZÁČĎÉÍŇÓŠŤÚÝŽĹŔĽÄÔ]+$/i,
      'sr-RS@latin': /^[A-ZČĆŽŠĐ]+$/i,
      'sr-RS': /^[А-ЯЂЈЉЊЋЏ]+$/i,
      'sv-SE': /^[A-ZÅÄÖ]+$/i,
      'th-TH': /^[ก-๐\s]+$/i,
      'tr-TR': /^[A-ZÇĞİıÖŞÜ]+$/i,
      'uk-UA': /^[А-ЩЬЮЯЄIЇҐі]+$/i,
      'vi-VN':
        /^[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴĐÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸ]+$/i,
      'ko-KR': /^[ㄱ-ㅎㅏ-ㅣ가-힣]*$/,
      'ku-IQ': /^[ئابپتجچحخدرڕزژسشعغفڤقکگلڵمنوۆھەیێيطؤثآإأكضصةظذ]+$/i,
      ar: /^[ءآأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهوىيًٌٍَُِّْٰ]+$/,
      he: /^[א-ת]+$/,
      fa: /^['آاءأؤئبپتثجچحخدذرزژسشصضطظعغفقکگلمنوهةی']+$/i,
      bn: /^['ঀঁংঃঅআইঈউঊঋঌএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ়ঽািীুূৃৄেৈোৌ্ৎৗড়ঢ়য়ৠৡৢৣৰৱ৲৳৴৵৶৷৸৹৺৻']+$/,
      eo: /^[ABCĈD-GĜHĤIJĴK-PRSŜTUŬVZ]+$/i,
      'hi-IN': /^[\u0900-\u0961]+[\u0972-\u097F]*$/i,
      'si-LK': /^[\u0D80-\u0DFF]+$/
    });
    var alphanumeric = (exports.alphanumeric = {
      'en-US': /^[0-9A-Z]+$/i,
      'az-AZ': /^[0-9A-VXYZÇƏĞİıÖŞÜ]+$/i,
      'bg-BG': /^[0-9А-Я]+$/i,
      'cs-CZ': /^[0-9A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+$/i,
      'da-DK': /^[0-9A-ZÆØÅ]+$/i,
      'de-DE': /^[0-9A-ZÄÖÜß]+$/i,
      'el-GR': /^[0-9Α-ω]+$/i,
      'es-ES': /^[0-9A-ZÁÉÍÑÓÚÜ]+$/i,
      'fi-FI': /^[0-9A-ZÅÄÖ]+$/i,
      'fr-FR': /^[0-9A-ZÀÂÆÇÉÈÊËÏÎÔŒÙÛÜŸ]+$/i,
      'it-IT': /^[0-9A-ZÀÉÈÌÎÓÒÙ]+$/i,
      'ja-JP': /^[0-9０-９ぁ-んァ-ヶｦ-ﾟ一-龠ー・。、]+$/i,
      'hu-HU': /^[0-9A-ZÁÉÍÓÖŐÚÜŰ]+$/i,
      'nb-NO': /^[0-9A-ZÆØÅ]+$/i,
      'nl-NL': /^[0-9A-ZÁÉËÏÓÖÜÚ]+$/i,
      'nn-NO': /^[0-9A-ZÆØÅ]+$/i,
      'pl-PL': /^[0-9A-ZĄĆĘŚŁŃÓŻŹ]+$/i,
      'pt-PT': /^[0-9A-ZÃÁÀÂÄÇÉÊËÍÏÕÓÔÖÚÜ]+$/i,
      'ru-RU': /^[0-9А-ЯЁ]+$/i,
      'kk-KZ':
        /^[0-9А-ЯЁ\u04D8\u04B0\u0406\u04A2\u0492\u04AE\u049A\u04E8\u04BA]+$/i,
      'sl-SI': /^[0-9A-ZČĆĐŠŽ]+$/i,
      'sk-SK': /^[0-9A-ZÁČĎÉÍŇÓŠŤÚÝŽĹŔĽÄÔ]+$/i,
      'sr-RS@latin': /^[0-9A-ZČĆŽŠĐ]+$/i,
      'sr-RS': /^[0-9А-ЯЂЈЉЊЋЏ]+$/i,
      'sv-SE': /^[0-9A-ZÅÄÖ]+$/i,
      'th-TH': /^[ก-๙\s]+$/i,
      'tr-TR': /^[0-9A-ZÇĞİıÖŞÜ]+$/i,
      'uk-UA': /^[0-9А-ЩЬЮЯЄIЇҐі]+$/i,
      'ko-KR': /^[0-9ㄱ-ㅎㅏ-ㅣ가-힣]*$/,
      'ku-IQ':
        /^[٠١٢٣٤٥٦٧٨٩0-9ئابپتجچحخدرڕزژسشعغفڤقکگلڵمنوۆھەیێيطؤثآإأكضصةظذ]+$/i,
      'vi-VN':
        /^[0-9A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴĐÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸ]+$/i,
      ar: /^[٠١٢٣٤٥٦٧٨٩0-9ءآأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهوىيًٌٍَُِّْٰ]+$/,
      he: /^[0-9א-ת]+$/,
      fa: /^['0-9آاءأؤئبپتثجچحخدذرزژسشصضطظعغفقکگلمنوهةی۱۲۳۴۵۶۷۸۹۰']+$/i,
      bn: /^['ঀঁংঃঅআইঈউঊঋঌএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ়ঽািীুূৃৄেৈোৌ্ৎৗড়ঢ়য়ৠৡৢৣ০১২৩৪৫৬৭৮৯ৰৱ৲৳৴৵৶৷৸৹৺৻']+$/,
      eo: /^[0-9ABCĈD-GĜHĤIJĴK-PRSŜTUŬVZ]+$/i,
      'hi-IN': /^[\u0900-\u0963]+[\u0966-\u097F]*$/i,
      'si-LK': /^[0-9\u0D80-\u0DFF]+$/
    });
    var decimal = (exports.decimal = {
      'en-US': '.',
      ar: '٫'
    });
    var englishLocales = (exports.englishLocales = [
      'AU',
      'GB',
      'HK',
      'IN',
      'NZ',
      'ZA',
      'ZM'
    ]);
    for (var locale, i = 0; i < englishLocales.length; i++) {
      locale = 'en-'.concat(englishLocales[i]);
      alpha[locale] = alpha['en-US'];
      alphanumeric[locale] = alphanumeric['en-US'];
      decimal[locale] = decimal['en-US'];
    }

    // Source: http://www.localeplanet.com/java/
    var arabicLocales = (exports.arabicLocales = [
      'AE',
      'BH',
      'DZ',
      'EG',
      'IQ',
      'JO',
      'KW',
      'LB',
      'LY',
      'MA',
      'QM',
      'QA',
      'SA',
      'SD',
      'SY',
      'TN',
      'YE'
    ]);
    for (var _locale, _i = 0; _i < arabicLocales.length; _i++) {
      _locale = 'ar-'.concat(arabicLocales[_i]);
      alpha[_locale] = alpha.ar;
      alphanumeric[_locale] = alphanumeric.ar;
      decimal[_locale] = decimal.ar;
    }
    var farsiLocales = (exports.farsiLocales = ['IR', 'AF']);
    for (var _locale2, _i2 = 0; _i2 < farsiLocales.length; _i2++) {
      _locale2 = 'fa-'.concat(farsiLocales[_i2]);
      alphanumeric[_locale2] = alphanumeric.fa;
      decimal[_locale2] = decimal.ar;
    }
    var bengaliLocales = (exports.bengaliLocales = ['BD', 'IN']);
    for (var _locale3, _i3 = 0; _i3 < bengaliLocales.length; _i3++) {
      _locale3 = 'bn-'.concat(bengaliLocales[_i3]);
      alpha[_locale3] = alpha.bn;
      alphanumeric[_locale3] = alphanumeric.bn;
      decimal[_locale3] = decimal['en-US'];
    }

    // Source: https://en.wikipedia.org/wiki/Decimal_mark
    var dotDecimal = (exports.dotDecimal = ['ar-EG', 'ar-LB', 'ar-LY']);
    var commaDecimal = (exports.commaDecimal = [
      'bg-BG',
      'cs-CZ',
      'da-DK',
      'de-DE',
      'el-GR',
      'en-ZM',
      'eo',
      'es-ES',
      'fr-CA',
      'fr-FR',
      'id-ID',
      'it-IT',
      'ku-IQ',
      'hi-IN',
      'hu-HU',
      'nb-NO',
      'nn-NO',
      'nl-NL',
      'pl-PL',
      'pt-PT',
      'ru-RU',
      'kk-KZ',
      'si-LK',
      'sl-SI',
      'sr-RS@latin',
      'sr-RS',
      'sv-SE',
      'tr-TR',
      'uk-UA',
      'vi-VN'
    ]);
    for (var _i4 = 0; _i4 < dotDecimal.length; _i4++) {
      decimal[dotDecimal[_i4]] = decimal['en-US'];
    }
    for (var _i5 = 0; _i5 < commaDecimal.length; _i5++) {
      decimal[commaDecimal[_i5]] = ',';
    }
    alpha['fr-CA'] = alpha['fr-FR'];
    alphanumeric['fr-CA'] = alphanumeric['fr-FR'];
    alpha['pt-BR'] = alpha['pt-PT'];
    alphanumeric['pt-BR'] = alphanumeric['pt-PT'];
    decimal['pt-BR'] = decimal['pt-PT'];

    // see #862
    alpha['pl-Pl'] = alpha['pl-PL'];
    alphanumeric['pl-Pl'] = alphanumeric['pl-PL'];
    decimal['pl-Pl'] = decimal['pl-PL'];

    // see #1455
    alpha['fa-AF'] = alpha.fa;

    /***/
  },

  /***/ 2316: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = blacklist;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function blacklist(str, chars) {
      (0, _assertString.default)(str);
      return str.replace(new RegExp('['.concat(chars, ']+'), 'g'), '');
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 6025: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = contains;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _toString = _interopRequireDefault(__webpack_require__(6451));
    var _merge = _interopRequireDefault(__webpack_require__(9956));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var defaulContainsOptions = {
      ignoreCase: false,
      minOccurrences: 1
    };
    function contains(str, elem, options) {
      (0, _assertString.default)(str);
      options = (0, _merge.default)(options, defaulContainsOptions);
      if (options.ignoreCase) {
        return (
          str.toLowerCase().split((0, _toString.default)(elem).toLowerCase())
            .length > options.minOccurrences
        );
      }
      return (
        str.split((0, _toString.default)(elem)).length > options.minOccurrences
      );
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 6356: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = equals;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function equals(str, comparison) {
      (0, _assertString.default)(str);
      return str === comparison;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 9722: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = escape;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function escape(str) {
      (0, _assertString.default)(str);
      return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\//g, '&#x2F;')
        .replace(/\\/g, '&#x5C;')
        .replace(/`/g, '&#96;');
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 9639: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isAbaRouting;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    // http://www.brainjar.com/js/validation/
    // https://www.aba.com/news-research/research-analysis/routing-number-policy-procedures
    // series reserved for future use are excluded
    var isRoutingReg =
      /^(?!(1[3-9])|(20)|(3[3-9])|(4[0-9])|(5[0-9])|(60)|(7[3-9])|(8[1-9])|(9[0-2])|(9[3-9]))[0-9]{9}$/;
    function isAbaRouting(str) {
      (0, _assertString.default)(str);
      if (!isRoutingReg.test(str)) return false;
      var checkSumVal = 0;
      for (var i = 0; i < str.length; i++) {
        if (i % 3 === 0) checkSumVal += str[i] * 3;
        else if (i % 3 === 1) checkSumVal += str[i] * 7;
        else checkSumVal += str[i] * 1;
      }
      return checkSumVal % 10 === 0;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 471: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isAfter;
    var _toDate = _interopRequireDefault(__webpack_require__(3834));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function isAfter(date, options) {
      // For backwards compatibility:
      // isAfter(str [, date]), i.e. `options` could be used as argument for the legacy `date`
      var comparisonDate =
        (options === null || options === void 0
          ? void 0
          : options.comparisonDate) ||
        options ||
        Date().toString();
      var comparison = (0, _toDate.default)(comparisonDate);
      var original = (0, _toDate.default)(date);
      return !!(original && comparison && original > comparison);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 899: /***/ (__unused_webpack_module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isAlpha;
    exports.locales = void 0;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _alpha = __webpack_require__(2644);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function isAlpha(_str) {
      var locale =
        arguments.length > 1 && arguments[1] !== undefined
          ? arguments[1]
          : 'en-US';
      var options =
        arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      (0, _assertString.default)(_str);
      var str = _str;
      var ignore = options.ignore;
      if (ignore) {
        if (ignore instanceof RegExp) {
          str = str.replace(ignore, '');
        } else if (typeof ignore === 'string') {
          str = str.replace(
            new RegExp(
              '['.concat(
                ignore.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, '\\$&'),
                ']'
              ),
              'g'
            ),
            ''
          ); // escape regex for ignore
        } else {
          throw new Error('ignore should be instance of a String or RegExp');
        }
      }
      if (locale in _alpha.alpha) {
        return _alpha.alpha[locale].test(str);
      }
      throw new Error("Invalid locale '".concat(locale, "'"));
    }
    var locales = (exports.locales = Object.keys(_alpha.alpha));

    /***/
  },

  /***/ 8317: /***/ (__unused_webpack_module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isAlphanumeric;
    exports.locales = void 0;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _alpha = __webpack_require__(2644);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function isAlphanumeric(_str) {
      var locale =
        arguments.length > 1 && arguments[1] !== undefined
          ? arguments[1]
          : 'en-US';
      var options =
        arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      (0, _assertString.default)(_str);
      var str = _str;
      var ignore = options.ignore;
      if (ignore) {
        if (ignore instanceof RegExp) {
          str = str.replace(ignore, '');
        } else if (typeof ignore === 'string') {
          str = str.replace(
            new RegExp(
              '['.concat(
                ignore.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, '\\$&'),
                ']'
              ),
              'g'
            ),
            ''
          ); // escape regex for ignore
        } else {
          throw new Error('ignore should be instance of a String or RegExp');
        }
      }
      if (locale in _alpha.alphanumeric) {
        return _alpha.alphanumeric[locale].test(str);
      }
      throw new Error("Invalid locale '".concat(locale, "'"));
    }
    var locales = (exports.locales = Object.keys(_alpha.alphanumeric));

    /***/
  },

  /***/ 4433: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isAscii;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    /* eslint-disable no-control-regex */
    var ascii = /^[\x00-\x7F]+$/;
    /* eslint-enable no-control-regex */

    function isAscii(str) {
      (0, _assertString.default)(str);
      return ascii.test(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 5776: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isBIC;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _isISO31661Alpha = __webpack_require__(3442);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    // https://en.wikipedia.org/wiki/ISO_9362
    var isBICReg = /^[A-Za-z]{6}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?$/;
    function isBIC(str) {
      (0, _assertString.default)(str);

      // toUpperCase() should be removed when a new major version goes out that changes
      // the regex to [A-Z] (per the spec).
      var countryCode = str.slice(4, 6).toUpperCase();
      if (
        !_isISO31661Alpha.CountryCodes.has(countryCode) &&
        countryCode !== 'XK'
      ) {
        return false;
      }
      return isBICReg.test(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 6135: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isBase32;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _merge = _interopRequireDefault(__webpack_require__(9956));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var base32 = /^[A-Z2-7]+=*$/;
    var crockfordBase32 = /^[A-HJKMNP-TV-Z0-9]+$/;
    var defaultBase32Options = {
      crockford: false
    };
    function isBase32(str, options) {
      (0, _assertString.default)(str);
      options = (0, _merge.default)(options, defaultBase32Options);
      if (options.crockford) {
        return crockfordBase32.test(str);
      }
      var len = str.length;
      if (len % 8 === 0 && base32.test(str)) {
        return true;
      }
      return false;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 2207: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isBase58;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    // Accepted chars - 123456789ABCDEFGH JKLMN PQRSTUVWXYZabcdefghijk mnopqrstuvwxyz
    var base58Reg = /^[A-HJ-NP-Za-km-z1-9]*$/;
    function isBase58(str) {
      (0, _assertString.default)(str);
      if (base58Reg.test(str)) {
        return true;
      }
      return false;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 7003: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isBase64;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _merge = _interopRequireDefault(__webpack_require__(9956));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var notBase64 = /[^A-Z0-9+/=]/i;
    var urlSafeBase64 = /^[A-Z0-9_-]*$/i;
    var defaultBase64Options = {
      urlSafe: false
    };
    function isBase64(str, options) {
      (0, _assertString.default)(str);
      options = (0, _merge.default)(options, defaultBase64Options);
      var len = str.length;
      if (options.urlSafe) {
        return urlSafeBase64.test(str);
      }
      if (len % 4 !== 0 || notBase64.test(str)) {
        return false;
      }
      var firstPaddingChar = str.indexOf('=');
      return (
        firstPaddingChar === -1 ||
        firstPaddingChar === len - 1 ||
        (firstPaddingChar === len - 2 && str[len - 1] === '=')
      );
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 9367: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isBefore;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _toDate = _interopRequireDefault(__webpack_require__(3834));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function isBefore(str) {
      var date =
        arguments.length > 1 && arguments[1] !== undefined
          ? arguments[1]
          : String(new Date());
      (0, _assertString.default)(str);
      var comparison = (0, _toDate.default)(date);
      var original = (0, _toDate.default)(str);
      return !!(original && comparison && original < comparison);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 2276: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isBoolean;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var defaultOptions = {
      loose: false
    };
    var strictBooleans = ['true', 'false', '1', '0'];
    var looseBooleans = [].concat(strictBooleans, ['yes', 'no']);
    function isBoolean(str) {
      var options =
        arguments.length > 1 && arguments[1] !== undefined
          ? arguments[1]
          : defaultOptions;
      (0, _assertString.default)(str);
      if (options.loose) {
        return looseBooleans.includes(str.toLowerCase());
      }
      return strictBooleans.includes(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 6185: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isBtcAddress;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var bech32 = /^(bc1)[a-z0-9]{25,39}$/;
    var base58 = /^(1|3)[A-HJ-NP-Za-km-z1-9]{25,39}$/;
    function isBtcAddress(str) {
      (0, _assertString.default)(str);
      return bech32.test(str) || base58.test(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 3189: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isByteLength;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function _typeof(o) {
      '@babel/helpers - typeof';
      return (
        (_typeof =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? o => typeof o
            : o =>
                o &&
                'function' == typeof Symbol &&
                o.constructor === Symbol &&
                o !== Symbol.prototype
                  ? 'symbol'
                  : typeof o),
        _typeof(o)
      );
    }
    /* eslint-disable prefer-rest-params */
    function isByteLength(str, options) {
      (0, _assertString.default)(str);
      var min;
      var max;
      if (_typeof(options) === 'object') {
        min = options.min || 0;
        max = options.max;
      } else {
        // backwards compatibility: isByteLength(str, min [, max])
        min = arguments[1];
        max = arguments[2];
      }
      var len = encodeURI(str).split(/%..|./).length - 1;
      return len >= min && (typeof max === 'undefined' || len <= max);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 1419: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isCreditCard;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _isLuhnNumber = _interopRequireDefault(__webpack_require__(5912));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var cards = {
      amex: /^3[47][0-9]{13}$/,
      dinersclub: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
      discover: /^6(?:011|5[0-9][0-9])[0-9]{12,15}$/,
      jcb: /^(?:2131|1800|35\d{3})\d{11}$/,
      mastercard:
        /^5[1-5][0-9]{2}|(222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}$/,
      // /^[25][1-7][0-9]{14}$/;
      unionpay: /^(6[27][0-9]{14}|^(81[0-9]{14,17}))$/,
      visa: /^(?:4[0-9]{12})(?:[0-9]{3,6})?$/
    };
    var allCards = (() => {
      var tmpCardsArray = [];
      for (var cardProvider in cards) {
        // istanbul ignore else
        if (Object.hasOwn(cards, cardProvider)) {
          tmpCardsArray.push(cards[cardProvider]);
        }
      }
      return tmpCardsArray;
    })();
    function isCreditCard(card) {
      var options =
        arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      (0, _assertString.default)(card);
      var provider = options.provider;
      var sanitized = card.replace(/[- ]+/g, '');
      if (provider && provider.toLowerCase() in cards) {
        // specific provider in the list
        if (!cards[provider.toLowerCase()].test(sanitized)) {
          return false;
        }
      } else if (provider && !(provider.toLowerCase() in cards)) {
        /* specific provider not in the list */
        throw new Error(
          ''.concat(provider, ' is not a valid credit card provider.')
        );
      } else if (!allCards.some(cardProvider => cardProvider.test(sanitized))) {
        // no specific provider
        return false;
      }
      return (0, _isLuhnNumber.default)(card);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 5429: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isCurrency;
    var _merge = _interopRequireDefault(__webpack_require__(9956));
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function currencyRegex(options) {
      var decimal_digits = '\\d{'.concat(options.digits_after_decimal[0], '}');
      options.digits_after_decimal.forEach((digit, index) => {
        if (index !== 0)
          decimal_digits = ''
            .concat(decimal_digits, '|\\d{')
            .concat(digit, '}');
      });
      var symbol = '('
          .concat(
            options.symbol.replace(/\W/, m => '\\'.concat(m)),
            ')'
          )
          .concat(options.require_symbol ? '' : '?'),
        negative = '-?',
        whole_dollar_amount_without_sep = '[1-9]\\d*',
        whole_dollar_amount_with_sep = '[1-9]\\d{0,2}(\\'.concat(
          options.thousands_separator,
          '\\d{3})*'
        ),
        valid_whole_dollar_amounts = [
          '0',
          whole_dollar_amount_without_sep,
          whole_dollar_amount_with_sep
        ],
        whole_dollar_amount = '('.concat(
          valid_whole_dollar_amounts.join('|'),
          ')?'
        ),
        decimal_amount = '(\\'
          .concat(options.decimal_separator, '(')
          .concat(decimal_digits, '))')
          .concat(options.require_decimal ? '' : '?');
      var pattern =
        whole_dollar_amount +
        (options.allow_decimal || options.require_decimal
          ? decimal_amount
          : '');

      // default is negative sign before symbol, but there are two other options (besides parens)
      if (options.allow_negatives && !options.parens_for_negatives) {
        if (options.negative_sign_after_digits) {
          pattern += negative;
        } else if (options.negative_sign_before_digits) {
          pattern = negative + pattern;
        }
      }

      // South African Rand, for example, uses R 123 (space) and R-123 (no space)
      if (options.allow_negative_sign_placeholder) {
        pattern = '( (?!\\-))?'.concat(pattern);
      } else if (options.allow_space_after_symbol) {
        pattern = ' ?'.concat(pattern);
      } else if (options.allow_space_after_digits) {
        pattern += '( (?!$))?';
      }
      if (options.symbol_after_digits) {
        pattern += symbol;
      } else {
        pattern = symbol + pattern;
      }
      if (options.allow_negatives) {
        if (options.parens_for_negatives) {
          pattern = '(\\('.concat(pattern, '\\)|').concat(pattern, ')');
        } else if (
          !(
            options.negative_sign_before_digits ||
            options.negative_sign_after_digits
          )
        ) {
          pattern = negative + pattern;
        }
      }

      // ensure there's a dollar and/or decimal amount, and that
      // it doesn't start with a space or a negative sign followed by a space
      return new RegExp('^(?!-? )(?=.*\\d)'.concat(pattern, '$'));
    }
    var default_currency_options = {
      symbol: '$',
      require_symbol: false,
      allow_space_after_symbol: false,
      symbol_after_digits: false,
      allow_negatives: true,
      parens_for_negatives: false,
      negative_sign_before_digits: false,
      negative_sign_after_digits: false,
      allow_negative_sign_placeholder: false,
      thousands_separator: ',',
      decimal_separator: '.',
      allow_decimal: true,
      require_decimal: false,
      digits_after_decimal: [2],
      allow_space_after_digits: false
    };
    function isCurrency(str, options) {
      (0, _assertString.default)(str);
      options = (0, _merge.default)(options, default_currency_options);
      return currencyRegex(options).test(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 2977: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isDataURI;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var validMediaType = /^[a-z]+\/[a-z0-9\-+._]+$/i;
    var validAttribute = /^[a-z-]+=[a-z0-9-]+$/i;
    var validData = /^[a-z0-9!$&'()*+,;=\-._~:@/?%\s]*$/i;
    function isDataURI(str) {
      (0, _assertString.default)(str);
      var data = str.split(',');
      if (data.length < 2) {
        return false;
      }
      var attributes = data.shift().trim().split(';');
      var schemeAndMediaType = attributes.shift();
      if (schemeAndMediaType.slice(0, 5) !== 'data:') {
        return false;
      }
      var mediaType = schemeAndMediaType.slice(5);
      if (mediaType !== '' && !validMediaType.test(mediaType)) {
        return false;
      }
      for (var i = 0; i < attributes.length; i++) {
        if (
          !(
            i === attributes.length - 1 &&
            attributes[i].toLowerCase() === 'base64'
          ) &&
          !validAttribute.test(attributes[i])
        ) {
          return false;
        }
      }
      for (var _i = 0; _i < data.length; _i++) {
        if (!validData.test(data[_i])) {
          return false;
        }
      }
      return true;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 4845: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isDate;
    var _merge = _interopRequireDefault(__webpack_require__(9956));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function _slicedToArray(arr, i) {
      return (
        _arrayWithHoles(arr) ||
        _iterableToArrayLimit(arr, i) ||
        _unsupportedIterableToArray(arr, i) ||
        _nonIterableRest()
      );
    }
    function _nonIterableRest() {
      throw new TypeError(
        'Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
      );
    }
    function _iterableToArrayLimit(r, l) {
      var t =
        null == r
          ? null
          : ('undefined' != typeof Symbol && r[Symbol.iterator]) ||
            r['@@iterator'];
      if (null != t) {
        var e,
          n,
          i,
          u,
          a = [],
          f = !0,
          o = !1;
        try {
          if (((i = (t = t.call(r)).next), 0 === l)) {
            if (Object(t) !== t) return;
            f = !1;
          } else
            for (
              ;
              !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l);
              f = !0
            );
        } catch (r) {
          (o = !0), (n = r);
        } finally {
          try {
            if (!f && null != t.return && ((u = t.return()), Object(u) !== u))
              return;
          } finally {
            if (o) throw n;
          }
        }
        return a;
      }
    }
    function _arrayWithHoles(arr) {
      if (Array.isArray(arr)) return arr;
    }
    function _createForOfIteratorHelper(o, allowArrayLike) {
      var it =
        (typeof Symbol !== 'undefined' && o[Symbol.iterator]) ||
        o['@@iterator'];
      if (!it) {
        if (
          Array.isArray(o) ||
          (it = _unsupportedIterableToArray(o)) ||
          (allowArrayLike && o && typeof o.length === 'number')
        ) {
          if (it) o = it;
          var i = 0;
          var F = function F() {};
          return {
            s: F,
            n: function n() {
              if (i >= o.length) return { done: true };
              return { done: false, value: o[i++] };
            },
            e: function e(_e) {
              throw _e;
            },
            f: F
          };
        }
        throw new TypeError(
          'Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
        );
      }
      var normalCompletion = true,
        didErr = false,
        err;
      return {
        s: function s() {
          it = it.call(o);
        },
        n: function n() {
          var step = it.next();
          normalCompletion = step.done;
          return step;
        },
        e: function e(_e2) {
          didErr = true;
          err = _e2;
        },
        f: function f() {
          try {
            if (!normalCompletion && it.return != null) it.return();
          } finally {
            if (didErr) throw err;
          }
        }
      };
    }
    function _unsupportedIterableToArray(o, minLen) {
      if (!o) return;
      if (typeof o === 'string') return _arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === 'Object' && o.constructor) n = o.constructor.name;
      if (n === 'Map' || n === 'Set') return Array.from(o);
      if (
        n === 'Arguments' ||
        /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)
      )
        return _arrayLikeToArray(o, minLen);
    }
    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length) len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
      return arr2;
    }
    var default_date_options = {
      format: 'YYYY/MM/DD',
      delimiters: ['/', '-'],
      strictMode: false
    };
    function isValidFormat(format) {
      return /(^(y{4}|y{2})[./-](m{1,2})[./-](d{1,2})$)|(^(m{1,2})[./-](d{1,2})[./-]((y{4}|y{2})$))|(^(d{1,2})[./-](m{1,2})[./-]((y{4}|y{2})$))/gi.test(
        format
      );
    }
    function zip(date, format) {
      var zippedArr = [],
        len = Math.min(date.length, format.length);
      for (var i = 0; i < len; i++) {
        zippedArr.push([date[i], format[i]]);
      }
      return zippedArr;
    }
    function isDate(input, options) {
      if (typeof options === 'string') {
        // Allow backward compatibility for old format isDate(input [, format])
        options = (0, _merge.default)(
          {
            format: options
          },
          default_date_options
        );
      } else {
        options = (0, _merge.default)(options, default_date_options);
      }
      if (typeof input === 'string' && isValidFormat(options.format)) {
        var formatDelimiter = options.delimiters.find(
          delimiter => options.format.indexOf(delimiter) !== -1
        );
        var dateDelimiter = options.strictMode
          ? formatDelimiter
          : options.delimiters.find(
              delimiter => input.indexOf(delimiter) !== -1
            );
        var dateAndFormat = zip(
          input.split(dateDelimiter),
          options.format.toLowerCase().split(formatDelimiter)
        );
        var dateObj = {};
        var _iterator = _createForOfIteratorHelper(dateAndFormat),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done; ) {
            var _step$value = _slicedToArray(_step.value, 2),
              dateWord = _step$value[0],
              formatWord = _step$value[1];
            if (dateWord.length !== formatWord.length) {
              return false;
            }
            dateObj[formatWord.charAt(0)] = dateWord;
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        var fullYear = dateObj.y;

        // Check if the year starts with a hyphen
        if (fullYear.startsWith('-')) {
          return false; // Hyphen before year is not allowed
        }
        if (dateObj.y.length === 2) {
          var parsedYear = parseInt(dateObj.y, 10);
          if (isNaN(parsedYear)) {
            return false;
          }
          var currentYearLastTwoDigits = new Date().getFullYear() % 100;
          if (parsedYear < currentYearLastTwoDigits) {
            fullYear = '20'.concat(dateObj.y);
          } else {
            fullYear = '19'.concat(dateObj.y);
          }
        }
        var month = dateObj.m;
        if (dateObj.m.length === 1) {
          month = '0'.concat(dateObj.m);
        }
        var day = dateObj.d;
        if (dateObj.d.length === 1) {
          day = '0'.concat(dateObj.d);
        }
        return (
          new Date(
            ''
              .concat(fullYear, '-')
              .concat(month, '-')
              .concat(day, 'T00:00:00.000Z')
          ).getUTCDate() === +dateObj.d
        );
      }
      if (!options.strictMode) {
        return (
          Object.prototype.toString.call(input) === '[object Date]' &&
          isFinite(input)
        );
      }
      return false;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 597: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isDecimal;
    var _merge = _interopRequireDefault(__webpack_require__(9956));
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _includes = _interopRequireDefault(__webpack_require__(5484));
    var _alpha = __webpack_require__(2644);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function decimalRegExp(options) {
      var regExp = new RegExp(
        '^[-+]?([0-9]+)?(\\'
          .concat(_alpha.decimal[options.locale], '[0-9]{')
          .concat(options.decimal_digits, '})')
          .concat(options.force_decimal ? '' : '?', '$')
      );
      return regExp;
    }
    var default_decimal_options = {
      force_decimal: false,
      decimal_digits: '1,',
      locale: 'en-US'
    };
    var blacklist = ['', '-', '+'];
    function isDecimal(str, options) {
      (0, _assertString.default)(str);
      options = (0, _merge.default)(options, default_decimal_options);
      if (options.locale in _alpha.decimal) {
        return (
          !(0, _includes.default)(blacklist, str.replace(/ /g, '')) &&
          decimalRegExp(options).test(str)
        );
      }
      throw new Error("Invalid locale '".concat(options.locale, "'"));
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 4098: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isDivisibleBy;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _toFloat = _interopRequireDefault(__webpack_require__(2429));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function isDivisibleBy(str, num) {
      (0, _assertString.default)(str);
      return (0, _toFloat.default)(str) % parseInt(num, 10) === 0;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 7597: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isEAN;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    /**
     * The most commonly used EAN standard is
     * the thirteen-digit EAN-13, while the
     * less commonly used 8-digit EAN-8 barcode was
     * introduced for use on small packages.
     * Also EAN/UCC-14 is used for Grouping of individual
     * trade items above unit level(Intermediate, Carton or Pallet).
     * For more info about EAN-14 checkout: https://www.gtin.info/itf-14-barcodes/
     * EAN consists of:
     * GS1 prefix, manufacturer code, product code and check digit
     * Reference: https://en.wikipedia.org/wiki/International_Article_Number
     * Reference: https://www.gtin.info/
     */

    /**
     * Define EAN Lenghts; 8 for EAN-8; 13 for EAN-13; 14 for EAN-14
     * and Regular Expression for valid EANs (EAN-8, EAN-13, EAN-14),
     * with exact numberic matching of 8 or 13 or 14 digits [0-9]
     */
    var LENGTH_EAN_8 = 8;
    var LENGTH_EAN_14 = 14;
    var validEanRegex = /^(\d{8}|\d{13}|\d{14})$/;

    /**
     * Get position weight given:
     * EAN length and digit index/position
     *
     * @param {number} length
     * @param {number} index
     * @return {number}
     */
    function getPositionWeightThroughLengthAndIndex(length, index) {
      if (length === LENGTH_EAN_8 || length === LENGTH_EAN_14) {
        return index % 2 === 0 ? 3 : 1;
      }
      return index % 2 === 0 ? 1 : 3;
    }

    /**
     * Calculate EAN Check Digit
     * Reference: https://en.wikipedia.org/wiki/International_Article_Number#Calculation_of_checksum_digit
     *
     * @param {string} ean
     * @return {number}
     */
    function calculateCheckDigit(ean) {
      var checksum = ean
        .slice(0, -1)
        .split('')
        .map(
          (char, index) =>
            Number(char) *
            getPositionWeightThroughLengthAndIndex(ean.length, index)
        )
        .reduce((acc, partialSum) => acc + partialSum, 0);
      var remainder = 10 - (checksum % 10);
      return remainder < 10 ? remainder : 0;
    }

    /**
     * Check if string is valid EAN:
     * Matches EAN-8/EAN-13/EAN-14 regex
     * Has valid check digit.
     *
     * @param {string} str
     * @return {boolean}
     */
    function isEAN(str) {
      (0, _assertString.default)(str);
      var actualCheckDigit = Number(str.slice(-1));
      return (
        validEanRegex.test(str) && actualCheckDigit === calculateCheckDigit(str)
      );
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 1324: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isEmail;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _isByteLength = _interopRequireDefault(__webpack_require__(3189));
    var _isFQDN = _interopRequireDefault(__webpack_require__(4972));
    var _isIP = _interopRequireDefault(__webpack_require__(8253));
    var _merge = _interopRequireDefault(__webpack_require__(9956));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var default_email_options = {
      allow_display_name: false,
      allow_underscores: false,
      require_display_name: false,
      allow_utf8_local_part: true,
      require_tld: true,
      blacklisted_chars: '',
      ignore_max_length: false,
      host_blacklist: [],
      host_whitelist: []
    };

    /* eslint-disable max-len */
    /* eslint-disable no-control-regex */
    var splitNameAddress = /^([^\x00-\x1F\x7F-\x9F\cX]+)</i;
    var emailUserPart = /^[a-z\d!#$%&'*+\-/=?^_`{|}~]+$/i;
    var gmailUserPart = /^[a-z\d]+$/;
    var quotedEmailUser =
      /^([\s\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e]|(\\[\x01-\x09\x0b\x0c\x0d-\x7f]))*$/i;
    var emailUserUtf8Part =
      /^[a-z\d!#$%&'*+\-/=?^_`{|}~\u00A1-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+$/i;
    var quotedEmailUserUtf8 =
      /^([\s\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|(\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*$/i;
    var defaultMaxEmailLength = 254;
    /* eslint-enable max-len */
    /* eslint-enable no-control-regex */

    /**
     * Validate display name according to the RFC2822: https://tools.ietf.org/html/rfc2822#appendix-A.1.2
     * @param {String} display_name
     */
    function validateDisplayName(display_name) {
      var display_name_without_quotes = display_name.replace(/^"(.+)"$/, '$1');
      // display name with only spaces is not valid
      if (!display_name_without_quotes.trim()) {
        return false;
      }

      // check whether display name contains illegal character
      var contains_illegal = /[.";<>]/.test(display_name_without_quotes);
      if (contains_illegal) {
        // if contains illegal characters,
        // must to be enclosed in double-quotes, otherwise it's not a valid display name
        if (display_name_without_quotes === display_name) {
          return false;
        }

        // the quotes in display name must start with character symbol \
        var all_start_with_back_slash =
          display_name_without_quotes.split('"').length ===
          display_name_without_quotes.split('\\"').length;
        if (!all_start_with_back_slash) {
          return false;
        }
      }
      return true;
    }
    function isEmail(str, options) {
      (0, _assertString.default)(str);
      options = (0, _merge.default)(options, default_email_options);
      if (options.require_display_name || options.allow_display_name) {
        var display_email = str.match(splitNameAddress);
        if (display_email) {
          var display_name = display_email[1];

          // Remove display name and angle brackets to get email address
          // Can be done in the regex but will introduce a ReDOS (See  #1597 for more info)
          str = str.replace(display_name, '').replace(/(^<|>$)/g, '');

          // sometimes need to trim the last space to get the display name
          // because there may be a space between display name and email address
          // eg. myname <address@gmail.com>
          // the display name is `myname` instead of `myname `, so need to trim the last space
          if (display_name.endsWith(' ')) {
            display_name = display_name.slice(0, -1);
          }
          if (!validateDisplayName(display_name)) {
            return false;
          }
        } else if (options.require_display_name) {
          return false;
        }
      }
      if (!options.ignore_max_length && str.length > defaultMaxEmailLength) {
        return false;
      }
      var parts = str.split('@');
      var domain = parts.pop();
      var lower_domain = domain.toLowerCase();
      if (options.host_blacklist.includes(lower_domain)) {
        return false;
      }
      if (
        options.host_whitelist.length > 0 &&
        !options.host_whitelist.includes(lower_domain)
      ) {
        return false;
      }
      var user = parts.join('@');
      if (
        options.domain_specific_validation &&
        (lower_domain === 'gmail.com' || lower_domain === 'googlemail.com')
      ) {
        /*
      Previously we removed dots for gmail addresses before validating.
      This was removed because it allows `multiple..dots@gmail.com`
      to be reported as valid, but it is not.
      Gmail only normalizes single dots, removing them from here is pointless,
      should be done in normalizeEmail
    */
        user = user.toLowerCase();

        // Removing sub-address from username before gmail validation
        var username = user.split('+')[0];

        // Dots are not included in gmail length restriction
        if (
          !(0, _isByteLength.default)(username.replace(/\./g, ''), {
            min: 6,
            max: 30
          })
        ) {
          return false;
        }
        var _user_parts = username.split('.');
        for (var i = 0; i < _user_parts.length; i++) {
          if (!gmailUserPart.test(_user_parts[i])) {
            return false;
          }
        }
      }
      if (
        options.ignore_max_length === false &&
        (!(0, _isByteLength.default)(user, {
          max: 64
        }) ||
          !(0, _isByteLength.default)(domain, {
            max: 254
          }))
      ) {
        return false;
      }
      if (
        !(0, _isFQDN.default)(domain, {
          require_tld: options.require_tld,
          ignore_max_length: options.ignore_max_length,
          allow_underscores: options.allow_underscores
        })
      ) {
        if (!options.allow_ip_domain) {
          return false;
        }
        if (!(0, _isIP.default)(domain)) {
          if (!domain.startsWith('[') || !domain.endsWith(']')) {
            return false;
          }
          var noBracketdomain = domain.slice(1, -1);
          if (
            noBracketdomain.length === 0 ||
            !(0, _isIP.default)(noBracketdomain)
          ) {
            return false;
          }
        }
      }
      if (user[0] === '"') {
        user = user.slice(1, user.length - 1);
        return options.allow_utf8_local_part
          ? quotedEmailUserUtf8.test(user)
          : quotedEmailUser.test(user);
      }
      var pattern = options.allow_utf8_local_part
        ? emailUserUtf8Part
        : emailUserPart;
      var user_parts = user.split('.');
      for (var _i = 0; _i < user_parts.length; _i++) {
        if (!pattern.test(user_parts[_i])) {
          return false;
        }
      }
      if (options.blacklisted_chars) {
        if (
          user.search(
            new RegExp('['.concat(options.blacklisted_chars, ']+'), 'g')
          ) !== -1
        )
          return false;
      }
      return true;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 2585: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isEmpty;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _merge = _interopRequireDefault(__webpack_require__(9956));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var default_is_empty_options = {
      ignore_whitespace: false
    };
    function isEmpty(str, options) {
      (0, _assertString.default)(str);
      options = (0, _merge.default)(options, default_is_empty_options);
      return (options.ignore_whitespace ? str.trim().length : str.length) === 0;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 7938: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isEthereumAddress;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var eth = /^(0x)[0-9a-f]{40}$/i;
    function isEthereumAddress(str) {
      (0, _assertString.default)(str);
      return eth.test(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 4972: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isFQDN;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _merge = _interopRequireDefault(__webpack_require__(9956));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var default_fqdn_options = {
      require_tld: true,
      allow_underscores: false,
      allow_trailing_dot: false,
      allow_numeric_tld: false,
      allow_wildcard: false,
      ignore_max_length: false
    };
    function isFQDN(str, options) {
      (0, _assertString.default)(str);
      options = (0, _merge.default)(options, default_fqdn_options);

      /* Remove the optional trailing dot before checking validity */
      if (options.allow_trailing_dot && str[str.length - 1] === '.') {
        str = str.substring(0, str.length - 1);
      }

      /* Remove the optional wildcard before checking validity */
      if (options.allow_wildcard === true && str.indexOf('*.') === 0) {
        str = str.substring(2);
      }
      var parts = str.split('.');
      var tld = parts[parts.length - 1];
      if (options.require_tld) {
        // disallow fqdns without tld
        if (parts.length < 2) {
          return false;
        }
        if (
          !options.allow_numeric_tld &&
          !/^([a-z\u00A1-\u00A8\u00AA-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}|xn[a-z0-9-]{2,})$/i.test(
            tld
          )
        ) {
          return false;
        }

        // disallow spaces
        if (/\s/.test(tld)) {
          return false;
        }
      }

      // reject numeric TLDs
      if (!options.allow_numeric_tld && /^\d+$/.test(tld)) {
        return false;
      }
      return parts.every(part => {
        if (part.length > 63 && !options.ignore_max_length) {
          return false;
        }
        if (!/^[a-z_\u00a1-\uffff0-9-]+$/i.test(part)) {
          return false;
        }

        // disallow full-width chars
        if (/[\uff01-\uff5e]/.test(part)) {
          return false;
        }

        // disallow parts starting or ending with hyphen
        if (/^-|-$/.test(part)) {
          return false;
        }
        if (!options.allow_underscores && /_/.test(part)) {
          return false;
        }
        return true;
      });
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 3158: /***/ (__unused_webpack_module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isFloat;
    exports.locales = void 0;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _alpha = __webpack_require__(2644);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function isFloat(str, options) {
      (0, _assertString.default)(str);
      options = options || {};
      var float = new RegExp(
        '^(?:[-+])?(?:[0-9]+)?(?:\\'.concat(
          options.locale ? _alpha.decimal[options.locale] : '.',
          '[0-9]*)?(?:[eE][\\+\\-]?(?:[0-9]+))?$'
        )
      );
      if (
        str === '' ||
        str === '.' ||
        str === ',' ||
        str === '-' ||
        str === '+'
      ) {
        return false;
      }
      var value = parseFloat(str.replace(',', '.'));
      return (
        float.test(str) &&
        (!Object.hasOwn(options, 'min') || value >= options.min) &&
        (!Object.hasOwn(options, 'max') || value <= options.max) &&
        (!Object.hasOwn(options, 'lt') || value < options.lt) &&
        (!Object.hasOwn(options, 'gt') || value > options.gt)
      );
    }
    var locales = (exports.locales = Object.keys(_alpha.decimal));

    /***/
  },

  /***/ 2619: /***/ (__unused_webpack_module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isFullWidth;
    exports.fullWidth = void 0;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var fullWidth = (exports.fullWidth =
      /[^\u0020-\u007E\uFF61-\uFF9F\uFFA0-\uFFDC\uFFE8-\uFFEE0-9a-zA-Z]/);
    function isFullWidth(str) {
      (0, _assertString.default)(str);
      return fullWidth.test(str);
    }

    /***/
  },

  /***/ 429: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isHSL;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var hslComma =
      /^hsla?\(((\+|-)?([0-9]+(\.[0-9]+)?(e(\+|-)?[0-9]+)?|\.[0-9]+(e(\+|-)?[0-9]+)?))(deg|grad|rad|turn)?(,(\+|-)?([0-9]+(\.[0-9]+)?(e(\+|-)?[0-9]+)?|\.[0-9]+(e(\+|-)?[0-9]+)?)%){2}(,((\+|-)?([0-9]+(\.[0-9]+)?(e(\+|-)?[0-9]+)?|\.[0-9]+(e(\+|-)?[0-9]+)?)%?))?\)$/i;
    var hslSpace =
      /^hsla?\(((\+|-)?([0-9]+(\.[0-9]+)?(e(\+|-)?[0-9]+)?|\.[0-9]+(e(\+|-)?[0-9]+)?))(deg|grad|rad|turn)?(\s(\+|-)?([0-9]+(\.[0-9]+)?(e(\+|-)?[0-9]+)?|\.[0-9]+(e(\+|-)?[0-9]+)?)%){2}\s?(\/\s((\+|-)?([0-9]+(\.[0-9]+)?(e(\+|-)?[0-9]+)?|\.[0-9]+(e(\+|-)?[0-9]+)?)%?)\s?)?\)$/i;
    function isHSL(str) {
      (0, _assertString.default)(str);

      // Strip duplicate spaces before calling the validation regex (See  #1598 for more info)
      var strippedStr = str
        .replace(/\s+/g, ' ')
        .replace(/\s?(hsla?\(|\)|,)\s?/gi, '$1');
      if (strippedStr.indexOf(',') !== -1) {
        return hslComma.test(strippedStr);
      }
      return hslSpace.test(strippedStr);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 2176: /***/ (__unused_webpack_module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isHalfWidth;
    exports.halfWidth = void 0;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var halfWidth = (exports.halfWidth =
      /[\u0020-\u007E\uFF61-\uFF9F\uFFA0-\uFFDC\uFFE8-\uFFEE0-9a-zA-Z]/);
    function isHalfWidth(str) {
      (0, _assertString.default)(str);
      return halfWidth.test(str);
    }

    /***/
  },

  /***/ 9841: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isHash;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var lengths = {
      md5: 32,
      md4: 32,
      sha1: 40,
      sha256: 64,
      sha384: 96,
      sha512: 128,
      ripemd128: 32,
      ripemd160: 40,
      tiger128: 32,
      tiger160: 40,
      tiger192: 48,
      crc32: 8,
      crc32b: 8
    };
    function isHash(str, algorithm) {
      (0, _assertString.default)(str);
      var hash = new RegExp('^[a-fA-F0-9]{'.concat(lengths[algorithm], '}$'));
      return hash.test(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 1992: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isHexColor;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var hexcolor = /^#?([0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$/i;
    function isHexColor(str) {
      (0, _assertString.default)(str);
      return hexcolor.test(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 6262: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isHexadecimal;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var hexadecimal = /^(0x|0h)?[0-9A-F]+$/i;
    function isHexadecimal(str) {
      (0, _assertString.default)(str);
      return hexadecimal.test(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 8111: /***/ (__unused_webpack_module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isIBAN;
    exports.locales = void 0;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    /**
     * List of country codes with
     * corresponding IBAN regular expression
     * Reference: https://en.wikipedia.org/wiki/International_Bank_Account_Number
     */
    var ibanRegexThroughCountryCode = {
      AD: /^(AD[0-9]{2})\d{8}[A-Z0-9]{12}$/,
      AE: /^(AE[0-9]{2})\d{3}\d{16}$/,
      AL: /^(AL[0-9]{2})\d{8}[A-Z0-9]{16}$/,
      AT: /^(AT[0-9]{2})\d{16}$/,
      AZ: /^(AZ[0-9]{2})[A-Z0-9]{4}\d{20}$/,
      BA: /^(BA[0-9]{2})\d{16}$/,
      BE: /^(BE[0-9]{2})\d{12}$/,
      BG: /^(BG[0-9]{2})[A-Z]{4}\d{6}[A-Z0-9]{8}$/,
      BH: /^(BH[0-9]{2})[A-Z]{4}[A-Z0-9]{14}$/,
      BR: /^(BR[0-9]{2})\d{23}[A-Z]{1}[A-Z0-9]{1}$/,
      BY: /^(BY[0-9]{2})[A-Z0-9]{4}\d{20}$/,
      CH: /^(CH[0-9]{2})\d{5}[A-Z0-9]{12}$/,
      CR: /^(CR[0-9]{2})\d{18}$/,
      CY: /^(CY[0-9]{2})\d{8}[A-Z0-9]{16}$/,
      CZ: /^(CZ[0-9]{2})\d{20}$/,
      DE: /^(DE[0-9]{2})\d{18}$/,
      DK: /^(DK[0-9]{2})\d{14}$/,
      DO: /^(DO[0-9]{2})[A-Z]{4}\d{20}$/,
      DZ: /^(DZ\d{24})$/,
      EE: /^(EE[0-9]{2})\d{16}$/,
      EG: /^(EG[0-9]{2})\d{25}$/,
      ES: /^(ES[0-9]{2})\d{20}$/,
      FI: /^(FI[0-9]{2})\d{14}$/,
      FO: /^(FO[0-9]{2})\d{14}$/,
      FR: /^(FR[0-9]{2})\d{10}[A-Z0-9]{11}\d{2}$/,
      GB: /^(GB[0-9]{2})[A-Z]{4}\d{14}$/,
      GE: /^(GE[0-9]{2})[A-Z0-9]{2}\d{16}$/,
      GI: /^(GI[0-9]{2})[A-Z]{4}[A-Z0-9]{15}$/,
      GL: /^(GL[0-9]{2})\d{14}$/,
      GR: /^(GR[0-9]{2})\d{7}[A-Z0-9]{16}$/,
      GT: /^(GT[0-9]{2})[A-Z0-9]{4}[A-Z0-9]{20}$/,
      HR: /^(HR[0-9]{2})\d{17}$/,
      HU: /^(HU[0-9]{2})\d{24}$/,
      IE: /^(IE[0-9]{2})[A-Z0-9]{4}\d{14}$/,
      IL: /^(IL[0-9]{2})\d{19}$/,
      IQ: /^(IQ[0-9]{2})[A-Z]{4}\d{15}$/,
      IR: /^(IR[0-9]{2})0\d{2}0\d{18}$/,
      IS: /^(IS[0-9]{2})\d{22}$/,
      IT: /^(IT[0-9]{2})[A-Z]{1}\d{10}[A-Z0-9]{12}$/,
      JO: /^(JO[0-9]{2})[A-Z]{4}\d{22}$/,
      KW: /^(KW[0-9]{2})[A-Z]{4}[A-Z0-9]{22}$/,
      KZ: /^(KZ[0-9]{2})\d{3}[A-Z0-9]{13}$/,
      LB: /^(LB[0-9]{2})\d{4}[A-Z0-9]{20}$/,
      LC: /^(LC[0-9]{2})[A-Z]{4}[A-Z0-9]{24}$/,
      LI: /^(LI[0-9]{2})\d{5}[A-Z0-9]{12}$/,
      LT: /^(LT[0-9]{2})\d{16}$/,
      LU: /^(LU[0-9]{2})\d{3}[A-Z0-9]{13}$/,
      LV: /^(LV[0-9]{2})[A-Z]{4}[A-Z0-9]{13}$/,
      MA: /^(MA[0-9]{26})$/,
      MC: /^(MC[0-9]{2})\d{10}[A-Z0-9]{11}\d{2}$/,
      MD: /^(MD[0-9]{2})[A-Z0-9]{20}$/,
      ME: /^(ME[0-9]{2})\d{18}$/,
      MK: /^(MK[0-9]{2})\d{3}[A-Z0-9]{10}\d{2}$/,
      MR: /^(MR[0-9]{2})\d{23}$/,
      MT: /^(MT[0-9]{2})[A-Z]{4}\d{5}[A-Z0-9]{18}$/,
      MU: /^(MU[0-9]{2})[A-Z]{4}\d{19}[A-Z]{3}$/,
      MZ: /^(MZ[0-9]{2})\d{21}$/,
      NL: /^(NL[0-9]{2})[A-Z]{4}\d{10}$/,
      NO: /^(NO[0-9]{2})\d{11}$/,
      PK: /^(PK[0-9]{2})[A-Z0-9]{4}\d{16}$/,
      PL: /^(PL[0-9]{2})\d{24}$/,
      PS: /^(PS[0-9]{2})[A-Z0-9]{4}\d{21}$/,
      PT: /^(PT[0-9]{2})\d{21}$/,
      QA: /^(QA[0-9]{2})[A-Z]{4}[A-Z0-9]{21}$/,
      RO: /^(RO[0-9]{2})[A-Z]{4}[A-Z0-9]{16}$/,
      RS: /^(RS[0-9]{2})\d{18}$/,
      SA: /^(SA[0-9]{2})\d{2}[A-Z0-9]{18}$/,
      SC: /^(SC[0-9]{2})[A-Z]{4}\d{20}[A-Z]{3}$/,
      SE: /^(SE[0-9]{2})\d{20}$/,
      SI: /^(SI[0-9]{2})\d{15}$/,
      SK: /^(SK[0-9]{2})\d{20}$/,
      SM: /^(SM[0-9]{2})[A-Z]{1}\d{10}[A-Z0-9]{12}$/,
      SV: /^(SV[0-9]{2})[A-Z0-9]{4}\d{20}$/,
      TL: /^(TL[0-9]{2})\d{19}$/,
      TN: /^(TN[0-9]{2})\d{20}$/,
      TR: /^(TR[0-9]{2})\d{5}[A-Z0-9]{17}$/,
      UA: /^(UA[0-9]{2})\d{6}[A-Z0-9]{19}$/,
      VA: /^(VA[0-9]{2})\d{18}$/,
      VG: /^(VG[0-9]{2})[A-Z0-9]{4}\d{16}$/,
      XK: /^(XK[0-9]{2})\d{16}$/
    };

    /**
     * Check if the country codes passed are valid using the
     * ibanRegexThroughCountryCode as a reference
     *
     * @param {array} countryCodeArray
     * @return {boolean}
     */

    function hasOnlyValidCountryCodes(countryCodeArray) {
      var countryCodeArrayFilteredWithObjectIbanCode = countryCodeArray.filter(
        countryCode => !(countryCode in ibanRegexThroughCountryCode)
      );
      if (countryCodeArrayFilteredWithObjectIbanCode.length > 0) {
        return false;
      }
      return true;
    }

    /**
     * Check whether string has correct universal IBAN format
     * The IBAN consists of up to 34 alphanumeric characters, as follows:
     * Country Code using ISO 3166-1 alpha-2, two letters
     * check digits, two digits and
     * Basic Bank Account Number (BBAN), up to 30 alphanumeric characters.
     * NOTE: Permitted IBAN characters are: digits [0-9] and the 26 latin alphabetic [A-Z]
     *
     * @param {string} str - string under validation
     * @param {object} options - object to pass the countries to be either whitelisted or blacklisted
     * @return {boolean}
     */
    function hasValidIbanFormat(str, options) {
      // Strip white spaces and hyphens
      var strippedStr = str.replace(/[\s-]+/gi, '').toUpperCase();
      var isoCountryCode = strippedStr.slice(0, 2).toUpperCase();
      var isoCountryCodeInIbanRegexCodeObject =
        isoCountryCode in ibanRegexThroughCountryCode;
      if (options.whitelist) {
        if (!hasOnlyValidCountryCodes(options.whitelist)) {
          return false;
        }
        var isoCountryCodeInWhiteList =
          options.whitelist.includes(isoCountryCode);
        if (!isoCountryCodeInWhiteList) {
          return false;
        }
      }
      if (options.blacklist) {
        var isoCountryCodeInBlackList =
          options.blacklist.includes(isoCountryCode);
        if (isoCountryCodeInBlackList) {
          return false;
        }
      }
      return (
        isoCountryCodeInIbanRegexCodeObject &&
        ibanRegexThroughCountryCode[isoCountryCode].test(strippedStr)
      );
    }

    /**
     * Check whether string has valid IBAN Checksum
     * by performing basic mod-97 operation and
     * the remainder should equal 1
     * -- Start by rearranging the IBAN by moving the four initial characters to the end of the string
     * -- Replace each letter in the string with two digits, A -> 10, B = 11, Z = 35
     * -- Interpret the string as a decimal integer and
     * -- compute the remainder on division by 97 (mod 97)
     * Reference: https://en.wikipedia.org/wiki/International_Bank_Account_Number
     *
     * @param {string} str
     * @return {boolean}
     */
    function hasValidIbanChecksum(str) {
      var strippedStr = str.replace(/[^A-Z0-9]+/gi, '').toUpperCase(); // Keep only digits and A-Z latin alphabetic
      var rearranged = strippedStr.slice(4) + strippedStr.slice(0, 4);
      var alphaCapsReplacedWithDigits = rearranged.replace(
        /[A-Z]/g,
        char => char.charCodeAt(0) - 55
      );
      var remainder = alphaCapsReplacedWithDigits
        .match(/\d{1,7}/g)
        .reduce((acc, value) => Number(acc + value) % 97, '');
      return remainder === 1;
    }
    function isIBAN(str) {
      var options =
        arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      (0, _assertString.default)(str);
      return hasValidIbanFormat(str, options) && hasValidIbanChecksum(str);
    }
    var locales = (exports.locales = Object.keys(ibanRegexThroughCountryCode));

    /***/
  },

  /***/ 9927: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isIMEI;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var imeiRegexWithoutHypens = /^[0-9]{15}$/;
    var imeiRegexWithHypens = /^\d{2}-\d{6}-\d{6}-\d{1}$/;
    function isIMEI(str, options) {
      (0, _assertString.default)(str);
      options = options || {};

      // default regex for checking imei is the one without hyphens

      var imeiRegex = imeiRegexWithoutHypens;
      if (options.allow_hyphens) {
        imeiRegex = imeiRegexWithHypens;
      }
      if (!imeiRegex.test(str)) {
        return false;
      }
      str = str.replace(/-/g, '');
      var sum = 0,
        mul = 2,
        l = 14;
      for (var i = 0; i < l; i++) {
        var digit = str.substring(l - i - 1, l - i);
        var tp = parseInt(digit, 10) * mul;
        if (tp >= 10) {
          sum += (tp % 10) + 1;
        } else {
          sum += tp;
        }
        if (mul === 1) {
          mul += 1;
        } else {
          mul -= 1;
        }
      }
      var chk = (10 - (sum % 10)) % 10;
      if (chk !== parseInt(str.substring(14, 15), 10)) {
        return false;
      }
      return true;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 8253: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isIP;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    /**
11.3.  Examples

   The following addresses

             fe80::1234 (on the 1st link of the node)
             ff02::5678 (on the 5th link of the node)
             ff08::9abc (on the 10th organization of the node)

   would be represented as follows:

             fe80::1234%1
             ff02::5678%5
             ff08::9abc%10

   (Here we assume a natural translation from a zone index to the
   <zone_id> part, where the Nth zone of any scope is translated into
   "N".)

   If we use interface names as <zone_id>, those addresses could also be
   represented as follows:

            fe80::1234%ne0
            ff02::5678%pvc1.3
            ff08::9abc%interface10

   where the interface "ne0" belongs to the 1st link, "pvc1.3" belongs
   to the 5th link, and "interface10" belongs to the 10th organization.
 * * */
    var IPv4SegmentFormat =
      '(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])';
    var IPv4AddressFormat = '('
      .concat(IPv4SegmentFormat, '[.]){3}')
      .concat(IPv4SegmentFormat);
    var IPv4AddressRegExp = new RegExp('^'.concat(IPv4AddressFormat, '$'));
    var IPv6SegmentFormat = '(?:[0-9a-fA-F]{1,4})';
    var IPv6AddressRegExp = new RegExp(
      '^(' +
        '(?:'
          .concat(IPv6SegmentFormat, ':){7}(?:')
          .concat(IPv6SegmentFormat, '|:)|') +
        '(?:'
          .concat(IPv6SegmentFormat, ':){6}(?:')
          .concat(IPv4AddressFormat, '|:')
          .concat(IPv6SegmentFormat, '|:)|') +
        '(?:'
          .concat(IPv6SegmentFormat, ':){5}(?::')
          .concat(IPv4AddressFormat, '|(:')
          .concat(IPv6SegmentFormat, '){1,2}|:)|') +
        '(?:'
          .concat(IPv6SegmentFormat, ':){4}(?:(:')
          .concat(IPv6SegmentFormat, '){0,1}:')
          .concat(IPv4AddressFormat, '|(:')
          .concat(IPv6SegmentFormat, '){1,3}|:)|') +
        '(?:'
          .concat(IPv6SegmentFormat, ':){3}(?:(:')
          .concat(IPv6SegmentFormat, '){0,2}:')
          .concat(IPv4AddressFormat, '|(:')
          .concat(IPv6SegmentFormat, '){1,4}|:)|') +
        '(?:'
          .concat(IPv6SegmentFormat, ':){2}(?:(:')
          .concat(IPv6SegmentFormat, '){0,3}:')
          .concat(IPv4AddressFormat, '|(:')
          .concat(IPv6SegmentFormat, '){1,5}|:)|') +
        '(?:'
          .concat(IPv6SegmentFormat, ':){1}(?:(:')
          .concat(IPv6SegmentFormat, '){0,4}:')
          .concat(IPv4AddressFormat, '|(:')
          .concat(IPv6SegmentFormat, '){1,6}|:)|') +
        '(?::((?::'
          .concat(IPv6SegmentFormat, '){0,5}:')
          .concat(IPv4AddressFormat, '|(?::')
          .concat(IPv6SegmentFormat, '){1,7}|:))') +
        ')(%[0-9a-zA-Z-.:]{1,})?$'
    );
    function isIP(str) {
      var version =
        arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      (0, _assertString.default)(str);
      version = String(version);
      if (!version) {
        return isIP(str, 4) || isIP(str, 6);
      }
      if (version === '4') {
        return IPv4AddressRegExp.test(str);
      }
      if (version === '6') {
        return IPv6AddressRegExp.test(str);
      }
      return false;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 6896: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isIPRange;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _isIP = _interopRequireDefault(__webpack_require__(8253));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var subnetMaybe = /^\d{1,3}$/;
    var v4Subnet = 32;
    var v6Subnet = 128;
    function isIPRange(str) {
      var version =
        arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      (0, _assertString.default)(str);
      var parts = str.split('/');

      // parts[0] -> ip, parts[1] -> subnet
      if (parts.length !== 2) {
        return false;
      }
      if (!subnetMaybe.test(parts[1])) {
        return false;
      }

      // Disallow preceding 0 i.e. 01, 02, ...
      if (parts[1].length > 1 && parts[1].startsWith('0')) {
        return false;
      }
      var isValidIP = (0, _isIP.default)(parts[0], version);
      if (!isValidIP) {
        return false;
      }

      // Define valid subnet according to IP's version
      var expectedSubnet = null;
      switch (String(version)) {
        case '4':
          expectedSubnet = v4Subnet;
          break;
        case '6':
          expectedSubnet = v6Subnet;
          break;
        default:
          expectedSubnet = (0, _isIP.default)(parts[0], '6')
            ? v6Subnet
            : v4Subnet;
      }
      return parts[1] <= expectedSubnet && parts[1] >= 0;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 8254: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isISBN;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var possibleIsbn10 = /^(?:[0-9]{9}X|[0-9]{10})$/;
    var possibleIsbn13 = /^(?:[0-9]{13})$/;
    var factor = [1, 3];
    function isISBN(isbn, options) {
      (0, _assertString.default)(isbn);

      // For backwards compatibility:
      // isISBN(str [, version]), i.e. `options` could be used as argument for the legacy `version`
      var version = String(
        (options === null || options === void 0 ? void 0 : options.version) ||
          options
      );
      if (
        !(
          (options !== null && options !== void 0 && options.version) ||
          options
        )
      ) {
        return (
          isISBN(isbn, {
            version: 10
          }) ||
          isISBN(isbn, {
            version: 13
          })
        );
      }
      var sanitizedIsbn = isbn.replace(/[\s-]+/g, '');
      var checksum = 0;
      if (version === '10') {
        if (!possibleIsbn10.test(sanitizedIsbn)) {
          return false;
        }
        for (var i = 0; i < version - 1; i++) {
          checksum += (i + 1) * sanitizedIsbn.charAt(i);
        }
        if (sanitizedIsbn.charAt(9) === 'X') {
          checksum += 10 * 10;
        } else {
          checksum += 10 * sanitizedIsbn.charAt(9);
        }
        if (checksum % 11 === 0) {
          return true;
        }
      } else if (version === '13') {
        if (!possibleIsbn13.test(sanitizedIsbn)) {
          return false;
        }
        for (var _i = 0; _i < 12; _i++) {
          checksum += factor[_i % 2] * sanitizedIsbn.charAt(_i);
        }
        if (sanitizedIsbn.charAt(12) - ((10 - (checksum % 10)) % 10) === 0) {
          return true;
        }
      }
      return false;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 9187: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isISIN;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var isin = /^[A-Z]{2}[0-9A-Z]{9}[0-9]$/;

    // this link details how the check digit is calculated:
    // https://www.isin.org/isin-format/. it is a little bit
    // odd in that it works with digits, not numbers. in order
    // to make only one pass through the ISIN characters, the
    // each alpha character is handled as 2 characters within
    // the loop.

    function isISIN(str) {
      (0, _assertString.default)(str);
      if (!isin.test(str)) {
        return false;
      }
      var double = true;
      var sum = 0;
      // convert values
      for (var i = str.length - 2; i >= 0; i--) {
        if (str[i] >= 'A' && str[i] <= 'Z') {
          var value = str[i].charCodeAt(0) - 55;
          var lo = value % 10;
          var hi = Math.trunc(value / 10);
          // letters have two digits, so handle the low order
          // and high order digits separately.
          for (var _i = 0, _arr = [lo, hi]; _i < _arr.length; _i++) {
            var digit = _arr[_i];
            if (double) {
              if (digit >= 5) {
                sum += 1 + (digit - 5) * 2;
              } else {
                sum += digit * 2;
              }
            } else {
              sum += digit;
            }
            double = !double;
          }
        } else {
          var _digit = str[i].charCodeAt(0) - '0'.charCodeAt(0);
          if (double) {
            if (_digit >= 5) {
              sum += 1 + (_digit - 5) * 2;
            } else {
              sum += _digit * 2;
            }
          } else {
            sum += _digit;
          }
          double = !double;
        }
      }
      var check = Math.trunc((sum + 9) / 10) * 10 - sum;
      return +str[str.length - 1] === check;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 3442: /***/ (__unused_webpack_module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports.CountryCodes = void 0;
    exports['default'] = isISO31661Alpha2;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    // from https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
    var validISO31661Alpha2CountriesCodes = new Set([
      'AD',
      'AE',
      'AF',
      'AG',
      'AI',
      'AL',
      'AM',
      'AO',
      'AQ',
      'AR',
      'AS',
      'AT',
      'AU',
      'AW',
      'AX',
      'AZ',
      'BA',
      'BB',
      'BD',
      'BE',
      'BF',
      'BG',
      'BH',
      'BI',
      'BJ',
      'BL',
      'BM',
      'BN',
      'BO',
      'BQ',
      'BR',
      'BS',
      'BT',
      'BV',
      'BW',
      'BY',
      'BZ',
      'CA',
      'CC',
      'CD',
      'CF',
      'CG',
      'CH',
      'CI',
      'CK',
      'CL',
      'CM',
      'CN',
      'CO',
      'CR',
      'CU',
      'CV',
      'CW',
      'CX',
      'CY',
      'CZ',
      'DE',
      'DJ',
      'DK',
      'DM',
      'DO',
      'DZ',
      'EC',
      'EE',
      'EG',
      'EH',
      'ER',
      'ES',
      'ET',
      'FI',
      'FJ',
      'FK',
      'FM',
      'FO',
      'FR',
      'GA',
      'GB',
      'GD',
      'GE',
      'GF',
      'GG',
      'GH',
      'GI',
      'GL',
      'GM',
      'GN',
      'GP',
      'GQ',
      'GR',
      'GS',
      'GT',
      'GU',
      'GW',
      'GY',
      'HK',
      'HM',
      'HN',
      'HR',
      'HT',
      'HU',
      'ID',
      'IE',
      'IL',
      'IM',
      'IN',
      'IO',
      'IQ',
      'IR',
      'IS',
      'IT',
      'JE',
      'JM',
      'JO',
      'JP',
      'KE',
      'KG',
      'KH',
      'KI',
      'KM',
      'KN',
      'KP',
      'KR',
      'KW',
      'KY',
      'KZ',
      'LA',
      'LB',
      'LC',
      'LI',
      'LK',
      'LR',
      'LS',
      'LT',
      'LU',
      'LV',
      'LY',
      'MA',
      'MC',
      'MD',
      'ME',
      'MF',
      'MG',
      'MH',
      'MK',
      'ML',
      'MM',
      'MN',
      'MO',
      'MP',
      'MQ',
      'MR',
      'MS',
      'MT',
      'MU',
      'MV',
      'MW',
      'MX',
      'MY',
      'MZ',
      'NA',
      'NC',
      'NE',
      'NF',
      'NG',
      'NI',
      'NL',
      'NO',
      'NP',
      'NR',
      'NU',
      'NZ',
      'OM',
      'PA',
      'PE',
      'PF',
      'PG',
      'PH',
      'PK',
      'PL',
      'PM',
      'PN',
      'PR',
      'PS',
      'PT',
      'PW',
      'PY',
      'QA',
      'RE',
      'RO',
      'RS',
      'RU',
      'RW',
      'SA',
      'SB',
      'SC',
      'SD',
      'SE',
      'SG',
      'SH',
      'SI',
      'SJ',
      'SK',
      'SL',
      'SM',
      'SN',
      'SO',
      'SR',
      'SS',
      'ST',
      'SV',
      'SX',
      'SY',
      'SZ',
      'TC',
      'TD',
      'TF',
      'TG',
      'TH',
      'TJ',
      'TK',
      'TL',
      'TM',
      'TN',
      'TO',
      'TR',
      'TT',
      'TV',
      'TW',
      'TZ',
      'UA',
      'UG',
      'UM',
      'US',
      'UY',
      'UZ',
      'VA',
      'VC',
      'VE',
      'VG',
      'VI',
      'VN',
      'VU',
      'WF',
      'WS',
      'YE',
      'YT',
      'ZA',
      'ZM',
      'ZW'
    ]);
    function isISO31661Alpha2(str) {
      (0, _assertString.default)(str);
      return validISO31661Alpha2CountriesCodes.has(str.toUpperCase());
    }
    var CountryCodes = (exports.CountryCodes =
      validISO31661Alpha2CountriesCodes);

    /***/
  },

  /***/ 5923: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isISO31661Alpha3;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    // from https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3
    var validISO31661Alpha3CountriesCodes = new Set([
      'AFG',
      'ALA',
      'ALB',
      'DZA',
      'ASM',
      'AND',
      'AGO',
      'AIA',
      'ATA',
      'ATG',
      'ARG',
      'ARM',
      'ABW',
      'AUS',
      'AUT',
      'AZE',
      'BHS',
      'BHR',
      'BGD',
      'BRB',
      'BLR',
      'BEL',
      'BLZ',
      'BEN',
      'BMU',
      'BTN',
      'BOL',
      'BES',
      'BIH',
      'BWA',
      'BVT',
      'BRA',
      'IOT',
      'BRN',
      'BGR',
      'BFA',
      'BDI',
      'KHM',
      'CMR',
      'CAN',
      'CPV',
      'CYM',
      'CAF',
      'TCD',
      'CHL',
      'CHN',
      'CXR',
      'CCK',
      'COL',
      'COM',
      'COG',
      'COD',
      'COK',
      'CRI',
      'CIV',
      'HRV',
      'CUB',
      'CUW',
      'CYP',
      'CZE',
      'DNK',
      'DJI',
      'DMA',
      'DOM',
      'ECU',
      'EGY',
      'SLV',
      'GNQ',
      'ERI',
      'EST',
      'ETH',
      'FLK',
      'FRO',
      'FJI',
      'FIN',
      'FRA',
      'GUF',
      'PYF',
      'ATF',
      'GAB',
      'GMB',
      'GEO',
      'DEU',
      'GHA',
      'GIB',
      'GRC',
      'GRL',
      'GRD',
      'GLP',
      'GUM',
      'GTM',
      'GGY',
      'GIN',
      'GNB',
      'GUY',
      'HTI',
      'HMD',
      'VAT',
      'HND',
      'HKG',
      'HUN',
      'ISL',
      'IND',
      'IDN',
      'IRN',
      'IRQ',
      'IRL',
      'IMN',
      'ISR',
      'ITA',
      'JAM',
      'JPN',
      'JEY',
      'JOR',
      'KAZ',
      'KEN',
      'KIR',
      'PRK',
      'KOR',
      'KWT',
      'KGZ',
      'LAO',
      'LVA',
      'LBN',
      'LSO',
      'LBR',
      'LBY',
      'LIE',
      'LTU',
      'LUX',
      'MAC',
      'MKD',
      'MDG',
      'MWI',
      'MYS',
      'MDV',
      'MLI',
      'MLT',
      'MHL',
      'MTQ',
      'MRT',
      'MUS',
      'MYT',
      'MEX',
      'FSM',
      'MDA',
      'MCO',
      'MNG',
      'MNE',
      'MSR',
      'MAR',
      'MOZ',
      'MMR',
      'NAM',
      'NRU',
      'NPL',
      'NLD',
      'NCL',
      'NZL',
      'NIC',
      'NER',
      'NGA',
      'NIU',
      'NFK',
      'MNP',
      'NOR',
      'OMN',
      'PAK',
      'PLW',
      'PSE',
      'PAN',
      'PNG',
      'PRY',
      'PER',
      'PHL',
      'PCN',
      'POL',
      'PRT',
      'PRI',
      'QAT',
      'REU',
      'ROU',
      'RUS',
      'RWA',
      'BLM',
      'SHN',
      'KNA',
      'LCA',
      'MAF',
      'SPM',
      'VCT',
      'WSM',
      'SMR',
      'STP',
      'SAU',
      'SEN',
      'SRB',
      'SYC',
      'SLE',
      'SGP',
      'SXM',
      'SVK',
      'SVN',
      'SLB',
      'SOM',
      'ZAF',
      'SGS',
      'SSD',
      'ESP',
      'LKA',
      'SDN',
      'SUR',
      'SJM',
      'SWZ',
      'SWE',
      'CHE',
      'SYR',
      'TWN',
      'TJK',
      'TZA',
      'THA',
      'TLS',
      'TGO',
      'TKL',
      'TON',
      'TTO',
      'TUN',
      'TUR',
      'TKM',
      'TCA',
      'TUV',
      'UGA',
      'UKR',
      'ARE',
      'GBR',
      'USA',
      'UMI',
      'URY',
      'UZB',
      'VUT',
      'VEN',
      'VNM',
      'VGB',
      'VIR',
      'WLF',
      'ESH',
      'YEM',
      'ZMB',
      'ZWE'
    ]);
    function isISO31661Alpha3(str) {
      (0, _assertString.default)(str);
      return validISO31661Alpha3CountriesCodes.has(str.toUpperCase());
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 909: /***/ (__unused_webpack_module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports.CurrencyCodes = void 0;
    exports['default'] = isISO4217;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    // from https://en.wikipedia.org/wiki/ISO_4217
    var validISO4217CurrencyCodes = new Set([
      'AED',
      'AFN',
      'ALL',
      'AMD',
      'ANG',
      'AOA',
      'ARS',
      'AUD',
      'AWG',
      'AZN',
      'BAM',
      'BBD',
      'BDT',
      'BGN',
      'BHD',
      'BIF',
      'BMD',
      'BND',
      'BOB',
      'BOV',
      'BRL',
      'BSD',
      'BTN',
      'BWP',
      'BYN',
      'BZD',
      'CAD',
      'CDF',
      'CHE',
      'CHF',
      'CHW',
      'CLF',
      'CLP',
      'CNY',
      'COP',
      'COU',
      'CRC',
      'CUC',
      'CUP',
      'CVE',
      'CZK',
      'DJF',
      'DKK',
      'DOP',
      'DZD',
      'EGP',
      'ERN',
      'ETB',
      'EUR',
      'FJD',
      'FKP',
      'GBP',
      'GEL',
      'GHS',
      'GIP',
      'GMD',
      'GNF',
      'GTQ',
      'GYD',
      'HKD',
      'HNL',
      'HRK',
      'HTG',
      'HUF',
      'IDR',
      'ILS',
      'INR',
      'IQD',
      'IRR',
      'ISK',
      'JMD',
      'JOD',
      'JPY',
      'KES',
      'KGS',
      'KHR',
      'KMF',
      'KPW',
      'KRW',
      'KWD',
      'KYD',
      'KZT',
      'LAK',
      'LBP',
      'LKR',
      'LRD',
      'LSL',
      'LYD',
      'MAD',
      'MDL',
      'MGA',
      'MKD',
      'MMK',
      'MNT',
      'MOP',
      'MRU',
      'MUR',
      'MVR',
      'MWK',
      'MXN',
      'MXV',
      'MYR',
      'MZN',
      'NAD',
      'NGN',
      'NIO',
      'NOK',
      'NPR',
      'NZD',
      'OMR',
      'PAB',
      'PEN',
      'PGK',
      'PHP',
      'PKR',
      'PLN',
      'PYG',
      'QAR',
      'RON',
      'RSD',
      'RUB',
      'RWF',
      'SAR',
      'SBD',
      'SCR',
      'SDG',
      'SEK',
      'SGD',
      'SHP',
      'SLE',
      'SLL',
      'SOS',
      'SRD',
      'SSP',
      'STN',
      'SVC',
      'SYP',
      'SZL',
      'THB',
      'TJS',
      'TMT',
      'TND',
      'TOP',
      'TRY',
      'TTD',
      'TWD',
      'TZS',
      'UAH',
      'UGX',
      'USD',
      'USN',
      'UYI',
      'UYU',
      'UYW',
      'UZS',
      'VES',
      'VND',
      'VUV',
      'WST',
      'XAF',
      'XAG',
      'XAU',
      'XBA',
      'XBB',
      'XBC',
      'XBD',
      'XCD',
      'XDR',
      'XOF',
      'XPD',
      'XPF',
      'XPT',
      'XSU',
      'XTS',
      'XUA',
      'XXX',
      'YER',
      'ZAR',
      'ZMW',
      'ZWL'
    ]);
    function isISO4217(str) {
      (0, _assertString.default)(str);
      return validISO4217CurrencyCodes.has(str.toUpperCase());
    }
    var CurrencyCodes = (exports.CurrencyCodes = validISO4217CurrencyCodes);

    /***/
  },

  /***/ 7446: /***/ (__unused_webpack_module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports.isFreightContainerID = void 0;
    exports.isISO6346 = isISO6346;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    // https://en.wikipedia.org/wiki/ISO_6346
    // according to ISO6346 standard, checksum digit is mandatory for freight container but recommended
    // for other container types (J and Z)
    var isISO6346Str = /^[A-Z]{3}(U[0-9]{7})|([J,Z][0-9]{6,7})$/;
    var isDigit = /^[0-9]$/;
    function isISO6346(str) {
      (0, _assertString.default)(str);
      str = str.toUpperCase();
      if (!isISO6346Str.test(str)) return false;
      if (str.length === 11) {
        var sum = 0;
        for (var i = 0; i < str.length - 1; i++) {
          if (!isDigit.test(str[i])) {
            var convertedCode = void 0;
            var letterCode = str.charCodeAt(i) - 55;
            if (letterCode < 11) convertedCode = letterCode;
            else if (letterCode >= 11 && letterCode <= 20)
              convertedCode = 12 + (letterCode % 11);
            else if (letterCode >= 21 && letterCode <= 30)
              convertedCode = 23 + (letterCode % 21);
            else convertedCode = 34 + (letterCode % 31);
            sum += convertedCode * 2 ** i;
          } else sum += str[i] * 2 ** i;
        }
        var checkSumDigit = sum % 11;
        return Number(str[str.length - 1]) === checkSumDigit;
      }
      return true;
    }
    var isFreightContainerID = (exports.isFreightContainerID = isISO6346);

    /***/
  },

  /***/ 7242: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isISO6391;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var isISO6391Set = new Set([
      'aa',
      'ab',
      'ae',
      'af',
      'ak',
      'am',
      'an',
      'ar',
      'as',
      'av',
      'ay',
      'az',
      'az',
      'ba',
      'be',
      'bg',
      'bh',
      'bi',
      'bm',
      'bn',
      'bo',
      'br',
      'bs',
      'ca',
      'ce',
      'ch',
      'co',
      'cr',
      'cs',
      'cu',
      'cv',
      'cy',
      'da',
      'de',
      'dv',
      'dz',
      'ee',
      'el',
      'en',
      'eo',
      'es',
      'et',
      'eu',
      'fa',
      'ff',
      'fi',
      'fj',
      'fo',
      'fr',
      'fy',
      'ga',
      'gd',
      'gl',
      'gn',
      'gu',
      'gv',
      'ha',
      'he',
      'hi',
      'ho',
      'hr',
      'ht',
      'hu',
      'hy',
      'hz',
      'ia',
      'id',
      'ie',
      'ig',
      'ii',
      'ik',
      'io',
      'is',
      'it',
      'iu',
      'ja',
      'jv',
      'ka',
      'kg',
      'ki',
      'kj',
      'kk',
      'kl',
      'km',
      'kn',
      'ko',
      'kr',
      'ks',
      'ku',
      'kv',
      'kw',
      'ky',
      'la',
      'lb',
      'lg',
      'li',
      'ln',
      'lo',
      'lt',
      'lu',
      'lv',
      'mg',
      'mh',
      'mi',
      'mk',
      'ml',
      'mn',
      'mr',
      'ms',
      'mt',
      'my',
      'na',
      'nb',
      'nd',
      'ne',
      'ng',
      'nl',
      'nn',
      'no',
      'nr',
      'nv',
      'ny',
      'oc',
      'oj',
      'om',
      'or',
      'os',
      'pa',
      'pi',
      'pl',
      'ps',
      'pt',
      'qu',
      'rm',
      'rn',
      'ro',
      'ru',
      'rw',
      'sa',
      'sc',
      'sd',
      'se',
      'sg',
      'si',
      'sk',
      'sl',
      'sm',
      'sn',
      'so',
      'sq',
      'sr',
      'ss',
      'st',
      'su',
      'sv',
      'sw',
      'ta',
      'te',
      'tg',
      'th',
      'ti',
      'tk',
      'tl',
      'tn',
      'to',
      'tr',
      'ts',
      'tt',
      'tw',
      'ty',
      'ug',
      'uk',
      'ur',
      'uz',
      've',
      'vi',
      'vo',
      'wa',
      'wo',
      'xh',
      'yi',
      'yo',
      'za',
      'zh',
      'zu'
    ]);
    function isISO6391(str) {
      (0, _assertString.default)(str);
      return isISO6391Set.has(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 3790: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isISO8601;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    /* eslint-disable max-len */
    // from http://goo.gl/0ejHHW
    var iso8601 =
      /^([+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-3])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([.,]\d+(?!:))?)?(\17[0-5]\d([.,]\d+)?)?([zZ]|([+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;
    // same as above, except with a strict 'T' separator between date and time
    var iso8601StrictSeparator =
      /^([+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-3])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T]((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([.,]\d+(?!:))?)?(\17[0-5]\d([.,]\d+)?)?([zZ]|([+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;
    /* eslint-enable max-len */
    var isValidDate = function isValidDate(str) {
      // str must have passed the ISO8601 check
      // this check is meant to catch invalid dates
      // like 2009-02-31
      // first check for ordinal dates
      var ordinalMatch = str.match(/^(\d{4})-?(\d{3})([ T]{1}\.*|$)/);
      if (ordinalMatch) {
        var oYear = Number(ordinalMatch[1]);
        var oDay = Number(ordinalMatch[2]);
        // if is leap year
        if ((oYear % 4 === 0 && oYear % 100 !== 0) || oYear % 400 === 0)
          return oDay <= 366;
        return oDay <= 365;
      }
      var match = str.match(/(\d{4})-?(\d{0,2})-?(\d*)/).map(Number);
      var year = match[1];
      var month = match[2];
      var day = match[3];
      var monthString = month ? '0'.concat(month).slice(-2) : month;
      var dayString = day ? '0'.concat(day).slice(-2) : day;

      // create a date object and compare
      var d = new Date(
        ''
          .concat(year, '-')
          .concat(monthString || '01', '-')
          .concat(dayString || '01')
      );
      if (month && day) {
        return (
          d.getUTCFullYear() === year &&
          d.getUTCMonth() + 1 === month &&
          d.getUTCDate() === day
        );
      }
      return true;
    };
    function isISO8601(str) {
      var options =
        arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      (0, _assertString.default)(str);
      var check = options.strictSeparator
        ? iso8601StrictSeparator.test(str)
        : iso8601.test(str);
      if (check && options.strict) return isValidDate(str);
      return check;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 9032: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isISRC;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    // see http://isrc.ifpi.org/en/isrc-standard/code-syntax
    var isrc = /^[A-Z]{2}[0-9A-Z]{3}\d{2}\d{5}$/;
    function isISRC(str) {
      (0, _assertString.default)(str);
      return isrc.test(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 7609: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isISSN;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var issn = '^\\d{4}-?\\d{3}[\\dX]$';
    function isISSN(str) {
      var options =
        arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      (0, _assertString.default)(str);
      var testIssn = issn;
      testIssn = options.require_hyphen ? testIssn.replace('?', '') : testIssn;
      testIssn = options.case_sensitive
        ? new RegExp(testIssn)
        : new RegExp(testIssn, 'i');
      if (!testIssn.test(str)) {
        return false;
      }
      var digits = str.replace('-', '').toUpperCase();
      var checksum = 0;
      for (var i = 0; i < digits.length; i++) {
        var digit = digits[i];
        checksum += (digit === 'X' ? 10 : +digit) * (8 - i);
      }
      return checksum % 11 === 0;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 9778: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isIdentityCard;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _isInt = _interopRequireDefault(__webpack_require__(7205));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var validators = {
      PL: function PL(str) {
        (0, _assertString.default)(str);
        var weightOfDigits = {
          1: 1,
          2: 3,
          3: 7,
          4: 9,
          5: 1,
          6: 3,
          7: 7,
          8: 9,
          9: 1,
          10: 3,
          11: 0
        };
        if (
          str != null &&
          str.length === 11 &&
          (0, _isInt.default)(str, {
            allow_leading_zeroes: true
          })
        ) {
          var digits = str.split('').slice(0, -1);
          var sum = digits.reduce(
            (acc, digit, index) =>
              acc + Number(digit) * weightOfDigits[index + 1],
            0
          );
          var modulo = sum % 10;
          var lastDigit = Number(str.charAt(str.length - 1));
          if ((modulo === 0 && lastDigit === 0) || lastDigit === 10 - modulo) {
            return true;
          }
        }
        return false;
      },
      ES: function ES(str) {
        (0, _assertString.default)(str);
        var DNI = /^[0-9X-Z][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/;
        var charsValue = {
          X: 0,
          Y: 1,
          Z: 2
        };
        var controlDigits = [
          'T',
          'R',
          'W',
          'A',
          'G',
          'M',
          'Y',
          'F',
          'P',
          'D',
          'X',
          'B',
          'N',
          'J',
          'Z',
          'S',
          'Q',
          'V',
          'H',
          'L',
          'C',
          'K',
          'E'
        ];

        // sanitize user input
        var sanitized = str.trim().toUpperCase();

        // validate the data structure
        if (!DNI.test(sanitized)) {
          return false;
        }

        // validate the control digit
        var number = sanitized
          .slice(0, -1)
          .replace(/[X,Y,Z]/g, char => charsValue[char]);
        return sanitized.endsWith(controlDigits[number % 23]);
      },
      FI: function FI(str) {
        // https://dvv.fi/en/personal-identity-code#:~:text=control%20character%20for%20a-,personal,-identity%20code%20calculated
        (0, _assertString.default)(str);
        if (str.length !== 11) {
          return false;
        }
        if (!str.match(/^\d{6}[-A+]\d{3}[0-9ABCDEFHJKLMNPRSTUVWXY]{1}$/)) {
          return false;
        }
        var checkDigits = '0123456789ABCDEFHJKLMNPRSTUVWXY';
        var idAsNumber =
          parseInt(str.slice(0, 6), 10) * 1000 + parseInt(str.slice(7, 10), 10);
        var remainder = idAsNumber % 31;
        var checkDigit = checkDigits[remainder];
        return checkDigit === str.slice(10, 11);
      },
      IN: function IN(str) {
        var DNI = /^[1-9]\d{3}\s?\d{4}\s?\d{4}$/;

        // multiplication table
        var d = [
          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
          [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
          [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
          [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
          [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
          [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
          [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
          [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
          [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
          [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
        ];

        // permutation table
        var p = [
          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
          [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
          [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
          [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
          [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
          [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
          [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
          [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
        ];

        // sanitize user input
        var sanitized = str.trim();

        // validate the data structure
        if (!DNI.test(sanitized)) {
          return false;
        }
        var c = 0;
        var invertedArray = sanitized
          .replace(/\s/g, '')
          .split('')
          .map(Number)
          .reverse();
        invertedArray.forEach((val, i) => {
          c = d[c][p[i % 8][val]];
        });
        return c === 0;
      },
      IR: function IR(str) {
        if (!str.match(/^\d{10}$/)) return false;
        str = '0000'.concat(str).slice(str.length - 6);
        if (parseInt(str.slice(3, 9), 10) === 0) return false;
        var lastNumber = parseInt(str.slice(9, 10), 10);
        var sum = 0;
        for (var i = 0; i < 9; i++) {
          sum += parseInt(str.slice(i, i + 1), 10) * (10 - i);
        }
        sum %= 11;
        return (
          (sum < 2 && lastNumber === sum) ||
          (sum >= 2 && lastNumber === 11 - sum)
        );
      },
      IT: function IT(str) {
        if (str.length !== 9) return false;
        if (str === 'CA00000AA') return false; // https://it.wikipedia.org/wiki/Carta_d%27identit%C3%A0_elettronica_italiana
        return str.search(/C[A-Z]\d{5}[A-Z]{2}/i) > -1;
      },
      NO: function NO(str) {
        var sanitized = str.trim();
        if (isNaN(Number(sanitized))) return false;
        if (sanitized.length !== 11) return false;
        if (sanitized === '00000000000') return false;

        // https://no.wikipedia.org/wiki/F%C3%B8dselsnummer
        var f = sanitized.split('').map(Number);
        var k1 =
          (11 -
            ((3 * f[0] +
              7 * f[1] +
              6 * f[2] +
              1 * f[3] +
              8 * f[4] +
              9 * f[5] +
              4 * f[6] +
              5 * f[7] +
              2 * f[8]) %
              11)) %
          11;
        var k2 =
          (11 -
            ((5 * f[0] +
              4 * f[1] +
              3 * f[2] +
              2 * f[3] +
              7 * f[4] +
              6 * f[5] +
              5 * f[6] +
              4 * f[7] +
              3 * f[8] +
              2 * k1) %
              11)) %
          11;
        if (k1 !== f[9] || k2 !== f[10]) return false;
        return true;
      },
      TH: function TH(str) {
        if (!str.match(/^[1-8]\d{12}$/)) return false;

        // validate check digit
        var sum = 0;
        for (var i = 0; i < 12; i++) {
          sum += parseInt(str[i], 10) * (13 - i);
        }
        return str[12] === ((11 - (sum % 11)) % 10).toString();
      },
      LK: function LK(str) {
        var old_nic = /^[1-9]\d{8}[vx]$/i;
        var new_nic = /^[1-9]\d{11}$/i;
        if (str.length === 10 && old_nic.test(str)) return true;
        else if (str.length === 12 && new_nic.test(str)) return true;
        return false;
      },
      'he-IL': function heIL(str) {
        var DNI = /^\d{9}$/;

        // sanitize user input
        var sanitized = str.trim();

        // validate the data structure
        if (!DNI.test(sanitized)) {
          return false;
        }
        var id = sanitized;
        var sum = 0,
          incNum;
        for (var i = 0; i < id.length; i++) {
          incNum = Number(id[i]) * ((i % 2) + 1); // Multiply number by 1 or 2
          sum += incNum > 9 ? incNum - 9 : incNum; // Sum the digits up and add to total
        }
        return sum % 10 === 0;
      },
      'ar-LY': function arLY(str) {
        // Libya National Identity Number NIN is 12 digits, the first digit is either 1 or 2
        var NIN = /^(1|2)\d{11}$/;

        // sanitize user input
        var sanitized = str.trim();

        // validate the data structure
        if (!NIN.test(sanitized)) {
          return false;
        }
        return true;
      },
      'ar-TN': function arTN(str) {
        var DNI = /^\d{8}$/;

        // sanitize user input
        var sanitized = str.trim();

        // validate the data structure
        if (!DNI.test(sanitized)) {
          return false;
        }
        return true;
      },
      'zh-CN': function zhCN(str) {
        var provincesAndCities = [
          '11',
          // 北京
          '12',
          // 天津
          '13',
          // 河北
          '14',
          // 山西
          '15',
          // 内蒙古
          '21',
          // 辽宁
          '22',
          // 吉林
          '23',
          // 黑龙江
          '31',
          // 上海
          '32',
          // 江苏
          '33',
          // 浙江
          '34',
          // 安徽
          '35',
          // 福建
          '36',
          // 江西
          '37',
          // 山东
          '41',
          // 河南
          '42',
          // 湖北
          '43',
          // 湖南
          '44',
          // 广东
          '45',
          // 广西
          '46',
          // 海南
          '50',
          // 重庆
          '51',
          // 四川
          '52',
          // 贵州
          '53',
          // 云南
          '54',
          // 西藏
          '61',
          // 陕西
          '62',
          // 甘肃
          '63',
          // 青海
          '64',
          // 宁夏
          '65',
          // 新疆
          '71',
          // 台湾
          '81',
          // 香港
          '82',
          // 澳门
          '91' // 国外
        ];
        var powers = [
          '7',
          '9',
          '10',
          '5',
          '8',
          '4',
          '2',
          '1',
          '6',
          '3',
          '7',
          '9',
          '10',
          '5',
          '8',
          '4',
          '2'
        ];
        var parityBit = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
        var checkAddressCode = function checkAddressCode(addressCode) {
          return provincesAndCities.includes(addressCode);
        };
        var checkBirthDayCode = function checkBirthDayCode(birDayCode) {
          var yyyy = parseInt(birDayCode.substring(0, 4), 10);
          var mm = parseInt(birDayCode.substring(4, 6), 10);
          var dd = parseInt(birDayCode.substring(6), 10);
          var xdata = new Date(yyyy, mm - 1, dd);
          if (xdata > new Date()) {
            return false;
            // eslint-disable-next-line max-len
          } else if (
            xdata.getFullYear() === yyyy &&
            xdata.getMonth() === mm - 1 &&
            xdata.getDate() === dd
          ) {
            return true;
          }
          return false;
        };
        var getParityBit = function getParityBit(idCardNo) {
          var id17 = idCardNo.substring(0, 17);
          var power = 0;
          for (var i = 0; i < 17; i++) {
            power += parseInt(id17.charAt(i), 10) * parseInt(powers[i], 10);
          }
          var mod = power % 11;
          return parityBit[mod];
        };
        var checkParityBit = function checkParityBit(idCardNo) {
          return getParityBit(idCardNo) === idCardNo.charAt(17).toUpperCase();
        };
        var check15IdCardNo = function check15IdCardNo(idCardNo) {
          var check =
            /^[1-9]\d{7}((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))\d{3}$/.test(
              idCardNo
            );
          if (!check) return false;
          var addressCode = idCardNo.substring(0, 2);
          check = checkAddressCode(addressCode);
          if (!check) return false;
          var birDayCode = '19'.concat(idCardNo.substring(6, 12));
          check = checkBirthDayCode(birDayCode);
          if (!check) return false;
          return true;
        };
        var check18IdCardNo = function check18IdCardNo(idCardNo) {
          var check =
            /^[1-9]\d{5}[1-9]\d{3}((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))\d{3}(\d|x|X)$/.test(
              idCardNo
            );
          if (!check) return false;
          var addressCode = idCardNo.substring(0, 2);
          check = checkAddressCode(addressCode);
          if (!check) return false;
          var birDayCode = idCardNo.substring(6, 14);
          check = checkBirthDayCode(birDayCode);
          if (!check) return false;
          return checkParityBit(idCardNo);
        };
        var checkIdCardNo = function checkIdCardNo(idCardNo) {
          var check = /^\d{15}|(\d{17}(\d|x|X))$/.test(idCardNo);
          if (!check) return false;
          if (idCardNo.length === 15) {
            return check15IdCardNo(idCardNo);
          }
          return check18IdCardNo(idCardNo);
        };
        return checkIdCardNo(str);
      },
      'zh-HK': function zhHK(str) {
        // sanitize user input
        str = str.trim();

        // HKID number starts with 1 or 2 letters, followed by 6 digits,
        // then a checksum contained in square / round brackets or nothing
        var regexHKID =
          /^[A-Z]{1,2}[0-9]{6}((\([0-9A]\))|(\[[0-9A]\])|([0-9A]))$/;
        var regexIsDigit = /^[0-9]$/;

        // convert the user input to all uppercase and apply regex
        str = str.toUpperCase();
        if (!regexHKID.test(str)) return false;
        str = str.replace(/\[|\]|\(|\)/g, '');
        if (str.length === 8) str = '3'.concat(str);
        var checkSumVal = 0;
        for (var i = 0; i <= 7; i++) {
          var convertedChar = void 0;
          if (!regexIsDigit.test(str[i]))
            convertedChar = (str[i].charCodeAt(0) - 55) % 11;
          else convertedChar = str[i];
          checkSumVal += convertedChar * (9 - i);
        }
        checkSumVal %= 11;
        var checkSumConverted;
        if (checkSumVal === 0) checkSumConverted = '0';
        else if (checkSumVal === 1) checkSumConverted = 'A';
        else checkSumConverted = String(11 - checkSumVal);
        if (checkSumConverted === str[str.length - 1]) return true;
        return false;
      },
      'zh-TW': function zhTW(str) {
        var ALPHABET_CODES = {
          A: 10,
          B: 11,
          C: 12,
          D: 13,
          E: 14,
          F: 15,
          G: 16,
          H: 17,
          I: 34,
          J: 18,
          K: 19,
          L: 20,
          M: 21,
          N: 22,
          O: 35,
          P: 23,
          Q: 24,
          R: 25,
          S: 26,
          T: 27,
          U: 28,
          V: 29,
          W: 32,
          X: 30,
          Y: 31,
          Z: 33
        };
        var sanitized = str.trim().toUpperCase();
        if (!/^[A-Z][0-9]{9}$/.test(sanitized)) return false;
        return Array.from(sanitized).reduce((sum, number, index) => {
          if (index === 0) {
            var code = ALPHABET_CODES[number];
            return (code % 10) * 9 + Math.floor(code / 10);
          }
          if (index === 9) {
            return (10 - (sum % 10) - Number(number)) % 10 === 0;
          }
          return sum + Number(number) * (9 - index);
        }, 0);
      }
    };
    function isIdentityCard(str, locale) {
      (0, _assertString.default)(str);
      if (locale in validators) {
        return validators[locale](str);
      } else if (locale === 'any') {
        for (var key in validators) {
          // https://github.com/gotwarlost/istanbul/blob/master/ignoring-code-for-coverage.md#ignoring-code-for-coverage-purposes
          // istanbul ignore else
          if (Object.hasOwn(validators, key)) {
            var validator = validators[key];
            if (validator(str)) {
              return true;
            }
          }
        }
        return false;
      }
      throw new Error("Invalid locale '".concat(locale, "'"));
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 2353: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isIn;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _toString = _interopRequireDefault(__webpack_require__(6451));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function _typeof(o) {
      '@babel/helpers - typeof';
      return (
        (_typeof =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? o => typeof o
            : o =>
                o &&
                'function' == typeof Symbol &&
                o.constructor === Symbol &&
                o !== Symbol.prototype
                  ? 'symbol'
                  : typeof o),
        _typeof(o)
      );
    }
    function isIn(str, options) {
      (0, _assertString.default)(str);
      var i;
      if (Object.prototype.toString.call(options) === '[object Array]') {
        var array = [];
        for (i in options) {
          // https://github.com/gotwarlost/istanbul/blob/master/ignoring-code-for-coverage.md#ignoring-code-for-coverage-purposes
          // istanbul ignore else
          if (Object.hasOwn(options, i)) {
            array[i] = (0, _toString.default)(options[i]);
          }
        }
        return array.indexOf(str) >= 0;
      } else if (_typeof(options) === 'object') {
        return Object.hasOwn(options, str);
      } else if (options && typeof options.indexOf === 'function') {
        return options.indexOf(str) >= 0;
      }
      return false;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 7205: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isInt;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var int = /^(?:[-+]?(?:0|[1-9][0-9]*))$/;
    var intLeadingZeroes = /^[-+]?[0-9]+$/;
    function isInt(str, options) {
      (0, _assertString.default)(str);
      options = options || {};

      // Get the regex to use for testing, based on whether
      // leading zeroes are allowed or not.
      var regex =
        options.allow_leading_zeroes === false ? int : intLeadingZeroes;

      // Check min/max/lt/gt
      var minCheckPassed = !Object.hasOwn(options, 'min') || str >= options.min;
      var maxCheckPassed = !Object.hasOwn(options, 'max') || str <= options.max;
      var ltCheckPassed = !Object.hasOwn(options, 'lt') || str < options.lt;
      var gtCheckPassed = !Object.hasOwn(options, 'gt') || str > options.gt;
      return (
        regex.test(str) &&
        minCheckPassed &&
        maxCheckPassed &&
        ltCheckPassed &&
        gtCheckPassed
      );
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 9812: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isJSON;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _merge = _interopRequireDefault(__webpack_require__(9956));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function _typeof(o) {
      '@babel/helpers - typeof';
      return (
        (_typeof =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? o => typeof o
            : o =>
                o &&
                'function' == typeof Symbol &&
                o.constructor === Symbol &&
                o !== Symbol.prototype
                  ? 'symbol'
                  : typeof o),
        _typeof(o)
      );
    }
    var default_json_options = {
      allow_primitives: false
    };
    function isJSON(str, options) {
      (0, _assertString.default)(str);
      try {
        options = (0, _merge.default)(options, default_json_options);
        var primitives = [];
        if (options.allow_primitives) {
          primitives = [null, false, true];
        }
        var obj = JSON.parse(str);
        return primitives.includes(obj) || (!!obj && _typeof(obj) === 'object');
      } catch (e) {
        /* ignore */
      }
      return false;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 8300: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isJWT;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _isBase = _interopRequireDefault(__webpack_require__(7003));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function isJWT(str) {
      (0, _assertString.default)(str);
      var dotSplit = str.split('.');
      var len = dotSplit.length;
      if (len !== 3) {
        return false;
      }
      return dotSplit.reduce(
        (acc, currElem) =>
          acc &&
          (0, _isBase.default)(currElem, {
            urlSafe: true
          }),
        true
      );
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 1607: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isLatLong;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _merge = _interopRequireDefault(__webpack_require__(9956));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var lat = /^\(?[+-]?(90(\.0+)?|[1-8]?\d(\.\d+)?)$/;
    var long = /^\s?[+-]?(180(\.0+)?|1[0-7]\d(\.\d+)?|\d{1,2}(\.\d+)?)\)?$/;
    var latDMS =
      /^(([1-8]?\d)\D+([1-5]?\d|60)\D+([1-5]?\d|60)(\.\d+)?|90\D+0\D+0)\D+[NSns]?$/i;
    var longDMS =
      /^\s*([1-7]?\d{1,2}\D+([1-5]?\d|60)\D+([1-5]?\d|60)(\.\d+)?|180\D+0\D+0)\D+[EWew]?$/i;
    var defaultLatLongOptions = {
      checkDMS: false
    };
    function isLatLong(str, options) {
      (0, _assertString.default)(str);
      options = (0, _merge.default)(options, defaultLatLongOptions);
      if (!str.includes(',')) return false;
      var pair = str.split(',');
      if (
        (pair[0].startsWith('(') && !pair[1].endsWith(')')) ||
        (pair[1].endsWith(')') && !pair[0].startsWith('('))
      )
        return false;
      if (options.checkDMS) {
        return latDMS.test(pair[0]) && longDMS.test(pair[1]);
      }
      return lat.test(pair[0]) && long.test(pair[1]);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 2041: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isLength;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function _typeof(o) {
      '@babel/helpers - typeof';
      return (
        (_typeof =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? o => typeof o
            : o =>
                o &&
                'function' == typeof Symbol &&
                o.constructor === Symbol &&
                o !== Symbol.prototype
                  ? 'symbol'
                  : typeof o),
        _typeof(o)
      );
    }
    /* eslint-disable prefer-rest-params */
    function isLength(str, options) {
      (0, _assertString.default)(str);
      var min;
      var max;
      if (_typeof(options) === 'object') {
        min = options.min || 0;
        max = options.max;
      } else {
        // backwards compatibility: isLength(str, min [, max])
        min = arguments[1] || 0;
        max = arguments[2];
      }
      var presentationSequences = str.match(/(\uFE0F|\uFE0E)/g) || [];
      var surrogatePairs = str.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g) || [];
      var len =
        str.length - presentationSequences.length - surrogatePairs.length;
      return len >= min && (typeof max === 'undefined' || len <= max);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 3109: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isLicensePlate;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var validators = {
      'cs-CZ': function csCZ(str) {
        return /^(([ABCDEFHIJKLMNPRSTUVXYZ]|[0-9])-?){5,8}$/.test(str);
      },
      'de-DE': function deDE(str) {
        return /^((A|AA|AB|AC|AE|AH|AK|AM|AN|AÖ|AP|AS|AT|AU|AW|AZ|B|BA|BB|BC|BE|BF|BH|BI|BK|BL|BM|BN|BO|BÖ|BS|BT|BZ|C|CA|CB|CE|CO|CR|CW|D|DA|DD|DE|DH|DI|DL|DM|DN|DO|DU|DW|DZ|E|EA|EB|ED|EE|EF|EG|EH|EI|EL|EM|EN|ER|ES|EU|EW|F|FB|FD|FF|FG|FI|FL|FN|FO|FR|FS|FT|FÜ|FW|FZ|G|GA|GC|GD|GE|GF|GG|GI|GK|GL|GM|GN|GÖ|GP|GR|GS|GT|GÜ|GV|GW|GZ|H|HA|HB|HC|HD|HE|HF|HG|HH|HI|HK|HL|HM|HN|HO|HP|HR|HS|HU|HV|HX|HY|HZ|IK|IL|IN|IZ|J|JE|JL|K|KA|KB|KC|KE|KF|KG|KH|KI|KK|KL|KM|KN|KO|KR|KS|KT|KU|KW|KY|L|LA|LB|LC|LD|LF|LG|LH|LI|LL|LM|LN|LÖ|LP|LR|LU|M|MA|MB|MC|MD|ME|MG|MH|MI|MK|ML|MM|MN|MO|MQ|MR|MS|MÜ|MW|MY|MZ|N|NB|ND|NE|NF|NH|NI|NK|NM|NÖ|NP|NR|NT|NU|NW|NY|NZ|OA|OB|OC|OD|OE|OF|OG|OH|OK|OL|OP|OS|OZ|P|PA|PB|PE|PF|PI|PL|PM|PN|PR|PS|PW|PZ|R|RA|RC|RD|RE|RG|RH|RI|RL|RM|RN|RO|RP|RS|RT|RU|RV|RW|RZ|S|SB|SC|SE|SG|SI|SK|SL|SM|SN|SO|SP|SR|ST|SU|SW|SY|SZ|TE|TF|TG|TO|TP|TR|TS|TT|TÜ|ÜB|UE|UH|UL|UM|UN|V|VB|VG|VK|VR|VS|W|WA|WB|WE|WF|WI|WK|WL|WM|WN|WO|WR|WS|WT|WÜ|WW|WZ|Z|ZE|ZI|ZP|ZR|ZW|ZZ)[- ]?[A-Z]{1,2}[- ]?\d{1,4}|(ABG|ABI|AIB|AIC|ALF|ALZ|ANA|ANG|ANK|APD|ARN|ART|ASL|ASZ|AUR|AZE|BAD|BAR|BBG|BCH|BED|BER|BGD|BGL|BID|BIN|BIR|BIT|BIW|BKS|BLB|BLK|BNA|BOG|BOH|BOR|BOT|BRA|BRB|BRG|BRK|BRL|BRV|BSB|BSK|BTF|BÜD|BUL|BÜR|BÜS|BÜZ|CAS|CHA|CLP|CLZ|COC|COE|CUX|DAH|DAN|DAU|DBR|DEG|DEL|DGF|DIL|DIN|DIZ|DKB|DLG|DON|DUD|DÜW|EBE|EBN|EBS|ECK|EIC|EIL|EIN|EIS|EMD|EMS|ERB|ERH|ERK|ERZ|ESB|ESW|FDB|FDS|FEU|FFB|FKB|FLÖ|FOR|FRG|FRI|FRW|FTL|FÜS|GAN|GAP|GDB|GEL|GEO|GER|GHA|GHC|GLA|GMN|GNT|GOA|GOH|GRA|GRH|GRI|GRM|GRZ|GTH|GUB|GUN|GVM|HAB|HAL|HAM|HAS|HBN|HBS|HCH|HDH|HDL|HEB|HEF|HEI|HER|HET|HGN|HGW|HHM|HIG|HIP|HMÜ|HOG|HOH|HOL|HOM|HOR|HÖS|HOT|HRO|HSK|HST|HVL|HWI|IGB|ILL|JÜL|KEH|KEL|KEM|KIB|KLE|KLZ|KÖN|KÖT|KÖZ|KRU|KÜN|KUS|KYF|LAN|LAU|LBS|LBZ|LDK|LDS|LEO|LER|LEV|LIB|LIF|LIP|LÖB|LOS|LRO|LSZ|LÜN|LUP|LWL|MAB|MAI|MAK|MAL|MED|MEG|MEI|MEK|MEL|MER|MET|MGH|MGN|MHL|MIL|MKK|MOD|MOL|MON|MOS|MSE|MSH|MSP|MST|MTK|MTL|MÜB|MÜR|MYK|MZG|NAB|NAI|NAU|NDH|NEA|NEB|NEC|NEN|NES|NEW|NMB|NMS|NOH|NOL|NOM|NOR|NVP|NWM|OAL|OBB|OBG|OCH|OHA|ÖHR|OHV|OHZ|OPR|OSL|OVI|OVL|OVP|PAF|PAN|PAR|PCH|PEG|PIR|PLÖ|PRÜ|QFT|QLB|RDG|REG|REH|REI|RID|RIE|ROD|ROF|ROK|ROL|ROS|ROT|ROW|RSL|RÜD|RÜG|SAB|SAD|SAN|SAW|SBG|SBK|SCZ|SDH|SDL|SDT|SEB|SEE|SEF|SEL|SFB|SFT|SGH|SHA|SHG|SHK|SHL|SIG|SIM|SLE|SLF|SLK|SLN|SLS|SLÜ|SLZ|SMÜ|SOB|SOG|SOK|SÖM|SON|SPB|SPN|SRB|SRO|STA|STB|STD|STE|STL|SUL|SÜW|SWA|SZB|TBB|TDO|TET|TIR|TÖL|TUT|UEM|UER|UFF|USI|VAI|VEC|VER|VIB|VIE|VIT|VOH|WAF|WAK|WAN|WAR|WAT|WBS|WDA|WEL|WEN|WER|WES|WHV|WIL|WIS|WIT|WIZ|WLG|WMS|WND|WOB|WOH|WOL|WOR|WOS|WRN|WSF|WST|WSW|WTL|WTM|WUG|WÜM|WUN|WUR|WZL|ZEL|ZIG)[- ]?(([A-Z][- ]?\d{1,4})|([A-Z]{2}[- ]?\d{1,3})))[- ]?(E|H)?$/.test(
          str
        );
      },
      'de-LI': function deLI(str) {
        return /^FL[- ]?\d{1,5}[UZ]?$/.test(str);
      },
      'en-IN': function enIN(str) {
        return /^[A-Z]{2}[ -]?[0-9]{1,2}(?:[ -]?[A-Z])(?:[ -]?[A-Z]*)?[ -]?[0-9]{4}$/.test(
          str
        );
      },
      'es-AR': function esAR(str) {
        return /^(([A-Z]{2} ?[0-9]{3} ?[A-Z]{2})|([A-Z]{3} ?[0-9]{3}))$/.test(
          str
        );
      },
      'fi-FI': function fiFI(str) {
        return /^(?=.{4,7})(([A-Z]{1,3}|[0-9]{1,3})[\s-]?([A-Z]{1,3}|[0-9]{1,5}))$/.test(
          str
        );
      },
      'hu-HU': function huHU(str) {
        return /^((((?!AAA)(([A-NPRSTVZWXY]{1})([A-PR-Z]{1})([A-HJ-NPR-Z]))|(A[ABC]I)|A[ABC]O|A[A-W]Q|BPI|BPO|UCO|UDO|XAO)-(?!000)\d{3})|(M\d{6})|((CK|DT|CD|HC|H[ABEFIKLMNPRSTVX]|MA|OT|R[A-Z]) \d{2}-\d{2})|(CD \d{3}-\d{3})|(C-(C|X) \d{4})|(X-(A|B|C) \d{4})|(([EPVZ]-\d{5}))|(S A[A-Z]{2} \d{2})|(SP \d{2}-\d{2}))$/.test(
          str
        );
      },
      'pt-BR': function ptBR(str) {
        return /^[A-Z]{3}[ -]?[0-9][A-Z][0-9]{2}|[A-Z]{3}[ -]?[0-9]{4}$/.test(
          str
        );
      },
      'pt-PT': function ptPT(str) {
        return /^([A-Z]{2}|[0-9]{2})[ -·]?([A-Z]{2}|[0-9]{2})[ -·]?([A-Z]{2}|[0-9]{2})$/.test(
          str
        );
      },
      'sq-AL': function sqAL(str) {
        return /^[A-Z]{2}[- ]?((\d{3}[- ]?(([A-Z]{2})|T))|(R[- ]?\d{3}))$/.test(
          str
        );
      },
      'sv-SE': function svSE(str) {
        return /^[A-HJ-PR-UW-Z]{3} ?[\d]{2}[A-HJ-PR-UW-Z1-9]$|(^[A-ZÅÄÖ ]{2,7}$)/.test(
          str.trim()
        );
      },
      'en-PK': function enPK(str) {
        return /(^[A-Z]{2}((\s|-){0,1})[0-9]{3,4}((\s|-)[0-9]{2}){0,1}$)|(^[A-Z]{3}((\s|-){0,1})[0-9]{3,4}((\s|-)[0-9]{2}){0,1}$)|(^[A-Z]{4}((\s|-){0,1})[0-9]{3,4}((\s|-)[0-9]{2}){0,1}$)|(^[A-Z]((\s|-){0,1})[0-9]{4}((\s|-)[0-9]{2}){0,1}$)/.test(
          str.trim()
        );
      }
    };
    function isLicensePlate(str, locale) {
      (0, _assertString.default)(str);
      if (locale in validators) {
        return validators[locale](str);
      } else if (locale === 'any') {
        for (var key in validators) {
          /* eslint guard-for-in: 0 */
          var validator = validators[key];
          if (validator(str)) {
            return true;
          }
        }
        return false;
      }
      throw new Error("Invalid locale '".concat(locale, "'"));
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 4513: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isLocale;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    /*
  = 3ALPHA              ; selected ISO 639 codes
    *2("-" 3ALPHA)      ; permanently reserved
 */
    var extlang = '([A-Za-z]{3}(-[A-Za-z]{3}){0,2})';

    /*
  = 2*3ALPHA            ; shortest ISO 639 code
    ["-" extlang]       ; sometimes followed by
                        ; extended language subtags
  / 4ALPHA              ; or reserved for future use
  / 5*8ALPHA            ; or registered language subtag
 */
    var language = '(([a-zA-Z]{2,3}(-'.concat(extlang, ')?)|([a-zA-Z]{5,8}))');

    /*
  = 4ALPHA              ; ISO 15924 code
 */
    var script = '([A-Za-z]{4})';

    /*
  = 2ALPHA              ; ISO 3166-1 code
  / 3DIGIT              ; UN M.49 code
 */
    var region = '([A-Za-z]{2}|\\d{3})';

    /*
  = 5*8alphanum         ; registered variants
  / (DIGIT 3alphanum)
 */
    var variant = '([A-Za-z0-9]{5,8}|(\\d[A-Z-a-z0-9]{3}))';

    /*
  = DIGIT               ; 0 - 9
  / %x41-57             ; A - W
  / %x59-5A             ; Y - Z
  / %x61-77             ; a - w
  / %x79-7A             ; y - z
 */
    var singleton = '(\\d|[A-W]|[Y-Z]|[a-w]|[y-z])';

    /*
  = singleton 1*("-" (2*8alphanum))
                        ; Single alphanumerics
                        ; "x" reserved for private use
 */
    var extension = '('.concat(singleton, '(-[A-Za-z0-9]{2,8})+)');

    /*
  = "x" 1*("-" (1*8alphanum))
 */
    var privateuse = '(x(-[A-Za-z0-9]{1,8})+)';

    // irregular tags do not match the 'langtag' production and would not
    // otherwise be considered 'well-formed'. These tags are all valid, but
    // most are deprecated in favor of more modern subtags or subtag combination

    var irregular =
      '((en-GB-oed)|(i-ami)|(i-bnn)|(i-default)|(i-enochian)|' +
      '(i-hak)|(i-klingon)|(i-lux)|(i-mingo)|(i-navajo)|(i-pwn)|(i-tao)|' +
      '(i-tay)|(i-tsu)|(sgn-BE-FR)|(sgn-BE-NL)|(sgn-CH-DE))';

    // regular tags match the 'langtag' production, but their subtags are not
    // extended language or variant subtags: their meaning is defined by
    // their registration and all of these are deprecated in favor of a more
    // modern subtag or sequence of subtags

    var regular =
      '((art-lojban)|(cel-gaulish)|(no-bok)|(no-nyn)|(zh-guoyu)|' +
      '(zh-hakka)|(zh-min)|(zh-min-nan)|(zh-xiang))';

    /*
  = irregular           ; non-redundant tags registered
  / regular             ; during the RFC 3066 era

 */
    var grandfathered = '('.concat(irregular, '|').concat(regular, ')');

    /*
  RFC 5646 defines delimitation of subtags via a hyphen:

      "Subtag" refers to a specific section of a tag, delimited by a
      hyphen, such as the subtags 'zh', 'Hant', and 'CN' in the tag "zh-
      Hant-CN".  Examples of subtags in this document are enclosed in
      single quotes ('Hant')

  However, we need to add "_" to maintain the existing behaviour.
 */
    var delimiter = '(-|_)';

    /*
  = language
    ["-" script]
    ["-" region]
    *("-" variant)
    *("-" extension)
    ["-" privateuse]
 */
    var langtag = ''
      .concat(language, '(')
      .concat(delimiter)
      .concat(script, ')?(')
      .concat(delimiter)
      .concat(region, ')?(')
      .concat(delimiter)
      .concat(variant, ')*(')
      .concat(delimiter)
      .concat(extension, ')*(')
      .concat(delimiter)
      .concat(privateuse, ')?');

    /*
  Regex implementation based on BCP RFC 5646
  Tags for Identifying Languages
  https://www.rfc-editor.org/rfc/rfc5646.html
 */
    var languageTagRegex = new RegExp(
      '(^'
        .concat(privateuse, '$)|(^')
        .concat(grandfathered, '$)|(^')
        .concat(langtag, '$)')
    );
    function isLocale(str) {
      (0, _assertString.default)(str);
      return languageTagRegex.test(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 6509: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isLowercase;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function isLowercase(str) {
      (0, _assertString.default)(str);
      return str === str.toLowerCase();
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 5912: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isLuhnNumber;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function isLuhnNumber(str) {
      (0, _assertString.default)(str);
      var sanitized = str.replace(/[- ]+/g, '');
      var sum = 0;
      var digit;
      var tmpNum;
      var shouldDouble;
      for (var i = sanitized.length - 1; i >= 0; i--) {
        digit = sanitized.substring(i, i + 1);
        tmpNum = parseInt(digit, 10);
        if (shouldDouble) {
          tmpNum *= 2;
          if (tmpNum >= 10) {
            sum += (tmpNum % 10) + 1;
          } else {
            sum += tmpNum;
          }
        } else {
          sum += tmpNum;
        }
        shouldDouble = !shouldDouble;
      }
      return !!(sum % 10 === 0 ? sanitized : false);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 7912: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isMACAddress;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var macAddress48 =
      /^(?:[0-9a-fA-F]{2}([-:\s]))([0-9a-fA-F]{2}\1){4}([0-9a-fA-F]{2})$/;
    var macAddress48NoSeparators = /^([0-9a-fA-F]){12}$/;
    var macAddress48WithDots = /^([0-9a-fA-F]{4}\.){2}([0-9a-fA-F]{4})$/;
    var macAddress64 =
      /^(?:[0-9a-fA-F]{2}([-:\s]))([0-9a-fA-F]{2}\1){6}([0-9a-fA-F]{2})$/;
    var macAddress64NoSeparators = /^([0-9a-fA-F]){16}$/;
    var macAddress64WithDots = /^([0-9a-fA-F]{4}\.){3}([0-9a-fA-F]{4})$/;
    function isMACAddress(str, options) {
      (0, _assertString.default)(str);
      if (options !== null && options !== void 0 && options.eui) {
        options.eui = String(options.eui);
      }
      /**
       * @deprecated `no_colons` TODO: remove it in the next major
       */
      if (
        (options !== null && options !== void 0 && options.no_colons) ||
        (options !== null && options !== void 0 && options.no_separators)
      ) {
        if (options.eui === '48') {
          return macAddress48NoSeparators.test(str);
        }
        if (options.eui === '64') {
          return macAddress64NoSeparators.test(str);
        }
        return (
          macAddress48NoSeparators.test(str) ||
          macAddress64NoSeparators.test(str)
        );
      }
      if (
        (options === null || options === void 0 ? void 0 : options.eui) === '48'
      ) {
        return macAddress48.test(str) || macAddress48WithDots.test(str);
      }
      if (
        (options === null || options === void 0 ? void 0 : options.eui) === '64'
      ) {
        return macAddress64.test(str) || macAddress64WithDots.test(str);
      }
      return (
        isMACAddress(str, {
          eui: '48'
        }) ||
        isMACAddress(str, {
          eui: '64'
        })
      );
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 3084: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isMD5;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var md5 = /^[a-f0-9]{32}$/;
    function isMD5(str) {
      (0, _assertString.default)(str);
      return md5.test(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 8693: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isMagnetURI;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var magnetURIComponent =
      /(?:^magnet:\?|[^?&]&)xt(?:\.1)?=urn:(?:(?:aich|bitprint|btih|ed2k|ed2khash|kzhash|md5|sha1|tree:tiger):[a-z0-9]{32}(?:[a-z0-9]{8})?|btmh:1220[a-z0-9]{64})(?:$|&)/i;
    function isMagnetURI(url) {
      (0, _assertString.default)(url);
      if (url.indexOf('magnet:?') !== 0) {
        return false;
      }
      return magnetURIComponent.test(url);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 4149: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isMailtoURI;
    var _trim = _interopRequireDefault(__webpack_require__(3495));
    var _isEmail = _interopRequireDefault(__webpack_require__(1324));
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function _slicedToArray(arr, i) {
      return (
        _arrayWithHoles(arr) ||
        _iterableToArrayLimit(arr, i) ||
        _unsupportedIterableToArray(arr, i) ||
        _nonIterableRest()
      );
    }
    function _nonIterableRest() {
      throw new TypeError(
        'Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
      );
    }
    function _iterableToArrayLimit(r, l) {
      var t =
        null == r
          ? null
          : ('undefined' != typeof Symbol && r[Symbol.iterator]) ||
            r['@@iterator'];
      if (null != t) {
        var e,
          n,
          i,
          u,
          a = [],
          f = !0,
          o = !1;
        try {
          if (((i = (t = t.call(r)).next), 0 === l)) {
            if (Object(t) !== t) return;
            f = !1;
          } else
            for (
              ;
              !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l);
              f = !0
            );
        } catch (r) {
          (o = !0), (n = r);
        } finally {
          try {
            if (!f && null != t.return && ((u = t.return()), Object(u) !== u))
              return;
          } finally {
            if (o) throw n;
          }
        }
        return a;
      }
    }
    function _arrayWithHoles(arr) {
      if (Array.isArray(arr)) return arr;
    }
    function _createForOfIteratorHelper(o, allowArrayLike) {
      var it =
        (typeof Symbol !== 'undefined' && o[Symbol.iterator]) ||
        o['@@iterator'];
      if (!it) {
        if (
          Array.isArray(o) ||
          (it = _unsupportedIterableToArray(o)) ||
          (allowArrayLike && o && typeof o.length === 'number')
        ) {
          if (it) o = it;
          var i = 0;
          var F = function F() {};
          return {
            s: F,
            n: function n() {
              if (i >= o.length) return { done: true };
              return { done: false, value: o[i++] };
            },
            e: function e(_e) {
              throw _e;
            },
            f: F
          };
        }
        throw new TypeError(
          'Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
        );
      }
      var normalCompletion = true,
        didErr = false,
        err;
      return {
        s: function s() {
          it = it.call(o);
        },
        n: function n() {
          var step = it.next();
          normalCompletion = step.done;
          return step;
        },
        e: function e(_e2) {
          didErr = true;
          err = _e2;
        },
        f: function f() {
          try {
            if (!normalCompletion && it.return != null) it.return();
          } finally {
            if (didErr) throw err;
          }
        }
      };
    }
    function _unsupportedIterableToArray(o, minLen) {
      if (!o) return;
      if (typeof o === 'string') return _arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === 'Object' && o.constructor) n = o.constructor.name;
      if (n === 'Map' || n === 'Set') return Array.from(o);
      if (
        n === 'Arguments' ||
        /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)
      )
        return _arrayLikeToArray(o, minLen);
    }
    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length) len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
      return arr2;
    }
    function parseMailtoQueryString(queryString) {
      var allowedParams = new Set(['subject', 'body', 'cc', 'bcc']),
        query = {
          cc: '',
          bcc: ''
        };
      var isParseFailed = false;
      var queryParams = queryString.split('&');
      if (queryParams.length > 4) {
        return false;
      }
      var _iterator = _createForOfIteratorHelper(queryParams),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          var q = _step.value;
          var _q$split = q.split('='),
            _q$split2 = _slicedToArray(_q$split, 2),
            key = _q$split2[0],
            value = _q$split2[1];

          // checked for invalid and duplicated query params
          if (key && !allowedParams.has(key)) {
            isParseFailed = true;
            break;
          }
          if (value && (key === 'cc' || key === 'bcc')) {
            query[key] = value;
          }
          if (key) {
            allowedParams.delete(key);
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      return isParseFailed ? false : query;
    }
    function isMailtoURI(url, options) {
      (0, _assertString.default)(url);
      if (url.indexOf('mailto:') !== 0) {
        return false;
      }
      var _url$replace$split = url.replace('mailto:', '').split('?'),
        _url$replace$split2 = _slicedToArray(_url$replace$split, 2),
        to = _url$replace$split2[0],
        _url$replace$split2$ = _url$replace$split2[1],
        queryString =
          _url$replace$split2$ === void 0 ? '' : _url$replace$split2$;
      if (!to && !queryString) {
        return true;
      }
      var query = parseMailtoQueryString(queryString);
      if (!query) {
        return false;
      }
      return ''
        .concat(to, ',')
        .concat(query.cc, ',')
        .concat(query.bcc)
        .split(',')
        .every(email => {
          email = (0, _trim.default)(email, ' ');
          if (email) {
            return (0, _isEmail.default)(email, options);
          }
          return true;
        });
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 6914: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isMimeType;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    /*
  Checks if the provided string matches to a correct Media type format (MIME type)

  This function only checks is the string format follows the
  etablished rules by the according RFC specifications.
  This function supports 'charset' in textual media types
  (https://tools.ietf.org/html/rfc6657).

  This function does not check against all the media types listed
  by the IANA (https://www.iana.org/assignments/media-types/media-types.xhtml)
  because of lightness purposes : it would require to include
  all these MIME types in this librairy, which would weigh it
  significantly. This kind of effort maybe is not worth for the use that
  this function has in this entire librairy.

  More informations in the RFC specifications :
  - https://tools.ietf.org/html/rfc2045
  - https://tools.ietf.org/html/rfc2046
  - https://tools.ietf.org/html/rfc7231#section-3.1.1.1
  - https://tools.ietf.org/html/rfc7231#section-3.1.1.5
*/

    // Match simple MIME types
    // NB :
    //   Subtype length must not exceed 100 characters.
    //   This rule does not comply to the RFC specs (what is the max length ?).
    var mimeTypeSimple =
      /^(application|audio|font|image|message|model|multipart|text|video)\/[a-zA-Z0-9.\-+_]{1,100}$/i; // eslint-disable-line max-len

    // Handle "charset" in "text/*"
    var mimeTypeText =
      /^text\/[a-zA-Z0-9.\-+]{1,100};\s?charset=("[a-zA-Z0-9.\-+\s]{0,70}"|[a-zA-Z0-9.\-+]{0,70})(\s?\([a-zA-Z0-9.\-+\s]{1,20}\))?$/i; // eslint-disable-line max-len

    // Handle "boundary" in "multipart/*"
    var mimeTypeMultipart =
      /^multipart\/[a-zA-Z0-9.\-+]{1,100}(;\s?(boundary|charset)=("[a-zA-Z0-9.\-+\s]{0,70}"|[a-zA-Z0-9.\-+]{0,70})(\s?\([a-zA-Z0-9.\-+\s]{1,20}\))?){0,2}$/i; // eslint-disable-line max-len

    function isMimeType(str) {
      (0, _assertString.default)(str);
      return (
        mimeTypeSimple.test(str) ||
        mimeTypeText.test(str) ||
        mimeTypeMultipart.test(str)
      );
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 8648: /***/ (__unused_webpack_module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isMobilePhone;
    exports.locales = void 0;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    /* eslint-disable max-len */
    var phones = {
      'am-AM': /^(\+?374|0)(33|4[134]|55|77|88|9[13-689])\d{6}$/,
      'ar-AE': /^((\+?971)|0)?5[024568]\d{7}$/,
      'ar-BH': /^(\+?973)?(3|6)\d{7}$/,
      'ar-DZ': /^(\+?213|0)(5|6|7)\d{8}$/,
      'ar-LB': /^(\+?961)?((3|81)\d{6}|7\d{7})$/,
      'ar-EG': /^((\+?20)|0)?1[0125]\d{8}$/,
      'ar-IQ': /^(\+?964|0)?7[0-9]\d{8}$/,
      'ar-JO': /^(\+?962|0)?7[789]\d{7}$/,
      'ar-KW': /^(\+?965)([569]\d{7}|41\d{6})$/,
      'ar-LY': /^((\+?218)|0)?(9[1-6]\d{7}|[1-8]\d{7,9})$/,
      'ar-MA': /^(?:(?:\+|00)212|0)[5-7]\d{8}$/,
      'ar-OM': /^((\+|00)968)?(9[1-9])\d{6}$/,
      'ar-PS': /^(\+?970|0)5[6|9](\d{7})$/,
      'ar-SA': /^(!?(\+?966)|0)?5\d{8}$/,
      'ar-SD': /^((\+?249)|0)?(9[012369]|1[012])\d{7}$/,
      'ar-SY': /^(!?(\+?963)|0)?9\d{8}$/,
      'ar-TN': /^(\+?216)?[2459]\d{7}$/,
      'az-AZ': /^(\+994|0)(10|5[015]|7[07]|99)\d{7}$/,
      'bs-BA': /^((((\+|00)3876)|06))((([0-3]|[5-6])\d{6})|(4\d{7}))$/,
      'be-BY': /^(\+?375)?(24|25|29|33|44)\d{7}$/,
      'bg-BG': /^(\+?359|0)?8[789]\d{7}$/,
      'bn-BD': /^(\+?880|0)1[13456789][0-9]{8}$/,
      'ca-AD': /^(\+376)?[346]\d{5}$/,
      'cs-CZ': /^(\+?420)? ?[1-9][0-9]{2} ?[0-9]{3} ?[0-9]{3}$/,
      'da-DK': /^(\+?45)?\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/,
      'de-DE': /^((\+49|0)1)(5[0-25-9]\d|6([23]|0\d?)|7([0-57-9]|6\d))\d{7,9}$/,
      'de-AT': /^(\+43|0)\d{1,4}\d{3,12}$/,
      'de-CH': /^(\+41|0)([1-9])\d{1,9}$/,
      'de-LU': /^(\+352)?((6\d1)\d{6})$/,
      'dv-MV': /^(\+?960)?(7[2-9]|9[1-9])\d{5}$/,
      'el-GR': /^(\+?30|0)?6(8[5-9]|9(?![26])[0-9])\d{7}$/,
      'el-CY': /^(\+?357?)?(9(9|6)\d{6})$/,
      'en-AI':
        /^(\+?1|0)264(?:2(35|92)|4(?:6[1-2]|76|97)|5(?:3[6-9]|8[1-4])|7(?:2(4|9)|72))\d{4}$/,
      'en-AU': /^(\+?61|0)4\d{8}$/,
      'en-AG':
        /^(?:\+1|1)268(?:464|7(?:1[3-9]|[28]\d|3[0246]|64|7[0-689]))\d{4}$/,
      'en-BM': /^(\+?1)?441(((3|7)\d{6}$)|(5[0-3][0-9]\d{4}$)|(59\d{5}$))/,
      'en-BS': /^(\+?1[-\s]?|0)?\(?242\)?[-\s]?\d{3}[-\s]?\d{4}$/,
      'en-GB': /^(\+?44|0)7\d{9}$/,
      'en-GG': /^(\+?44|0)1481\d{6}$/,
      'en-GH': /^(\+233|0)(20|50|24|54|27|57|26|56|23|28|55|59)\d{7}$/,
      'en-GY': /^(\+592|0)6\d{6}$/,
      'en-HK': /^(\+?852[-\s]?)?[456789]\d{3}[-\s]?\d{4}$/,
      'en-MO': /^(\+?853[-\s]?)?[6]\d{3}[-\s]?\d{4}$/,
      'en-IE': /^(\+?353|0)8[356789]\d{7}$/,
      'en-IN': /^(\+?91|0)?[6789]\d{9}$/,
      'en-JM': /^(\+?876)?\d{7}$/,
      'en-KE': /^(\+?254|0)(7|1)\d{8}$/,
      'fr-CF': /^(\+?236| ?)(70|75|77|72|21|22)\d{6}$/,
      'en-SS': /^(\+?211|0)(9[1257])\d{7}$/,
      'en-KI': /^((\+686|686)?)?( )?((6|7)(2|3|8)[0-9]{6})$/,
      'en-KN': /^(?:\+1|1)869(?:46\d|48[89]|55[6-8]|66\d|76[02-7])\d{4}$/,
      'en-LS': /^(\+?266)(22|28|57|58|59|27|52)\d{6}$/,
      'en-MT': /^(\+?356|0)?(99|79|77|21|27|22|25)[0-9]{6}$/,
      'en-MU': /^(\+?230|0)?\d{8}$/,
      'en-MW':
        /^(\+?265|0)(((77|88|31|99|98|21)\d{7})|(((111)|1)\d{6})|(32000\d{4}))$/,
      'en-NA': /^(\+?264|0)(6|8)\d{7}$/,
      'en-NG': /^(\+?234|0)?[789]\d{9}$/,
      'en-NZ': /^(\+?64|0)[28]\d{7,9}$/,
      'en-PG': /^(\+?675|0)?(7\d|8[18])\d{6}$/,
      'en-PK': /^((00|\+)?92|0)3[0-6]\d{8}$/,
      'en-PH': /^(09|\+639)\d{9}$/,
      'en-RW': /^(\+?250|0)?[7]\d{8}$/,
      'en-SG': /^(\+65)?[3689]\d{7}$/,
      'en-SL': /^(\+?232|0)\d{8}$/,
      'en-TZ': /^(\+?255|0)?[67]\d{8}$/,
      'en-UG': /^(\+?256|0)?[7]\d{8}$/,
      'en-US':
        /^((\+1|1)?( |-)?)?(\([2-9][0-9]{2}\)|[2-9][0-9]{2})( |-)?([2-9][0-9]{2}( |-)?[0-9]{4})$/,
      'en-ZA': /^(\+?27|0)\d{9}$/,
      'en-ZM': /^(\+?26)?09[567]\d{7}$/,
      'en-ZW': /^(\+263)[0-9]{9}$/,
      'en-BW': /^(\+?267)?(7[1-8]{1})\d{6}$/,
      'es-AR': /^\+?549(11|[2368]\d)\d{8}$/,
      'es-BO': /^(\+?591)?(6|7)\d{7}$/,
      'es-CO': /^(\+?57)?3(0(0|1|2|4|5)|1\d|2[0-4]|5(0|1))\d{7}$/,
      'es-CL': /^(\+?56|0)[2-9]\d{1}\d{7}$/,
      'es-CR': /^(\+506)?[2-8]\d{7}$/,
      'es-CU': /^(\+53|0053)?5\d{7}$/,
      'es-DO': /^(\+?1)?8[024]9\d{7}$/,
      'es-HN': /^(\+?504)?[9|8|3|2]\d{7}$/,
      'es-EC': /^(\+?593|0)([2-7]|9[2-9])\d{7}$/,
      'es-ES': /^(\+?34)?[6|7]\d{8}$/,
      'es-PE': /^(\+?51)?9\d{8}$/,
      'es-MX': /^(\+?52)?(1|01)?\d{10,11}$/,
      'es-NI': /^(\+?505)\d{7,8}$/,
      'es-PA': /^(\+?507)\d{7,8}$/,
      'es-PY': /^(\+?595|0)9[9876]\d{7}$/,
      'es-SV': /^(\+?503)?[67]\d{7}$/,
      'es-UY': /^(\+598|0)9[1-9][\d]{6}$/,
      'es-VE': /^(\+?58)?(2|4)\d{9}$/,
      'et-EE': /^(\+?372)?\s?(5|8[1-4])\s?([0-9]\s?){6,7}$/,
      'fa-IR': /^(\+?98[-\s]?|0)9[0-39]\d[-\s]?\d{3}[-\s]?\d{4}$/,
      'fi-FI': /^(\+?358|0)\s?(4[0-6]|50)\s?(\d\s?){4,8}$/,
      'fj-FJ': /^(\+?679)?\s?\d{3}\s?\d{4}$/,
      'fo-FO': /^(\+?298)?\s?\d{2}\s?\d{2}\s?\d{2}$/,
      'fr-BF': /^(\+226|0)[67]\d{7}$/,
      'fr-BJ': /^(\+229)\d{8}$/,
      'fr-CD': /^(\+?243|0)?(8|9)\d{8}$/,
      'fr-CM': /^(\+?237)6[0-9]{8}$/,
      'fr-FR': /^(\+?33|0)[67]\d{8}$/,
      'fr-GF': /^(\+?594|0|00594)[67]\d{8}$/,
      'fr-GP': /^(\+?590|0|00590)[67]\d{8}$/,
      'fr-MQ': /^(\+?596|0|00596)[67]\d{8}$/,
      'fr-PF': /^(\+?689)?8[789]\d{6}$/,
      'fr-RE': /^(\+?262|0|00262)[67]\d{8}$/,
      'fr-WF': /^(\+681)?\d{6}$/,
      'he-IL': /^(\+972|0)([23489]|5[012345689]|77)[1-9]\d{6}$/,
      'hu-HU': /^(\+?36|06)(20|30|31|50|70)\d{7}$/,
      'id-ID':
        /^(\+?62|0)8(1[123456789]|2[1238]|3[1238]|5[12356789]|7[78]|9[56789]|8[123456789])([\s?|\d]{5,11})$/,
      'ir-IR': /^(\+98|0)?9\d{9}$/,
      'it-IT': /^(\+?39)?\s?3\d{2} ?\d{6,7}$/,
      'it-SM': /^((\+378)|(0549)|(\+390549)|(\+3780549))?6\d{5,9}$/,
      'ja-JP': /^(\+81[ -]?(\(0\))?|0)[6789]0[ -]?\d{4}[ -]?\d{4}$/,
      'ka-GE': /^(\+?995)?(79\d{7}|5\d{8})$/,
      'kk-KZ': /^(\+?7|8)?7\d{9}$/,
      'kl-GL': /^(\+?299)?\s?\d{2}\s?\d{2}\s?\d{2}$/,
      'ko-KR': /^((\+?82)[ -]?)?0?1([0|1|6|7|8|9]{1})[ -]?\d{3,4}[ -]?\d{4}$/,
      'ky-KG': /^(\+?7\s?\+?7|0)\s?\d{2}\s?\d{3}\s?\d{4}$/,
      'lt-LT': /^(\+370|8)\d{8}$/,
      'lv-LV': /^(\+?371)2\d{7}$/,
      'mg-MG': /^((\+?261|0)(2|3)\d)?\d{7}$/,
      'mn-MN': /^(\+|00|011)?976(77|81|88|91|94|95|96|99)\d{6}$/,
      'my-MM':
        /^(\+?959|09|9)(2[5-7]|3[1-2]|4[0-5]|6[6-9]|7[5-9]|9[6-9])[0-9]{7}$/,
      'ms-MY': /^(\+?60|0)1(([0145](-|\s)?\d{7,8})|([236-9](-|\s)?\d{7}))$/,
      'mz-MZ': /^(\+?258)?8[234567]\d{7}$/,
      'nb-NO': /^(\+?47)?[49]\d{7}$/,
      'ne-NP': /^(\+?977)?9[78]\d{8}$/,
      'nl-BE': /^(\+?32|0)4\d{8}$/,
      'nl-NL': /^(((\+|00)?31\(0\))|((\+|00)?31)|0)6{1}\d{8}$/,
      'nl-AW': /^(\+)?297(56|59|64|73|74|99)\d{5}$/,
      'nn-NO': /^(\+?47)?[49]\d{7}$/,
      'pl-PL': /^(\+?48)? ?([5-8]\d|45) ?\d{3} ?\d{2} ?\d{2}$/,
      'pt-BR':
        /^((\+?55 ?[1-9]{2} ?)|(\+?55 ?\([1-9]{2}\) ?)|(0[1-9]{2} ?)|(\([1-9]{2}\) ?)|([1-9]{2} ?))((\d{4}-?\d{4})|(9[1-9]{1}\d{3}-?\d{4}))$/,
      'pt-PT': /^(\+?351)?9[1236]\d{7}$/,
      'pt-AO': /^(\+244)\d{9}$/,
      'ro-MD': /^(\+?373|0)((6(0|1|2|6|7|8|9))|(7(6|7|8|9)))\d{6}$/,
      'ro-RO': /^(\+?40|0)\s?7\d{2}(\/|\s|\.|-)?\d{3}(\s|\.|-)?\d{3}$/,
      'ru-RU': /^(\+?7|8)?9\d{9}$/,
      'si-LK': /^(?:0|94|\+94)?(7(0|1|2|4|5|6|7|8)( |-)?)\d{7}$/,
      'sl-SI':
        /^(\+386\s?|0)(\d{1}\s?\d{3}\s?\d{2}\s?\d{2}|\d{2}\s?\d{3}\s?\d{3})$/,
      'sk-SK': /^(\+?421)? ?[1-9][0-9]{2} ?[0-9]{3} ?[0-9]{3}$/,
      'so-SO': /^(\+?252|0)((6[0-9])\d{7}|(7[1-9])\d{7})$/,
      'sq-AL': /^(\+355|0)6[789]\d{6}$/,
      'sr-RS': /^(\+3816|06)[- \d]{5,9}$/,
      'sv-SE': /^(\+?46|0)[\s-]?7[\s-]?[02369]([\s-]?\d){7}$/,
      'tg-TJ': /^(\+?992)?[5][5]\d{7}$/,
      'th-TH': /^(\+66|66|0)\d{9}$/,
      'tr-TR': /^(\+?90|0)?5\d{9}$/,
      'tk-TM': /^(\+993|993|8)\d{8}$/,
      'uk-UA': /^(\+?38|8)?0\d{9}$/,
      'uz-UZ': /^(\+?998)?(6[125-79]|7[1-69]|88|9\d)\d{7}$/,
      'vi-VN':
        /^((\+?84)|0)((3([2-9]))|(5([25689]))|(7([0|6-9]))|(8([1-9]))|(9([0-9])))([0-9]{7})$/,
      'zh-CN': /^((\+|00)86)?(1[3-9]|9[28])\d{9}$/,
      'zh-TW': /^(\+?886-?|0)?9\d{8}$/,
      'dz-BT': /^(\+?975|0)?(17|16|77|02)\d{6}$/,
      'ar-YE': /^(((\+|00)9677|0?7)[0137]\d{7}|((\+|00)967|0)[1-7]\d{6})$/,
      'ar-EH': /^(\+?212|0)[\s-]?(5288|5289)[\s-]?\d{5}$/,
      'fa-AF': /^(\+93|0)?(2{1}[0-8]{1}|[3-5]{1}[0-4]{1})(\d{7})$/
    };
    /* eslint-enable max-len */

    // aliases
    phones['en-CA'] = phones['en-US'];
    phones['fr-CA'] = phones['en-CA'];
    phones['fr-BE'] = phones['nl-BE'];
    phones['zh-HK'] = phones['en-HK'];
    phones['zh-MO'] = phones['en-MO'];
    phones['ga-IE'] = phones['en-IE'];
    phones['fr-CH'] = phones['de-CH'];
    phones['it-CH'] = phones['fr-CH'];
    function isMobilePhone(str, locale, options) {
      (0, _assertString.default)(str);
      if (options && options.strictMode && !str.startsWith('+')) {
        return false;
      }
      if (Array.isArray(locale)) {
        return locale.some(key => {
          // https://github.com/gotwarlost/istanbul/blob/master/ignoring-code-for-coverage.md#ignoring-code-for-coverage-purposes
          // istanbul ignore else
          if (Object.hasOwn(phones, key)) {
            var phone = phones[key];
            if (phone.test(str)) {
              return true;
            }
          }
          return false;
        });
      } else if (locale in phones) {
        return phones[locale].test(str);
        // alias falsey locale as 'any'
      } else if (!locale || locale === 'any') {
        for (var key in phones) {
          // istanbul ignore else
          if (Object.hasOwn(phones, key)) {
            var phone = phones[key];
            if (phone.test(str)) {
              return true;
            }
          }
        }
        return false;
      }
      throw new Error("Invalid locale '".concat(locale, "'"));
    }
    var locales = (exports.locales = Object.keys(phones));

    /***/
  },

  /***/ 1296: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isMongoId;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _isHexadecimal = _interopRequireDefault(__webpack_require__(6262));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function isMongoId(str) {
      (0, _assertString.default)(str);
      return (0, _isHexadecimal.default)(str) && str.length === 24;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 2672: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isMultibyte;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    /* eslint-disable no-control-regex */
    var multibyte = /[^\x00-\x7F]/;
    /* eslint-enable no-control-regex */

    function isMultibyte(str) {
      (0, _assertString.default)(str);
      return multibyte.test(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 3769: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isNumeric;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _alpha = __webpack_require__(2644);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var numericNoSymbols = /^[0-9]+$/;
    function isNumeric(str, options) {
      (0, _assertString.default)(str);
      if (options && options.no_symbols) {
        return numericNoSymbols.test(str);
      }
      return new RegExp(
        '^[+-]?([0-9]*['.concat(
          (options || {}).locale ? _alpha.decimal[options.locale] : '.',
          '])?[0-9]+$'
        )
      ).test(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 9193: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isOctal;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var octal = /^(0o)?[0-7]+$/i;
    function isOctal(str) {
      (0, _assertString.default)(str);
      return octal.test(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 33: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isPassportNumber;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    /**
     * Reference:
     * https://en.wikipedia.org/ -- Wikipedia
     * https://docs.microsoft.com/en-us/microsoft-365/compliance/eu-passport-number -- EU Passport Number
     * https://countrycode.org/ -- Country Codes
     */
    var passportRegexByCountryCode = {
      AM: /^[A-Z]{2}\d{7}$/,
      // ARMENIA
      AR: /^[A-Z]{3}\d{6}$/,
      // ARGENTINA
      AT: /^[A-Z]\d{7}$/,
      // AUSTRIA
      AU: /^[A-Z]\d{7}$/,
      // AUSTRALIA
      AZ: /^[A-Z]{1}\d{8}$/,
      // AZERBAIJAN
      BE: /^[A-Z]{2}\d{6}$/,
      // BELGIUM
      BG: /^\d{9}$/,
      // BULGARIA
      BR: /^[A-Z]{2}\d{6}$/,
      // BRAZIL
      BY: /^[A-Z]{2}\d{7}$/,
      // BELARUS
      CA: /^[A-Z]{2}\d{6}$/,
      // CANADA
      CH: /^[A-Z]\d{7}$/,
      // SWITZERLAND
      CN: /^G\d{8}$|^E(?![IO])[A-Z0-9]\d{7}$/,
      // CHINA [G=Ordinary, E=Electronic] followed by 8-digits, or E followed by any UPPERCASE letter (except I and O) followed by 7 digits
      CY: /^[A-Z](\d{6}|\d{8})$/,
      // CYPRUS
      CZ: /^\d{8}$/,
      // CZECH REPUBLIC
      DE: /^[CFGHJKLMNPRTVWXYZ0-9]{9}$/,
      // GERMANY
      DK: /^\d{9}$/,
      // DENMARK
      DZ: /^\d{9}$/,
      // ALGERIA
      EE: /^([A-Z]\d{7}|[A-Z]{2}\d{7})$/,
      // ESTONIA (K followed by 7-digits), e-passports have 2 UPPERCASE followed by 7 digits
      ES: /^[A-Z0-9]{2}([A-Z0-9]?)\d{6}$/,
      // SPAIN
      FI: /^[A-Z]{2}\d{7}$/,
      // FINLAND
      FR: /^\d{2}[A-Z]{2}\d{5}$/,
      // FRANCE
      GB: /^\d{9}$/,
      // UNITED KINGDOM
      GR: /^[A-Z]{2}\d{7}$/,
      // GREECE
      HR: /^\d{9}$/,
      // CROATIA
      HU: /^[A-Z]{2}(\d{6}|\d{7})$/,
      // HUNGARY
      IE: /^[A-Z0-9]{2}\d{7}$/,
      // IRELAND
      IN: /^[A-Z]{1}-?\d{7}$/,
      // INDIA
      ID: /^[A-C]\d{7}$/,
      // INDONESIA
      IR: /^[A-Z]\d{8}$/,
      // IRAN
      IS: /^(A)\d{7}$/,
      // ICELAND
      IT: /^[A-Z0-9]{2}\d{7}$/,
      // ITALY
      JM: /^[Aa]\d{7}$/,
      // JAMAICA
      JP: /^[A-Z]{2}\d{7}$/,
      // JAPAN
      KR: /^[MS]\d{8}$/,
      // SOUTH KOREA, REPUBLIC OF KOREA, [S=PS Passports, M=PM Passports]
      KZ: /^[a-zA-Z]\d{7}$/,
      // KAZAKHSTAN
      LI: /^[a-zA-Z]\d{5}$/,
      // LIECHTENSTEIN
      LT: /^[A-Z0-9]{8}$/,
      // LITHUANIA
      LU: /^[A-Z0-9]{8}$/,
      // LUXEMBURG
      LV: /^[A-Z0-9]{2}\d{7}$/,
      // LATVIA
      LY: /^[A-Z0-9]{8}$/,
      // LIBYA
      MT: /^\d{7}$/,
      // MALTA
      MZ: /^([A-Z]{2}\d{7})|(\d{2}[A-Z]{2}\d{5})$/,
      // MOZAMBIQUE
      MY: /^[AHK]\d{8}$/,
      // MALAYSIA
      MX: /^\d{10,11}$/,
      // MEXICO
      NL: /^[A-Z]{2}[A-Z0-9]{6}\d$/,
      // NETHERLANDS
      NZ: /^([Ll]([Aa]|[Dd]|[Ff]|[Hh])|[Ee]([Aa]|[Pp])|[Nn])\d{6}$/,
      // NEW ZEALAND
      PH: /^([A-Z](\d{6}|\d{7}[A-Z]))|([A-Z]{2}(\d{6}|\d{7}))$/,
      // PHILIPPINES
      PK: /^[A-Z]{2}\d{7}$/,
      // PAKISTAN
      PL: /^[A-Z]{2}\d{7}$/,
      // POLAND
      PT: /^[A-Z]\d{6}$/,
      // PORTUGAL
      RO: /^\d{8,9}$/,
      // ROMANIA
      RU: /^\d{9}$/,
      // RUSSIAN FEDERATION
      SE: /^\d{8}$/,
      // SWEDEN
      SL: /^(P)[A-Z]\d{7}$/,
      // SLOVENIA
      SK: /^[0-9A-Z]\d{7}$/,
      // SLOVAKIA
      TH: /^[A-Z]{1,2}\d{6,7}$/,
      // THAILAND
      TR: /^[A-Z]\d{8}$/,
      // TURKEY
      UA: /^[A-Z]{2}\d{6}$/,
      // UKRAINE
      US: /^\d{9}$/,
      // UNITED STATES
      ZA: /^[TAMD]\d{8}$/ // SOUTH AFRICA
    };

    /**
     * Check if str is a valid passport number
     * relative to provided ISO Country Code.
     *
     * @param {string} str
     * @param {string} countryCode
     * @return {boolean}
     */
    function isPassportNumber(str, countryCode) {
      (0, _assertString.default)(str);
      /** Remove All Whitespaces, Convert to UPPERCASE */
      var normalizedStr = str.replace(/\s/g, '').toUpperCase();
      return (
        countryCode.toUpperCase() in passportRegexByCountryCode &&
        passportRegexByCountryCode[countryCode].test(normalizedStr)
      );
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 5985: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isPort;
    var _isInt = _interopRequireDefault(__webpack_require__(7205));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function isPort(str) {
      return (0, _isInt.default)(str, {
        allow_leading_zeroes: false,
        min: 0,
        max: 65535
      });
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 5517: /***/ (__unused_webpack_module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isPostalCode;
    exports.locales = void 0;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    // common patterns
    var threeDigit = /^\d{3}$/;
    var fourDigit = /^\d{4}$/;
    var fiveDigit = /^\d{5}$/;
    var sixDigit = /^\d{6}$/;
    var patterns = {
      AD: /^AD\d{3}$/,
      AT: fourDigit,
      AU: fourDigit,
      AZ: /^AZ\d{4}$/,
      BA: /^([7-8]\d{4}$)/,
      BE: fourDigit,
      BG: fourDigit,
      BR: /^\d{5}-\d{3}$/,
      BY: /^2[1-4]\d{4}$/,
      CA: /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][\s-]?\d[ABCEGHJ-NPRSTV-Z]\d$/i,
      CH: fourDigit,
      CN: /^(0[1-7]|1[012356]|2[0-7]|3[0-6]|4[0-7]|5[1-7]|6[1-7]|7[1-5]|8[1345]|9[09])\d{4}$/,
      CZ: /^\d{3}\s?\d{2}$/,
      DE: fiveDigit,
      DK: fourDigit,
      DO: fiveDigit,
      DZ: fiveDigit,
      EE: fiveDigit,
      ES: /^(5[0-2]{1}|[0-4]{1}\d{1})\d{3}$/,
      FI: fiveDigit,
      FR: /^\d{2}\s?\d{3}$/,
      GB: /^(gir\s?0aa|[a-z]{1,2}\d[\da-z]?\s?(\d[a-z]{2})?)$/i,
      GR: /^\d{3}\s?\d{2}$/,
      HR: /^([1-5]\d{4}$)/,
      HT: /^HT\d{4}$/,
      HU: fourDigit,
      ID: fiveDigit,
      IE: /^(?!.*(?:o))[A-Za-z]\d[\dw]\s\w{4}$/i,
      IL: /^(\d{5}|\d{7})$/,
      IN: /^((?!10|29|35|54|55|65|66|86|87|88|89)[1-9][0-9]{5})$/,
      IR: /^(?!(\d)\1{3})[13-9]{4}[1346-9][013-9]{5}$/,
      IS: threeDigit,
      IT: fiveDigit,
      JP: /^\d{3}-\d{4}$/,
      KE: fiveDigit,
      KR: /^(\d{5}|\d{6})$/,
      LI: /^(948[5-9]|949[0-7])$/,
      LT: /^LT-\d{5}$/,
      LU: fourDigit,
      LV: /^LV-\d{4}$/,
      LK: fiveDigit,
      MG: threeDigit,
      MX: fiveDigit,
      MT: /^[A-Za-z]{3}\s{0,1}\d{4}$/,
      MY: fiveDigit,
      NL: /^[1-9]\d{3}\s?(?!sa|sd|ss)[a-z]{2}$/i,
      NO: fourDigit,
      NP: /^(10|21|22|32|33|34|44|45|56|57)\d{3}$|^(977)$/i,
      NZ: fourDigit,
      PL: /^\d{2}-\d{3}$/,
      PR: /^00[679]\d{2}([ -]\d{4})?$/,
      PT: /^\d{4}-\d{3}?$/,
      RO: sixDigit,
      RU: sixDigit,
      SA: fiveDigit,
      SE: /^[1-9]\d{2}\s?\d{2}$/,
      SG: sixDigit,
      SI: fourDigit,
      SK: /^\d{3}\s?\d{2}$/,
      TH: fiveDigit,
      TN: fourDigit,
      TW: /^\d{3}(\d{2})?$/,
      UA: fiveDigit,
      US: /^\d{5}(-\d{4})?$/,
      ZA: fourDigit,
      ZM: fiveDigit
    };
    var locales = (exports.locales = Object.keys(patterns));
    function isPostalCode(str, locale) {
      (0, _assertString.default)(str);
      if (locale in patterns) {
        return patterns[locale].test(str);
      } else if (locale === 'any') {
        for (var key in patterns) {
          // https://github.com/gotwarlost/istanbul/blob/master/ignoring-code-for-coverage.md#ignoring-code-for-coverage-purposes
          // istanbul ignore else
          if (Object.hasOwn(patterns, key)) {
            var pattern = patterns[key];
            if (pattern.test(str)) {
              return true;
            }
          }
        }
        return false;
      }
      throw new Error("Invalid locale '".concat(locale, "'"));
    }

    /***/
  },

  /***/ 7397: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isRFC3339;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    /* Based on https://tools.ietf.org/html/rfc3339#section-5.6 */

    var dateFullYear = /[0-9]{4}/;
    var dateMonth = /(0[1-9]|1[0-2])/;
    var dateMDay = /([12]\d|0[1-9]|3[01])/;
    var timeHour = /([01][0-9]|2[0-3])/;
    var timeMinute = /[0-5][0-9]/;
    var timeSecond = /([0-5][0-9]|60)/;
    var timeSecFrac = /(\.[0-9]+)?/;
    var timeNumOffset = new RegExp(
      '[-+]'.concat(timeHour.source, ':').concat(timeMinute.source)
    );
    var timeOffset = new RegExp('([zZ]|'.concat(timeNumOffset.source, ')'));
    var partialTime = new RegExp(
      ''
        .concat(timeHour.source, ':')
        .concat(timeMinute.source, ':')
        .concat(timeSecond.source)
        .concat(timeSecFrac.source)
    );
    var fullDate = new RegExp(
      ''
        .concat(dateFullYear.source, '-')
        .concat(dateMonth.source, '-')
        .concat(dateMDay.source)
    );
    var fullTime = new RegExp(
      ''.concat(partialTime.source).concat(timeOffset.source)
    );
    var rfc3339 = new RegExp(
      '^'.concat(fullDate.source, '[ tT]').concat(fullTime.source, '$')
    );
    function isRFC3339(str) {
      (0, _assertString.default)(str);
      return rfc3339.test(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 8329: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isRgbColor;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var rgbColor =
      /^rgb\((([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]),){2}([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\)$/;
    var rgbaColor =
      /^rgba\((([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]),){3}(0?\.\d|1(\.0)?|0(\.0)?)\)$/;
    var rgbColorPercent =
      /^rgb\((([0-9]%|[1-9][0-9]%|100%),){2}([0-9]%|[1-9][0-9]%|100%)\)$/;
    var rgbaColorPercent =
      /^rgba\((([0-9]%|[1-9][0-9]%|100%),){3}(0?\.\d|1(\.0)?|0(\.0)?)\)$/;
    function isRgbColor(str) {
      var includePercentValues =
        arguments.length > 1 && arguments[1] !== undefined
          ? arguments[1]
          : true;
      (0, _assertString.default)(str);
      if (!includePercentValues) {
        return rgbColor.test(str) || rgbaColor.test(str);
      }
      return (
        rgbColor.test(str) ||
        rgbaColor.test(str) ||
        rgbColorPercent.test(str) ||
        rgbaColorPercent.test(str)
      );
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 2493: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isSemVer;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _multilineRegex = _interopRequireDefault(__webpack_require__(4112));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    /**
     * Regular Expression to match
     * semantic versioning (SemVer)
     * built from multi-line, multi-parts regexp
     * Reference: https://semver.org/
     */
    var semanticVersioningRegex = (0, _multilineRegex.default)(
      [
        '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)',
        '(?:-((?:0|[1-9]\\d*|\\d*[a-z-][0-9a-z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-z-][0-9a-z-]*))*))',
        '?(?:\\+([0-9a-z-]+(?:\\.[0-9a-z-]+)*))?$'
      ],
      'i'
    );
    function isSemVer(str) {
      (0, _assertString.default)(str);
      return semanticVersioningRegex.test(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 2140: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isSlug;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var charsetRegex = /^[^\s-_](?!.*?[-_]{2,})[a-z0-9-\\][^\s]*[^-_\s]$/;
    function isSlug(str) {
      (0, _assertString.default)(str);
      return charsetRegex.test(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 1792: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isStrongPassword;
    var _merge = _interopRequireDefault(__webpack_require__(9956));
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var upperCaseRegex = /^[A-Z]$/;
    var lowerCaseRegex = /^[a-z]$/;
    var numberRegex = /^[0-9]$/;
    var symbolRegex = /^[-#!$@£%^&*()_+|~=`{}[\]:";'<>?,./\\ ]$/;
    var defaultOptions = {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      returnScore: false,
      pointsPerUnique: 1,
      pointsPerRepeat: 0.5,
      pointsForContainingLower: 10,
      pointsForContainingUpper: 10,
      pointsForContainingNumber: 10,
      pointsForContainingSymbol: 10
    };

    /* Counts number of occurrences of each char in a string
     * could be moved to util/ ?
     */
    function countChars(str) {
      var result = {};
      Array.from(str).forEach(char => {
        var curVal = result[char];
        if (curVal) {
          result[char] += 1;
        } else {
          result[char] = 1;
        }
      });
      return result;
    }

    /* Return information about a password */
    function analyzePassword(password) {
      var charMap = countChars(password);
      var analysis = {
        length: password.length,
        uniqueChars: Object.keys(charMap).length,
        uppercaseCount: 0,
        lowercaseCount: 0,
        numberCount: 0,
        symbolCount: 0
      };
      Object.keys(charMap).forEach(char => {
        /* istanbul ignore else */
        if (upperCaseRegex.test(char)) {
          analysis.uppercaseCount += charMap[char];
        } else if (lowerCaseRegex.test(char)) {
          analysis.lowercaseCount += charMap[char];
        } else if (numberRegex.test(char)) {
          analysis.numberCount += charMap[char];
        } else if (symbolRegex.test(char)) {
          analysis.symbolCount += charMap[char];
        }
      });
      return analysis;
    }
    function scorePassword(analysis, scoringOptions) {
      var points = 0;
      points += analysis.uniqueChars * scoringOptions.pointsPerUnique;
      points +=
        (analysis.length - analysis.uniqueChars) *
        scoringOptions.pointsPerRepeat;
      if (analysis.lowercaseCount > 0) {
        points += scoringOptions.pointsForContainingLower;
      }
      if (analysis.uppercaseCount > 0) {
        points += scoringOptions.pointsForContainingUpper;
      }
      if (analysis.numberCount > 0) {
        points += scoringOptions.pointsForContainingNumber;
      }
      if (analysis.symbolCount > 0) {
        points += scoringOptions.pointsForContainingSymbol;
      }
      return points;
    }
    function isStrongPassword(str) {
      var options =
        arguments.length > 1 && arguments[1] !== undefined
          ? arguments[1]
          : null;
      (0, _assertString.default)(str);
      var analysis = analyzePassword(str);
      options = (0, _merge.default)(options || {}, defaultOptions);
      if (options.returnScore) {
        return scorePassword(analysis, options);
      }
      return (
        analysis.length >= options.minLength &&
        analysis.lowercaseCount >= options.minLowercase &&
        analysis.uppercaseCount >= options.minUppercase &&
        analysis.numberCount >= options.minNumbers &&
        analysis.symbolCount >= options.minSymbols
      );
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 4901: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isSurrogatePair;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var surrogatePair = /[\uD800-\uDBFF][\uDC00-\uDFFF]/;
    function isSurrogatePair(str) {
      (0, _assertString.default)(str);
      return surrogatePair.test(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 578: /***/ (module, exports, __webpack_require__) => {
    function _typeof(o) {
      '@babel/helpers - typeof';
      return (
        (_typeof =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? o => typeof o
            : o =>
                o &&
                'function' == typeof Symbol &&
                o.constructor === Symbol &&
                o !== Symbol.prototype
                  ? 'symbol'
                  : typeof o),
        _typeof(o)
      );
    }
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isTaxID;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var algorithms = _interopRequireWildcard(__webpack_require__(4134));
    var _isDate = _interopRequireDefault(__webpack_require__(4845));
    function _getRequireWildcardCache(e) {
      if ('function' != typeof WeakMap) return null;
      var r = new WeakMap(),
        t = new WeakMap();
      return (_getRequireWildcardCache = function _getRequireWildcardCache(e) {
        return e ? t : r;
      })(e);
    }
    function _interopRequireWildcard(e, r) {
      if (!r && e && e.__esModule) return e;
      if (null === e || ('object' != _typeof(e) && 'function' != typeof e))
        return { default: e };
      var t = _getRequireWildcardCache(r);
      if (t && t.has(e)) return t.get(e);
      var n = { __proto__: null },
        a = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var u in e)
        if ('default' !== u && Object.hasOwn(e, u)) {
          var i = a ? Object.getOwnPropertyDescriptor(e, u) : null;
          i && (i.get || i.set)
            ? Object.defineProperty(n, u, i)
            : (n[u] = e[u]);
        }
      return (n.default = e), t && t.set(e, n), n;
    }
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function _toConsumableArray(arr) {
      return (
        _arrayWithoutHoles(arr) ||
        _iterableToArray(arr) ||
        _unsupportedIterableToArray(arr) ||
        _nonIterableSpread()
      );
    }
    function _nonIterableSpread() {
      throw new TypeError(
        'Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
      );
    }
    function _unsupportedIterableToArray(o, minLen) {
      if (!o) return;
      if (typeof o === 'string') return _arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === 'Object' && o.constructor) n = o.constructor.name;
      if (n === 'Map' || n === 'Set') return Array.from(o);
      if (
        n === 'Arguments' ||
        /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)
      )
        return _arrayLikeToArray(o, minLen);
    }
    function _iterableToArray(iter) {
      if (
        (typeof Symbol !== 'undefined' && iter[Symbol.iterator] != null) ||
        iter['@@iterator'] != null
      )
        return Array.from(iter);
    }
    function _arrayWithoutHoles(arr) {
      if (Array.isArray(arr)) return _arrayLikeToArray(arr);
    }
    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length) len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
      return arr2;
    }
    /**
     * TIN Validation
     * Validates Tax Identification Numbers (TINs) from the US, EU member states and the United Kingdom.
     *
     * EU-UK:
     * National TIN validity is calculated using public algorithms as made available by DG TAXUD.
     *
     * See `https://ec.europa.eu/taxation_customs/tin/specs/FS-TIN%20Algorithms-Public.docx` for more information.
     *
     * US:
     * An Employer Identification Number (EIN), also known as a Federal Tax Identification Number,
     *  is used to identify a business entity.
     *
     * NOTES:
     *  - Prefix 47 is being reserved for future use
     *  - Prefixes 26, 27, 45, 46 and 47 were previously assigned by the Philadelphia campus.
     *
     * See `http://www.irs.gov/Businesses/Small-Businesses-&-Self-Employed/How-EINs-are-Assigned-and-Valid-EIN-Prefixes`
     * for more information.
     */

    // Locale functions

    /*
     * bg-BG validation function
     * (Edinen graždanski nomer (EGN/ЕГН), persons only)
     * Checks if birth date (first six digits) is valid and calculates check (last) digit
     */
    function bgBgCheck(tin) {
      // Extract full year, normalize month and check birth date validity
      var century_year = tin.slice(0, 2);
      var month = parseInt(tin.slice(2, 4), 10);
      if (month > 40) {
        month -= 40;
        century_year = '20'.concat(century_year);
      } else if (month > 20) {
        month -= 20;
        century_year = '18'.concat(century_year);
      } else {
        century_year = '19'.concat(century_year);
      }
      if (month < 10) {
        month = '0'.concat(month);
      }
      var date = ''
        .concat(century_year, '/')
        .concat(month, '/')
        .concat(tin.slice(4, 6));
      if (!(0, _isDate.default)(date, 'YYYY/MM/DD')) {
        return false;
      }

      // split digits into an array for further processing
      var digits = tin.split('').map(a => parseInt(a, 10));

      // Calculate checksum by multiplying digits with fixed values
      var multip_lookup = [2, 4, 8, 5, 10, 9, 7, 3, 6];
      var checksum = 0;
      for (var i = 0; i < multip_lookup.length; i++) {
        checksum += digits[i] * multip_lookup[i];
      }
      checksum = checksum % 11 === 10 ? 0 : checksum % 11;
      return checksum === digits[9];
    }

    /**
     * Check if an input is a valid Canadian SIN (Social Insurance Number)
     *
     * The Social Insurance Number (SIN) is a 9 digit number that
     * you need to work in Canada or to have access to government programs and benefits.
     *
     * https://en.wikipedia.org/wiki/Social_Insurance_Number
     * https://www.canada.ca/en/employment-social-development/services/sin.html
     * https://www.codercrunch.com/challenge/819302488/sin-validator
     *
     * @param {string} input
     * @return {boolean}
     */
    function isCanadianSIN(input) {
      var digitsArray = input.split('');
      var even = digitsArray
        .filter((_, idx) => idx % 2)
        .map(i => Number(i) * 2)
        .join('')
        .split('');
      var total = digitsArray
        .filter((_, idx) => !(idx % 2))
        .concat(even)
        .map(i => Number(i))
        .reduce((acc, cur) => acc + cur);
      return total % 10 === 0;
    }

    /*
     * cs-CZ validation function
     * (Rodné číslo (RČ), persons only)
     * Checks if birth date (first six digits) is valid and divisibility by 11
     * Material not in DG TAXUD document sourced from:
     * -`https://lorenc.info/3MA381/overeni-spravnosti-rodneho-cisla.htm`
     * -`https://www.mvcr.cz/clanek/rady-a-sluzby-dokumenty-rodne-cislo.aspx`
     */
    function csCzCheck(tin) {
      tin = tin.replace(/\W/, '');

      // Extract full year from TIN length
      var full_year = parseInt(tin.slice(0, 2), 10);
      if (tin.length === 10) {
        if (full_year < 54) {
          full_year = '20'.concat(full_year);
        } else {
          full_year = '19'.concat(full_year);
        }
      } else {
        if (tin.slice(6) === '000') {
          return false;
        } // Three-zero serial not assigned before 1954
        if (full_year < 54) {
          full_year = '19'.concat(full_year);
        } else {
          return false; // No 18XX years seen in any of the resources
        }
      }
      // Add missing zero if needed
      if (full_year.length === 3) {
        full_year = [full_year.slice(0, 2), '0', full_year.slice(2)].join('');
      }

      // Extract month from TIN and normalize
      var month = parseInt(tin.slice(2, 4), 10);
      if (month > 50) {
        month -= 50;
      }
      if (month > 20) {
        // Month-plus-twenty was only introduced in 2004
        if (parseInt(full_year, 10) < 2004) {
          return false;
        }
        month -= 20;
      }
      if (month < 10) {
        month = '0'.concat(month);
      }

      // Check date validity
      var date = ''
        .concat(full_year, '/')
        .concat(month, '/')
        .concat(tin.slice(4, 6));
      if (!(0, _isDate.default)(date, 'YYYY/MM/DD')) {
        return false;
      }

      // Verify divisibility by 11
      if (tin.length === 10) {
        if (parseInt(tin, 10) % 11 !== 0) {
          // Some numbers up to and including 1985 are still valid if
          // check (last) digit equals 0 and modulo of first 9 digits equals 10
          var checkdigit = parseInt(tin.slice(0, 9), 10) % 11;
          if (parseInt(full_year, 10) < 1986 && checkdigit === 10) {
            if (parseInt(tin.slice(9), 10) !== 0) {
              return false;
            }
          } else {
            return false;
          }
        }
      }
      return true;
    }

    /*
     * de-AT validation function
     * (Abgabenkontonummer, persons/entities)
     * Verify TIN validity by calling luhnCheck()
     */
    function deAtCheck(tin) {
      return algorithms.luhnCheck(tin);
    }

    /*
     * de-DE validation function
     * (Steueridentifikationsnummer (Steuer-IdNr.), persons only)
     * Tests for single duplicate/triplicate value, then calculates ISO 7064 check (last) digit
     * Partial implementation of spec (same result with both algorithms always)
     */
    function deDeCheck(tin) {
      // Split digits into an array for further processing
      var digits = tin.split('').map(a => parseInt(a, 10));

      // Fill array with strings of number positions
      var occurences = [];
      for (var i = 0; i < digits.length - 1; i++) {
        occurences.push('');
        for (var j = 0; j < digits.length - 1; j++) {
          if (digits[i] === digits[j]) {
            occurences[i] += j;
          }
        }
      }

      // Remove digits with one occurence and test for only one duplicate/triplicate
      occurences = occurences.filter(a => a.length > 1);
      if (occurences.length !== 2 && occurences.length !== 3) {
        return false;
      }

      // In case of triplicate value only two digits are allowed next to each other
      if (occurences[0].length === 3) {
        var trip_locations = occurences[0].split('').map(a => parseInt(a, 10));
        var recurrent = 0; // Amount of neighbour occurences
        for (var _i = 0; _i < trip_locations.length - 1; _i++) {
          if (trip_locations[_i] + 1 === trip_locations[_i + 1]) {
            recurrent += 1;
          }
        }
        if (recurrent === 2) {
          return false;
        }
      }
      return algorithms.iso7064Check(tin);
    }

    /*
     * dk-DK validation function
     * (CPR-nummer (personnummer), persons only)
     * Checks if birth date (first six digits) is valid and assigned to century (seventh) digit,
     * and calculates check (last) digit
     */
    function dkDkCheck(tin) {
      tin = tin.replace(/\W/, '');

      // Extract year, check if valid for given century digit and add century
      var year = parseInt(tin.slice(4, 6), 10);
      var century_digit = tin.slice(6, 7);
      switch (century_digit) {
        case '0':
        case '1':
        case '2':
        case '3':
          year = '19'.concat(year);
          break;
        case '4':
        case '9':
          if (year < 37) {
            year = '20'.concat(year);
          } else {
            year = '19'.concat(year);
          }
          break;
        default:
          if (year < 37) {
            year = '20'.concat(year);
          } else if (year > 58) {
            year = '18'.concat(year);
          } else {
            return false;
          }
          break;
      }
      // Add missing zero if needed
      if (year.length === 3) {
        year = [year.slice(0, 2), '0', year.slice(2)].join('');
      }
      // Check date validity
      var date = ''
        .concat(year, '/')
        .concat(tin.slice(2, 4), '/')
        .concat(tin.slice(0, 2));
      if (!(0, _isDate.default)(date, 'YYYY/MM/DD')) {
        return false;
      }

      // Split digits into an array for further processing
      var digits = tin.split('').map(a => parseInt(a, 10));
      var checksum = 0;
      var weight = 4;
      // Multiply by weight and add to checksum
      for (var i = 0; i < 9; i++) {
        checksum += digits[i] * weight;
        weight -= 1;
        if (weight === 1) {
          weight = 7;
        }
      }
      checksum %= 11;
      if (checksum === 1) {
        return false;
      }
      return checksum === 0 ? digits[9] === 0 : digits[9] === 11 - checksum;
    }

    /*
     * el-CY validation function
     * (Arithmos Forologikou Mitroou (AFM/ΑΦΜ), persons only)
     * Verify TIN validity by calculating ASCII value of check (last) character
     */
    function elCyCheck(tin) {
      // split digits into an array for further processing
      var digits = tin
        .slice(0, 8)
        .split('')
        .map(a => parseInt(a, 10));
      var checksum = 0;
      // add digits in even places
      for (var i = 1; i < digits.length; i += 2) {
        checksum += digits[i];
      }

      // add digits in odd places
      for (var _i2 = 0; _i2 < digits.length; _i2 += 2) {
        if (digits[_i2] < 2) {
          checksum += 1 - digits[_i2];
        } else {
          checksum += 2 * (digits[_i2] - 2) + 5;
          if (digits[_i2] > 4) {
            checksum += 2;
          }
        }
      }
      return String.fromCharCode((checksum % 26) + 65) === tin.charAt(8);
    }

    /*
     * el-GR validation function
     * (Arithmos Forologikou Mitroou (AFM/ΑΦΜ), persons/entities)
     * Verify TIN validity by calculating check (last) digit
     * Algorithm not in DG TAXUD document- sourced from:
     * - `http://epixeirisi.gr/%CE%9A%CE%A1%CE%99%CE%A3%CE%99%CE%9C%CE%91-%CE%98%CE%95%CE%9C%CE%91%CE%A4%CE%91-%CE%A6%CE%9F%CE%A1%CE%9F%CE%9B%CE%9F%CE%93%CE%99%CE%91%CE%A3-%CE%9A%CE%91%CE%99-%CE%9B%CE%9F%CE%93%CE%99%CE%A3%CE%A4%CE%99%CE%9A%CE%97%CE%A3/23791/%CE%91%CF%81%CE%B9%CE%B8%CE%BC%CF%8C%CF%82-%CE%A6%CE%BF%CF%81%CE%BF%CE%BB%CE%BF%CE%B3%CE%B9%CE%BA%CE%BF%CF%8D-%CE%9C%CE%B7%CF%84%CF%81%CF%8E%CE%BF%CF%85`
     */
    function elGrCheck(tin) {
      // split digits into an array for further processing
      var digits = tin.split('').map(a => parseInt(a, 10));
      var checksum = 0;
      for (var i = 0; i < 8; i++) {
        checksum += digits[i] * 2 ** (8 - i);
      }
      return (checksum % 11) % 10 === digits[8];
    }

    /*
     * en-GB validation function (should go here if needed)
     * (National Insurance Number (NINO) or Unique Taxpayer Reference (UTR),
     * persons/entities respectively)
     */

    /*
     * en-IE validation function
     * (Personal Public Service Number (PPS No), persons only)
     * Verify TIN validity by calculating check (second to last) character
     */
    function enIeCheck(tin) {
      var checksum = algorithms.reverseMultiplyAndSum(
        tin
          .split('')
          .slice(0, 7)
          .map(a => parseInt(a, 10)),
        8
      );
      if (tin.length === 9 && tin[8] !== 'W') {
        checksum += (tin[8].charCodeAt(0) - 64) * 9;
      }
      checksum %= 23;
      if (checksum === 0) {
        return tin[7].toUpperCase() === 'W';
      }
      return tin[7].toUpperCase() === String.fromCharCode(64 + checksum);
    }

    // Valid US IRS campus prefixes
    var enUsCampusPrefix = {
      andover: ['10', '12'],
      atlanta: ['60', '67'],
      austin: ['50', '53'],
      brookhaven: [
        '01',
        '02',
        '03',
        '04',
        '05',
        '06',
        '11',
        '13',
        '14',
        '16',
        '21',
        '22',
        '23',
        '25',
        '34',
        '51',
        '52',
        '54',
        '55',
        '56',
        '57',
        '58',
        '59',
        '65'
      ],
      cincinnati: ['30', '32', '35', '36', '37', '38', '61'],
      fresno: ['15', '24'],
      internet: ['20', '26', '27', '45', '46', '47'],
      kansas: ['40', '44'],
      memphis: ['94', '95'],
      ogden: ['80', '90'],
      philadelphia: [
        '33',
        '39',
        '41',
        '42',
        '43',
        '46',
        '48',
        '62',
        '63',
        '64',
        '66',
        '68',
        '71',
        '72',
        '73',
        '74',
        '75',
        '76',
        '77',
        '81',
        '82',
        '83',
        '84',
        '85',
        '86',
        '87',
        '88',
        '91',
        '92',
        '93',
        '98',
        '99'
      ],
      sba: ['31']
    };

    // Return an array of all US IRS campus prefixes
    function enUsGetPrefixes() {
      var prefixes = [];
      for (var location in enUsCampusPrefix) {
        // https://github.com/gotwarlost/istanbul/blob/master/ignoring-code-for-coverage.md#ignoring-code-for-coverage-purposes
        // istanbul ignore else
        if (Object.hasOwn(enUsCampusPrefix, location)) {
          prefixes.push.apply(
            prefixes,
            _toConsumableArray(enUsCampusPrefix[location])
          );
        }
      }
      return prefixes;
    }

    /*
     * en-US validation function
     * Verify that the TIN starts with a valid IRS campus prefix
     */
    function enUsCheck(tin) {
      return enUsGetPrefixes().indexOf(tin.slice(0, 2)) !== -1;
    }

    /*
     * es-AR validation function
     * Clave Única de Identificación Tributaria (CUIT/CUIL)
     * Sourced from:
     * - https://servicioscf.afip.gob.ar/publico/abc/ABCpaso2.aspx?id_nivel1=3036&id_nivel2=3040&p=Conceptos%20b%C3%A1sicos
     * - https://es.wikipedia.org/wiki/Clave_%C3%9Anica_de_Identificaci%C3%B3n_Tributaria
     */

    function esArCheck(tin) {
      var accum = 0;
      var digits = tin.split('');
      var digit = parseInt(digits.pop(), 10);
      for (var i = 0; i < digits.length; i++) {
        accum += digits[9 - i] * (2 + (i % 6));
      }
      var verif = 11 - (accum % 11);
      if (verif === 11) {
        verif = 0;
      } else if (verif === 10) {
        verif = 9;
      }
      return digit === verif;
    }

    /*
     * es-ES validation function
     * (Documento Nacional de Identidad (DNI)
     * or Número de Identificación de Extranjero (NIE), persons only)
     * Verify TIN validity by calculating check (last) character
     */
    function esEsCheck(tin) {
      // Split characters into an array for further processing
      var chars = tin.toUpperCase().split('');

      // Replace initial letter if needed
      if (isNaN(parseInt(chars[0], 10)) && chars.length > 1) {
        var lead_replace = 0;
        switch (chars[0]) {
          case 'Y':
            lead_replace = 1;
            break;
          case 'Z':
            lead_replace = 2;
            break;
          default:
        }
        chars.splice(0, 1, lead_replace);
        // Fill with zeros if smaller than proper
      } else {
        while (chars.length < 9) {
          chars.unshift(0);
        }
      }

      // Calculate checksum and check according to lookup
      var lookup = [
        'T',
        'R',
        'W',
        'A',
        'G',
        'M',
        'Y',
        'F',
        'P',
        'D',
        'X',
        'B',
        'N',
        'J',
        'Z',
        'S',
        'Q',
        'V',
        'H',
        'L',
        'C',
        'K',
        'E'
      ];
      chars = chars.join('');
      var checksum = parseInt(chars.slice(0, 8), 10) % 23;
      return chars[8] === lookup[checksum];
    }

    /*
     * et-EE validation function
     * (Isikukood (IK), persons only)
     * Checks if birth date (century digit and six following) is valid and calculates check (last) digit
     * Material not in DG TAXUD document sourced from:
     * - `https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Estonia-TIN.pdf`
     */
    function etEeCheck(tin) {
      // Extract year and add century
      var full_year = tin.slice(1, 3);
      var century_digit = tin.slice(0, 1);
      switch (century_digit) {
        case '1':
        case '2':
          full_year = '18'.concat(full_year);
          break;
        case '3':
        case '4':
          full_year = '19'.concat(full_year);
          break;
        default:
          full_year = '20'.concat(full_year);
          break;
      }
      // Check date validity
      var date = ''
        .concat(full_year, '/')
        .concat(tin.slice(3, 5), '/')
        .concat(tin.slice(5, 7));
      if (!(0, _isDate.default)(date, 'YYYY/MM/DD')) {
        return false;
      }

      // Split digits into an array for further processing
      var digits = tin.split('').map(a => parseInt(a, 10));
      var checksum = 0;
      var weight = 1;
      // Multiply by weight and add to checksum
      for (var i = 0; i < 10; i++) {
        checksum += digits[i] * weight;
        weight += 1;
        if (weight === 10) {
          weight = 1;
        }
      }
      // Do again if modulo 11 of checksum is 10
      if (checksum % 11 === 10) {
        checksum = 0;
        weight = 3;
        for (var _i3 = 0; _i3 < 10; _i3++) {
          checksum += digits[_i3] * weight;
          weight += 1;
          if (weight === 10) {
            weight = 1;
          }
        }
        if (checksum % 11 === 10) {
          return digits[10] === 0;
        }
      }
      return checksum % 11 === digits[10];
    }

    /*
     * fi-FI validation function
     * (Henkilötunnus (HETU), persons only)
     * Checks if birth date (first six digits plus century symbol) is valid
     * and calculates check (last) digit
     */
    function fiFiCheck(tin) {
      // Extract year and add century
      var full_year = tin.slice(4, 6);
      var century_symbol = tin.slice(6, 7);
      switch (century_symbol) {
        case '+':
          full_year = '18'.concat(full_year);
          break;
        case '-':
          full_year = '19'.concat(full_year);
          break;
        default:
          full_year = '20'.concat(full_year);
          break;
      }
      // Check date validity
      var date = ''
        .concat(full_year, '/')
        .concat(tin.slice(2, 4), '/')
        .concat(tin.slice(0, 2));
      if (!(0, _isDate.default)(date, 'YYYY/MM/DD')) {
        return false;
      }

      // Calculate check character
      var checksum = parseInt(tin.slice(0, 6) + tin.slice(7, 10), 10) % 31;
      if (checksum < 10) {
        return checksum === parseInt(tin.slice(10), 10);
      }
      checksum -= 10;
      var letters_lookup = [
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'H',
        'J',
        'K',
        'L',
        'M',
        'N',
        'P',
        'R',
        'S',
        'T',
        'U',
        'V',
        'W',
        'X',
        'Y'
      ];
      return letters_lookup[checksum] === tin.slice(10);
    }

    /*
     * fr/nl-BE validation function
     * (Numéro national (N.N.), persons only)
     * Checks if birth date (first six digits) is valid and calculates check (last two) digits
     */
    function frBeCheck(tin) {
      // Zero month/day value is acceptable
      if (tin.slice(2, 4) !== '00' || tin.slice(4, 6) !== '00') {
        // Extract date from first six digits of TIN
        var date = ''
          .concat(tin.slice(0, 2), '/')
          .concat(tin.slice(2, 4), '/')
          .concat(tin.slice(4, 6));
        if (!(0, _isDate.default)(date, 'YY/MM/DD')) {
          return false;
        }
      }
      var checksum = 97 - (parseInt(tin.slice(0, 9), 10) % 97);
      var checkdigits = parseInt(tin.slice(9, 11), 10);
      if (checksum !== checkdigits) {
        checksum = 97 - (parseInt('2'.concat(tin.slice(0, 9)), 10) % 97);
        if (checksum !== checkdigits) {
          return false;
        }
      }
      return true;
    }

    /*
     * fr-FR validation function
     * (Numéro fiscal de référence (numéro SPI), persons only)
     * Verify TIN validity by calculating check (last three) digits
     */
    function frFrCheck(tin) {
      tin = tin.replace(/\s/g, '');
      var checksum = parseInt(tin.slice(0, 10), 10) % 511;
      var checkdigits = parseInt(tin.slice(10, 13), 10);
      return checksum === checkdigits;
    }

    /*
     * fr/lb-LU validation function
     * (numéro d’identification personnelle, persons only)
     * Verify birth date validity and run Luhn and Verhoeff checks
     */
    function frLuCheck(tin) {
      // Extract date and check validity
      var date = ''
        .concat(tin.slice(0, 4), '/')
        .concat(tin.slice(4, 6), '/')
        .concat(tin.slice(6, 8));
      if (!(0, _isDate.default)(date, 'YYYY/MM/DD')) {
        return false;
      }

      // Run Luhn check
      if (!algorithms.luhnCheck(tin.slice(0, 12))) {
        return false;
      }
      // Remove Luhn check digit and run Verhoeff check
      return algorithms.verhoeffCheck(
        ''.concat(tin.slice(0, 11)).concat(tin[12])
      );
    }

    /*
     * hr-HR validation function
     * (Osobni identifikacijski broj (OIB), persons/entities)
     * Verify TIN validity by calling iso7064Check(digits)
     */
    function hrHrCheck(tin) {
      return algorithms.iso7064Check(tin);
    }

    /*
     * hu-HU validation function
     * (Adóazonosító jel, persons only)
     * Verify TIN validity by calculating check (last) digit
     */
    function huHuCheck(tin) {
      // split digits into an array for further processing
      var digits = tin.split('').map(a => parseInt(a, 10));
      var checksum = 8;
      for (var i = 1; i < 9; i++) {
        checksum += digits[i] * (i + 1);
      }
      return checksum % 11 === digits[9];
    }

    /*
     * lt-LT validation function (should go here if needed)
     * (Asmens kodas, persons/entities respectively)
     * Current validation check is alias of etEeCheck- same format applies
     */

    /*
     * it-IT first/last name validity check
     * Accepts it-IT TIN-encoded names as a three-element character array and checks their validity
     * Due to lack of clarity between resources ("Are only Italian consonants used?
     * What happens if a person has X in their name?" etc.) only two test conditions
     * have been implemented:
     * Vowels may only be followed by other vowels or an X character
     * and X characters after vowels may only be followed by other X characters.
     */
    function itItNameCheck(name) {
      // true at the first occurence of a vowel
      var vowelflag = false;

      // true at the first occurence of an X AFTER vowel
      // (to properly handle last names with X as consonant)
      var xflag = false;
      for (var i = 0; i < 3; i++) {
        if (!vowelflag && /[AEIOU]/.test(name[i])) {
          vowelflag = true;
        } else if (!xflag && vowelflag && name[i] === 'X') {
          xflag = true;
        } else if (i > 0) {
          if (vowelflag && !xflag) {
            if (!/[AEIOU]/.test(name[i])) {
              return false;
            }
          }
          if (xflag) {
            if (!/X/.test(name[i])) {
              return false;
            }
          }
        }
      }
      return true;
    }

    /*
     * it-IT validation function
     * (Codice fiscale (TIN-IT), persons only)
     * Verify name, birth date and codice catastale validity
     * and calculate check character.
     * Material not in DG-TAXUD document sourced from:
     * `https://en.wikipedia.org/wiki/Italian_fiscal_code`
     */
    function itItCheck(tin) {
      // Capitalize and split characters into an array for further processing
      var chars = tin.toUpperCase().split('');

      // Check first and last name validity calling itItNameCheck()
      if (!itItNameCheck(chars.slice(0, 3))) {
        return false;
      }
      if (!itItNameCheck(chars.slice(3, 6))) {
        return false;
      }

      // Convert letters in number spaces back to numbers if any
      var number_locations = [6, 7, 9, 10, 12, 13, 14];
      var number_replace = {
        L: '0',
        M: '1',
        N: '2',
        P: '3',
        Q: '4',
        R: '5',
        S: '6',
        T: '7',
        U: '8',
        V: '9'
      };
      for (
        var _i4 = 0, _number_locations = number_locations;
        _i4 < _number_locations.length;
        _i4++
      ) {
        var i = _number_locations[_i4];
        if (chars[i] in number_replace) {
          chars.splice(i, 1, number_replace[chars[i]]);
        }
      }

      // Extract month and day, and check date validity
      var month_replace = {
        A: '01',
        B: '02',
        C: '03',
        D: '04',
        E: '05',
        H: '06',
        L: '07',
        M: '08',
        P: '09',
        R: '10',
        S: '11',
        T: '12'
      };
      var month = month_replace[chars[8]];
      var day = parseInt(chars[9] + chars[10], 10);
      if (day > 40) {
        day -= 40;
      }
      if (day < 10) {
        day = '0'.concat(day);
      }
      var date = ''
        .concat(chars[6])
        .concat(chars[7], '/')
        .concat(month, '/')
        .concat(day);
      if (!(0, _isDate.default)(date, 'YY/MM/DD')) {
        return false;
      }

      // Calculate check character by adding up even and odd characters as numbers
      var checksum = 0;
      for (var _i5 = 1; _i5 < chars.length - 1; _i5 += 2) {
        var char_to_int = parseInt(chars[_i5], 10);
        if (isNaN(char_to_int)) {
          char_to_int = chars[_i5].charCodeAt(0) - 65;
        }
        checksum += char_to_int;
      }
      var odd_convert = {
        // Maps of characters at odd places
        A: 1,
        B: 0,
        C: 5,
        D: 7,
        E: 9,
        F: 13,
        G: 15,
        H: 17,
        I: 19,
        J: 21,
        K: 2,
        L: 4,
        M: 18,
        N: 20,
        O: 11,
        P: 3,
        Q: 6,
        R: 8,
        S: 12,
        T: 14,
        U: 16,
        V: 10,
        W: 22,
        X: 25,
        Y: 24,
        Z: 23,
        0: 1,
        1: 0
      };
      for (var _i6 = 0; _i6 < chars.length - 1; _i6 += 2) {
        var _char_to_int = 0;
        if (chars[_i6] in odd_convert) {
          _char_to_int = odd_convert[chars[_i6]];
        } else {
          var multiplier = parseInt(chars[_i6], 10);
          _char_to_int = 2 * multiplier + 1;
          if (multiplier > 4) {
            _char_to_int += 2;
          }
        }
        checksum += _char_to_int;
      }
      if (String.fromCharCode(65 + (checksum % 26)) !== chars[15]) {
        return false;
      }
      return true;
    }

    /*
     * lv-LV validation function
     * (Personas kods (PK), persons only)
     * Check validity of birth date and calculate check (last) digit
     * Support only for old format numbers (not starting with '32', issued before 2017/07/01)
     * Material not in DG TAXUD document sourced from:
     * `https://boot.ritakafija.lv/forums/index.php?/topic/88314-personas-koda-algoritms-%C4%8Deksumma/`
     */
    function lvLvCheck(tin) {
      tin = tin.replace(/\W/, '');
      // Extract date from TIN
      var day = tin.slice(0, 2);
      if (day !== '32') {
        // No date/checksum check if new format
        var month = tin.slice(2, 4);
        if (month !== '00') {
          // No date check if unknown month
          var full_year = tin.slice(4, 6);
          switch (tin[6]) {
            case '0':
              full_year = '18'.concat(full_year);
              break;
            case '1':
              full_year = '19'.concat(full_year);
              break;
            default:
              full_year = '20'.concat(full_year);
              break;
          }
          // Check date validity
          var date = ''
            .concat(full_year, '/')
            .concat(tin.slice(2, 4), '/')
            .concat(day);
          if (!(0, _isDate.default)(date, 'YYYY/MM/DD')) {
            return false;
          }
        }

        // Calculate check digit
        var checksum = 1101;
        var multip_lookup = [1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
        for (var i = 0; i < tin.length - 1; i++) {
          checksum -= parseInt(tin[i], 10) * multip_lookup[i];
        }
        return parseInt(tin[10], 10) === checksum % 11;
      }
      return true;
    }

    /*
     * mt-MT validation function
     * (Identity Card Number or Unique Taxpayer Reference, persons/entities)
     * Verify Identity Card Number structure (no other tests found)
     */
    function mtMtCheck(tin) {
      if (tin.length !== 9) {
        // No tests for UTR
        var chars = tin.toUpperCase().split('');
        // Fill with zeros if smaller than proper
        while (chars.length < 8) {
          chars.unshift(0);
        }
        // Validate format according to last character
        switch (tin[7]) {
          case 'A':
          case 'P':
            if (parseInt(chars[6], 10) === 0) {
              return false;
            }
            break;
          default: {
            var first_part = parseInt(chars.join('').slice(0, 5), 10);
            if (first_part > 32000) {
              return false;
            }
            var second_part = parseInt(chars.join('').slice(5, 7), 10);
            if (first_part === second_part) {
              return false;
            }
          }
        }
      }
      return true;
    }

    /*
     * nl-NL validation function
     * (Burgerservicenummer (BSN) or Rechtspersonen Samenwerkingsverbanden Informatie Nummer (RSIN),
     * persons/entities respectively)
     * Verify TIN validity by calculating check (last) digit (variant of MOD 11)
     */
    function nlNlCheck(tin) {
      return (
        algorithms.reverseMultiplyAndSum(
          tin
            .split('')
            .slice(0, 8)
            .map(a => parseInt(a, 10)),
          9
        ) %
          11 ===
        parseInt(tin[8], 10)
      );
    }

    /*
     * pl-PL validation function
     * (Powszechny Elektroniczny System Ewidencji Ludności (PESEL)
     * or Numer identyfikacji podatkowej (NIP), persons/entities)
     * Verify TIN validity by validating birth date (PESEL) and calculating check (last) digit
     */
    function plPlCheck(tin) {
      // NIP
      if (tin.length === 10) {
        // Calculate last digit by multiplying with lookup
        var lookup = [6, 5, 7, 2, 3, 4, 5, 6, 7];
        var _checksum = 0;
        for (var i = 0; i < lookup.length; i++) {
          _checksum += parseInt(tin[i], 10) * lookup[i];
        }
        _checksum %= 11;
        if (_checksum === 10) {
          return false;
        }
        return _checksum === parseInt(tin[9], 10);
      }

      // PESEL
      // Extract full year using month
      var full_year = tin.slice(0, 2);
      var month = parseInt(tin.slice(2, 4), 10);
      if (month > 80) {
        full_year = '18'.concat(full_year);
        month -= 80;
      } else if (month > 60) {
        full_year = '22'.concat(full_year);
        month -= 60;
      } else if (month > 40) {
        full_year = '21'.concat(full_year);
        month -= 40;
      } else if (month > 20) {
        full_year = '20'.concat(full_year);
        month -= 20;
      } else {
        full_year = '19'.concat(full_year);
      }
      // Add leading zero to month if needed
      if (month < 10) {
        month = '0'.concat(month);
      }
      // Check date validity
      var date = ''
        .concat(full_year, '/')
        .concat(month, '/')
        .concat(tin.slice(4, 6));
      if (!(0, _isDate.default)(date, 'YYYY/MM/DD')) {
        return false;
      }

      // Calculate last digit by mulitplying with odd one-digit numbers except 5
      var checksum = 0;
      var multiplier = 1;
      for (var _i7 = 0; _i7 < tin.length - 1; _i7++) {
        checksum += (parseInt(tin[_i7], 10) * multiplier) % 10;
        multiplier += 2;
        if (multiplier > 10) {
          multiplier = 1;
        } else if (multiplier === 5) {
          multiplier += 2;
        }
      }
      checksum = 10 - (checksum % 10);
      return checksum === parseInt(tin[10], 10);
    }

    /*
     * pt-BR validation function
     * (Cadastro de Pessoas Físicas (CPF, persons)
     * Cadastro Nacional de Pessoas Jurídicas (CNPJ, entities)
     * Both inputs will be validated
     */

    function ptBrCheck(tin) {
      if (tin.length === 11) {
        var _sum;
        var remainder;
        _sum = 0;
        if (
          // Reject known invalid CPFs
          tin === '11111111111' ||
          tin === '22222222222' ||
          tin === '33333333333' ||
          tin === '44444444444' ||
          tin === '55555555555' ||
          tin === '66666666666' ||
          tin === '77777777777' ||
          tin === '88888888888' ||
          tin === '99999999999' ||
          tin === '00000000000'
        )
          return false;
        for (var i = 1; i <= 9; i++)
          _sum += parseInt(tin.substring(i - 1, i), 10) * (11 - i);
        remainder = (_sum * 10) % 11;
        if (remainder === 10) remainder = 0;
        if (remainder !== parseInt(tin.substring(9, 10), 10)) return false;
        _sum = 0;
        for (var _i8 = 1; _i8 <= 10; _i8++)
          _sum += parseInt(tin.substring(_i8 - 1, _i8), 10) * (12 - _i8);
        remainder = (_sum * 10) % 11;
        if (remainder === 10) remainder = 0;
        if (remainder !== parseInt(tin.substring(10, 11), 10)) return false;
        return true;
      }
      if (
        // Reject know invalid CNPJs
        tin === '00000000000000' ||
        tin === '11111111111111' ||
        tin === '22222222222222' ||
        tin === '33333333333333' ||
        tin === '44444444444444' ||
        tin === '55555555555555' ||
        tin === '66666666666666' ||
        tin === '77777777777777' ||
        tin === '88888888888888' ||
        tin === '99999999999999'
      ) {
        return false;
      }
      var length = tin.length - 2;
      var identifiers = tin.substring(0, length);
      var verificators = tin.substring(length);
      var sum = 0;
      var pos = length - 7;
      for (var _i9 = length; _i9 >= 1; _i9--) {
        sum += identifiers.charAt(length - _i9) * pos;
        pos -= 1;
        if (pos < 2) {
          pos = 9;
        }
      }
      var result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      if (result !== parseInt(verificators.charAt(0), 10)) {
        return false;
      }
      length += 1;
      identifiers = tin.substring(0, length);
      sum = 0;
      pos = length - 7;
      for (var _i10 = length; _i10 >= 1; _i10--) {
        sum += identifiers.charAt(length - _i10) * pos;
        pos -= 1;
        if (pos < 2) {
          pos = 9;
        }
      }
      result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      if (result !== parseInt(verificators.charAt(1), 10)) {
        return false;
      }
      return true;
    }

    /*
     * pt-PT validation function
     * (Número de identificação fiscal (NIF), persons/entities)
     * Verify TIN validity by calculating check (last) digit (variant of MOD 11)
     */
    function ptPtCheck(tin) {
      var checksum =
        11 -
        (algorithms.reverseMultiplyAndSum(
          tin
            .split('')
            .slice(0, 8)
            .map(a => parseInt(a, 10)),
          9
        ) %
          11);
      if (checksum > 9) {
        return parseInt(tin[8], 10) === 0;
      }
      return checksum === parseInt(tin[8], 10);
    }

    /*
     * ro-RO validation function
     * (Cod Numeric Personal (CNP) or Cod de înregistrare fiscală (CIF),
     * persons only)
     * Verify CNP validity by calculating check (last) digit (test not found for CIF)
     * Material not in DG TAXUD document sourced from:
     * `https://en.wikipedia.org/wiki/National_identification_number#Romania`
     */
    function roRoCheck(tin) {
      if (tin.slice(0, 4) !== '9000') {
        // No test found for this format
        // Extract full year using century digit if possible
        var full_year = tin.slice(1, 3);
        switch (tin[0]) {
          case '1':
          case '2':
            full_year = '19'.concat(full_year);
            break;
          case '3':
          case '4':
            full_year = '18'.concat(full_year);
            break;
          case '5':
          case '6':
            full_year = '20'.concat(full_year);
            break;
          default:
        }

        // Check date validity
        var date = ''
          .concat(full_year, '/')
          .concat(tin.slice(3, 5), '/')
          .concat(tin.slice(5, 7));
        if (date.length === 8) {
          if (!(0, _isDate.default)(date, 'YY/MM/DD')) {
            return false;
          }
        } else if (!(0, _isDate.default)(date, 'YYYY/MM/DD')) {
          return false;
        }

        // Calculate check digit
        var digits = tin.split('').map(a => parseInt(a, 10));
        var multipliers = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
        var checksum = 0;
        for (var i = 0; i < multipliers.length; i++) {
          checksum += digits[i] * multipliers[i];
        }
        if (checksum % 11 === 10) {
          return digits[12] === 1;
        }
        return digits[12] === checksum % 11;
      }
      return true;
    }

    /*
     * sk-SK validation function
     * (Rodné číslo (RČ) or bezvýznamové identifikačné číslo (BIČ), persons only)
     * Checks validity of pre-1954 birth numbers (rodné číslo) only
     * Due to the introduction of the pseudo-random BIČ it is not possible to test
     * post-1954 birth numbers without knowing whether they are BIČ or RČ beforehand
     */
    function skSkCheck(tin) {
      if (tin.length === 9) {
        tin = tin.replace(/\W/, '');
        if (tin.slice(6) === '000') {
          return false;
        } // Three-zero serial not assigned before 1954

        // Extract full year from TIN length
        var full_year = parseInt(tin.slice(0, 2), 10);
        if (full_year > 53) {
          return false;
        }
        if (full_year < 10) {
          full_year = '190'.concat(full_year);
        } else {
          full_year = '19'.concat(full_year);
        }

        // Extract month from TIN and normalize
        var month = parseInt(tin.slice(2, 4), 10);
        if (month > 50) {
          month -= 50;
        }
        if (month < 10) {
          month = '0'.concat(month);
        }

        // Check date validity
        var date = ''
          .concat(full_year, '/')
          .concat(month, '/')
          .concat(tin.slice(4, 6));
        if (!(0, _isDate.default)(date, 'YYYY/MM/DD')) {
          return false;
        }
      }
      return true;
    }

    /*
     * sl-SI validation function
     * (Davčna številka, persons/entities)
     * Verify TIN validity by calculating check (last) digit (variant of MOD 11)
     */
    function slSiCheck(tin) {
      var checksum =
        11 -
        (algorithms.reverseMultiplyAndSum(
          tin
            .split('')
            .slice(0, 7)
            .map(a => parseInt(a, 10)),
          8
        ) %
          11);
      if (checksum === 10) {
        return parseInt(tin[7], 10) === 0;
      }
      return checksum === parseInt(tin[7], 10);
    }

    /*
     * sv-SE validation function
     * (Personnummer or samordningsnummer, persons only)
     * Checks validity of birth date and calls luhnCheck() to validate check (last) digit
     */
    function svSeCheck(tin) {
      // Make copy of TIN and normalize to two-digit year form
      var tin_copy = tin.slice(0);
      if (tin.length > 11) {
        tin_copy = tin_copy.slice(2);
      }

      // Extract date of birth
      var full_year = '';
      var month = tin_copy.slice(2, 4);
      var day = parseInt(tin_copy.slice(4, 6), 10);
      if (tin.length > 11) {
        full_year = tin.slice(0, 4);
      } else {
        full_year = tin.slice(0, 2);
        if (tin.length === 11 && day < 60) {
          // Extract full year from centenarian symbol
          // Should work just fine until year 10000 or so
          var current_year = new Date().getFullYear().toString();
          var current_century = parseInt(current_year.slice(0, 2), 10);
          current_year = parseInt(current_year, 10);
          if (tin[6] === '-') {
            if (
              parseInt(''.concat(current_century).concat(full_year), 10) >
              current_year
            ) {
              full_year = ''.concat(current_century - 1).concat(full_year);
            } else {
              full_year = ''.concat(current_century).concat(full_year);
            }
          } else {
            full_year = ''.concat(current_century - 1).concat(full_year);
            if (current_year - parseInt(full_year, 10) < 100) {
              return false;
            }
          }
        }
      }

      // Normalize day and check date validity
      if (day > 60) {
        day -= 60;
      }
      if (day < 10) {
        day = '0'.concat(day);
      }
      var date = ''.concat(full_year, '/').concat(month, '/').concat(day);
      if (date.length === 8) {
        if (!(0, _isDate.default)(date, 'YY/MM/DD')) {
          return false;
        }
      } else if (!(0, _isDate.default)(date, 'YYYY/MM/DD')) {
        return false;
      }
      return algorithms.luhnCheck(tin.replace(/\W/, ''));
    }

    /**
     * uk-UA validation function
     * Verify TIN validity by calculating check (last) digit (variant of MOD 11)
     */
    function ukUaCheck(tin) {
      // Calculate check digit
      var digits = tin.split('').map(a => parseInt(a, 10));
      var multipliers = [-1, 5, 7, 9, 4, 6, 10, 5, 7];
      var checksum = 0;
      for (var i = 0; i < multipliers.length; i++) {
        checksum += digits[i] * multipliers[i];
      }
      return checksum % 11 === 10
        ? digits[9] === 0
        : digits[9] === checksum % 11;
    }

    // Locale lookup objects

    /*
     * Tax id regex formats for various locales
     *
     * Where not explicitly specified in DG-TAXUD document both
     * uppercase and lowercase letters are acceptable.
     */
    var taxIdFormat = {
      'bg-BG': /^\d{10}$/,
      'cs-CZ': /^\d{6}\/{0,1}\d{3,4}$/,
      'de-AT': /^\d{9}$/,
      'de-DE': /^[1-9]\d{10}$/,
      'dk-DK': /^\d{6}-{0,1}\d{4}$/,
      'el-CY': /^[09]\d{7}[A-Z]$/,
      'el-GR': /^([0-4]|[7-9])\d{8}$/,
      'en-CA': /^\d{9}$/,
      'en-GB':
        /^\d{10}$|^(?!GB|NK|TN|ZZ)(?![DFIQUV])[A-Z](?![DFIQUVO])[A-Z]\d{6}[ABCD ]$/i,
      'en-IE': /^\d{7}[A-W][A-IW]{0,1}$/i,
      'en-US': /^\d{2}[- ]{0,1}\d{7}$/,
      'es-AR': /(20|23|24|27|30|33|34)[0-9]{8}[0-9]/,
      'es-ES': /^(\d{0,8}|[XYZKLM]\d{7})[A-HJ-NP-TV-Z]$/i,
      'et-EE': /^[1-6]\d{6}(00[1-9]|0[1-9][0-9]|[1-6][0-9]{2}|70[0-9]|710)\d$/,
      'fi-FI': /^\d{6}[-+A]\d{3}[0-9A-FHJ-NPR-Y]$/i,
      'fr-BE': /^\d{11}$/,
      'fr-FR': /^[0-3]\d{12}$|^[0-3]\d\s\d{2}(\s\d{3}){3}$/,
      // Conforms both to official spec and provided example
      'fr-LU': /^\d{13}$/,
      'hr-HR': /^\d{11}$/,
      'hu-HU': /^8\d{9}$/,
      'it-IT':
        /^[A-Z]{6}[L-NP-V0-9]{2}[A-EHLMPRST][L-NP-V0-9]{2}[A-ILMZ][L-NP-V0-9]{3}[A-Z]$/i,
      'lv-LV': /^\d{6}-{0,1}\d{5}$/,
      // Conforms both to DG TAXUD spec and original research
      'mt-MT': /^\d{3,7}[APMGLHBZ]$|^([1-8])\1\d{7}$/i,
      'nl-NL': /^\d{9}$/,
      'pl-PL': /^\d{10,11}$/,
      'pt-BR': /(?:^\d{11}$)|(?:^\d{14}$)/,
      'pt-PT': /^\d{9}$/,
      'ro-RO': /^\d{13}$/,
      'sk-SK': /^\d{6}\/{0,1}\d{3,4}$/,
      'sl-SI': /^[1-9]\d{7}$/,
      'sv-SE': /^(\d{6}[-+]{0,1}\d{4}|(18|19|20)\d{6}[-+]{0,1}\d{4})$/,
      'uk-UA': /^\d{10}$/
    };
    // taxIdFormat locale aliases
    taxIdFormat['lb-LU'] = taxIdFormat['fr-LU'];
    taxIdFormat['lt-LT'] = taxIdFormat['et-EE'];
    taxIdFormat['nl-BE'] = taxIdFormat['fr-BE'];
    taxIdFormat['fr-CA'] = taxIdFormat['en-CA'];

    // Algorithmic tax id check functions for various locales
    var taxIdCheck = {
      'bg-BG': bgBgCheck,
      'cs-CZ': csCzCheck,
      'de-AT': deAtCheck,
      'de-DE': deDeCheck,
      'dk-DK': dkDkCheck,
      'el-CY': elCyCheck,
      'el-GR': elGrCheck,
      'en-CA': isCanadianSIN,
      'en-IE': enIeCheck,
      'en-US': enUsCheck,
      'es-AR': esArCheck,
      'es-ES': esEsCheck,
      'et-EE': etEeCheck,
      'fi-FI': fiFiCheck,
      'fr-BE': frBeCheck,
      'fr-FR': frFrCheck,
      'fr-LU': frLuCheck,
      'hr-HR': hrHrCheck,
      'hu-HU': huHuCheck,
      'it-IT': itItCheck,
      'lv-LV': lvLvCheck,
      'mt-MT': mtMtCheck,
      'nl-NL': nlNlCheck,
      'pl-PL': plPlCheck,
      'pt-BR': ptBrCheck,
      'pt-PT': ptPtCheck,
      'ro-RO': roRoCheck,
      'sk-SK': skSkCheck,
      'sl-SI': slSiCheck,
      'sv-SE': svSeCheck,
      'uk-UA': ukUaCheck
    };
    // taxIdCheck locale aliases
    taxIdCheck['lb-LU'] = taxIdCheck['fr-LU'];
    taxIdCheck['lt-LT'] = taxIdCheck['et-EE'];
    taxIdCheck['nl-BE'] = taxIdCheck['fr-BE'];
    taxIdCheck['fr-CA'] = taxIdCheck['en-CA'];

    // Regexes for locales where characters should be omitted before checking format
    var allsymbols = /[-\\/!@#$%^&*()+=[\]]+/g;
    var sanitizeRegexes = {
      'de-AT': allsymbols,
      'de-DE': /[/\\]/g,
      'fr-BE': allsymbols
    };
    // sanitizeRegexes locale aliases
    sanitizeRegexes['nl-BE'] = sanitizeRegexes['fr-BE'];

    /*
     * Validator function
     * Return true if the passed string is a valid tax identification number
     * for the specified locale.
     * Throw an error exception if the locale is not supported.
     */
    function isTaxID(str) {
      var locale =
        arguments.length > 1 && arguments[1] !== undefined
          ? arguments[1]
          : 'en-US';
      (0, _assertString.default)(str);
      // Copy TIN to avoid replacement if sanitized
      var strcopy = str.slice(0);
      if (locale in taxIdFormat) {
        if (locale in sanitizeRegexes) {
          strcopy = strcopy.replace(sanitizeRegexes[locale], '');
        }
        if (!taxIdFormat[locale].test(strcopy)) {
          return false;
        }
        if (locale in taxIdCheck) {
          return taxIdCheck[locale](strcopy);
        }
        // Fallthrough; not all locales have algorithmic checks
        return true;
      }
      throw new Error("Invalid locale '".concat(locale, "'"));
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 9527: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isTime;
    var _merge = _interopRequireDefault(__webpack_require__(9956));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var default_time_options = {
      hourFormat: 'hour24',
      mode: 'default'
    };
    var formats = {
      hour24: {
        default: /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/,
        withSeconds: /^([01]?[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/
      },
      hour12: {
        default: /^(0?[1-9]|1[0-2]):([0-5][0-9]) (A|P)M$/,
        withSeconds: /^(0?[1-9]|1[0-2]):([0-5][0-9]):([0-5][0-9]) (A|P)M$/
      }
    };
    function isTime(input, options) {
      options = (0, _merge.default)(options, default_time_options);
      if (typeof input !== 'string') return false;
      return formats[options.hourFormat][options.mode].test(input);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 1793: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isURL;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _isFQDN = _interopRequireDefault(__webpack_require__(4972));
    var _isIP = _interopRequireDefault(__webpack_require__(8253));
    var _merge = _interopRequireDefault(__webpack_require__(9956));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function _slicedToArray(arr, i) {
      return (
        _arrayWithHoles(arr) ||
        _iterableToArrayLimit(arr, i) ||
        _unsupportedIterableToArray(arr, i) ||
        _nonIterableRest()
      );
    }
    function _nonIterableRest() {
      throw new TypeError(
        'Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
      );
    }
    function _unsupportedIterableToArray(o, minLen) {
      if (!o) return;
      if (typeof o === 'string') return _arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === 'Object' && o.constructor) n = o.constructor.name;
      if (n === 'Map' || n === 'Set') return Array.from(o);
      if (
        n === 'Arguments' ||
        /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)
      )
        return _arrayLikeToArray(o, minLen);
    }
    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length) len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
      return arr2;
    }
    function _iterableToArrayLimit(r, l) {
      var t =
        null == r
          ? null
          : ('undefined' != typeof Symbol && r[Symbol.iterator]) ||
            r['@@iterator'];
      if (null != t) {
        var e,
          n,
          i,
          u,
          a = [],
          f = !0,
          o = !1;
        try {
          if (((i = (t = t.call(r)).next), 0 === l)) {
            if (Object(t) !== t) return;
            f = !1;
          } else
            for (
              ;
              !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l);
              f = !0
            );
        } catch (r) {
          (o = !0), (n = r);
        } finally {
          try {
            if (!f && null != t.return && ((u = t.return()), Object(u) !== u))
              return;
          } finally {
            if (o) throw n;
          }
        }
        return a;
      }
    }
    function _arrayWithHoles(arr) {
      if (Array.isArray(arr)) return arr;
    }
    /*
options for isURL method

require_protocol - if set as true isURL will return false if protocol is not present in the URL
require_valid_protocol - isURL will check if the URL's protocol is present in the protocols option
protocols - valid protocols can be modified with this option
require_host - if set as false isURL will not check if host is present in the URL
require_port - if set as true isURL will check if port is present in the URL
allow_protocol_relative_urls - if set as true protocol relative URLs will be allowed
validate_length - if set as false isURL will skip string length validation (IE maximum is 2083)

*/

    var default_url_options = {
      protocols: ['http', 'https', 'ftp'],
      require_tld: true,
      require_protocol: false,
      require_host: true,
      require_port: false,
      require_valid_protocol: true,
      allow_underscores: false,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false,
      allow_fragments: true,
      allow_query_components: true,
      validate_length: true
    };
    var wrapped_ipv6 = /^\[([^\]]+)\](?::([0-9]+))?$/;
    function isRegExp(obj) {
      return Object.prototype.toString.call(obj) === '[object RegExp]';
    }
    function checkHost(host, matches) {
      for (var i = 0; i < matches.length; i++) {
        var match = matches[i];
        if (host === match || (isRegExp(match) && match.test(host))) {
          return true;
        }
      }
      return false;
    }
    function isURL(url, options) {
      (0, _assertString.default)(url);
      if (!url || /[\s<>]/.test(url)) {
        return false;
      }
      if (url.indexOf('mailto:') === 0) {
        return false;
      }
      options = (0, _merge.default)(options, default_url_options);
      if (options.validate_length && url.length >= 2083) {
        return false;
      }
      if (!options.allow_fragments && url.includes('#')) {
        return false;
      }
      if (
        !options.allow_query_components &&
        (url.includes('?') || url.includes('&'))
      ) {
        return false;
      }
      var protocol, auth, host, hostname, port, port_str, split, ipv6;
      split = url.split('#');
      url = split.shift();
      split = url.split('?');
      url = split.shift();
      split = url.split('://');
      if (split.length > 1) {
        protocol = split.shift().toLowerCase();
        if (
          options.require_valid_protocol &&
          options.protocols.indexOf(protocol) === -1
        ) {
          return false;
        }
      } else if (options.require_protocol) {
        return false;
      } else if (url.slice(0, 2) === '//') {
        if (!options.allow_protocol_relative_urls) {
          return false;
        }
        split[0] = url.slice(2);
      }
      url = split.join('://');
      if (url === '') {
        return false;
      }
      split = url.split('/');
      url = split.shift();
      if (url === '' && !options.require_host) {
        return true;
      }
      split = url.split('@');
      if (split.length > 1) {
        if (options.disallow_auth) {
          return false;
        }
        if (split[0] === '') {
          return false;
        }
        auth = split.shift();
        if (auth.indexOf(':') >= 0 && auth.split(':').length > 2) {
          return false;
        }
        var _auth$split = auth.split(':'),
          _auth$split2 = _slicedToArray(_auth$split, 2),
          user = _auth$split2[0],
          password = _auth$split2[1];
        if (user === '' && password === '') {
          return false;
        }
      }
      hostname = split.join('@');
      port_str = null;
      ipv6 = null;
      var ipv6_match = hostname.match(wrapped_ipv6);
      if (ipv6_match) {
        host = '';
        ipv6 = ipv6_match[1];
        port_str = ipv6_match[2] || null;
      } else {
        split = hostname.split(':');
        host = split.shift();
        if (split.length) {
          port_str = split.join(':');
        }
      }
      if (port_str !== null && port_str.length > 0) {
        port = parseInt(port_str, 10);
        if (!/^[0-9]+$/.test(port_str) || port <= 0 || port > 65535) {
          return false;
        }
      } else if (options.require_port) {
        return false;
      }
      if (options.host_whitelist) {
        return checkHost(host, options.host_whitelist);
      }
      if (host === '' && !options.require_host) {
        return true;
      }
      if (
        !(0, _isIP.default)(host) &&
        !(0, _isFQDN.default)(host, options) &&
        (!ipv6 || !(0, _isIP.default)(ipv6, 6))
      ) {
        return false;
      }
      host = host || ipv6;
      if (options.host_blacklist && checkHost(host, options.host_blacklist)) {
        return false;
      }
      return true;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 6455: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isUUID;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var uuid = {
      1: /^[0-9A-F]{8}-[0-9A-F]{4}-1[0-9A-F]{3}-[0-9A-F]{4}-[0-9A-F]{12}$/i,
      2: /^[0-9A-F]{8}-[0-9A-F]{4}-2[0-9A-F]{3}-[0-9A-F]{4}-[0-9A-F]{12}$/i,
      3: /^[0-9A-F]{8}-[0-9A-F]{4}-3[0-9A-F]{3}-[0-9A-F]{4}-[0-9A-F]{12}$/i,
      4: /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
      5: /^[0-9A-F]{8}-[0-9A-F]{4}-5[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
      7: /^[0-9A-F]{8}-[0-9A-F]{4}-7[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
      all: /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i
    };
    function isUUID(str, version) {
      (0, _assertString.default)(str);
      var pattern =
        uuid[![undefined, null].includes(version) ? version : 'all'];
      return !!pattern && pattern.test(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 6413: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isUppercase;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function isUppercase(str) {
      (0, _assertString.default)(str);
      return str === str.toUpperCase();
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 4551: /***/ (__unused_webpack_module, exports, __webpack_require__) => {
    function _typeof(o) {
      '@babel/helpers - typeof';
      return (
        (_typeof =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? o => typeof o
            : o =>
                o &&
                'function' == typeof Symbol &&
                o.constructor === Symbol &&
                o !== Symbol.prototype
                  ? 'symbol'
                  : typeof o),
        _typeof(o)
      );
    }
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isVAT;
    exports.vatMatchers = void 0;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var algorithms = _interopRequireWildcard(__webpack_require__(4134));
    function _getRequireWildcardCache(e) {
      if ('function' != typeof WeakMap) return null;
      var r = new WeakMap(),
        t = new WeakMap();
      return (_getRequireWildcardCache = function _getRequireWildcardCache(e) {
        return e ? t : r;
      })(e);
    }
    function _interopRequireWildcard(e, r) {
      if (!r && e && e.__esModule) return e;
      if (null === e || ('object' != _typeof(e) && 'function' != typeof e))
        return { default: e };
      var t = _getRequireWildcardCache(r);
      if (t && t.has(e)) return t.get(e);
      var n = { __proto__: null },
        a = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var u in e)
        if ('default' !== u && Object.hasOwn(e, u)) {
          var i = a ? Object.getOwnPropertyDescriptor(e, u) : null;
          i && (i.get || i.set)
            ? Object.defineProperty(n, u, i)
            : (n[u] = e[u]);
        }
      return (n.default = e), t && t.set(e, n), n;
    }
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var AU = function AU(str) {
      var match = str.match(/^(AU)?(\d{11})$/);
      if (!match) {
        return false;
      }
      // @see {@link https://abr.business.gov.au/Help/AbnFormat}
      var weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
      str = str.replace(/^AU/, '');
      var ABN = (parseInt(str.slice(0, 1), 10) - 1).toString() + str.slice(1);
      var total = 0;
      for (var i = 0; i < 11; i++) {
        total += weights[i] * ABN.charAt(i);
      }
      return total !== 0 && total % 89 === 0;
    };
    var CH = function CH(str) {
      // @see {@link https://www.ech.ch/de/ech/ech-0097/5.2.0}
      var hasValidCheckNumber = function hasValidCheckNumber(digits) {
        var lastDigit = digits.pop(); // used as check number
        var weights = [5, 4, 3, 2, 7, 6, 5, 4];
        var calculatedCheckNumber =
          (11 -
            (digits.reduce((acc, el, idx) => acc + el * weights[idx], 0) %
              11)) %
          11;
        return lastDigit === calculatedCheckNumber;
      };

      // @see {@link https://www.estv.admin.ch/estv/de/home/mehrwertsteuer/uid/mwst-uid-nummer.html}
      return (
        /^(CHE[- ]?)?(\d{9}|(\d{3}\.\d{3}\.\d{3})|(\d{3} \d{3} \d{3})) ?(TVA|MWST|IVA)?$/.test(
          str
        ) && hasValidCheckNumber(str.match(/\d/g).map(el => +el))
      );
    };
    var PT = function PT(str) {
      var match = str.match(/^(PT)?(\d{9})$/);
      if (!match) {
        return false;
      }
      var tin = match[2];
      var checksum =
        11 -
        (algorithms.reverseMultiplyAndSum(
          tin
            .split('')
            .slice(0, 8)
            .map(a => parseInt(a, 10)),
          9
        ) %
          11);
      if (checksum > 9) {
        return parseInt(tin[8], 10) === 0;
      }
      return checksum === parseInt(tin[8], 10);
    };
    var vatMatchers = (exports.vatMatchers = {
      /**
       * European Union VAT identification numbers
       */
      AT: function AT(str) {
        return /^(AT)?U\d{8}$/.test(str);
      },
      BE: function BE(str) {
        return /^(BE)?\d{10}$/.test(str);
      },
      BG: function BG(str) {
        return /^(BG)?\d{9,10}$/.test(str);
      },
      HR: function HR(str) {
        return /^(HR)?\d{11}$/.test(str);
      },
      CY: function CY(str) {
        return /^(CY)?\w{9}$/.test(str);
      },
      CZ: function CZ(str) {
        return /^(CZ)?\d{8,10}$/.test(str);
      },
      DK: function DK(str) {
        return /^(DK)?\d{8}$/.test(str);
      },
      EE: function EE(str) {
        return /^(EE)?\d{9}$/.test(str);
      },
      FI: function FI(str) {
        return /^(FI)?\d{8}$/.test(str);
      },
      FR: function FR(str) {
        return /^(FR)?\w{2}\d{9}$/.test(str);
      },
      DE: function DE(str) {
        return /^(DE)?\d{9}$/.test(str);
      },
      EL: function EL(str) {
        return /^(EL)?\d{9}$/.test(str);
      },
      HU: function HU(str) {
        return /^(HU)?\d{8}$/.test(str);
      },
      IE: function IE(str) {
        return /^(IE)?\d{7}\w{1}(W)?$/.test(str);
      },
      IT: function IT(str) {
        return /^(IT)?\d{11}$/.test(str);
      },
      LV: function LV(str) {
        return /^(LV)?\d{11}$/.test(str);
      },
      LT: function LT(str) {
        return /^(LT)?\d{9,12}$/.test(str);
      },
      LU: function LU(str) {
        return /^(LU)?\d{8}$/.test(str);
      },
      MT: function MT(str) {
        return /^(MT)?\d{8}$/.test(str);
      },
      NL: function NL(str) {
        return /^(NL)?\d{9}B\d{2}$/.test(str);
      },
      PL: function PL(str) {
        return /^(PL)?(\d{10}|(\d{3}-\d{3}-\d{2}-\d{2})|(\d{3}-\d{2}-\d{2}-\d{3}))$/.test(
          str
        );
      },
      PT: PT,
      RO: function RO(str) {
        return /^(RO)?\d{2,10}$/.test(str);
      },
      SK: function SK(str) {
        return /^(SK)?\d{10}$/.test(str);
      },
      SI: function SI(str) {
        return /^(SI)?\d{8}$/.test(str);
      },
      ES: function ES(str) {
        return /^(ES)?\w\d{7}[A-Z]$/.test(str);
      },
      SE: function SE(str) {
        return /^(SE)?\d{12}$/.test(str);
      },
      /**
       * VAT numbers of non-EU countries
       */
      AL: function AL(str) {
        return /^(AL)?\w{9}[A-Z]$/.test(str);
      },
      MK: function MK(str) {
        return /^(MK)?\d{13}$/.test(str);
      },
      AU: AU,
      BY: function BY(str) {
        return /^(УНП )?\d{9}$/.test(str);
      },
      CA: function CA(str) {
        return /^(CA)?\d{9}$/.test(str);
      },
      IS: function IS(str) {
        return /^(IS)?\d{5,6}$/.test(str);
      },
      IN: function IN(str) {
        return /^(IN)?\d{15}$/.test(str);
      },
      ID: function ID(str) {
        return /^(ID)?(\d{15}|(\d{2}.\d{3}.\d{3}.\d{1}-\d{3}.\d{3}))$/.test(
          str
        );
      },
      IL: function IL(str) {
        return /^(IL)?\d{9}$/.test(str);
      },
      KZ: function KZ(str) {
        return /^(KZ)?\d{12}$/.test(str);
      },
      NZ: function NZ(str) {
        return /^(NZ)?\d{9}$/.test(str);
      },
      NG: function NG(str) {
        return /^(NG)?(\d{12}|(\d{8}-\d{4}))$/.test(str);
      },
      NO: function NO(str) {
        return /^(NO)?\d{9}MVA$/.test(str);
      },
      PH: function PH(str) {
        return /^(PH)?(\d{12}|\d{3} \d{3} \d{3} \d{3})$/.test(str);
      },
      RU: function RU(str) {
        return /^(RU)?(\d{10}|\d{12})$/.test(str);
      },
      SM: function SM(str) {
        return /^(SM)?\d{5}$/.test(str);
      },
      SA: function SA(str) {
        return /^(SA)?\d{15}$/.test(str);
      },
      RS: function RS(str) {
        return /^(RS)?\d{9}$/.test(str);
      },
      CH: CH,
      TR: function TR(str) {
        return /^(TR)?\d{10}$/.test(str);
      },
      UA: function UA(str) {
        return /^(UA)?\d{12}$/.test(str);
      },
      GB: function GB(str) {
        return /^GB((\d{3} \d{4} ([0-8][0-9]|9[0-6]))|(\d{9} \d{3})|(((GD[0-4])|(HA[5-9]))[0-9]{2}))$/.test(
          str
        );
      },
      UZ: function UZ(str) {
        return /^(UZ)?\d{9}$/.test(str);
      },
      /**
       * VAT numbers of Latin American countries
       */
      AR: function AR(str) {
        return /^(AR)?\d{11}$/.test(str);
      },
      BO: function BO(str) {
        return /^(BO)?\d{7}$/.test(str);
      },
      BR: function BR(str) {
        return /^(BR)?((\d{2}.\d{3}.\d{3}\/\d{4}-\d{2})|(\d{3}.\d{3}.\d{3}-\d{2}))$/.test(
          str
        );
      },
      CL: function CL(str) {
        return /^(CL)?\d{8}-\d{1}$/.test(str);
      },
      CO: function CO(str) {
        return /^(CO)?\d{10}$/.test(str);
      },
      CR: function CR(str) {
        return /^(CR)?\d{9,12}$/.test(str);
      },
      EC: function EC(str) {
        return /^(EC)?\d{13}$/.test(str);
      },
      SV: function SV(str) {
        return /^(SV)?\d{4}-\d{6}-\d{3}-\d{1}$/.test(str);
      },
      GT: function GT(str) {
        return /^(GT)?\d{7}-\d{1}$/.test(str);
      },
      HN: function HN(str) {
        return /^(HN)?$/.test(str);
      },
      MX: function MX(str) {
        return /^(MX)?\w{3,4}\d{6}\w{3}$/.test(str);
      },
      NI: function NI(str) {
        return /^(NI)?\d{3}-\d{6}-\d{4}\w{1}$/.test(str);
      },
      PA: function PA(str) {
        return /^(PA)?$/.test(str);
      },
      PY: function PY(str) {
        return /^(PY)?\d{6,8}-\d{1}$/.test(str);
      },
      PE: function PE(str) {
        return /^(PE)?\d{11}$/.test(str);
      },
      DO: function DO(str) {
        return /^(DO)?(\d{11}|(\d{3}-\d{7}-\d{1})|[1,4,5]{1}\d{8}|([1,4,5]{1})-\d{2}-\d{5}-\d{1})$/.test(
          str
        );
      },
      UY: function UY(str) {
        return /^(UY)?\d{12}$/.test(str);
      },
      VE: function VE(str) {
        return /^(VE)?[J,G,V,E]{1}-(\d{9}|(\d{8}-\d{1}))$/.test(str);
      }
    });
    function isVAT(str, countryCode) {
      (0, _assertString.default)(str);
      (0, _assertString.default)(countryCode);
      if (countryCode in vatMatchers) {
        return vatMatchers[countryCode](str);
      }
      throw new Error("Invalid country code: '".concat(countryCode, "'"));
    }

    /***/
  },

  /***/ 8678: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isVariableWidth;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _isFullWidth = __webpack_require__(2619);
    var _isHalfWidth = __webpack_require__(2176);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function isVariableWidth(str) {
      (0, _assertString.default)(str);
      return (
        _isFullWidth.fullWidth.test(str) && _isHalfWidth.halfWidth.test(str)
      );
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 2124: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = isWhitelisted;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function isWhitelisted(str, chars) {
      (0, _assertString.default)(str);
      for (var i = str.length - 1; i >= 0; i--) {
        if (chars.indexOf(str[i]) === -1) {
          return false;
        }
      }
      return true;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 7622: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = ltrim;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function ltrim(str, chars) {
      (0, _assertString.default)(str);
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
      var pattern = chars
        ? new RegExp(
            '^['.concat(chars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), ']+'),
            'g'
          )
        : /^\s+/g;
      return str.replace(pattern, '');
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 9189: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = matches;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function matches(str, pattern, modifiers) {
      (0, _assertString.default)(str);
      if (Object.prototype.toString.call(pattern) !== '[object RegExp]') {
        pattern = new RegExp(pattern, modifiers);
      }
      return !!str.match(pattern);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 1733: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = normalizeEmail;
    var _merge = _interopRequireDefault(__webpack_require__(9956));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var default_normalize_email_options = {
      // The following options apply to all email addresses
      // Lowercases the local part of the email address.
      // Please note this may violate RFC 5321 as per http://stackoverflow.com/a/9808332/192024).
      // The domain is always lowercased, as per RFC 1035
      all_lowercase: true,
      // The following conversions are specific to GMail
      // Lowercases the local part of the GMail address (known to be case-insensitive)
      gmail_lowercase: true,
      // Removes dots from the local part of the email address, as that's ignored by GMail
      gmail_remove_dots: true,
      // Removes the subaddress (e.g. "+foo") from the email address
      gmail_remove_subaddress: true,
      // Conversts the googlemail.com domain to gmail.com
      gmail_convert_googlemaildotcom: true,
      // The following conversions are specific to Outlook.com / Windows Live / Hotmail
      // Lowercases the local part of the Outlook.com address (known to be case-insensitive)
      outlookdotcom_lowercase: true,
      // Removes the subaddress (e.g. "+foo") from the email address
      outlookdotcom_remove_subaddress: true,
      // The following conversions are specific to Yahoo
      // Lowercases the local part of the Yahoo address (known to be case-insensitive)
      yahoo_lowercase: true,
      // Removes the subaddress (e.g. "-foo") from the email address
      yahoo_remove_subaddress: true,
      // The following conversions are specific to Yandex
      // Lowercases the local part of the Yandex address (known to be case-insensitive)
      yandex_lowercase: true,
      // The following conversions are specific to iCloud
      // Lowercases the local part of the iCloud address (known to be case-insensitive)
      icloud_lowercase: true,
      // Removes the subaddress (e.g. "+foo") from the email address
      icloud_remove_subaddress: true
    };

    // List of domains used by iCloud
    var icloud_domains = ['icloud.com', 'me.com'];

    // List of domains used by Outlook.com and its predecessors
    // This list is likely incomplete.
    // Partial reference:
    // https://blogs.office.com/2013/04/17/outlook-com-gets-two-step-verification-sign-in-by-alias-and-new-international-domains/
    var outlookdotcom_domains = [
      'hotmail.at',
      'hotmail.be',
      'hotmail.ca',
      'hotmail.cl',
      'hotmail.co.il',
      'hotmail.co.nz',
      'hotmail.co.th',
      'hotmail.co.uk',
      'hotmail.com',
      'hotmail.com.ar',
      'hotmail.com.au',
      'hotmail.com.br',
      'hotmail.com.gr',
      'hotmail.com.mx',
      'hotmail.com.pe',
      'hotmail.com.tr',
      'hotmail.com.vn',
      'hotmail.cz',
      'hotmail.de',
      'hotmail.dk',
      'hotmail.es',
      'hotmail.fr',
      'hotmail.hu',
      'hotmail.id',
      'hotmail.ie',
      'hotmail.in',
      'hotmail.it',
      'hotmail.jp',
      'hotmail.kr',
      'hotmail.lv',
      'hotmail.my',
      'hotmail.ph',
      'hotmail.pt',
      'hotmail.sa',
      'hotmail.sg',
      'hotmail.sk',
      'live.be',
      'live.co.uk',
      'live.com',
      'live.com.ar',
      'live.com.mx',
      'live.de',
      'live.es',
      'live.eu',
      'live.fr',
      'live.it',
      'live.nl',
      'msn.com',
      'outlook.at',
      'outlook.be',
      'outlook.cl',
      'outlook.co.il',
      'outlook.co.nz',
      'outlook.co.th',
      'outlook.com',
      'outlook.com.ar',
      'outlook.com.au',
      'outlook.com.br',
      'outlook.com.gr',
      'outlook.com.pe',
      'outlook.com.tr',
      'outlook.com.vn',
      'outlook.cz',
      'outlook.de',
      'outlook.dk',
      'outlook.es',
      'outlook.fr',
      'outlook.hu',
      'outlook.id',
      'outlook.ie',
      'outlook.in',
      'outlook.it',
      'outlook.jp',
      'outlook.kr',
      'outlook.lv',
      'outlook.my',
      'outlook.ph',
      'outlook.pt',
      'outlook.sa',
      'outlook.sg',
      'outlook.sk',
      'passport.com'
    ];

    // List of domains used by Yahoo Mail
    // This list is likely incomplete
    var yahoo_domains = [
      'rocketmail.com',
      'yahoo.ca',
      'yahoo.co.uk',
      'yahoo.com',
      'yahoo.de',
      'yahoo.fr',
      'yahoo.in',
      'yahoo.it',
      'ymail.com'
    ];

    // List of domains used by yandex.ru
    var yandex_domains = [
      'yandex.ru',
      'yandex.ua',
      'yandex.kz',
      'yandex.com',
      'yandex.by',
      'ya.ru'
    ];

    // replace single dots, but not multiple consecutive dots
    function dotsReplacer(match) {
      if (match.length > 1) {
        return match;
      }
      return '';
    }
    function normalizeEmail(email, options) {
      options = (0, _merge.default)(options, default_normalize_email_options);
      var raw_parts = email.split('@');
      var domain = raw_parts.pop();
      var user = raw_parts.join('@');
      var parts = [user, domain];

      // The domain is always lowercased, as it's case-insensitive per RFC 1035
      parts[1] = parts[1].toLowerCase();
      if (parts[1] === 'gmail.com' || parts[1] === 'googlemail.com') {
        // Address is GMail
        if (options.gmail_remove_subaddress) {
          parts[0] = parts[0].split('+')[0];
        }
        if (options.gmail_remove_dots) {
          // this does not replace consecutive dots like example..email@gmail.com
          parts[0] = parts[0].replace(/\.+/g, dotsReplacer);
        }
        if (!parts[0].length) {
          return false;
        }
        if (options.all_lowercase || options.gmail_lowercase) {
          parts[0] = parts[0].toLowerCase();
        }
        parts[1] = options.gmail_convert_googlemaildotcom
          ? 'gmail.com'
          : parts[1];
      } else if (icloud_domains.indexOf(parts[1]) >= 0) {
        // Address is iCloud
        if (options.icloud_remove_subaddress) {
          parts[0] = parts[0].split('+')[0];
        }
        if (!parts[0].length) {
          return false;
        }
        if (options.all_lowercase || options.icloud_lowercase) {
          parts[0] = parts[0].toLowerCase();
        }
      } else if (outlookdotcom_domains.indexOf(parts[1]) >= 0) {
        // Address is Outlook.com
        if (options.outlookdotcom_remove_subaddress) {
          parts[0] = parts[0].split('+')[0];
        }
        if (!parts[0].length) {
          return false;
        }
        if (options.all_lowercase || options.outlookdotcom_lowercase) {
          parts[0] = parts[0].toLowerCase();
        }
      } else if (yahoo_domains.indexOf(parts[1]) >= 0) {
        // Address is Yahoo
        if (options.yahoo_remove_subaddress) {
          var components = parts[0].split('-');
          parts[0] =
            components.length > 1
              ? components.slice(0, -1).join('-')
              : components[0];
        }
        if (!parts[0].length) {
          return false;
        }
        if (options.all_lowercase || options.yahoo_lowercase) {
          parts[0] = parts[0].toLowerCase();
        }
      } else if (yandex_domains.indexOf(parts[1]) >= 0) {
        if (options.all_lowercase || options.yandex_lowercase) {
          parts[0] = parts[0].toLowerCase();
        }
        parts[1] = 'yandex.ru'; // all yandex domains are equal, 1st preferred
      } else if (options.all_lowercase) {
        // Any other address
        parts[0] = parts[0].toLowerCase();
      }
      return parts.join('@');
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 8213: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = rtrim;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function rtrim(str, chars) {
      (0, _assertString.default)(str);
      if (chars) {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
        var pattern = new RegExp(
          '['.concat(chars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), ']+$'),
          'g'
        );
        return str.replace(pattern, '');
      }
      // Use a faster and more safe than regex trim method https://blog.stevenlevithan.com/archives/faster-trim-javascript
      var strIndex = str.length - 1;
      while (/\s/.test(str.charAt(strIndex))) {
        strIndex -= 1;
      }
      return str.slice(0, strIndex + 1);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 1117: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = stripLow;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    var _blacklist = _interopRequireDefault(__webpack_require__(2316));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function stripLow(str, keep_new_lines) {
      (0, _assertString.default)(str);
      var chars = keep_new_lines
        ? '\\x00-\\x09\\x0B\\x0C\\x0E-\\x1F\\x7F'
        : '\\x00-\\x1F\\x7F';
      return (0, _blacklist.default)(str, chars);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 1960: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = toBoolean;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function toBoolean(str, strict) {
      (0, _assertString.default)(str);
      if (strict) {
        return str === '1' || /^true$/i.test(str);
      }
      return str !== '0' && !/^false$/i.test(str) && str !== '';
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 3834: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = toDate;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function toDate(date) {
      (0, _assertString.default)(date);
      date = Date.parse(date);
      return !isNaN(date) ? new Date(date) : null;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 2429: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = toFloat;
    var _isFloat = _interopRequireDefault(__webpack_require__(3158));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function toFloat(str) {
      if (!(0, _isFloat.default)(str)) return NaN;
      return parseFloat(str);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 5237: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = toInt;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function toInt(str, radix) {
      (0, _assertString.default)(str);
      return parseInt(str, radix || 10);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 3495: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = trim;
    var _rtrim = _interopRequireDefault(__webpack_require__(8213));
    var _ltrim = _interopRequireDefault(__webpack_require__(7622));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function trim(str, chars) {
      return (0, _rtrim.default)((0, _ltrim.default)(str, chars), chars);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 2224: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = unescape;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function unescape(str) {
      (0, _assertString.default)(str);
      return str
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#x2F;/g, '/')
        .replace(/&#x5C;/g, '\\')
        .replace(/&#96;/g, '`')
        .replace(/&amp;/g, '&');
      // &amp; replacement has to be the last one to prevent
      // bugs with intermediate strings containing escape sequences
      // See: https://github.com/validatorjs/validator.js/issues/1827
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 4134: /***/ (__unused_webpack_module, exports) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports.iso7064Check = iso7064Check;
    exports.luhnCheck = luhnCheck;
    exports.reverseMultiplyAndSum = reverseMultiplyAndSum;
    exports.verhoeffCheck = verhoeffCheck;
    /**
     * Algorithmic validation functions
     * May be used as is or implemented in the workflow of other validators.
     */

    /*
     * ISO 7064 validation function
     * Called with a string of numbers (incl. check digit)
     * to validate according to ISO 7064 (MOD 11, 10).
     */
    function iso7064Check(str) {
      var checkvalue = 10;
      for (var i = 0; i < str.length - 1; i++) {
        checkvalue =
          (parseInt(str[i], 10) + checkvalue) % 10 === 0
            ? (10 * 2) % 11
            : (((parseInt(str[i], 10) + checkvalue) % 10) * 2) % 11;
      }
      checkvalue = checkvalue === 1 ? 0 : 11 - checkvalue;
      return checkvalue === parseInt(str[10], 10);
    }

    /*
     * Luhn (mod 10) validation function
     * Called with a string of numbers (incl. check digit)
     * to validate according to the Luhn algorithm.
     */
    function luhnCheck(str) {
      var checksum = 0;
      var second = false;
      for (var i = str.length - 1; i >= 0; i--) {
        if (second) {
          var product = parseInt(str[i], 10) * 2;
          if (product > 9) {
            // sum digits of product and add to checksum
            checksum += product
              .toString()
              .split('')
              .map(a => parseInt(a, 10))
              .reduce((a, b) => a + b, 0);
          } else {
            checksum += product;
          }
        } else {
          checksum += parseInt(str[i], 10);
        }
        second = !second;
      }
      return checksum % 10 === 0;
    }

    /*
     * Reverse TIN multiplication and summation helper function
     * Called with an array of single-digit integers and a base multiplier
     * to calculate the sum of the digits multiplied in reverse.
     * Normally used in variations of MOD 11 algorithmic checks.
     */
    function reverseMultiplyAndSum(digits, base) {
      var total = 0;
      for (var i = 0; i < digits.length; i++) {
        total += digits[i] * (base - i);
      }
      return total;
    }

    /*
     * Verhoeff validation helper function
     * Called with a string of numbers
     * to validate according to the Verhoeff algorithm.
     */
    function verhoeffCheck(str) {
      var d_table = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
        [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
        [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
        [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
        [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
        [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
        [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
        [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
        [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
      ];
      var p_table = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
        [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
        [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
        [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
        [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
        [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
        [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
      ];

      // Copy (to prevent replacement) and reverse
      var str_copy = str.split('').reverse().join('');
      var checksum = 0;
      for (var i = 0; i < str_copy.length; i++) {
        checksum = d_table[checksum][p_table[i % 8][parseInt(str_copy[i], 10)]];
      }
      return checksum === 0;
    }

    /***/
  },

  /***/ 1420: /***/ (module, exports) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = assertString;
    function _typeof(o) {
      '@babel/helpers - typeof';
      return (
        (_typeof =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? o => typeof o
            : o =>
                o &&
                'function' == typeof Symbol &&
                o.constructor === Symbol &&
                o !== Symbol.prototype
                  ? 'symbol'
                  : typeof o),
        _typeof(o)
      );
    }
    function assertString(input) {
      var isString = typeof input === 'string' || input instanceof String;
      if (!isString) {
        var invalidType = _typeof(input);
        if (input === null) invalidType = 'null';
        else if (invalidType === 'object') invalidType = input.constructor.name;
        throw new TypeError(
          'Expected a string but received a '.concat(invalidType)
        );
      }
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 5484: /***/ (module, exports) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = void 0;
    var includes = function includes(arr, val) {
      return arr.some(arrVal => val === arrVal);
    };
    var _default = (exports['default'] = includes);
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 9956: /***/ (module, exports) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = merge;
    function merge() {
      var obj =
        arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var defaults = arguments.length > 1 ? arguments[1] : undefined;
      for (var key in defaults) {
        if (typeof obj[key] === 'undefined') {
          obj[key] = defaults[key];
        }
      }
      return obj;
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 4112: /***/ (module, exports) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = multilineRegexp;
    /**
     * Build RegExp object from an array
     * of multiple/multi-line regexp parts
     *
     * @param {string[]} parts
     * @param {string} flags
     * @return {object} - RegExp object
     */
    function multilineRegexp(parts, flags) {
      var regexpAsStringLiteral = parts.join('');
      return new RegExp(regexpAsStringLiteral, flags);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 6451: /***/ (module, exports) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = toString;
    function _typeof(o) {
      '@babel/helpers - typeof';
      return (
        (_typeof =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? o => typeof o
            : o =>
                o &&
                'function' == typeof Symbol &&
                o.constructor === Symbol &&
                o !== Symbol.prototype
                  ? 'symbol'
                  : typeof o),
        _typeof(o)
      );
    }
    function toString(input) {
      if (_typeof(input) === 'object' && input !== null) {
        if (typeof input.toString === 'function') {
          input = input.toString();
        } else {
          input = '[object Object]';
        }
      } else if (
        input === null ||
        typeof input === 'undefined' ||
        (isNaN(input) && !input.length)
      ) {
        input = '';
      }
      return String(input);
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 6235: /***/ (module, exports, __webpack_require__) => {
    Object.defineProperty(exports, '__esModule', {
      value: true
    });
    exports['default'] = whitelist;
    var _assertString = _interopRequireDefault(__webpack_require__(1420));
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function whitelist(str, chars) {
      (0, _assertString.default)(str);
      return str.replace(new RegExp('[^'.concat(chars, ']+'), 'g'), '');
    }
    module.exports = exports.default;
    module.exports['default'] = exports.default;

    /***/
  },

  /***/ 8867: /***/ (module, __unused_webpack_exports, __webpack_require__) => {
    const WebSocket = __webpack_require__(1518);

    WebSocket.createWebSocketStream = __webpack_require__(1658);
    WebSocket.Server = __webpack_require__(8887);
    WebSocket.Receiver = __webpack_require__(5066);
    WebSocket.Sender = __webpack_require__(6947);

    module.exports = WebSocket;

    /***/
  },

  /***/ 9436: /***/ (module, __unused_webpack_exports, __webpack_require__) => {
    const { EMPTY_BUFFER } = __webpack_require__(5949);

    /**
     * Merges an array of buffers into a new buffer.
     *
     * @param {Buffer[]} list The array of buffers to concat
     * @param {Number} totalLength The total length of buffers in the list
     * @return {Buffer} The resulting buffer
     * @public
     */
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];

      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;

      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }

      if (offset < totalLength) return target.slice(0, offset);

      return target;
    }

    /**
     * Masks a buffer using the given mask.
     *
     * @param {Buffer} source The buffer to mask
     * @param {Buffer} mask The mask to use
     * @param {Buffer} output The buffer where to store the result
     * @param {Number} offset The offset at which to start writing
     * @param {Number} length The number of bytes to mask.
     * @public
     */
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }

    /**
     * Unmasks a buffer using the given mask.
     *
     * @param {Buffer} buffer The buffer to unmask
     * @param {Buffer} mask The mask to use
     * @public
     */
    function _unmask(buffer, mask) {
      // Required until https://github.com/nodejs/node/issues/9006 is resolved.
      const length = buffer.length;
      for (let i = 0; i < length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }

    /**
     * Converts a buffer to an `ArrayBuffer`.
     *
     * @param {Buffer} buf The buffer to convert
     * @return {ArrayBuffer} Converted buffer
     * @public
     */
    function toArrayBuffer(buf) {
      if (buf.byteLength === buf.buffer.byteLength) {
        return buf.buffer;
      }

      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }

    /**
     * Converts `data` to a `Buffer`.
     *
     * @param {*} data The data to convert
     * @return {Buffer} The buffer
     * @throws {TypeError}
     * @public
     */
    function toBuffer(data) {
      toBuffer.readOnly = true;

      if (Buffer.isBuffer(data)) return data;

      let buf;

      if (data instanceof ArrayBuffer) {
        buf = Buffer.from(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }

      return buf;
    }

    try {
      const bufferUtil = __webpack_require__(1269);
      const bu = bufferUtil.BufferUtil || bufferUtil;

      module.exports = {
        concat,
        mask(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bu.mask(source, mask, output, offset, length);
        },
        toArrayBuffer,
        toBuffer,
        unmask(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bu.unmask(buffer, mask);
        }
      };
    } catch (e) /* istanbul ignore next */ {
      module.exports = {
        concat,
        mask: _mask,
        toArrayBuffer,
        toBuffer,
        unmask: _unmask
      };
    }

    /***/
  },

  /***/ 5949: /***/ module => {
    module.exports = {
      BINARY_TYPES: ['nodebuffer', 'arraybuffer', 'fragments'],
      GUID: '258EAFA5-E914-47DA-95CA-C5AB0DC85B11',
      kStatusCode: Symbol('status-code'),
      kWebSocket: Symbol('websocket'),
      EMPTY_BUFFER: Buffer.alloc(0),
      NOOP: () => {}
    };

    /***/
  },

  /***/ 4561: /***/ module => {
    /**
     * Class representing an event.
     *
     * @private
     */
    class Event {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @param {Object} target A reference to the target to which the event was
       *     dispatched
       */
      constructor(type, target) {
        this.target = target;
        this.type = type;
      }
    }

    /**
     * Class representing a message event.
     *
     * @extends Event
     * @private
     */
    class MessageEvent extends Event {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {(String|Buffer|ArrayBuffer|Buffer[])} data The received data
       * @param {WebSocket} target A reference to the target to which the event was
       *     dispatched
       */
      constructor(data, target) {
        super('message', target);

        this.data = data;
      }
    }

    /**
     * Class representing a close event.
     *
     * @extends Event
     * @private
     */
    class CloseEvent extends Event {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {Number} code The status code explaining why the connection is being
       *     closed
       * @param {String} reason A human-readable string explaining why the
       *     connection is closing
       * @param {WebSocket} target A reference to the target to which the event was
       *     dispatched
       */
      constructor(code, reason, target) {
        super('close', target);

        this.wasClean = target._closeFrameReceived && target._closeFrameSent;
        this.reason = reason;
        this.code = code;
      }
    }

    /**
     * Class representing an open event.
     *
     * @extends Event
     * @private
     */
    class OpenEvent extends Event {
      /**
       * Create a new `OpenEvent`.
       *
       * @param {WebSocket} target A reference to the target to which the event was
       *     dispatched
       */
      constructor(target) {
        super('open', target);
      }
    }

    /**
     * Class representing an error event.
     *
     * @extends Event
     * @private
     */
    class ErrorEvent extends Event {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {Object} error The error that generated this event
       * @param {WebSocket} target A reference to the target to which the event was
       *     dispatched
       */
      constructor(error, target) {
        super('error', target);

        this.message = error.message;
        this.error = error;
      }
    }

    /**
     * This provides methods for emulating the `EventTarget` interface. It's not
     * meant to be used directly.
     *
     * @mixin
     */
    const EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {Function} listener The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean`` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, listener, options) {
        if (typeof listener !== 'function') return;

        function onMessage(data) {
          listener.call(this, new MessageEvent(data, this));
        }

        function onClose(code, message) {
          listener.call(this, new CloseEvent(code, message, this));
        }

        function onError(error) {
          listener.call(this, new ErrorEvent(error, this));
        }

        function onOpen() {
          listener.call(this, new OpenEvent(this));
        }

        const method = options && options.once ? 'once' : 'on';

        if (type === 'message') {
          onMessage._listener = listener;
          this[method](type, onMessage);
        } else if (type === 'close') {
          onClose._listener = listener;
          this[method](type, onClose);
        } else if (type === 'error') {
          onError._listener = listener;
          this[method](type, onError);
        } else if (type === 'open') {
          onOpen._listener = listener;
          this[method](type, onOpen);
        } else {
          this[method](type, listener);
        }
      },

      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {Function} listener The listener to remove
       * @public
       */
      removeEventListener(type, listener) {
        const listeners = this.listeners(type);

        for (let i = 0; i < listeners.length; i++) {
          if (
            listeners[i] === listener ||
            listeners[i]._listener === listener
          ) {
            this.removeListener(type, listeners[i]);
          }
        }
      }
    };

    module.exports = EventTarget;

    /***/
  },

  /***/ 2035: /***/ module => {
    //
    // Allowed token characters:
    //
    // '!', '#', '$', '%', '&', ''', '*', '+', '-',
    // '.', 0-9, A-Z, '^', '_', '`', a-z, '|', '~'
    //
    // tokenChars[32] === 0 // ' '
    // tokenChars[33] === 1 // '!'
    // tokenChars[34] === 0 // '"'
    // ...
    //
    // prettier-ignore
    const tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0, // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0, // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0, // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0, // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1, // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1, // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1, // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0 // 112 - 127
    ];

    /**
     * Adds an offer to the map of extension offers or a parameter to the map of
     * parameters.
     *
     * @param {Object} dest The map of extension offers or parameters
     * @param {String} name The extension or parameter name
     * @param {(Object|Boolean|String)} elem The extension parameters or the
     *     parameter value
     * @private
     */
    function push(dest, name, elem) {
      if (dest[name] === undefined) dest[name] = [elem];
      else dest[name].push(elem);
    }

    /**
     * Parses the `Sec-WebSocket-Extensions` header into an object.
     *
     * @param {String} header The field value of the header
     * @return {Object} The parsed object
     * @public
     */
    function parse(header) {
      const offers = Object.create(null);

      if (header === undefined || header === '') return offers;

      let params = Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let end = -1;
      let i = 0;

      for (; i < header.length; i++) {
        const code = header.charCodeAt(i);

        if (extensionName === undefined) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 0x20 /* ' ' */ || code === 0x09 /* '\t' */) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 0x3b /* ';' */ || code === 0x2c /* ',' */) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }

            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 0x2c) {
              push(offers, name, params);
              params = Object.create(null);
            } else {
              extensionName = name;
            }

            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === undefined) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 0x20 || code === 0x09) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 0x3b || code === 0x2c) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }

            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 0x2c) {
              push(offers, extensionName, params);
              params = Object.create(null);
              extensionName = undefined;
            }

            start = end = -1;
          } else if (code === 0x3d /* '=' */ && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          //
          // The value of a quoted-string after unescaping must conform to the
          // token ABNF, so only token characters are valid.
          // Ref: https://tools.ietf.org/html/rfc6455#section-9.1
          //
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 0x22 /* '"' */ && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 0x5c /* '\' */) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 0x22 && header.charCodeAt(i - 1) === 0x3d) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 0x20 || code === 0x09)) {
            if (end === -1) end = i;
          } else if (code === 0x3b || code === 0x2c) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }

            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, '');
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 0x2c) {
              push(offers, extensionName, params);
              params = Object.create(null);
              extensionName = undefined;
            }

            paramName = undefined;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }

      if (start === -1 || inQuotes) {
        throw new SyntaxError('Unexpected end of input');
      }

      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === undefined) {
        push(offers, token, params);
      } else {
        if (paramName === undefined) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ''));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }

      return offers;
    }

    /**
     * Builds the `Sec-WebSocket-Extensions` header field value.
     *
     * @param {Object} extensions The map of extensions and parameters to format
     * @return {String} A string representing the given object
     * @public
     */
    function format(extensions) {
      return Object.keys(extensions)
        .map(extension => {
          let configurations = extensions[extension];
          if (!Array.isArray(configurations)) configurations = [configurations];
          return configurations
            .map(params => {
              return [extension]
                .concat(
                  Object.keys(params).map(k => {
                    let values = params[k];
                    if (!Array.isArray(values)) values = [values];
                    return values
                      .map(v => (v === true ? k : `${k}=${v}`))
                      .join('; ');
                  })
                )
                .join('; ');
            })
            .join(', ');
        })
        .join(', ');
    }

    module.exports = { format, parse };

    /***/
  },

  /***/ 1356: /***/ module => {
    const kDone = Symbol('kDone');
    const kRun = Symbol('kRun');

    /**
     * A very simple job queue with adjustable concurrency. Adapted from
     * https://github.com/STRML/async-limiter
     */
    class Limiter {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }

      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }

      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;

        if (this.jobs.length) {
          const job = this.jobs.shift();

          this.pending++;
          job(this[kDone]);
        }
      }
    }

    module.exports = Limiter;

    /***/
  },

  /***/ 6684: /***/ (module, __unused_webpack_exports, __webpack_require__) => {
    const zlib = __webpack_require__(9796);

    const bufferUtil = __webpack_require__(9436);
    const Limiter = __webpack_require__(1356);
    const { kStatusCode, NOOP } = __webpack_require__(5949);

    const TRAILER = Buffer.from([0x00, 0x00, 0xff, 0xff]);
    const kPerMessageDeflate = Symbol('permessage-deflate');
    const kTotalLength = Symbol('total-length');
    const kCallback = Symbol('callback');
    const kBuffers = Symbol('buffers');
    const kError = Symbol('error');

    //
    // We limit zlib concurrency, which prevents severe memory fragmentation
    // as documented in https://github.com/nodejs/node/issues/8871#issuecomment-250915913
    // and https://github.com/websockets/ws/issues/1202
    //
    // Intentionally global; it's the global thread pool that's an issue.
    //
    let zlibLimiter;

    /**
     * permessage-deflate implementation.
     */
    class PerMessageDeflate {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {Boolean} [isServer=false] Create the instance in either server or
       *     client mode
       * @param {Number} [maxPayload=0] The maximum allowed message length
       */
      constructor(options, isServer, maxPayload) {
        this._maxPayload = maxPayload | 0;
        this._options = options || {};
        this._threshold =
          this._options.threshold !== undefined
            ? this._options.threshold
            : 1024;
        this._isServer = !!isServer;
        this._deflate = null;
        this._inflate = null;

        this.params = null;

        if (!zlibLimiter) {
          const concurrency =
            this._options.concurrencyLimit !== undefined
              ? this._options.concurrencyLimit
              : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }

      /**
       * @type {String}
       */
      static get extensionName() {
        return 'permessage-deflate';
      }

      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};

        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }

        return params;
      }

      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);

        this.params = this._isServer
          ? this.acceptAsServer(configurations)
          : this.acceptAsClient(configurations);

        return this.params;
      }

      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }

        if (this._deflate) {
          const callback = this._deflate[kCallback];

          this._deflate.close();
          this._deflate = null;

          if (callback) {
            callback(
              new Error(
                'The deflate stream was closed while data was being processed'
              )
            );
          }
        }
      }

      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find(params => {
          if (
            (opts.serverNoContextTakeover === false &&
              params.server_no_context_takeover) ||
            (params.server_max_window_bits &&
              (opts.serverMaxWindowBits === false ||
                (typeof opts.serverMaxWindowBits === 'number' &&
                  opts.serverMaxWindowBits > params.server_max_window_bits))) ||
            (typeof opts.clientMaxWindowBits === 'number' &&
              !params.client_max_window_bits)
          ) {
            return false;
          }

          return true;
        });

        if (!accepted) {
          throw new Error('None of the extension offers can be accepted');
        }

        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === 'number') {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === 'number') {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (
          accepted.client_max_window_bits === true ||
          opts.clientMaxWindowBits === false
        ) {
          delete accepted.client_max_window_bits;
        }

        return accepted;
      }

      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];

        if (
          this._options.clientNoContextTakeover === false &&
          params.client_no_context_takeover
        ) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }

        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === 'number') {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (
          this._options.clientMaxWindowBits === false ||
          (typeof this._options.clientMaxWindowBits === 'number' &&
            params.client_max_window_bits > this._options.clientMaxWindowBits)
        ) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }

        return params;
      }

      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach(params => {
          Object.keys(params).forEach(key => {
            let value = params[key];

            if (value.length > 1) {
              throw new Error(
                `Parameter "${key}" must have only a single value`
              );
            }

            value = value[0];

            if (key === 'client_max_window_bits') {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === 'server_max_window_bits') {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (
              key === 'client_no_context_takeover' ||
              key === 'server_no_context_takeover'
            ) {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }

            params[key] = value;
          });
        });

        return configurations;
      }

      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add(done => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }

      /**
       * Compress data. Concurrency limited.
       *
       * @param {Buffer} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add(done => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }

      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? 'client' : 'server';

        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits =
            typeof this.params[key] !== 'number'
              ? zlib.Z_DEFAULT_WINDOWBITS
              : this.params[key];

          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on('error', inflateOnError);
          this._inflate.on('data', inflateOnData);
        }

        this._inflate[kCallback] = callback;

        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);

        this._inflate.flush(() => {
          const err = this._inflate[kError];

          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }

          const data = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );

          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];

            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }

          callback(null, data);
        });
      }

      /**
       * Compress data.
       *
       * @param {Buffer} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? 'server' : 'client';

        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits =
            typeof this.params[key] !== 'number'
              ? zlib.Z_DEFAULT_WINDOWBITS
              : this.params[key];

          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });

          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];

          //
          // An `'error'` event is emitted, only on Node.js < 10.0.0, if the
          // `zlib.DeflateRaw` instance is closed while data is being processed.
          // This can happen if `PerMessageDeflate#cleanup()` is called at the wrong
          // time due to an abnormal WebSocket closure.
          //
          this._deflate.on('error', NOOP);
          this._deflate.on('data', deflateOnData);
        }

        this._deflate[kCallback] = callback;

        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            //
            // The deflate stream was closed while data was being processed.
            //
            return;
          }

          let data = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );

          if (fin) data = data.slice(0, data.length - 4);

          //
          // Ensure that the callback will not be called again in
          // `PerMessageDeflate#cleanup()`.
          //
          this._deflate[kCallback] = null;

          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];

          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }

          callback(null, data);
        });
      }
    }

    module.exports = PerMessageDeflate;

    /**
     * The listener of the `zlib.DeflateRaw` stream `'data'` event.
     *
     * @param {Buffer} chunk A chunk of data
     * @private
     */
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }

    /**
     * The listener of the `zlib.InflateRaw` stream `'data'` event.
     *
     * @param {Buffer} chunk A chunk of data
     * @private
     */
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;

      if (
        this[kPerMessageDeflate]._maxPayload < 1 ||
        this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload
      ) {
        this[kBuffers].push(chunk);
        return;
      }

      this[kError] = new RangeError('Max payload size exceeded');
      this[kError].code = 'WS_ERR_UNSUPPORTED_MESSAGE_LENGTH';
      this[kError][kStatusCode] = 1009;
      this.removeListener('data', inflateOnData);
      this.reset();
    }

    /**
     * The listener of the `zlib.InflateRaw` stream `'error'` event.
     *
     * @param {Error} err The emitted error
     * @private
     */
    function inflateOnError(err) {
      //
      // There is no need to call `Zlib#close()` as the handle is automatically
      // closed when an error is emitted.
      //
      this[kPerMessageDeflate]._inflate = null;
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }

    /***/
  },

  /***/ 5066: /***/ (module, __unused_webpack_exports, __webpack_require__) => {
    const { Writable } = __webpack_require__(2781);

    const PerMessageDeflate = __webpack_require__(6684);
    const { BINARY_TYPES, EMPTY_BUFFER, kStatusCode, kWebSocket } =
      __webpack_require__(5949);
    const { concat, toArrayBuffer, unmask } = __webpack_require__(9436);
    const { isValidStatusCode, isValidUTF8 } = __webpack_require__(6279);

    const GET_INFO = 0;
    const GET_PAYLOAD_LENGTH_16 = 1;
    const GET_PAYLOAD_LENGTH_64 = 2;
    const GET_MASK = 3;
    const GET_DATA = 4;
    const INFLATING = 5;

    /**
     * HyBi Receiver implementation.
     *
     * @extends Writable
     */
    class Receiver extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {String} [binaryType=nodebuffer] The type for binary data
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Boolean} [isServer=false] Specifies whether to operate in client or
       *     server mode
       * @param {Number} [maxPayload=0] The maximum allowed message length
       */
      constructor(binaryType, extensions, isServer, maxPayload) {
        super();

        this._binaryType = binaryType || BINARY_TYPES[0];
        this[kWebSocket] = undefined;
        this._extensions = extensions || {};
        this._isServer = !!isServer;
        this._maxPayload = maxPayload | 0;

        this._bufferedBytes = 0;
        this._buffers = [];

        this._compressed = false;
        this._payloadLength = 0;
        this._mask = undefined;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;

        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragments = [];

        this._state = GET_INFO;
        this._loop = false;
      }

      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 0x08 && this._state == GET_INFO) return cb();

        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }

      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;

        if (n === this._buffers[0].length) return this._buffers.shift();

        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = buf.slice(n);
          return buf.slice(0, n);
        }

        const dst = Buffer.allocUnsafe(n);

        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;

          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = buf.slice(n);
          }

          n -= buf.length;
        } while (n > 0);

        return dst;
      }

      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        let err;
        this._loop = true;

        do {
          switch (this._state) {
            case GET_INFO:
              err = this.getInfo();
              break;
            case GET_PAYLOAD_LENGTH_16:
              err = this.getPayloadLength16();
              break;
            case GET_PAYLOAD_LENGTH_64:
              err = this.getPayloadLength64();
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              err = this.getData(cb);
              break;
            default:
              // `INFLATING`
              this._loop = false;
              return;
          }
        } while (this._loop);

        cb(err);
      }

      /**
       * Reads the first two bytes of a frame.
       *
       * @return {(RangeError|undefined)} A possible error
       * @private
       */
      getInfo() {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }

        const buf = this.consume(2);

        if ((buf[0] & 0x30) !== 0x00) {
          this._loop = false;
          return error(
            RangeError,
            'RSV2 and RSV3 must be clear',
            true,
            1002,
            'WS_ERR_UNEXPECTED_RSV_2_3'
          );
        }

        const compressed = (buf[0] & 0x40) === 0x40;

        if (compressed && !this._extensions[PerMessageDeflate.extensionName]) {
          this._loop = false;
          return error(
            RangeError,
            'RSV1 must be clear',
            true,
            1002,
            'WS_ERR_UNEXPECTED_RSV_1'
          );
        }

        this._fin = (buf[0] & 0x80) === 0x80;
        this._opcode = buf[0] & 0x0f;
        this._payloadLength = buf[1] & 0x7f;

        if (this._opcode === 0x00) {
          if (compressed) {
            this._loop = false;
            return error(
              RangeError,
              'RSV1 must be clear',
              true,
              1002,
              'WS_ERR_UNEXPECTED_RSV_1'
            );
          }

          if (!this._fragmented) {
            this._loop = false;
            return error(
              RangeError,
              'invalid opcode 0',
              true,
              1002,
              'WS_ERR_INVALID_OPCODE'
            );
          }

          this._opcode = this._fragmented;
        } else if (this._opcode === 0x01 || this._opcode === 0x02) {
          if (this._fragmented) {
            this._loop = false;
            return error(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              'WS_ERR_INVALID_OPCODE'
            );
          }

          this._compressed = compressed;
        } else if (this._opcode > 0x07 && this._opcode < 0x0b) {
          if (!this._fin) {
            this._loop = false;
            return error(
              RangeError,
              'FIN must be set',
              true,
              1002,
              'WS_ERR_EXPECTED_FIN'
            );
          }

          if (compressed) {
            this._loop = false;
            return error(
              RangeError,
              'RSV1 must be clear',
              true,
              1002,
              'WS_ERR_UNEXPECTED_RSV_1'
            );
          }

          if (this._payloadLength > 0x7d) {
            this._loop = false;
            return error(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              'WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH'
            );
          }
        } else {
          this._loop = false;
          return error(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            'WS_ERR_INVALID_OPCODE'
          );
        }

        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 0x80) === 0x80;

        if (this._isServer) {
          if (!this._masked) {
            this._loop = false;
            return error(
              RangeError,
              'MASK must be set',
              true,
              1002,
              'WS_ERR_EXPECTED_MASK'
            );
          }
        } else if (this._masked) {
          this._loop = false;
          return error(
            RangeError,
            'MASK must be clear',
            true,
            1002,
            'WS_ERR_UNEXPECTED_MASK'
          );
        }

        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127)
          this._state = GET_PAYLOAD_LENGTH_64;
        else return this.haveLength();
      }

      /**
       * Gets extended payload length (7+16).
       *
       * @return {(RangeError|undefined)} A possible error
       * @private
       */
      getPayloadLength16() {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }

        this._payloadLength = this.consume(2).readUInt16BE(0);
        return this.haveLength();
      }

      /**
       * Gets extended payload length (7+64).
       *
       * @return {(RangeError|undefined)} A possible error
       * @private
       */
      getPayloadLength64() {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }

        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);

        //
        // The maximum safe integer in JavaScript is 2^53 - 1. An error is returned
        // if payload length is greater than this number.
        //
        if (num > 2 ** (53 - 32) - 1) {
          this._loop = false;
          return error(
            RangeError,
            'Unsupported WebSocket frame: payload length > 2^53 - 1',
            false,
            1009,
            'WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH'
          );
        }

        this._payloadLength = num * 2 ** 32 + buf.readUInt32BE(4);
        return this.haveLength();
      }

      /**
       * Payload length has been read.
       *
       * @return {(RangeError|undefined)} A possible error
       * @private
       */
      haveLength() {
        if (this._payloadLength && this._opcode < 0x08) {
          this._totalPayloadLength += this._payloadLength;
          if (
            this._totalPayloadLength > this._maxPayload &&
            this._maxPayload > 0
          ) {
            this._loop = false;
            return error(
              RangeError,
              'Max payload size exceeded',
              false,
              1009,
              'WS_ERR_UNSUPPORTED_MESSAGE_LENGTH'
            );
          }
        }

        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }

      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }

        this._mask = this.consume(4);
        this._state = GET_DATA;
      }

      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;

        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }

          data = this.consume(this._payloadLength);
          if (this._masked) unmask(data, this._mask);
        }

        if (this._opcode > 0x07) return this.controlMessage(data);

        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }

        if (data.length) {
          //
          // This message is not compressed so its lenght is the sum of the payload
          // length of all fragments.
          //
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }

        return this.dataMessage();
      }

      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate =
          this._extensions[PerMessageDeflate.extensionName];

        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);

          if (buf.length) {
            this._messageLength += buf.length;
            if (
              this._messageLength > this._maxPayload &&
              this._maxPayload > 0
            ) {
              return cb(
                error(
                  RangeError,
                  'Max payload size exceeded',
                  false,
                  1009,
                  'WS_ERR_UNSUPPORTED_MESSAGE_LENGTH'
                )
              );
            }

            this._fragments.push(buf);
          }

          const er = this.dataMessage();
          if (er) return cb(er);

          this.startLoop(cb);
        });
      }

      /**
       * Handles a data message.
       *
       * @return {(Error|undefined)} A possible error
       * @private
       */
      dataMessage() {
        if (this._fin) {
          const messageLength = this._messageLength;
          const fragments = this._fragments;

          this._totalPayloadLength = 0;
          this._messageLength = 0;
          this._fragmented = 0;
          this._fragments = [];

          if (this._opcode === 2) {
            let data;

            if (this._binaryType === 'nodebuffer') {
              data = concat(fragments, messageLength);
            } else if (this._binaryType === 'arraybuffer') {
              data = toArrayBuffer(concat(fragments, messageLength));
            } else {
              data = fragments;
            }

            this.emit('message', data);
          } else {
            const buf = concat(fragments, messageLength);

            if (!isValidUTF8(buf)) {
              this._loop = false;
              return error(
                Error,
                'invalid UTF-8 sequence',
                true,
                1007,
                'WS_ERR_INVALID_UTF8'
              );
            }

            this.emit('message', buf.toString());
          }
        }

        this._state = GET_INFO;
      }

      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data) {
        if (this._opcode === 0x08) {
          this._loop = false;

          if (data.length === 0) {
            this.emit('conclude', 1005, '');
            this.end();
          } else if (data.length === 1) {
            return error(
              RangeError,
              'invalid payload length 1',
              true,
              1002,
              'WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH'
            );
          } else {
            const code = data.readUInt16BE(0);

            if (!isValidStatusCode(code)) {
              return error(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                'WS_ERR_INVALID_CLOSE_CODE'
              );
            }

            const buf = data.slice(2);

            if (!isValidUTF8(buf)) {
              return error(
                Error,
                'invalid UTF-8 sequence',
                true,
                1007,
                'WS_ERR_INVALID_UTF8'
              );
            }

            this.emit('conclude', code, buf.toString());
            this.end();
          }
        } else if (this._opcode === 0x09) {
          this.emit('ping', data);
        } else {
          this.emit('pong', data);
        }

        this._state = GET_INFO;
      }
    }

    module.exports = Receiver;

    /**
     * Builds an error object.
     *
     * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
     * @param {String} message The error message
     * @param {Boolean} prefix Specifies whether or not to add a default prefix to
     *     `message`
     * @param {Number} statusCode The status code
     * @param {String} errorCode The exposed error code
     * @return {(Error|RangeError)} The error
     * @private
     */
    function error(ErrorCtor, message, prefix, statusCode, errorCode) {
      const err = new ErrorCtor(
        prefix ? `Invalid WebSocket frame: ${message}` : message
      );

      Error.captureStackTrace(err, error);
      err.code = errorCode;
      err[kStatusCode] = statusCode;
      return err;
    }

    /***/
  },

  /***/ 6947: /***/ (module, __unused_webpack_exports, __webpack_require__) => {
    /* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^net|tls$" }] */

    const net = __webpack_require__(1808);
    const tls = __webpack_require__(4404);
    const { randomFillSync } = __webpack_require__(6113);

    const PerMessageDeflate = __webpack_require__(6684);
    const { EMPTY_BUFFER } = __webpack_require__(5949);
    const { isValidStatusCode } = __webpack_require__(6279);
    const { mask: applyMask, toBuffer } = __webpack_require__(9436);

    const mask = Buffer.alloc(4);

    /**
     * HyBi Sender implementation.
     */
    class Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {(net.Socket|tls.Socket)} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       */
      constructor(socket, extensions) {
        this._extensions = extensions || {};
        this._socket = socket;

        this._firstFragment = true;
        this._compress = false;

        this._bufferedBytes = 0;
        this._deflating = false;
        this._queue = [];
      }

      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {Buffer} data The data to frame
       * @param {Object} options Options object
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {Buffer[]} The framed data as a list of `Buffer` instances
       * @public
       */
      static frame(data, options) {
        const merge = options.mask && options.readOnly;
        let offset = options.mask ? 6 : 2;
        let payloadLength = data.length;

        if (data.length >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (data.length > 125) {
          offset += 2;
          payloadLength = 126;
        }

        const target = Buffer.allocUnsafe(
          merge ? data.length + offset : offset
        );

        target[0] = options.fin ? options.opcode | 0x80 : options.opcode;
        if (options.rsv1) target[0] |= 0x40;

        target[1] = payloadLength;

        if (payloadLength === 126) {
          target.writeUInt16BE(data.length, 2);
        } else if (payloadLength === 127) {
          target.writeUInt32BE(0, 2);
          target.writeUInt32BE(data.length, 6);
        }

        if (!options.mask) return [target, data];

        randomFillSync(mask, 0, 4);

        target[1] |= 0x80;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];

        if (merge) {
          applyMask(data, mask, target, offset, data.length);
          return [target];
        }

        applyMask(data, mask, data, 0, data.length);
        return [target, data];
      }

      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {String} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;

        if (code === undefined) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== 'number' || !isValidStatusCode(code)) {
          throw new TypeError(
            'First argument must be a valid error code number'
          );
        } else if (data === undefined || data === '') {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);

          if (length > 123) {
            throw new RangeError(
              'The message must not be greater than 123 bytes'
            );
          }

          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          buf.write(data, 2);
        }

        if (this._deflating) {
          this.enqueue([this.doClose, buf, mask, cb]);
        } else {
          this.doClose(buf, mask, cb);
        }
      }

      /**
       * Frames and sends a close message.
       *
       * @param {Buffer} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @private
       */
      doClose(data, mask, cb) {
        this.sendFrame(
          Sender.frame(data, {
            fin: true,
            rsv1: false,
            opcode: 0x08,
            mask,
            readOnly: false
          }),
          cb
        );
      }

      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        const buf = toBuffer(data);

        if (buf.length > 125) {
          throw new RangeError(
            'The data size must not be greater than 125 bytes'
          );
        }

        if (this._deflating) {
          this.enqueue([this.doPing, buf, mask, toBuffer.readOnly, cb]);
        } else {
          this.doPing(buf, mask, toBuffer.readOnly, cb);
        }
      }

      /**
       * Frames and sends a ping message.
       *
       * @param {Buffer} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Boolean} [readOnly=false] Specifies whether `data` can be modified
       * @param {Function} [cb] Callback
       * @private
       */
      doPing(data, mask, readOnly, cb) {
        this.sendFrame(
          Sender.frame(data, {
            fin: true,
            rsv1: false,
            opcode: 0x09,
            mask,
            readOnly
          }),
          cb
        );
      }

      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        const buf = toBuffer(data);

        if (buf.length > 125) {
          throw new RangeError(
            'The data size must not be greater than 125 bytes'
          );
        }

        if (this._deflating) {
          this.enqueue([this.doPong, buf, mask, toBuffer.readOnly, cb]);
        } else {
          this.doPong(buf, mask, toBuffer.readOnly, cb);
        }
      }

      /**
       * Frames and sends a pong message.
       *
       * @param {Buffer} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Boolean} [readOnly=false] Specifies whether `data` can be modified
       * @param {Function} [cb] Callback
       * @private
       */
      doPong(data, mask, readOnly, cb) {
        this.sendFrame(
          Sender.frame(data, {
            fin: true,
            rsv1: false,
            opcode: 0x0a,
            mask,
            readOnly
          }),
          cb
        );
      }

      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const buf = toBuffer(data);
        const perMessageDeflate =
          this._extensions[PerMessageDeflate.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;

        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate) {
            rsv1 = buf.length >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }

        if (options.fin) this._firstFragment = true;

        if (perMessageDeflate) {
          const opts = {
            fin: options.fin,
            rsv1,
            opcode,
            mask: options.mask,
            readOnly: toBuffer.readOnly
          };

          if (this._deflating) {
            this.enqueue([this.dispatch, buf, this._compress, opts, cb]);
          } else {
            this.dispatch(buf, this._compress, opts, cb);
          }
        } else {
          this.sendFrame(
            Sender.frame(buf, {
              fin: options.fin,
              rsv1: false,
              opcode,
              mask: options.mask,
              readOnly: toBuffer.readOnly
            }),
            cb
          );
        }
      }

      /**
       * Dispatches a data message.
       *
       * @param {Buffer} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(Sender.frame(data, options), cb);
          return;
        }

        const perMessageDeflate =
          this._extensions[PerMessageDeflate.extensionName];

        this._bufferedBytes += data.length;
        this._deflating = true;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              'The socket was closed while data was being compressed'
            );

            if (typeof cb === 'function') cb(err);

            for (let i = 0; i < this._queue.length; i++) {
              const callback = this._queue[i][4];

              if (typeof callback === 'function') callback(err);
            }

            return;
          }

          this._bufferedBytes -= data.length;
          this._deflating = false;
          options.readOnly = false;
          this.sendFrame(Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }

      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (!this._deflating && this._queue.length) {
          const params = this._queue.shift();

          this._bufferedBytes -= params[1].length;
          Reflect.apply(params[0], this, params.slice(1));
        }
      }

      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[1].length;
        this._queue.push(params);
      }

      /**
       * Sends a frame.
       *
       * @param {Buffer[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    }

    module.exports = Sender;

    /***/
  },

  /***/ 1658: /***/ (module, __unused_webpack_exports, __webpack_require__) => {
    const { Duplex } = __webpack_require__(2781);

    /**
     * Emits the `'close'` event on a stream.
     *
     * @param {Duplex} stream The stream.
     * @private
     */
    function emitClose(stream) {
      stream.emit('close');
    }

    /**
     * The listener of the `'end'` event.
     *
     * @private
     */
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }

    /**
     * The listener of the `'error'` event.
     *
     * @param {Error} err The error
     * @private
     */
    function duplexOnError(err) {
      this.removeListener('error', duplexOnError);
      this.destroy();
      if (this.listenerCount('error') === 0) {
        // Do not suppress the throwing behavior.
        this.emit('error', err);
      }
    }

    /**
     * Wraps a `WebSocket` in a duplex stream.
     *
     * @param {WebSocket} ws The `WebSocket` to wrap
     * @param {Object} [options] The options for the `Duplex` constructor
     * @return {Duplex} The duplex stream
     * @public
     */
    function createWebSocketStream(ws, options) {
      let resumeOnReceiverDrain = true;
      let terminateOnDestroy = true;

      function receiverOnDrain() {
        if (resumeOnReceiverDrain) ws._socket.resume();
      }

      if (ws.readyState === ws.CONNECTING) {
        ws.once('open', function open() {
          ws._receiver.removeAllListeners('drain');
          ws._receiver.on('drain', receiverOnDrain);
        });
      } else {
        ws._receiver.removeAllListeners('drain');
        ws._receiver.on('drain', receiverOnDrain);
      }

      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });

      ws.on('message', function message(msg) {
        if (!duplex.push(msg)) {
          resumeOnReceiverDrain = false;
          ws._socket.pause();
        }
      });

      ws.once('error', function error(err) {
        if (duplex.destroyed) return;

        // Prevent `ws.terminate()` from being called by `duplex._destroy()`.
        //
        // - If the `'error'` event is emitted before the `'open'` event, then
        //   `ws.terminate()` is a noop as no socket is assigned.
        // - Otherwise, the error is re-emitted by the listener of the `'error'`
        //   event of the `Receiver` object. The listener already closes the
        //   connection by calling `ws.close()`. This allows a close frame to be
        //   sent to the other peer. If `ws.terminate()` is called right after this,
        //   then the close frame might not be sent.
        terminateOnDestroy = false;
        duplex.destroy(err);
      });

      ws.once('close', function close() {
        if (duplex.destroyed) return;

        duplex.push(null);
      });

      duplex._destroy = (err, callback) => {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }

        let called = false;

        ws.once('error', function error(err) {
          called = true;
          callback(err);
        });

        ws.once('close', function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });

        if (terminateOnDestroy) ws.terminate();
      };

      duplex._final = callback => {
        if (ws.readyState === ws.CONNECTING) {
          ws.once('open', function open() {
            duplex._final(callback);
          });
          return;
        }

        // If the value of the `_socket` property is `null` it means that `ws` is a
        // client websocket and the handshake failed. In fact, when this happens, a
        // socket is never assigned to the websocket. Wait for the `'error'` event
        // that will be emitted by the websocket.
        if (ws._socket === null) return;

        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once('finish', function finish() {
            // `duplex` is not destroyed here because the `'end'` event will be
            // emitted on `duplex` after this `'finish'` event. The EOF signaling
            // `null` chunk is, in fact, pushed when the websocket emits `'close'`.
            callback();
          });
          ws.close();
        }
      };

      duplex._read = () => {
        if (
          (ws.readyState === ws.OPEN || ws.readyState === ws.CLOSING) &&
          !resumeOnReceiverDrain
        ) {
          resumeOnReceiverDrain = true;
          if (!ws._receiver._writableState.needDrain) ws._socket.resume();
        }
      };

      duplex._write = (chunk, encoding, callback) => {
        if (ws.readyState === ws.CONNECTING) {
          ws.once('open', function open() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }

        ws.send(chunk, callback);
      };

      duplex.on('end', duplexOnEnd);
      duplex.on('error', duplexOnError);
      return duplex;
    }

    module.exports = createWebSocketStream;

    /***/
  },

  /***/ 6279: /***/ (module, __unused_webpack_exports, __webpack_require__) => {
    /**
     * Checks if a status code is allowed in a close frame.
     *
     * @param {Number} code The status code
     * @return {Boolean} `true` if the status code is valid, else `false`
     * @public
     */
    function isValidStatusCode(code) {
      return (
        (code >= 1000 &&
          code <= 1014 &&
          code !== 1004 &&
          code !== 1005 &&
          code !== 1006) ||
        (code >= 3000 && code <= 4999)
      );
    }

    /**
     * Checks if a given buffer contains only correct UTF-8.
     * Ported from https://www.cl.cam.ac.uk/%7Emgk25/ucs/utf8_check.c by
     * Markus Kuhn.
     *
     * @param {Buffer} buf The buffer to check
     * @return {Boolean} `true` if `buf` contains only correct UTF-8, else `false`
     * @public
     */
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;

      while (i < len) {
        if ((buf[i] & 0x80) === 0) {
          // 0xxxxxxx
          i++;
        } else if ((buf[i] & 0xe0) === 0xc0) {
          // 110xxxxx 10xxxxxx
          if (
            i + 1 === len ||
            (buf[i + 1] & 0xc0) !== 0x80 ||
            (buf[i] & 0xfe) === 0xc0 // Overlong
          ) {
            return false;
          }

          i += 2;
        } else if ((buf[i] & 0xf0) === 0xe0) {
          // 1110xxxx 10xxxxxx 10xxxxxx
          if (
            i + 2 >= len ||
            (buf[i + 1] & 0xc0) !== 0x80 ||
            (buf[i + 2] & 0xc0) !== 0x80 ||
            (buf[i] === 0xe0 && (buf[i + 1] & 0xe0) === 0x80) || // Overlong
            (buf[i] === 0xed && (buf[i + 1] & 0xe0) === 0xa0) // Surrogate (U+D800 - U+DFFF)
          ) {
            return false;
          }

          i += 3;
        } else if ((buf[i] & 0xf8) === 0xf0) {
          // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
          if (
            i + 3 >= len ||
            (buf[i + 1] & 0xc0) !== 0x80 ||
            (buf[i + 2] & 0xc0) !== 0x80 ||
            (buf[i + 3] & 0xc0) !== 0x80 ||
            (buf[i] === 0xf0 && (buf[i + 1] & 0xf0) === 0x80) || // Overlong
            (buf[i] === 0xf4 && buf[i + 1] > 0x8f) ||
            buf[i] > 0xf4 // > U+10FFFF
          ) {
            return false;
          }

          i += 4;
        } else {
          return false;
        }
      }

      return true;
    }

    try {
      let isValidUTF8 = __webpack_require__(4592);

      /* istanbul ignore if */
      if (typeof isValidUTF8 === 'object') {
        isValidUTF8 = isValidUTF8.Validation.isValidUTF8; // utf-8-validate@<3.0.0
      }

      module.exports = {
        isValidStatusCode,
        isValidUTF8(buf) {
          return buf.length < 150 ? _isValidUTF8(buf) : isValidUTF8(buf);
        }
      };
    } catch (e) /* istanbul ignore next */ {
      module.exports = {
        isValidStatusCode,
        isValidUTF8: _isValidUTF8
      };
    }

    /***/
  },

  /***/ 8887: /***/ (module, __unused_webpack_exports, __webpack_require__) => {
    /* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^net|tls|https$" }] */

    const EventEmitter = __webpack_require__(2361);
    const http = __webpack_require__(3685);
    const https = __webpack_require__(5687);
    const net = __webpack_require__(1808);
    const tls = __webpack_require__(4404);
    const { createHash } = __webpack_require__(6113);

    const PerMessageDeflate = __webpack_require__(6684);
    const WebSocket = __webpack_require__(1518);
    const { format, parse } = __webpack_require__(2035);
    const { GUID, kWebSocket } = __webpack_require__(5949);

    const keyRegex = /^[+/0-9A-Za-z]{22}==$/;

    const RUNNING = 0;
    const CLOSING = 1;
    const CLOSED = 2;

    /**
     * Class representing a WebSocket server.
     *
     * @extends EventEmitter
     */
    class WebSocketServer extends EventEmitter {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();

        options = {
          maxPayload: 100 * 1024 * 1024,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          verifyClient: null,
          noServer: false,
          backlog: null, // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          ...options
        };

        if (
          (options.port == null && !options.server && !options.noServer) ||
          (options.port != null && (options.server || options.noServer)) ||
          (options.server && options.noServer)
        ) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options ' +
              'must be specified'
          );
        }

        if (options.port != null) {
          this._server = http.createServer((req, res) => {
            const body = http.STATUS_CODES[426];

            res.writeHead(426, {
              'Content-Length': body.length,
              'Content-Type': 'text/plain'
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }

        if (this._server) {
          const emitConnection = this.emit.bind(this, 'connection');

          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, 'listening'),
            error: this.emit.bind(this, 'error'),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }

        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) this.clients = new Set();
        this.options = options;
        this._state = RUNNING;
      }

      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }

        if (!this._server) return null;
        return this._server.address();
      }

      /**
       * Close the server.
       *
       * @param {Function} [cb] Callback
       * @public
       */
      close(cb) {
        if (cb) this.once('close', cb);

        if (this._state === CLOSED) {
          process.nextTick(emitClose, this);
          return;
        }

        if (this._state === CLOSING) return;
        this._state = CLOSING;

        //
        // Terminate all associated clients.
        //
        if (this.clients) {
          for (const client of this.clients) client.terminate();
        }

        const server = this._server;

        if (server) {
          this._removeListeners();
          this._removeListeners = this._server = null;

          //
          // Close the http server if it was internally created.
          //
          if (this.options.port != null) {
            server.close(emitClose.bind(undefined, this));
            return;
          }
        }

        process.nextTick(emitClose, this);
      }

      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf('?');
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;

          if (pathname !== this.options.path) return false;
        }

        return true;
      }

      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {(net.Socket|tls.Socket)} socket The network socket between the
       *     server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on('error', socketOnError);

        const key =
          req.headers['sec-websocket-key'] !== undefined
            ? req.headers['sec-websocket-key'].trim()
            : false;
        const upgrade = req.headers.upgrade;
        const version = +req.headers['sec-websocket-version'];
        const extensions = {};

        if (
          req.method !== 'GET' ||
          upgrade === undefined ||
          upgrade.toLowerCase() !== 'websocket' ||
          !key ||
          !keyRegex.test(key) ||
          (version !== 8 && version !== 13) ||
          !this.shouldHandle(req)
        ) {
          return abortHandshake(socket, 400);
        }

        if (this.options.perMessageDeflate) {
          const perMessageDeflate = new PerMessageDeflate(
            this.options.perMessageDeflate,
            true,
            this.options.maxPayload
          );

          try {
            const offers = parse(req.headers['sec-websocket-extensions']);

            if (offers[PerMessageDeflate.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]);
              extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            return abortHandshake(socket, 400);
          }
        }

        //
        // Optionally call external client verification handler.
        //
        if (this.options.verifyClient) {
          const info = {
            origin:
              req.headers[
                `${version === 8 ? 'sec-websocket-origin' : 'origin'}`
              ],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };

          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(
              info,
              (verified, code, message, headers) => {
                if (!verified) {
                  return abortHandshake(socket, code || 401, message, headers);
                }

                this.completeUpgrade(key, extensions, req, socket, head, cb);
              }
            );
            return;
          }

          if (!this.options.verifyClient(info))
            return abortHandshake(socket, 401);
        }

        this.completeUpgrade(key, extensions, req, socket, head, cb);
      }

      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Object} extensions The accepted extensions
       * @param {http.IncomingMessage} req The request object
       * @param {(net.Socket|tls.Socket)} socket The network socket between the
       *     server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(key, extensions, req, socket, head, cb) {
        //
        // Destroy the socket if the client has already sent a FIN packet.
        //
        if (!socket.readable || !socket.writable) return socket.destroy();

        if (socket[kWebSocket]) {
          throw new Error(
            'server.handleUpgrade() was called more than once with the same ' +
              'socket, possibly due to a misconfiguration'
          );
        }

        if (this._state > RUNNING) return abortHandshake(socket, 503);

        const digest = createHash('sha1')
          .update(key + GUID)
          .digest('base64');

        const headers = [
          'HTTP/1.1 101 Switching Protocols',
          'Upgrade: websocket',
          'Connection: Upgrade',
          `Sec-WebSocket-Accept: ${digest}`
        ];

        const ws = new WebSocket(null);
        let protocol = req.headers['sec-websocket-protocol'];

        if (protocol) {
          protocol = protocol.split(',').map(trim);

          //
          // Optionally call external protocol selection handler.
          //
          if (this.options.handleProtocols) {
            protocol = this.options.handleProtocols(protocol, req);
          } else {
            protocol = protocol[0];
          }

          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }

        if (extensions[PerMessageDeflate.extensionName]) {
          const params = extensions[PerMessageDeflate.extensionName].params;
          const value = format({
            [PerMessageDeflate.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }

        //
        // Allow external modification/inspection of handshake headers.
        //
        this.emit('headers', headers, req);

        socket.write(headers.concat('\r\n').join('\r\n'));
        socket.removeListener('error', socketOnError);

        ws.setSocket(socket, head, this.options.maxPayload);

        if (this.clients) {
          this.clients.add(ws);
          ws.on('close', () => this.clients.delete(ws));
        }

        cb(ws, req);
      }
    }

    module.exports = WebSocketServer;

    /**
     * Add event listeners on an `EventEmitter` using a map of <event, listener>
     * pairs.
     *
     * @param {EventEmitter} server The event emitter
     * @param {Object.<String, Function>} map The listeners to add
     * @return {Function} A function that will remove the added listeners when
     *     called
     * @private
     */
    function addListeners(server, map) {
      for (const event of Object.keys(map)) server.on(event, map[event]);

      return function removeListeners() {
        for (const event of Object.keys(map)) {
          server.removeListener(event, map[event]);
        }
      };
    }

    /**
     * Emit a `'close'` event on an `EventEmitter`.
     *
     * @param {EventEmitter} server The event emitter
     * @private
     */
    function emitClose(server) {
      server._state = CLOSED;
      server.emit('close');
    }

    /**
     * Handle premature socket errors.
     *
     * @private
     */
    function socketOnError() {
      this.destroy();
    }

    /**
     * Close the connection when preconditions are not fulfilled.
     *
     * @param {(net.Socket|tls.Socket)} socket The socket of the upgrade request
     * @param {Number} code The HTTP response status code
     * @param {String} [message] The HTTP response body
     * @param {Object} [headers] Additional HTTP response headers
     * @private
     */
    function abortHandshake(socket, code, message, headers) {
      if (socket.writable) {
        message = message || http.STATUS_CODES[code];
        headers = {
          Connection: 'close',
          'Content-Type': 'text/html',
          'Content-Length': Buffer.byteLength(message),
          ...headers
        };

        socket.write(
          `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r\n` +
            Object.keys(headers)
              .map(h => `${h}: ${headers[h]}`)
              .join('\r\n') +
            '\r\n\r\n' +
            message
        );
      }

      socket.removeListener('error', socketOnError);
      socket.destroy();
    }

    /**
     * Remove whitespace characters from both ends of a string.
     *
     * @param {String} str The string
     * @return {String} A new string representing `str` stripped of whitespace
     *     characters from both its beginning and end
     * @private
     */
    function trim(str) {
      return str.trim();
    }

    /***/
  },

  /***/ 1518: /***/ (module, __unused_webpack_exports, __webpack_require__) => {
    /* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^Readable$" }] */

    const EventEmitter = __webpack_require__(2361);
    const https = __webpack_require__(5687);
    const http = __webpack_require__(3685);
    const net = __webpack_require__(1808);
    const tls = __webpack_require__(4404);
    const { randomBytes, createHash } = __webpack_require__(6113);
    const { Readable } = __webpack_require__(2781);
    const { URL } = __webpack_require__(7310);

    const PerMessageDeflate = __webpack_require__(6684);
    const Receiver = __webpack_require__(5066);
    const Sender = __webpack_require__(6947);
    const { BINARY_TYPES, EMPTY_BUFFER, GUID, kStatusCode, kWebSocket, NOOP } =
      __webpack_require__(5949);
    const { addEventListener, removeEventListener } = __webpack_require__(4561);
    const { format, parse } = __webpack_require__(2035);
    const { toBuffer } = __webpack_require__(9436);

    const readyStates = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
    const protocolVersions = [8, 13];
    const closeTimeout = 30 * 1000;

    /**
     * Class representing a WebSocket.
     *
     * @extends EventEmitter
     */
    class WebSocket extends EventEmitter {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();

        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = '';
        this._closeTimer = null;
        this._extensions = {};
        this._protocol = '';
        this._readyState = WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;

        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;

          if (Array.isArray(protocols)) {
            protocols = protocols.join(', ');
          } else if (typeof protocols === 'object' && protocols !== null) {
            options = protocols;
            protocols = undefined;
          }

          initAsClient(this, address, protocols, options);
        } else {
          this._isServer = true;
        }
      }

      /**
       * This deviates from the WHATWG interface since ws doesn't support the
       * required default "blob" type (instead we define a custom "nodebuffer"
       * type).
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }

      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;

        this._binaryType = type;

        //
        // Allow to change `binaryType` on the fly.
        //
        if (this._receiver) this._receiver._binaryType = type;
      }

      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;

        return this._socket._writableState.length + this._sender._bufferedBytes;
      }

      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }

      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return undefined;
      }

      /* istanbul ignore next */
      set onclose(listener) {}

      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return undefined;
      }

      /* istanbul ignore next */
      set onerror(listener) {}

      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return undefined;
      }

      /* istanbul ignore next */
      set onopen(listener) {}

      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return undefined;
      }

      /* istanbul ignore next */
      set onmessage(listener) {}

      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }

      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }

      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }

      /**
       * Set up the socket and the internal resources.
       *
       * @param {(net.Socket|tls.Socket)} socket The network socket between the
       *     server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Number} [maxPayload=0] The maximum allowed message size
       * @private
       */
      setSocket(socket, head, maxPayload) {
        const receiver = new Receiver(
          this.binaryType,
          this._extensions,
          this._isServer,
          maxPayload
        );

        this._sender = new Sender(socket, this._extensions);
        this._receiver = receiver;
        this._socket = socket;

        receiver[kWebSocket] = this;
        socket[kWebSocket] = this;

        receiver.on('conclude', receiverOnConclude);
        receiver.on('drain', receiverOnDrain);
        receiver.on('error', receiverOnError);
        receiver.on('message', receiverOnMessage);
        receiver.on('ping', receiverOnPing);
        receiver.on('pong', receiverOnPong);

        socket.setTimeout(0);
        socket.setNoDelay();

        if (head.length > 0) socket.unshift(head);

        socket.on('close', socketOnClose);
        socket.on('data', socketOnData);
        socket.on('end', socketOnEnd);
        socket.on('error', socketOnError);

        this._readyState = WebSocket.OPEN;
        this.emit('open');
      }

      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = WebSocket.CLOSED;
          this.emit('close', this._closeCode, this._closeMessage);
          return;
        }

        if (this._extensions[PerMessageDeflate.extensionName]) {
          this._extensions[PerMessageDeflate.extensionName].cleanup();
        }

        this._receiver.removeAllListeners();
        this._readyState = WebSocket.CLOSED;
        this.emit('close', this._closeCode, this._closeMessage);
      }

      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {String} [data] A string explaining why the connection is closing
       * @public
       */
      close(code, data) {
        if (this.readyState === WebSocket.CLOSED) return;
        if (this.readyState === WebSocket.CONNECTING) {
          const msg =
            'WebSocket was closed before the connection was established';
          return abortHandshake(this, this._req, msg);
        }

        if (this.readyState === WebSocket.CLOSING) {
          if (
            this._closeFrameSent &&
            (this._closeFrameReceived ||
              this._receiver._writableState.errorEmitted)
          ) {
            this._socket.end();
          }

          return;
        }

        this._readyState = WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, err => {
          //
          // This error is handled by the `'error'` listener on the socket. We only
          // want to know if the close frame has been sent here.
          //
          if (err) return;

          this._closeFrameSent = true;

          if (
            this._closeFrameReceived ||
            this._receiver._writableState.errorEmitted
          ) {
            this._socket.end();
          }
        });

        //
        // Specify a timeout for the closing handshake to complete.
        //
        this._closeTimer = setTimeout(
          this._socket.destroy.bind(this._socket),
          closeTimeout
        );
      }

      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === WebSocket.CONNECTING) {
          throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
        }

        if (typeof data === 'function') {
          cb = data;
          data = mask = undefined;
        } else if (typeof mask === 'function') {
          cb = mask;
          mask = undefined;
        }

        if (typeof data === 'number') data = data.toString();

        if (this.readyState !== WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }

        if (mask === undefined) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }

      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === WebSocket.CONNECTING) {
          throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
        }

        if (typeof data === 'function') {
          cb = data;
          data = mask = undefined;
        } else if (typeof mask === 'function') {
          cb = mask;
          mask = undefined;
        }

        if (typeof data === 'number') data = data.toString();

        if (this.readyState !== WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }

        if (mask === undefined) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }

      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === WebSocket.CONNECTING) {
          throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
        }

        if (typeof options === 'function') {
          cb = options;
          options = {};
        }

        if (typeof data === 'number') data = data.toString();

        if (this.readyState !== WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }

        const opts = {
          binary: typeof data !== 'string',
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };

        if (!this._extensions[PerMessageDeflate.extensionName]) {
          opts.compress = false;
        }

        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }

      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === WebSocket.CLOSED) return;
        if (this.readyState === WebSocket.CONNECTING) {
          const msg =
            'WebSocket was closed before the connection was established';
          return abortHandshake(this, this._req, msg);
        }

        if (this._socket) {
          this._readyState = WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    }

    /**
     * @constant {Number} CONNECTING
     * @memberof WebSocket
     */
    Object.defineProperty(WebSocket, 'CONNECTING', {
      enumerable: true,
      value: readyStates.indexOf('CONNECTING')
    });

    /**
     * @constant {Number} CONNECTING
     * @memberof WebSocket.prototype
     */
    Object.defineProperty(WebSocket.prototype, 'CONNECTING', {
      enumerable: true,
      value: readyStates.indexOf('CONNECTING')
    });

    /**
     * @constant {Number} OPEN
     * @memberof WebSocket
     */
    Object.defineProperty(WebSocket, 'OPEN', {
      enumerable: true,
      value: readyStates.indexOf('OPEN')
    });

    /**
     * @constant {Number} OPEN
     * @memberof WebSocket.prototype
     */
    Object.defineProperty(WebSocket.prototype, 'OPEN', {
      enumerable: true,
      value: readyStates.indexOf('OPEN')
    });

    /**
     * @constant {Number} CLOSING
     * @memberof WebSocket
     */
    Object.defineProperty(WebSocket, 'CLOSING', {
      enumerable: true,
      value: readyStates.indexOf('CLOSING')
    });

    /**
     * @constant {Number} CLOSING
     * @memberof WebSocket.prototype
     */
    Object.defineProperty(WebSocket.prototype, 'CLOSING', {
      enumerable: true,
      value: readyStates.indexOf('CLOSING')
    });

    /**
     * @constant {Number} CLOSED
     * @memberof WebSocket
     */
    Object.defineProperty(WebSocket, 'CLOSED', {
      enumerable: true,
      value: readyStates.indexOf('CLOSED')
    });

    /**
     * @constant {Number} CLOSED
     * @memberof WebSocket.prototype
     */
    Object.defineProperty(WebSocket.prototype, 'CLOSED', {
      enumerable: true,
      value: readyStates.indexOf('CLOSED')
    });

    [
      'binaryType',
      'bufferedAmount',
      'extensions',
      'protocol',
      'readyState',
      'url'
    ].forEach(property => {
      Object.defineProperty(WebSocket.prototype, property, {
        enumerable: true
      });
    });

    //
    // Add the `onopen`, `onerror`, `onclose`, and `onmessage` attributes.
    // See https://html.spec.whatwg.org/multipage/comms.html#the-websocket-interface
    //
    ['open', 'error', 'close', 'message'].forEach(method => {
      Object.defineProperty(WebSocket.prototype, `on${method}`, {
        enumerable: true,
        get() {
          const listeners = this.listeners(method);
          for (let i = 0; i < listeners.length; i++) {
            if (listeners[i]._listener) return listeners[i]._listener;
          }

          return undefined;
        },
        set(listener) {
          const listeners = this.listeners(method);
          for (let i = 0; i < listeners.length; i++) {
            //
            // Remove only the listeners added via `addEventListener`.
            //
            if (listeners[i]._listener)
              this.removeListener(method, listeners[i]);
          }
          this.addEventListener(method, listener);
        }
      });
    });

    WebSocket.prototype.addEventListener = addEventListener;
    WebSocket.prototype.removeEventListener = removeEventListener;

    module.exports = WebSocket;

    /**
     * Initialize a WebSocket client.
     *
     * @param {WebSocket} websocket The client to initialize
     * @param {(String|URL)} address The URL to which to connect
     * @param {String} [protocols] The subprotocols
     * @param {Object} [options] Connection options
     * @param {(Boolean|Object)} [options.perMessageDeflate=true] Enable/disable
     *     permessage-deflate
     * @param {Number} [options.handshakeTimeout] Timeout in milliseconds for the
     *     handshake request
     * @param {Number} [options.protocolVersion=13] Value of the
     *     `Sec-WebSocket-Version` header
     * @param {String} [options.origin] Value of the `Origin` or
     *     `Sec-WebSocket-Origin` header
     * @param {Number} [options.maxPayload=104857600] The maximum allowed message
     *     size
     * @param {Boolean} [options.followRedirects=false] Whether or not to follow
     *     redirects
     * @param {Number} [options.maxRedirects=10] The maximum number of redirects
     *     allowed
     * @private
     */
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        protocolVersion: protocolVersions[1],
        maxPayload: 100 * 1024 * 1024,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        createConnection: undefined,
        socketPath: undefined,
        hostname: undefined,
        protocol: undefined,
        timeout: undefined,
        method: undefined,
        host: undefined,
        path: undefined,
        port: undefined
      };

      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} ` +
            `(supported versions: ${protocolVersions.join(', ')})`
        );
      }

      let parsedUrl;

      if (address instanceof URL) {
        parsedUrl = address;
        websocket._url = address.href;
      } else {
        parsedUrl = new URL(address);
        websocket._url = address;
      }

      const isUnixSocket = parsedUrl.protocol === 'ws+unix:';

      if (!parsedUrl.host && (!isUnixSocket || !parsedUrl.pathname)) {
        const err = new Error(`Invalid URL: ${websocket.url}`);

        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }

      const isSecure =
        parsedUrl.protocol === 'wss:' || parsedUrl.protocol === 'https:';
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes(16).toString('base64');
      const get = isSecure ? https.get : http.get;
      let perMessageDeflate;

      opts.createConnection = isSecure ? tlsConnect : netConnect;
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith('[')
        ? parsedUrl.hostname.slice(1, -1)
        : parsedUrl.hostname;
      opts.headers = {
        'Sec-WebSocket-Version': opts.protocolVersion,
        'Sec-WebSocket-Key': key,
        Connection: 'Upgrade',
        Upgrade: 'websocket',
        ...opts.headers
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;

      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate(
          opts.perMessageDeflate !== true ? opts.perMessageDeflate : {},
          false,
          opts.maxPayload
        );
        opts.headers['Sec-WebSocket-Extensions'] = format({
          [PerMessageDeflate.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols) {
        opts.headers['Sec-WebSocket-Protocol'] = protocols;
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers['Sec-WebSocket-Origin'] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }

      if (isUnixSocket) {
        const parts = opts.path.split(':');

        opts.socketPath = parts[0];
        opts.path = parts[1];
      }

      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalUnixSocket = isUnixSocket;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isUnixSocket
            ? opts.socketPath
            : parsedUrl.host;

          const headers = options && options.headers;

          //
          // Shallow copy the user provided options so that headers can be changed
          // without mutating the original object.
          //
          options = { ...options, headers: {} };

          if (headers) {
            for (const [key, value] of Object.entries(headers)) {
              options.headers[key.toLowerCase()] = value;
            }
          }
        } else {
          const isSameHost = isUnixSocket
            ? websocket._originalUnixSocket
              ? opts.socketPath === websocket._originalHostOrSocketPath
              : false
            : websocket._originalUnixSocket
              ? false
              : parsedUrl.host === websocket._originalHostOrSocketPath;

          if (!isSameHost || (websocket._originalSecure && !isSecure)) {
            //
            // Match curl 7.77.0 behavior and drop the following headers. These
            // headers are also dropped when following a redirect to a subdomain.
            //
            delete opts.headers.authorization;
            delete opts.headers.cookie;

            if (!isSameHost) delete opts.headers.host;

            opts.auth = undefined;
          }
        }

        //
        // Match curl 7.77.0 behavior and make the first `Authorization` header win.
        // If the `Authorization` header is set, then there is nothing to do as it
        // will take precedence.
        //
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization =
            'Basic ' + Buffer.from(opts.auth).toString('base64');
        }
      }

      let req = (websocket._req = get(opts));

      if (opts.timeout) {
        req.on('timeout', () => {
          abortHandshake(websocket, req, 'Opening handshake has timed out');
        });
      }

      req.on('error', err => {
        if (req === null || req.aborted) return;

        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });

      req.on('response', res => {
        const location = res.headers.location;
        const statusCode = res.statusCode;

        if (
          location &&
          opts.followRedirects &&
          statusCode >= 300 &&
          statusCode < 400
        ) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, 'Maximum redirects exceeded');
            return;
          }

          req.abort();

          let addr;

          try {
            addr = new URL(location, address);
          } catch (err) {
            emitErrorAndClose(websocket, err);
            return;
          }

          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit('unexpected-response', req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });

      req.on('upgrade', (res, socket, head) => {
        websocket.emit('upgrade', res);

        //
        // The user may have closed the connection from a listener of the `upgrade`
        // event.
        //
        if (websocket.readyState !== WebSocket.CONNECTING) return;

        req = websocket._req = null;

        const upgrade = res.headers.upgrade;

        if (upgrade === undefined || upgrade.toLowerCase() !== 'websocket') {
          abortHandshake(websocket, socket, 'Invalid Upgrade header');
          return;
        }

        const digest = createHash('sha1')
          .update(key + GUID)
          .digest('base64');

        if (res.headers['sec-websocket-accept'] !== digest) {
          abortHandshake(
            websocket,
            socket,
            'Invalid Sec-WebSocket-Accept header'
          );
          return;
        }

        const serverProt = res.headers['sec-websocket-protocol'];
        const protList = (protocols || '').split(/, */);
        let protError;

        if (!protocols && serverProt) {
          protError = 'Server sent a subprotocol but none was requested';
        } else if (protocols && !serverProt) {
          protError = 'Server sent no subprotocol';
        } else if (serverProt && !protList.includes(serverProt)) {
          protError = 'Server sent an invalid subprotocol';
        }

        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }

        if (serverProt) websocket._protocol = serverProt;

        const secWebSocketExtensions = res.headers['sec-websocket-extensions'];

        if (secWebSocketExtensions !== undefined) {
          if (!perMessageDeflate) {
            const message =
              'Server sent a Sec-WebSocket-Extensions header but no extension ' +
              'was requested';
            abortHandshake(websocket, socket, message);
            return;
          }

          let extensions;

          try {
            extensions = parse(secWebSocketExtensions);
          } catch (err) {
            const message = 'Invalid Sec-WebSocket-Extensions header';
            abortHandshake(websocket, socket, message);
            return;
          }

          const extensionNames = Object.keys(extensions);

          if (extensionNames.length) {
            if (
              extensionNames.length !== 1 ||
              extensionNames[0] !== PerMessageDeflate.extensionName
            ) {
              const message =
                'Server indicated an extension that was not requested';
              abortHandshake(websocket, socket, message);
              return;
            }

            try {
              perMessageDeflate.accept(
                extensions[PerMessageDeflate.extensionName]
              );
            } catch (err) {
              const message = 'Invalid Sec-WebSocket-Extensions header';
              abortHandshake(websocket, socket, message);
              return;
            }

            websocket._extensions[PerMessageDeflate.extensionName] =
              perMessageDeflate;
          }
        }

        websocket.setSocket(socket, head, opts.maxPayload);
      });
    }

    /**
     * Emit the `'error'` and `'close'` event.
     *
     * @param {WebSocket} websocket The WebSocket instance
     * @param {Error} The error to emit
     * @private
     */
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket.CLOSING;
      websocket.emit('error', err);
      websocket.emitClose();
    }

    /**
     * Create a `net.Socket` and initiate a connection.
     *
     * @param {Object} options Connection options
     * @return {net.Socket} The newly created socket used to start the connection
     * @private
     */
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }

    /**
     * Create a `tls.TLSSocket` and initiate a connection.
     *
     * @param {Object} options Connection options
     * @return {tls.TLSSocket} The newly created socket used to start the connection
     * @private
     */
    function tlsConnect(options) {
      options.path = undefined;

      if (!options.servername && options.servername !== '') {
        options.servername = net.isIP(options.host) ? '' : options.host;
      }

      return tls.connect(options);
    }

    /**
     * Abort the handshake and emit an error.
     *
     * @param {WebSocket} websocket The WebSocket instance
     * @param {(http.ClientRequest|net.Socket|tls.Socket)} stream The request to
     *     abort or the socket to destroy
     * @param {String} message The error message
     * @private
     */
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket.CLOSING;

      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);

      if (stream.setHeader) {
        stream.abort();

        if (stream.socket && !stream.socket.destroyed) {
          //
          // On Node.js >= 14.3.0 `request.abort()` does not destroy the socket if
          // called after the request completed. See
          // https://github.com/websockets/ws/issues/1869.
          //
          stream.socket.destroy();
        }

        stream.once('abort', websocket.emitClose.bind(websocket));
        websocket.emit('error', err);
      } else {
        stream.destroy(err);
        stream.once('error', websocket.emit.bind(websocket, 'error'));
        stream.once('close', websocket.emitClose.bind(websocket));
      }
    }

    /**
     * Handle cases where the `ping()`, `pong()`, or `send()` methods are called
     * when the `readyState` attribute is `CLOSING` or `CLOSED`.
     *
     * @param {WebSocket} websocket The WebSocket instance
     * @param {*} [data] The data to send
     * @param {Function} [cb] Callback
     * @private
     */
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = toBuffer(data).length;

        //
        // The `_bufferedAmount` property is used only when the peer is a client and
        // the opening handshake fails. Under these circumstances, in fact, the
        // `setSocket()` method is not called, so the `_socket` and `_sender`
        // properties are set to `null`.
        //
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }

      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} ` +
            `(${readyStates[websocket.readyState]})`
        );
        cb(err);
      }
    }

    /**
     * The listener of the `Receiver` `'conclude'` event.
     *
     * @param {Number} code The status code
     * @param {String} reason The reason for closing
     * @private
     */
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];

      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;

      if (websocket._socket[kWebSocket] === undefined) return;

      websocket._socket.removeListener('data', socketOnData);
      process.nextTick(resume, websocket._socket);

      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }

    /**
     * The listener of the `Receiver` `'drain'` event.
     *
     * @private
     */
    function receiverOnDrain() {
      this[kWebSocket]._socket.resume();
    }

    /**
     * The listener of the `Receiver` `'error'` event.
     *
     * @param {(RangeError|Error)} err The emitted error
     * @private
     */
    function receiverOnError(err) {
      const websocket = this[kWebSocket];

      if (websocket._socket[kWebSocket] !== undefined) {
        websocket._socket.removeListener('data', socketOnData);

        //
        // On Node.js < 14.0.0 the `'error'` event is emitted synchronously. See
        // https://github.com/websockets/ws/issues/1940.
        //
        process.nextTick(resume, websocket._socket);

        websocket.close(err[kStatusCode]);
      }

      websocket.emit('error', err);
    }

    /**
     * The listener of the `Receiver` `'finish'` event.
     *
     * @private
     */
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }

    /**
     * The listener of the `Receiver` `'message'` event.
     *
     * @param {(String|Buffer|ArrayBuffer|Buffer[])} data The message
     * @private
     */
    function receiverOnMessage(data) {
      this[kWebSocket].emit('message', data);
    }

    /**
     * The listener of the `Receiver` `'ping'` event.
     *
     * @param {Buffer} data The data included in the ping frame
     * @private
     */
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];

      websocket.pong(data, !websocket._isServer, NOOP);
      websocket.emit('ping', data);
    }

    /**
     * The listener of the `Receiver` `'pong'` event.
     *
     * @param {Buffer} data The data included in the pong frame
     * @private
     */
    function receiverOnPong(data) {
      this[kWebSocket].emit('pong', data);
    }

    /**
     * Resume a readable stream
     *
     * @param {Readable} stream The readable stream
     * @private
     */
    function resume(stream) {
      stream.resume();
    }

    /**
     * The listener of the `net.Socket` `'close'` event.
     *
     * @private
     */
    function socketOnClose() {
      const websocket = this[kWebSocket];

      this.removeListener('close', socketOnClose);
      this.removeListener('data', socketOnData);
      this.removeListener('end', socketOnEnd);

      websocket._readyState = WebSocket.CLOSING;

      let chunk;

      //
      // The close frame might not have been received or the `'end'` event emitted,
      // for example, if the socket was destroyed due to an error. Ensure that the
      // `receiver` stream is closed after writing any remaining buffered data to
      // it. If the readable side of the socket is in flowing mode then there is no
      // buffered data as everything has been already written and `readable.read()`
      // will return `null`. If instead, the socket is paused, any possible buffered
      // data will be read as a single chunk.
      //
      if (
        !this._readableState.endEmitted &&
        !websocket._closeFrameReceived &&
        !websocket._receiver._writableState.errorEmitted &&
        (chunk = websocket._socket.read()) !== null
      ) {
        websocket._receiver.write(chunk);
      }

      websocket._receiver.end();

      this[kWebSocket] = undefined;

      clearTimeout(websocket._closeTimer);

      if (
        websocket._receiver._writableState.finished ||
        websocket._receiver._writableState.errorEmitted
      ) {
        websocket.emitClose();
      } else {
        websocket._receiver.on('error', receiverOnFinish);
        websocket._receiver.on('finish', receiverOnFinish);
      }
    }

    /**
     * The listener of the `net.Socket` `'data'` event.
     *
     * @param {Buffer} chunk A chunk of data
     * @private
     */
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }

    /**
     * The listener of the `net.Socket` `'end'` event.
     *
     * @private
     */
    function socketOnEnd() {
      const websocket = this[kWebSocket];

      websocket._readyState = WebSocket.CLOSING;
      websocket._receiver.end();
      this.end();
    }

    /**
     * The listener of the `net.Socket` `'error'` event.
     *
     * @private
     */
    function socketOnError() {
      const websocket = this[kWebSocket];

      this.removeListener('error', socketOnError);
      this.on('error', NOOP);

      if (websocket) {
        websocket._readyState = WebSocket.CLOSING;
        this.destroy();
      }
    }

    /***/
  },

  /***/ 1269: /***/ module => {
    module.exports = eval('require')('bufferutil');

    /***/
  },

  /***/ 4592: /***/ module => {
    module.exports = eval('require')('utf-8-validate');

    /***/
  },

  /***/ 4468: /***/ (
    __unused_webpack___webpack_module__,
    __webpack_exports__,
    __webpack_require__
  ) => {
    // ESM COMPAT FLAG
    __webpack_require__.r(__webpack_exports__);

    // EXPORTS
    __webpack_require__.d(__webpack_exports__, {
      tunnelmole: () => /* reexport */ tunnelmole
    }); // CONCATENATED MODULE: ./node_modules/tunnelmole/dist/config-instance.js
    const instanceConfig = {
      hostip: {
        endpoint: 'wss://service.tunnelmole.com:8083',
        httpEndpoint: 'https://service.tunnelmole.com'
      },
      runtime: {
        enableLogging: true
      }
    };
    /* harmony default export */ const config_instance = instanceConfig;
    //# sourceMappingURL=config-instance.js.map
    // EXTERNAL MODULE: ./node_modules/deepmerge/dist/cjs.js
    var cjs = __webpack_require__(6323); // CONCATENATED MODULE: ./node_modules/tunnelmole/dist/config.js

    const baseConfig = {
      hostip: {
        endpoint: 'service.tunnelmole.com',
        port: '80'
      },
      runtime: {
        enableLogging: true
      }
    };
    const config = cjs(baseConfig, config_instance);
    /* harmony default export */ const dist_config = config;
    //# sourceMappingURL=config.js.map
    // EXTERNAL MODULE: ./node_modules/ws/index.js
    var ws = __webpack_require__(8867); // CONCATENATED MODULE: ./node_modules/tunnelmole/dist/src/websocket/host-ip-websocket.js

    class HostipWebSocket extends ws {
      sendMessage(object) {
        const json = JSON.stringify(object);
        this.send(json);
      }
    }
    //# sourceMappingURL=host-ip-websocket.js.map
    // CONCATENATED MODULE: ./node_modules/tunnelmole/dist/src/messages/types.js
    const initialise = 'initialise';
    const hostnameAssigned = 'hostnameAssigned';
    const forwardedResponse = 'forwardedResponse';

    //# sourceMappingURL=types.js.map
    // EXTERNAL MODULE: external "events"
    var external_events_ = __webpack_require__(2361); // CONCATENATED MODULE: ./node_modules/tunnelmole/dist/src/events/event-handler.js

    const eventHandler = new external_events_.EventEmitter();
    const URL_ASSIGNED = 'url-assigned';
    //# sourceMappingURL=event-handler.js.map
    // CONCATENATED MODULE: ./node_modules/tunnelmole/dist/src/message-handlers/hostname-assigned.js

    async function hostname_assigned_hostnameAssigned(
      message,
      websocket,
      options
    ) {
      const port = options.port;
      if (typeof port === 'undefined') {
        console.error('Please specify a port e.g. run "tmole 80"');
      }
      const httpUrl = `http://${message.hostname}`;
      const httpsUrl = `https://${message.hostname}`;
      if (process.env.TUNNELMOLE_QUIET_MODE !== '1') {
        console.info(`${httpUrl} is forwarding to localhost:${port}`);
        console.info(`${httpsUrl} is forwarding to localhost:${port}`);
      }
      eventHandler.emit(URL_ASSIGNED, httpsUrl);
    }
    //# sourceMappingURL=hostname-assigned.js.map
    // EXTERNAL MODULE: external "http"
    var external_http_ = __webpack_require__(3685); // CONCATENATED MODULE: ./node_modules/tunnelmole/dist/src/logging/log.js
    async function log(message, level = 'info') {
      switch (level) {
        case 'info':
          if (process.env.TUNNELMOLE_DEBUG === '1') {
            console.info(message);
          }
          break;
        case 'warning':
          console.warn(message);
          break;
        case 'error':
          console.error(message);
          break;
        default:
          console.info(message);
          break;
      }
    }
    //# sourceMappingURL=log.js.map
    // CONCATENATED MODULE: ./node_modules/tunnelmole/dist/src/message-handlers/forwarded-request.js

    async function forwardedRequest(
      forwardedRequestMessage,
      websocket,
      options
    ) {
      const port = options.port;
      const { requestId, url, headers } = forwardedRequestMessage;
      // @todo: Once GET is working, add support for all HTTP methods
      const requestOptions = {
        hostname: 'localhost',
        method: forwardedRequestMessage.method,
        port: port,
        path: url,
        headers
      };
      const request = external_http_.request(requestOptions, response => {
        let responseBody;
        response.on('data', chunk => {
          if (typeof responseBody === 'undefined') {
            responseBody = chunk;
          } else {
            responseBody = Buffer.concat([responseBody, chunk]);
          }
        });
        /**
         * If you see this callback being called more than once, this is probably normal especially if a browser initiated the request
         * Most browsers will make more than one request, for example an extra one for favicon.ico
         */
        response.on('end', () => {
          //@ts-expect-error
          const forwardedResponseMessage = {
            type: forwardedResponse,
            requestId,
            statusCode: response.statusCode,
            url,
            headers: response.headers,
            body: ''
          };
          if (Buffer.isBuffer(responseBody)) {
            forwardedResponseMessage.body = responseBody.toString('base64');
          }
          websocket.sendMessage(forwardedResponseMessage);
        });
      });
      // Send the request body if its not empty
      if (forwardedRequestMessage.body !== '') {
        const requestBody = Buffer.from(forwardedRequestMessage.body, 'base64');
        request.write(requestBody);
      }
      request.on('error', error => {
        log(error);
      });
      request.end();
    }
    //# sourceMappingURL=forwarded-request.js.map
    // CONCATENATED MODULE: ./node_modules/tunnelmole/dist/src/message-handlers/hostname-already-taken.js
    async function hostnameAlreadyTaken(message) {
      console.error(
        message.hostname +
          ' is already taken, please choose a different hostname'
      );
      process.exit(0);
    }
    //# sourceMappingURL=hostname-already-taken.js.map
    // CONCATENATED MODULE: ./node_modules/tunnelmole/dist/src/message-handlers/invalid-subscription.js
    function invalidSubscription(message) {
      if (typeof message.apiKey === 'string') {
        console.info(
          'You have set the invalid api key ' +
            message.apiKey +
            '.\n\n' +
            'There is no active subscription associated with this api key, please check your account at https://dashboard.tunnelmole.com\n' +
            'Please set an api key for a valid subscription with "tmole --set-api-key <your_new_api_key>"\n\n' +
            'Falling back to free mode with a random subdomain.\n'
        );
      } else {
        console.info(
          'Custom tunnelmole.net subdomains are a premium feature and require a subscription.' +
            '\n\n' +
            'To get started, sign up at https://dashboard.tunnelmole.com.' +
            '\n\n' +
            'Tunnelmole is an open source project so you can also try self hosting, if you prefer to spend time instead of money.' +
            '\n' +
            'Head over to https://github.com/robbie-cahill/tunnelmole-service to learn more.\n\n' +
            'Falling back to free mode with a random subdomain.\n\n'
        );
      }
    }
    //# sourceMappingURL=invalid-subscription.js.map
    // CONCATENATED MODULE: ./node_modules/tunnelmole/dist/src/message-handlers/domain-already-reserved.js
    function domainAlreadyReserved(message) {
      console.info(
        `The domain ${message.subdomain}.tunnelmole.net is already reserved by another user. Please choose a different subdomain. Falling back to a random subdomain`
      );
    }
    //# sourceMappingURL=domain-already-reserved.js.map
    // CONCATENATED MODULE: ./node_modules/tunnelmole/dist/src/message-handlers/domain-reservation-error.js
    function domainReservationError(message) {
      console.info(
        `There was an error reserving the domain ${message.subdomain}.tunnelmole.net. Falling back to a random subdomain`
      );
    }
    //# sourceMappingURL=domain-reservation-error.js.map
    // CONCATENATED MODULE: ./node_modules/tunnelmole/dist/src/message-handlers/too-many-domains.js
    function tooManyDomains(message) {
      console.info(
        `You have exceeded the domain limit for your API key. Falling back to a random subdomain. Try removing some domains with "tmole --unreserve-subdomain <subdomain>"`
      );
    }
    //# sourceMappingURL=too-many-domains.js.map
    // CONCATENATED MODULE: ./node_modules/tunnelmole/dist/src/message-handlers/client-message.js
    function clientMessage(message) {
      var _a;
      switch ((_a = message.logLevel) !== null && _a !== void 0 ? _a : 'info') {
        case 'info':
          console.info(message.message);
          break;
        case 'warn':
          console.warn(message.message);
          break;
        case 'error':
          console.error(message.message);
          break;
        default:
          console.info(message.message);
          break;
      }
    }
    //# sourceMappingURL=client-message.js.map
    // CONCATENATED MODULE: ./node_modules/tunnelmole/dist/message-handlers.js

    /**
     * Websocket message handlers for different message types
     * Like app.ts for express, but with handlers for different message types instead of URLs
     */
    const messageHandlers = {
      hostnameAssigned: hostname_assigned_hostnameAssigned,
      forwardedRequest: forwardedRequest,
      hostnameAlreadyTaken: hostnameAlreadyTaken,
      invalidSubscription: invalidSubscription,
      domainAlreadyReserved: domainAlreadyReserved,
      domainReservationError: domainReservationError,
      tooManyDomains: tooManyDomains,
      clientMessage: clientMessage
    };

    //# sourceMappingURL=message-handlers.js.map
    // EXTERNAL MODULE: external "crypto"
    var external_crypto_ = __webpack_require__(6113); // CONCATENATED MODULE: ./node_modules/nanoid/url-alphabet/index.js
    // This alphabet uses `A-Za-z0-9_-` symbols.
    // The order of characters is optimized for better gzip and brotli compression.
    // Same as in non-secure/index.js
    const urlAlphabet =
      'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'; // CONCATENATED MODULE: ./node_modules/nanoid/index.js

    // It is best to make fewer, larger requests to the crypto module to
    // avoid system call overhead. So, random numbers are generated in a
    // pool. The pool is a Buffer that is larger than the initial random
    // request size by this multiplier. The pool is enlarged if subsequent
    // requests exceed the maximum buffer size.
    const POOL_SIZE_MULTIPLIER = 128;
    let pool, poolOffset;

    const fillPool = bytes => {
      if (!pool || pool.length < bytes) {
        pool = Buffer.allocUnsafe(bytes * POOL_SIZE_MULTIPLIER);
        external_crypto_.randomFillSync(pool);
        poolOffset = 0;
      } else if (poolOffset + bytes > pool.length) {
        external_crypto_.randomFillSync(pool);
        poolOffset = 0;
      }
      poolOffset += bytes;
    };

    const random = bytes => {
      // `|=` convert `bytes` to number to prevent `valueOf` abusing and pool pollution
      fillPool((bytes |= 0));
      return pool.subarray(poolOffset - bytes, poolOffset);
    };

    const customRandom = (alphabet, defaultSize, getRandom) => {
      // First, a bitmask is necessary to generate the ID. The bitmask makes bytes
      // values closer to the alphabet size. The bitmask calculates the closest
      // `2^31 - 1` number, which exceeds the alphabet size.
      // For example, the bitmask for the alphabet size 30 is 31 (00011111).
      const mask = (2 << (31 - Math.clz32((alphabet.length - 1) | 1))) - 1;
      // Though, the bitmask solution is not perfect since the bytes exceeding
      // the alphabet size are refused. Therefore, to reliably generate the ID,
      // the random bytes redundancy has to be satisfied.

      // Note: every hardware random generator call is performance expensive,
      // because the system call for entropy collection takes a lot of time.
      // So, to avoid additional system calls, extra bytes are requested in advance.

      // Next, a step determines how many random bytes to generate.
      // The number of random bytes gets decided upon the ID size, mask,
      // alphabet size, and magic number 1.6 (using 1.6 peaks at performance
      // according to benchmarks).
      const step = Math.ceil((1.6 * mask * defaultSize) / alphabet.length);

      return (size = defaultSize) => {
        let id = '';
        while (true) {
          const bytes = getRandom(step);
          // A compact alternative for `for (let i = 0; i < step; i++)`.
          let i = step;
          while (i--) {
            // Adding `|| ''` refuses a random byte that exceeds the alphabet size.
            id += alphabet[bytes[i] & mask] || '';
            if (id.length === size) return id;
          }
        }
      };
    };

    const customAlphabet = (alphabet, size = 21) =>
      customRandom(alphabet, size, random);

    const nanoid = (size = 21) => {
      // `|=` convert `size` to number to prevent `valueOf` abusing and pool pollution
      fillPool((size |= 0));
      let id = '';
      // We are reading directly from the random pool to avoid creating new array
      for (let i = poolOffset - size; i < poolOffset; i++) {
        // It is incorrect to use bytes exceeding the alphabet size.
        // The following mask reduces the random byte in the 0-255 value
        // range to the 0-63 value range. Therefore, adding hacks, such
        // as empty string fallback or magic numbers, is unneccessary because
        // the bitmask trims bytes down to the alphabet size.
        id += urlAlphabet[pool[i] & 63];
      }
      return id;
    };

    // EXTERNAL MODULE: external "fs"
    var external_fs_ = __webpack_require__(7147);
    // EXTERNAL MODULE: ./node_modules/node-localstorage/LocalStorage.js
    var LocalStorage = __webpack_require__(7908);
    // EXTERNAL MODULE: external "os"
    var external_os_ = __webpack_require__(2037); // CONCATENATED MODULE: ./node_modules/tunnelmole/dist/src/node-persist/storage.js

    let storage_storage;
    const storage_initStorage = async () => {
      const homedir = external_os_.homedir();
      const dir = homedir + '/' + '.tmole.sh';
      if (!external_fs_.existsSync(dir)) {
        external_fs_.mkdirSync(dir);
      }
      storage_storage = new LocalStorage.LocalStorage(dir + '/local-storage');
      return;
    };
    //# sourceMappingURL=storage.js.map
    // CONCATENATED MODULE: ./node_modules/tunnelmole/dist/src/identity/client-id-service.js

    const initialiseClientId = async () => {
      // @todo Check for an existing client id before overwriting it with a new one
      const existingClientId = await getClientId();
      if (!existingClientId) {
        const clientId = nanoid();
        storage_storage.setItem('clientId', clientId);
      }
    };
    const getClientId = async () => {
      const clientId = storage_storage.getItem('clientId');
      return clientId;
    };
    //# sourceMappingURL=client-id-service.js.map
    // CONCATENATED MODULE: ./node_modules/tunnelmole/dist/src/identity/api-key-service.js

    const API_KEY = 'apiKey';
    const getApiKey = async () => {
      const apiKey = storage_storage.getItem(API_KEY) || undefined;
      return apiKey;
    };
    const setApiKey = async apiKey => {
      if (!storage) {
        initStorage();
      }
      storage.setItem(API_KEY, apiKey);
      console.info('API Key ' + apiKey + ' is set\n');
    };

    //# sourceMappingURL=api-key-service.js.map
    // EXTERNAL MODULE: ./node_modules/validator/index.js
    var validator = __webpack_require__(7527); // CONCATENATED MODULE: ./node_modules/tunnelmole/dist/src/tunnelmole.js

    async function tunnelmole(options) {
      await storage_initStorage();
      await initialiseClientId();
      // Set port to 3000 if port is not specified
      if (options.port === undefined) {
        options.port = 3000;
      }
      if (options.setApiKey) {
        return;
      }
      const websocket = new HostipWebSocket(dist_config.hostip.endpoint);
      const websocketIsReady = websocket.readyState === 1;
      const sendInitialiseMessage = async () => {
        var _a;
        log('Sending initialise message');
        const initialiseMessage = {
          type: initialise,
          clientId: await getClientId()
        };
        // Set api key if we have one available
        const apiKey = await getApiKey();
        if (typeof apiKey === 'string') {
          initialiseMessage.apiKey = apiKey;
        }
        // Handle passed subdomain param if present
        let domain =
          (_a = options.domain) !== null && _a !== void 0 ? _a : undefined;
        if (typeof domain === 'string') {
          // Remove protocols in case they were passed by mistake as the "domain"
          domain = domain.replace('http://', '');
          domain = domain.replace('https://', '');
          if (!validator.isURL(domain)) {
            console.info(
              'Invalid domain name passed, please use the format mydomain.tunnelmole.net'
            );
            return Promise.resolve();
          }
          const domainParts = domain.split('.');
          const subdomain = domainParts[0];
          initialiseMessage.subdomain = subdomain;
        }
        websocket.sendMessage(initialiseMessage);
      };
      // There seems to be a bug where on a second run, the websocket is re-used and is in a ready state
      // Send initialise message now if this is the case, otherwise set the open event to trigger the initialise message
      if (websocketIsReady) {
        sendInitialiseMessage();
      } else {
        websocket.on('open', sendInitialiseMessage);
      }
      websocket.on('message', text => {
        const message = JSON.parse(text);
        if (typeof message.type !== 'string') {
          console.error('Invalid message, type is missing or invalid');
        }
        // Errors should be handled in the handler itself. If it gets here it will be thrown.
        if (typeof messageHandlers[message.type] !== 'function') {
          console.error('Handler not found for message type ' + message.type);
        }
        const handler = messageHandlers[message.type];
        handler(message, websocket, options);
      });
      // Log messages if debug is enabled
      websocket.on('message', text => {
        const message = JSON.parse(text);
        log(Date.now() + ' Received ' + message.type + ' message:', 'info');
        log(message, 'info');
      });
      // Log errors
      websocket.on('error', error => {
        log(Date.now() + 'Caught an error:', 'error');
        console.error(error);
      });
      // Listen for the URL assigned event and return it
      return new Promise(resolve => {
        eventHandler.on(URL_ASSIGNED, url => {
          resolve(url);
        });
      });
    }
    //# sourceMappingURL=tunnelmole.js.map
    // CONCATENATED MODULE: ./node_modules/tunnelmole/dist/src/index.js

    //# sourceMappingURL=index.js.map

    /***/
  }
};
