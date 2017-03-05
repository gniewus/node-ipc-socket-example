const util = require("./util"),
      C = require("./C");

util.discover_socket_and_setup(C.APP_NAME,
    function(ipc_client, socket_id, data) {
        ipc_client.disconnect(socket_id);
    }
);
