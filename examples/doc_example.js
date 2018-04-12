const grib2 = require('../index')
const fs = require('fs-extra')

async function test() {

    // load file content
  const fileContentBuffer = await fs.readFile('./sample_data/COSMODE_single_level_elements_PS_2018020500_000.grib2')

  // parse file content (this is a synchronous operation)
  // the result is an array, as multiple grib2 files can be concatenated to a single
  const grib2Array = grib2(fileContentBuffer)

  // get value at predefined coordinate
  // first parameter is longitude (East is positiv, West is negative)
  // second parameter is latitude (North is positive, South is negative)
  const value = grib2Array[0].getValue(7.13, 48.628)
  
  console.log("Reference time: " + grib2Array[0].referenceTimestamp)
  console.log("Forecast time: " + grib2Array[0].forecastTimestamp)
  console.log("Value at longitude 48.628 °N and 7.13 °E: " + value)
}

test()