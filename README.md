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
    sections: <<Object>> // an object that contains the
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
const gribs = require('grib2-simple')
const fs = require('fs-extra')

async function test() {

  // load file content
  const fileContentBuffer = await fs.readFile('./sample_data/testfile1.grib2')

  // parse file content (this is a synchronous operation)
  const instance = grib2(fileContnetBuffer)

  const value = instance.getValue(7.13, 48.628)

  console.log("Reference time: " + instance.referenceTime)
  console.log("Forecast time: " + instance.forecastTime)
  console.log("Value at longitude 7.13 °N and 48.628 °E: " + value)
}
```
