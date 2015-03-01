#!/usr/bin/env node

(function() {
  var anybase, e;

  anybase = require('./anybase');

  if (process.argv.length < 4) {
    console.log('Usage:');
    console.log('  anybase target_numberic_base original_number [original_numeric_base [digits_min [digits_max]]]');
  } else {
    try {
      console.log(anybase.apply(this, process.argv.slice(2)));
    } catch (_error) {
      e = _error;
      console.error(String(e));
      process.exit(1);
    }
  }

}).call(this);
