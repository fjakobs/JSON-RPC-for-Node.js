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
      invalidParams(res, rpcRequest.id);
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
        internalError(res, rpcRequest.id);
      });
      return;
    }
  } catch (e) {
    methodNotFound(res, rpcRequest.id);
    return;
  }
  
  finishRequest(rpcRequest, res, result, null);
}


var finishRequest = function(rpcRequest, res, result, error) {
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


var checkValidRequest = function(rpcRequest, res) {
  if (
    !rpcRequest.method || 
    !rpcRequest.params || 
    rpcRequest.id === undefined ||
    !(rpcRequest.params instanceof Array)
  ) {          
    invalidRequest(res, rpcRequest.id || null);
  }
}


/**
 * ERROR HANDLING
 */
var returnError = function(res, status, error, id) {
  res.sendHeader(status, {'Content-Type': 'application/json-rpc'});      
  var rpcRespone = createResponse(null, error, id);
  res.sendBody(JSON.stringify(rpcRespone));
  res.finish();  
}

var parseError = function(res, id) {
  var error = {
    code : -32700,
    message : "Parse error."
  };
  returnError(res, 500, error, id);
}

var invalidRequest = function(res, id) {
  var error = {
    code : -32600,
    message : "Invalid Request."
  };
  returnError(res, 400, error, id);
}

var methodNotFound = function(res, id) {
  var error = {
    code : -32601,
    message : "Method not found."
  };
  returnError(res, 404, error, id);  
}

var invalidParams = function(res, id) {
  var error = {
    code : -32602,
    message : "Invalid params."
  };
  returnError(res, 500, error, id);  
}

var internalError = function(res, id) {
  var error = {
    code : -32603,
    message : "Internal error."
  };
  returnError(res, 500, error, id);  
}