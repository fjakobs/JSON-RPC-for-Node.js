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

this.ls = function() {
  // TODO: make a true async call
  var ls = sys.exec("ls .").wait();
  return ls;
}