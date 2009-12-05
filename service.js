var sys = require('sys');
 
/**
 * RPC-Methods
 */ 
 
this.echo = function(a) {
  return a;
}

this.add = function(a, b) {
  return a + b;
}

this.note = function(a, b) {
  sys.debug("notification " + a + " - " + b);
}

// async call
this.ls = function() {
  return sys.exec("ls .");
}