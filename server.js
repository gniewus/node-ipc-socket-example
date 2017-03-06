const ipc = require("node-ipc"),
      path = require("path"),
      fs = require("fs"),
      process = require("process"),
      util = require("./util"),
      C = require("./C");

var logger = {
    log: function(s) {
        console.log("[INFO] " + s);
    }
};

util.ipc_set_default_config(ipc.config);
util.ensure_socket_master_dir(C.APP_NAME);

ipc.config.appspace = C.APP_NAME;
ipc.config.socketRoot = util.make_socket_root(C.APP_NAME);

logger.log("setting socket path to: " + ipc.config.socketRoot);

ipc.serve(
        ipc.config.socketRoot,
        () => {
            ipc.server.on(
                "get:appidentity",
                (data, socket) => {
                    ipc.server.emit(socket,
                        "appidentity",
                        {
                            id: ipc.config.id,
                            message: C.APP_NAME
                        }
                    );
                }
            );
});

new Array("SIGINT", "exit", "uncaughtException")
        .forEach(evtname => {
    process.on(evtname, () => {
        var spath = ipc.config.socketRoot;
        if(fs.existsSync(spath)) {
            logger.log("cleaning up file: " + spath);
            fs.unlinkSync(spath);
        }
        process.exit();
    });
})

ipc.server.start();
