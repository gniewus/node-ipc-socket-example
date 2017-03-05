const os = require("os"),
      path = require("path"),
      process = require("process"),
      fs = require("fs");

const PREFIX = "node-socket-" + process.getuid() + "-";

function ensure_appname(maybe_appname) {
    return maybe_appname || ("proc-"+process.pid);
}

function make_socket_dir_path(appname) {
    var tmpdir = os.tmpdir(),
        procdir = path.join(tmpdir, PREFIX+appname);
    return procdir;
}

exports.make_socket_root = function(appname) {
    var sockdir = make_socket_dir_path(appname)
    return path.join(
            sockdir,
            process.pid.toString()+"_"
            +process.getuid()
    )
};

exports.ipc_set_default_config = function(ipc_config) {
    ipc_config.retry = 1500;
};

exports.ensure_socket_master_dir = function(maybe_appname) {
    var appname = ensure_appname(maybe_appname),
        procdir = make_socket_dir_path(appname);
    if(!fs.existsSync(procdir)) {
        fs.mkdirSync(procdir);
    }
    return procdir;
};

exports.discover_socket_and_setup = function(maybe_appname, on_connect, handlers) {
    var appname = ensure_appname(maybe_appname),
        procdir = make_socket_dir_path(maybe_appname);

    fs.readdirSync(procdir).forEach(sfile => {
        var spath = path.join(procdir, sfile)

        const tipc = require("node-ipc");
        exports.ipc_set_default_config(tipc.config);

        tipc.config.id = appname + "-client";
        tipc.config.socketRoot = spath;

        tipc.connectTo(
            sfile,
            spath,
            function() {
                tipc.of[sfile].on(
                    "connect",
                    function() {
                        tipc.log("# connected to world", tipc.config.delay);
                        tipc.of[sfile].emit(
                                "get:appidentity",
                                { id: tipc.config.id })
                    });
                tipc.of[sfile].on(
                    "appidentity",
                    function(data) {
                        if(data.message == appname) {
                            // match!
                            if(on_connect) {
                                on_connect(tipc, sfile, data);
                            }
                        } else {
                            tipc.log("# not match, disconnecting...")
                            tipc.disconnect(sfile);
                        }
                    });
                Object.keys(handlers || {}).forEach((evtname) => {
                    var handler = handlers[evtname]
                    tipc.of[sfile].on(evtname, handler);
                });
                // console.log(tipc.of[sfile].destroy)
            }
        );
    });
};
