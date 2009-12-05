/**
 * JOSN-RPC 1.0 implementation running on Node.js
 * 
 * Ther service file to includ must be given on the command line.
 * Example: node JSON-RPC/RPC.js ./service
 * 
 * http://json-rpc.org/wiki/specification
 * http://groups.google.com/group/json-rpc/web/json-rpc-1-2-proposal
 * http://groups.google.com/group/json-rpc/web/json-rpc-over-http
 * 
 * http://nodejs.org/
 * 
 * Creator: Martin Wittemann
 */
 
 // TODO: Add a way to use JSON-RPC 2.0 (proposal) 

// require the system stuff 
var sys = require('sys'), 
   http = require('http');
   
// include the service file
var serviceFile = process.ARGV[2];
if (!serviceFile) {
  sys.puts("No file for the service is given.");
  return;
} else if (serviceFile.charAt(0) != ".") {
  sys.puts("Filepath does not start with a . ");  
  return;  
} else if (serviceFile.indexOf(".js") != -1) {
  sys.puts("Please omit .js");  
  return;  
}
var service = require(serviceFile);


// create the server
http.createServer(function (req, res) {
    
  // handle GET requests
  if (req.method === "GET" && req.uri.params.method) {
    var rpcRequest = {
      method: req.uri.params.method,
      params: JSON.parse(req.uri.params.params),
      id: req.uri.params.id
    };
  // handle POST requests
  } else {
    // TODO: implement POST Parameters request handling
    req.setBodyEncoding("utf8");
    var body = "";
    req.addListener("body", function(chunk) {
      body += chunk;
    });

    req.addListener("complete", function() {
      var rpcRequest = JSON.parse(body);
      processRequest(rpcRequest, res);
    });    
    return;
  } 
  
  processRequest(rpcRequest, res);

}).listen(8000);
sys.puts('Server running at http://127.0.0.1:8000/');


var processRequest = function(rpcRequest, res) {
  
  try {
    var result = service[rpcRequest.method].apply(service, rpcRequest.params);
    // TODO: Check for async functions (promises)
  } catch (e) {
    // TODO propper error handing
    var error = createError(1, "", "");
  }
  
  // check for id's (needs response)
  if (rpcRequest.id != null) {
    res.sendHeader(200, {'Content-Type': 'application/json-rpc'});      
    var rpcRespone = createResponse(result, error, rpcRequest.id);
    res.sendBody(JSON.stringify(rpcRespone));
  } else {
    res.sendHeader(204, {'Connection': 'close'});
  }

  res.finish();  
}

var createResponse = function(result, error, id) {
  return {
    result : result || null,
    error : error || null,
    id : id
  };
}

var createError = function(code, message, data) {
  return {
    code: code,
    message: message,
    data: data
  };
}