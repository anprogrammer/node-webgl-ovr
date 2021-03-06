var GLFW = require('node-glfw-ovr');
var WebGL = require('./webgl');

module.exports = function () {

    if (process.platform !== 'win32')
        process.on('SIGINT', function () { process.exit(0); });
    //process.on('exit', function () { console.log('exiting app'); });

    var platform;
    var window;

    var events;
    Object.defineProperty(GLFW, 'events', {
      get: function () {
        if (events) return events;
        events = new (require('events').EventEmitter);
        
        var _emit=events.emit;
        events.emit=function() {
          var args = Array.prototype.slice.call(arguments);
          var evt= args[1]; // args[1] is the event, args[0] is the type of event
          //console.log("emitting event: "+require('util').inspect(args));
          if(args[0] != 'quit') {
            evt.preventDefault = function () {};
            evt.stopPropagation = function () {};
          }
          //_emit.apply(this,args);
          events.listeners(args[0]).forEach(function(listener) {
            listener(args[1]);        
          });
        };
        return events;
      },
      // enumerable: true,
      // configurable: true
    });

    GLFW.Init();
    //  GLFW.events.on('event', console.dir);
    GLFW.events.on('quit', function () { process.exit(0); });
    GLFW.events.on("keydown", function (evt) {
      if (evt.keyCode === 'C'.charCodeAt(0) && evt.ctrlKey) { process.exit(0); }// Control+C
    });

    var currentWindow = null;
    platform = {
        type: "nodeGLFW",
        setTitle: function(title) {
            GLFW.SetWindowTitle(window, title);
        },
        setIcon: function () { },
        flip: function() {
            GLFW.SwapBuffers(window);
        },
        getElementById: function (name) {
            return null; //this;
        },
        createElement: function (name, width, height, monitor, fs) {
            if (name.indexOf('canvas') >= 0) {
                this.createWindow(width || 800, height || 800, monitor || 0, fs || false);
                this.canvas = this;
                WebGL.canvas = this;
                return this;
            }
            return null;
        },
        createWindow: function (width, height, monitor, fs) {
            var attribs = GLFW.WINDOW;

            if (width == 0 || height == 0) {
                attribs = GLFW.FULLSCREEN;
                width = height = 0;
            }
            
            if (fs) {
                attribs = GLFW.FULLSCREEN;
            }

            var resizeListeners = [], rl = GLFW.events.listeners('resize');
            for (var l = 0, ln = rl.length; l < ln; ++l)
                resizeListeners[l] = rl[l];
            GLFW.events.removeAllListeners('resize');

            GLFW.DefaultWindowHints();

            // we use OpenGL 2.1, GLSL 1.20. Comment this for now as this is for GLSL 1.50
            //GLFW.OpenWindowHint(GLFW.OPENGL_FORWARD_COMPAT, 1);
            //GLFW.OpenWindowHint(GLFW.OPENGL_VERSION_MAJOR, 3);
            //GLFW.OpenWindowHint(GLFW.OPENGL_VERSION_MINOR, 2);
            //GLFW.OpenWindowHint(GLFW.OPENGL_PROFILE, GLFW.OPENGL_CORE_PROFILE);
            GLFW.WindowHint(GLFW.RESIZABLE, 1);
            GLFW.WindowHint(GLFW.VISIBLE, 1);
            GLFW.WindowHint(GLFW.DECORATED, 1);
            GLFW.WindowHint(GLFW.RED_BITS, 8);
            GLFW.WindowHint(GLFW.GREEN_BITS, 8);
            GLFW.WindowHint(GLFW.BLUE_BITS, 8);
            GLFW.WindowHint(GLFW.DEPTH_BITS, 24);
            GLFW.WindowHint(GLFW.REFRESH_RATE, 0);

            if (!(window=GLFW.CreateWindow(width, height, "", monitor))) {
                GLFW.Terminate();
                throw "Can't initialize GL surface";
            }

            GLFW.MakeContextCurrent(window);

            GLFW.SetWindowTitle("WebGL");

            // make sure GLEW is initialized
            WebGL.Init();

            GLFW.SwapBuffers(window);
            GLFW.SwapInterval(window,0); // Disable VSync (we want to get as high FPS as possible!)

            for (var l = 0, ln = resizeListeners.length; l < ln; ++l)
                GLFW.events.addListener('resize', resizeListeners[l]);

            var size = GLFW.GetWindowSize(window);
            this.width = this.drawingBufferWidth = size.width;
            this.height = this.drawingBufferHeight = size.height;
            currentWindow = window;
        },
        getContext: function (name) {
            return WebGL;
        },
        on: function (name, callback) {
            GLFW.events.on(name, callback);
        },
        addEventListener: function (name, callback) {
            GLFW.events.on(name, callback);
        },
        removeEventListener: function (name, callback) {
            GLFW.events.removeListener(name, callback);
        },
        getMonitorCount: function() {
            return GLFW.GetMonitors().length;
        },
        requestAnimationFrame: function (callback, delay) {
            GLFW.PollEvents();

            setImmediate(function () {
                GLFW.StartVRFrame(window);
                callback(GLFW.GetTime() * 1000.0);
                GLFW.EndVRFrame(window);
            });
        }
    };
    
    platform.destroyWindow = function(wnd) {
        GLFW.DestroyWindow(wnd);
    };
    
    platform.enableHMD = function(disableVsync) {
        return GLFW.EnableHMDRendering(currentWindow, disableVsync || false);
    };
    
    platform.getHMDTargetSize = function() {
        var sz = GLFW.GetHMDTargetSize();
        return [sz.x, sz.y];
    };
    
    platform.startVREye = function(n) {
        return GLFW.StartVREye(n);
    };
    
    platform.isVRSafetyWarningVisible = function() {
        return GLFW.IsVRSafetyWarningVisible();
    };
    
    platform.startVRFrame = function(wnd) {
        return GLFW.startVRFrame(wnd);
    };
    
    platform.getEyeViewport = function(n) {
        return GLFW.GetEyeViewport(n);
    };
    
    platform.getHeadPosition = function(n) {
        return GLFW.GetHeadPosition(n);
    };
    
    platform.getHeadOrientation = function(n) {
        return GLFW.GetHeadOrientation(n);
    };
    
    platform.getHMDFboId = function(gl) {
        return new gl.WebGLFramebuffer(GLFW.GetHMDFboId());
    };
    
    platform.getEyeViewAdjust = function(n) {
        return GLFW.GetEyeViewAdjust(n);
    };
    
    platform.getProjectionMatrix = function(n) {
        return GLFW.GetProjectionMatrix(n);
    };
    
    platform.resetVROrientation = function() {
        GLFW.ResetVROrientation();
    };
    
    platform.getJoystickAxes = function() {
        return GLFW.GetJoystickAxes();
    };
    
    platform.getJoystickButtons = function() {
        return GLFW.GetJoystickButtons();
    };

    Object.defineProperty(platform, 'AntTweakBar', {
        get: function (cb) {
            return new GLFW.AntTweakBar();
        }
    });

    Object.defineProperty(platform, 'onkeydown', {
        set: function (cb) {
            this.on('keydown', cb);
        }
    });

    Object.defineProperty(platform, 'onkeyup', {
        set: function (cb) {
            this.on('keyup', cb);
        }
    });
    
    Object.defineProperty(platform, 'onresize', {
        set: function(cb) {
            GLFW.events.on('resize', cb);
        }
    });

    return platform;
};

