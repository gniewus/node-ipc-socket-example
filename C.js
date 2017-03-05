const util = require("./util");

exports.APP_NAME = "C-socket-app";
exports.SOCKET_DIRECTORY = util.ensure_socket_master_dir(exports.APP_NAME);

