/**
 * JOSN-RPC 1.0 implementation running on Node.js
 * 
 * http://json-rpc.org/wiki/specification
 * http://nodejs.org/
 * 
 * Creator: Martin Wittemann
 */
 
 // TODO: Add a way to use JSON-RPC 2.0 (proposal) 
 
var sys = require('sys'), 
   http = require('http');
   
 
var self = this;
 

http.createServer(function (req, res) {
  
  res.sendHeader(200, {'Content-Type': 'application/jsonrequest'});
  
  var rpcRequest = JSON.parse(req.uri.params.q);
  
  try {
    var result = self[rpcRequest.method].apply(self, rpcRequest.params);    
  } catch (e) {
    // TODO propper error handing
    var error = createError(1, "", "");
  }
  
  if (rpcRequest.id != null) {
    var rpsRespone = createResponse(result, error, rpcRequest.id);
    res.sendBody(sys.inspect(rpsRespone));
    res.finish();
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







/**
 * RPC-Methods
 */ 
// TODO: move the method specification to a separate file
this.echo = function(a) {
  return a;
}

this.add = function(a, b) {
  return a + b;
}

this.note = function(a, b) {
  sys.debug("handeMessage: " + a + " - " + b + " - ");
}