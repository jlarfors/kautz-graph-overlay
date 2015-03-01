anybase = require './anybase'

if process.argv.length < 4
  console.log 'Usage:'
  console.log '  anybase target_numberic_base original_number [original_numeric_base [digits_min [digits_max]]]'
else
  try
    console.log anybase.apply @, process.argv[2 ...]
  catch e
    console.error String e
    process.exit 1
