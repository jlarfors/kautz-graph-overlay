anybase
=======

node_module to convert virtually from any to any other numeric base

# Limits
- Will only accept numeric bases 2 ... 62 (included)
- JavaScript number type limit (positive integers: 0 ... 2^53 - 1)
- No negative numbers
- No decimals
- Minimum and maximum output digits limit: 64

# Maps digit values as follows:
- 0..9 to 0..9
- A..Z to 10..35
- a..z to 36..61

# Use with your node.js project
## Install
    cd /path/to/your/project
    npm install anybase --save
## In your code
    var anybase = require('anybase');
    
    target_base     = 2
    original_number = '11'
    original_base   = 8
    
    // prints 1001
    console.log(anybase(target_base, original_number, original_base));
    
    // prepend with zeros to make it 8 characters
    minimum_digits = 8
    // prints 00001001
    console.log(anybase(target_base, original_number, original_base, minimum_digits));
    
    // prepend with zeros to make it 8 characters
    minimum_digits = 2
    maximum_digits = 2
    // prints 01
    console.log(anybase(target_base, original_number, original_base, minimum_digits, maximum_digits));

# Use on your terminal
## Install globally
    sudo npm install -g anybase
## Convert numbers on your terminal
    anybase 2 11 8 # prints 1001
    anybase 2 11 8 8 # prints 00001001
    anybase 2 11 2 2 # prints 01
