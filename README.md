# grib2-simple
`grib2-simple` is a tiny node.js library to parse the content of grib2 files. It
is implemented in plain JavaScript (and thus is not a wrapper for a C library or
Java program).

`grib2-simple` is being developed as part of the `Designetz` project and only
covers the functionality that is needed to parse grib2 files provided by
the open data project of `DWD` (Deutscher Wetter Dienst). There are currently no
plans to extend the library to cover the full functionality of grib2 files. This
might change in the future, though.

![Set of logos](https://github.com/UdSAES/grib2-simple/blob/master/docs/logos_uds_aes_designetz_bmwi.png?raw=true)

## License
See the [LICENSE](./LICENSE) file for license rights and limitations (MIT).

## Install
```
npm install grib2-simple
```

## Usage
The `grib2-simple` project exposes a single function which parses the content
of a grib2 file given as a Buffer. The result given is Array of objects as follows
```
[
  {
    referenceTimestamp: <<Integer>>, // the reference time as UNIX timestamp in ms,
    forecastTimestamp: <<1500001000000>>, // the forecast time as UNIX timestamp in ms,
    getValue: function(lon, lat) {...}, // a function to retrieve a value
    sections: <<Object>> // an object that contains the information of the sections
  },
  ...
]

```
Each Array element represents a grib2 record, whereby a grib2 file contains one
or more grib2 records.

The function `getValue` is used to retrieve a value for given longitude and
latitude in `°`.

### Example
```JavaScript
const grib2 = require('./index')
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
```
