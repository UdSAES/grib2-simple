'use strict'

const grib2 = require('../index')
const fs = require('fs-extra')
async function main() {
  const fileContent = await fs.readFile('./sample_data/COSMODE_single_level_elements_T_2M_2018021500_000.grib2', {encoding: null})
  const grib2Array = await grib2(fileContent)
  console.log('t_2m at 49 °N 7 °E: ' + grib2Array[0].getValue(7, 49) + 'K')
}

main()
