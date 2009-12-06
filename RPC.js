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

// set the version of the JSON-RPC
var version = "2.0";

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
    try {
      var rpcRequest = {
        method: req.uri.params.method,
        params: JSON.parse(req.uri.params.params),
        id: req.uri.params.id
      };      
    } catch (e) {
      parseError(res, null);
      return;
    }
    checkValidRequest(rpcRequest, res);
    processRequest(rpcRequest, res);
    
  // handle POST requests
  } else {
    req.setBodyEncoding("utf8");
    var body = "";
    req.addListener("body", function(chunk) {
      body += chunk;
    });

    req.addListener("complete", function() {
      try {
        var rpcRequest = JSON.parse(body);        
      } catch (e) {
        parseError(res, null);
        return;
      }
      checkValidRequest(rpcRequest, res);      
      processRequest(rpcRequest, res);
    });    
    return;
  } 
}).listen(8000);
sys.puts('Server running at http://127.0.0.1:8000/');


var processRequest = function(rpcRequest, res) {
  
  try {
    // check for param count
    if (service[rpcRequest.method].length != rpcRequest.params.length) {
      invalidParams(res, rpcRequest);
      return;
    }
    
    var result = service[rpcRequest.method].apply(service, rpcRequest.params);
    
    // check for async requests
    if (result instanceof process.Promise) {
      // not failed
      result.addCallback(function(result) {
        finishRequest(rpcRequest, res, result, null);        
      });
      // failed
      result.addErrback(function(e) {    
        internalError(res, rpcRequest);
      });
      return;
    }
  } catch (e) {
    methodNotFound(res, rpcRequest);
    return;
  }
  
  finishRequest(rpcRequest, res, result, null);
}


var finishRequest = function(rpcRequest, res, result, error) {
  // check for id's (needs response)
  if (rpcRequest.id != null) {
    res.sendHeader(200, {'Content-Type': 'application/json-rpc'});
    var rpcRespone = createResponse(result, error, rpcRequest);
    res.sendBody(JSON.stringify(rpcRespone));
  } else {
    res.sendHeader(204, {'Connection': 'close'});
  }

  res.finish();  
}


var createResponse = function(result, error, rpcRequest) {
  if (version === "2.0") {
    var rpcResponse = {
      jsonrpc: "2.0"
    };
    error != null ? rpcResponse.error = error : rpcResponse.result = result
    rpcResponse.id = rpcRequest && rpcRequest.id ? rpcRequest.id : null;
    return rpcResponse;
  } else {
    return {
      result : result || null,
      error : error || null,
      id : rpcRequest && rpcRequest.id ? rpcRequest.id : null 
    };    
  }
}


var checkValidRequest = function(rpcRequest, res) {
  if (
    !rpcRequest.method || 
    !rpcRequest.params || 
    rpcRequest.id === undefined ||
    !(rpcRequest.params instanceof Array)
  ) {          
    invalidRequest(res, rpcRequest);
  }
}


/**
 * ERROR HANDLING
 */
var sendError = function(res, status, error, request) {
  res.sendHeader(status, {'Content-Type': 'application/json-rpc'});      
  var rpcRespone = createResponse(null, error, request);
  res.sendBody(JSON.stringify(rpcRespone));
  res.finish();  
}

var createError = function(code, message) {
  return {code : code, message : message};
}

var parseError = function(res, request) {
  sendError(res, 500, createError(-32700, "Parse error."), request);
}

var invalidRequest = function(res, request) {
  sendError(res, 400, createError(-32600, "Invalid Request."), request);
}

var methodNotFound = function(res, request) {
  sendError(res, 404, createError(-32601, "Method not found."), request);  
}

var invalidParams = function(res, request) {
  sendError(res, 500, createError(-32602, "Invalid params."), request);  
}

var internalError = function(res, request) {
  sendError(res, 500, createError(-32603, "Internal error."), request);  
}