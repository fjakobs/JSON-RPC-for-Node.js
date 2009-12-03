var http = require('http');
var sys = require('sys');

// test.js 
var server = http.createServer(function(req,res) { 
  res.sendHeader(200, {'Content-Type': 'text/plain'});
  req.setBodyEncoding("utf8");

  var body = "";
  req.addListener("body", function(chunk) {
    body += chunk;
  });
  
  req.addListener("complete", function() {
    sys.puts(decodeURIComponent(body));
    res.sendBody(body);    
    res.finish();
  });  
}); 

server.listen(8000);