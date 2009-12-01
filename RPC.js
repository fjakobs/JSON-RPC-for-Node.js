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
var service = require(serviceFile);

// create the server
http.createServer(function (req, res) {  
  
  // TODO: set the proper content type (application/json-rpc)
  res.sendHeader(200, {'Content-Type': 'text/plain'});
  
  // TODO: implement propper GET Parameters AND POST request handling
  var rpcRequest = JSON.parse(req.uri.params.q);
  
  try {
    var result = service[rpcRequest.method].apply(service, rpcRequest.params);
    // TODO: Check for async functions (promises)
  } catch (e) {
    // TODO propper error handing
    var error = createError(1, "", "");
  }
  
  if (rpcRequest.id != null) {
    var rpsRespone = createResponse(result, error, rpcRequest.id);
    res.sendBody(sys.inspect(rpsRespone));
  }
  
  res.finish();    

}).listen(8000);
sys.puts('Server running at http://127.0.0.1:8000/');



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