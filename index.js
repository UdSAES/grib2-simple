// grib2-simple
//
// Copyright 2018 The grib2-simple Developers. See the LICENSE file at
// the top-level directory of this distribution and at
// https://github.com/UdSAES/grib2-simple/LICENSE
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// grib2-simple may be freely used and distributed under the MIT license

'use strict'

const moment = require('moment-timezone')
const {VError} = require('verror')
const assert = require('assert')
const _ = require('lodash')
const debug = require('debug')('grib2-simple:index')

function parseGridDefinition3_0(sectionBuffer) {
  return {
    numberOfPointsAlongParallel: sectionBuffer.readUInt32BE(30),
    numberOfPointsAlongMeridian: sectionBuffer.readUInt32BE(34),
    La1: sectionBuffer.readInt32BE(46) / 1e6,
    Lo1: sectionBuffer.readInt32BE(50) / 1e6,
    La2: sectionBuffer.readInt32BE(55) / 1e6,
    Lo2: sectionBuffer.readInt32BE(59) / 1e6,
    iInc: sectionBuffer.readInt32BE(63) / 1e6,
    jInc: sectionBuffer.readInt32BE(67) / 1e6,
    scanningMode: sectionBuffer[71]
  }
}

function parseProductDefinition4_0(sectionBuffer, referenceTimestamp) {
  const result = {
    parameterCategory: sectionBuffer[9],
    parameterNumber: sectionBuffer[10],
    typeOfGenerationProcess: sectionBuffer[11],
    backgroundGenerationProcessIdentifier: sectionBuffer[12],
    analysisGenerationProcessIdentifier: sectionBuffer[13],
    hoursCutOff: sectionBuffer.readInt16BE(14),
    minutesCutOff: sectionBuffer[16],
    timeUnitRange: sectionBuffer[17],
    forecastTime: sectionBuffer.readUInt32BE(18),
  }

  var factor = 1000
  const timeUnitRange = result.timeUnitRange
  if (timeUnitRange === 0) {
    factor *= 60
  } else if (timeUnitRange === 1) {
    factor *= 60 * 60
  } else if (timeUnitRange === 2) {
    factor *= 24 * 60 * 60
  } else if (timeUnitRange === 10) {
    factor *= 3 * 60 * 60
  } else if (timeUnitRange === 11) {
    factor *= 6 * 60 * 60
  } else if (timeUnitRange === 12) {
    factor *= 12 * 60 * 60
  } else if (timeUnitRange === 13) {
    factor *= 1
  } else {
    throw new VError({
      name: 'FORECAST_TIME_NOT_SUPPORTED',
      cause: new Error(timeUnitRange + '')
    })
  }
  result.forecastTimestamp = referenceTimestamp + factor * result.forecastTime
  return result
}

function parseProductDefinition4_8(sectionBuffer) {
  const result = {
    parameterCategory: sectionBuffer[9],
    parameterNumber: sectionBuffer[10],
    typeOfGenerationProcess: sectionBuffer[11],
    backgroundGenerationProcessIdentifier: sectionBuffer[12],
    analysisGenerationProcessIdentifier: sectionBuffer[13],
    hoursCutOff: sectionBuffer.readInt16BE(14),
    minutesCutOff: sectionBuffer[16],
    timeUnitRange: sectionBuffer[17],
    foreCastTime: sectionBuffer.slice(18, 24),
    year: sectionBuffer.readUInt16BE(34),
    month: sectionBuffer[36],
    day: sectionBuffer[37],
    hour: sectionBuffer[38],
    minute: sectionBuffer[39],
    second: sectionBuffer[40],
  }

  result.forecastTimestamp = moment.tz({
    y: result.year,
    M: result.month - 1,
    d: result.day,
    h: result.hour,
    m: result.minute,
    s: result.second
  }, 'UTC').valueOf()

  return result
}

function parseDataRepresentationTemplate5_0(sectionBuffer) {

  const R = sectionBuffer.readFloatBE(11)
  var E = sectionBuffer.readUInt16BE(15) & 0x7fff
  if ((sectionBuffer.readUInt16BE(15) >> 15) > 0) {
    E *= -1
  }

  var D = sectionBuffer.readUInt16BE(17) & 0x7fff
  if ((sectionBuffer.readUInt16BE(17) >> 15) > 0) {
    D *= -1
  }

  return {
    R: R,
    E: E,
    D: D,
    numberOfBitsForPacking: sectionBuffer[19],
    typeOfOriginalFieldValues: sectionBuffer[20]
  }


}

function parseSection0(buffer, startIndex) {
  const result = {
    discipline: buffer[startIndex + 6],
    edition: buffer[startIndex + 7],
    totalLength: buffer.readUInt32BE(startIndex + 12)
  }

  return {
    startIndex: startIndex,
    lengthOfRawData: 16,
    data: result
  }
}

function parseSection1(buffer, startIndex) {
  const result = {
    length: buffer.readUInt32BE(startIndex),
    numberOfSection: buffer[startIndex + 4],
    originationCenterId: buffer.readUInt16BE(startIndex + 5),
    originationSubCenterId: buffer.readUInt16BE(startIndex + 7),
    masterTableVersion: buffer[startIndex + 9],
    localTableVersionNumber: buffer[startIndex + 10],
    significanceOfReferenceTime: buffer[startIndex + 11],
    year: buffer.readUInt16BE(startIndex + 12),
    month: buffer[startIndex + 14],
    day: buffer[startIndex + 15],
    hour: buffer[startIndex + 16],
    minute: buffer[startIndex + 17],
    second: buffer[startIndex + 18],
    productionStatus: buffer[startIndex + 19],
    typeOfProcessedData: buffer[startIndex + 20]
  }

  result.referenceTimestamp = moment.tz({
    y: result.year,
    M: result.month - 1,
    d: result.day,
    h: result.hour,
    m: result.minute,
    s: result.second
  }, 'UTC').valueOf()

  return {
    startIndex: startIndex,
    lengthOfRawData: result.length,
    data: result
  }
}

function parseSection2(buffer, startIndex) {
  const result = {
    length: buffer.readUInt32BE(startIndex),
    numberOfSection: buffer[startIndex + 4],
    localUse: buffer.slice(startIndex + 5, startIndex + buffer.readUInt32BE(startIndex))

  }
  return {
    startIndex: startIndex,
    lengthOfRawData: result.length,
    data: result
  }
}

function parseSection3(buffer, startIndex) {
  const result = {
    length: buffer.readUInt32BE(startIndex),
    numberOfSection: buffer[startIndex + 4],
    sourceOfGridDefinition: buffer[startIndex + 5],
    numberOfDataPoints: buffer.readUInt32BE(startIndex + 6),
    numberOfOctetsForOptionalDefinitions: buffer[10],
    interpretationOfOptionalDefinitions: buffer[11],
    gridDefinitionTemplateNumber: buffer[13],
    gridDefinitionTemplate: parseGridDefinition3_0(buffer.slice(startIndex))
  }

  return {
    startIndex: startIndex,
    lengthOfRawData: result.length,
    data: result
  }
}

function parseSection4(buffer, startIndex, referenceTimestamp) {
  const result = {
    length: buffer.readUInt32BE(startIndex),
    numberOfSection: buffer[startIndex + 4],
    numberOfCoordinateValuesAfterTemplate: buffer.readUInt16BE(startIndex + 5),
    productDefinitionTemplateNumber: buffer.readUInt16BE(startIndex + 7),
    productDefinitionTemplate: null
  }

  if (result.productDefinitionTemplateNumber === 0) {
    result.productDefinitionTemplate = parseProductDefinition4_0(buffer.slice(startIndex), referenceTimestamp)
  } else if (result.productDefinitionTemplateNumber === 8) {
    result.productDefinitionTemplate = parseProductDefinition4_8(buffer.slice(startIndex))
  } else {
    throw new VError({
      name: 'PRODUCT_DEFINITION_TEMPLATE_NOT_SUPPORTED',
      cause: new Error(result.productDefinitionTemplateNumber + '')
    })
  }

  return {
    startIndex: startIndex,
    lengthOfRawData: result.length,
    data: result
  }
}

function parseSection5(buffer, startIndex) {
  const result = {
    length: buffer.readUInt32BE(startIndex),
    numberOfSection: buffer[startIndex + 4],
    numberOfDataPoints: buffer.readUInt32BE(startIndex + 5),
    dataRepresentationTemplateNumber: buffer.readUInt16BE(startIndex + 9),
    dataRepresentationTemplate: parseDataRepresentationTemplate5_0(buffer.slice(startIndex))
  }

  return {
    startIndex: startIndex,
    lengthOfRawData: result.length,
    data: result
  }
}

function parseSection6(buffer, startIndex) {
  const result = {
    length: buffer.readUInt32BE(startIndex),
    numberOfSection: buffer[startIndex + 4],
    bitMapIndicator: buffer[startIndex + 5],
    bitMap: buffer.slice(startIndex + 6, startIndex + buffer.readUInt32BE(startIndex))
  }

  return {
    startIndex: startIndex,
    lengthOfRawData: result.length,
    data: result
  }
}

function parseSection7(buffer, startIndex) {
  const result = {
    length: buffer.readUInt32BE(startIndex),
    numberOfSection: buffer[startIndex + 4],
    rawData: buffer.slice(startIndex + 5, startIndex + buffer.readUInt32BE(startIndex))
  }

  return {
    startIndex: startIndex,
    lengthOfRawData: result.length,
    data: result
  }
}

function parseAllSections(gribBuffer, startIndex) {
  const section0 = parseSection0(gribBuffer, startIndex)

  if (section0.data.totalLength > (gribBuffer.length - startIndex)) {
    throw new VError({
      name: 'INVALID_LENGTH_ERROR',
      cause: new Error(JSON.stringify(
        {
          totalLength: section0.data.totalLength,
          length: (gribBuffer.length - startIndex)
        }
      ))
    })
  }

  const section1 = parseSection1(gribBuffer, section0.startIndex + section0.lengthOfRawData)
  const section2 = parseSection2(gribBuffer, section1.startIndex + section1.lengthOfRawData)
  const section3 = parseSection3(gribBuffer, section2.startIndex + section2.lengthOfRawData)
  const section4 = parseSection4(gribBuffer, section3.startIndex + section3.lengthOfRawData, section1.data.referenceTimestamp)
  const section5 = parseSection5(gribBuffer, section4.startIndex + section4.lengthOfRawData)
  const section6 = parseSection6(gribBuffer, section5.startIndex + section5.lengthOfRawData)
  const section7 = parseSection7(gribBuffer, section6.startIndex + section6.lengthOfRawData, section3, section5)

  const c1 = Math.pow(2, section5.data.dataRepresentationTemplate.E)
  const c2 = Math.pow(10, section5.data.dataRepresentationTemplate.D)

  function convertRawValue(rawValue) {
    return (section5.data.dataRepresentationTemplate.R + rawValue * c1) / c2
  }

  function getGridLocation(lon, lat) {
    const lonIndex = Math.round(((lon - section3.data.gridDefinitionTemplate.Lo1) / section3.data.gridDefinitionTemplate.jInc))
    const latIndex = Math.round(((lat - section3.data.gridDefinitionTemplate.La1) / section3.data.gridDefinitionTemplate.iInc))

    var bestIndex = latIndex * section3.data.gridDefinitionTemplate.numberOfPointsAlongParallel
    bestIndex += lonIndex

    return {
      lon: section3.data.gridDefinitionTemplate.Lo1 + section3.data.gridDefinitionTemplate.jInc * lonIndex,
      lat: section3.data.gridDefinitionTemplate.La1 + section3.data.gridDefinitionTemplate.iInc * latIndex
    }
  }

  function countSetBits(n) {
    let count = 0
    while (n > 0) {
      n = n & (n - 1)
      count++
    }
    return count
  }

  function countUnsetBitsTillPosition(n, exclusiveEndPosition) {
    let position = 0
    let bitCount = 0
    while(position < exclusiveEndPosition) {
      const bit = (n >> (7 - position)) & 0x01
      if (bit === 0) {
        bitCount++
      }
      position++
    }

    return bitCount
  }

  function getInvalidValuesBeforeIndex (index) {
    let invalidCount = 0
    const endIndex = Math.floor(index / 8)
    const bitIndex = index % 8
    for (let i = 0; i < endIndex; i++) {
      const byte = section6.data.bitMap[i]
      const setBits = countSetBits(byte)
      invalidCount += 8 - setBits
    }

    invalidCount += countUnsetBitsTillPosition(section6.data.bitMap[endIndex], bitIndex)

    return invalidCount
  }

  function getValidity(index) {
    const byte = section6.data.bitMap[Math.floor(index/8)]
    const bit = (byte >> (7 - (index % 8))) & 0x01
    return bit > 0
  }

  function getValue(lon, lat) {
    if (section5.data.dataRepresentationTemplate.numberOfBitsForPacking === 0) {
      return section5.data.dataRepresentationTemplate.R
    }
    
    if (section5.data.dataRepresentationTemplate.numberOfBitsForPacking !== 16) {
      throw new VError({
        name: 'NUMBER_OF_BITS_FOR_PACKING_NOT_IMPLEMENTED_ERROR',
        cause: new Error(String(section5.data.dataRepresentationTemplate.numberOfBitsForPacking))
      })
    }

    // The grid is stored by column and not by row!!!
    const lonIndex = Math.round(((lon - section3.data.gridDefinitionTemplate.Lo1) / section3.data.gridDefinitionTemplate.jInc))
    const latIndex = Math.round(((lat - section3.data.gridDefinitionTemplate.La1) / section3.data.gridDefinitionTemplate.iInc))

    var bestIndex = latIndex * section3.data.gridDefinitionTemplate.numberOfPointsAlongParallel
    bestIndex += lonIndex
    
    let invalidCount = 0
    let isInvalid = false
    if (section6.data.bitMap.length > 0) {
      invalidCount= getInvalidValuesBeforeIndex(bestIndex)
      isInvalid = !getValidity(bestIndex)
    }
    if (isInvalid) {
      return null
    }
    
    bestIndex -= getInvalidValuesBeforeIndex(bestIndex)
    if (bestIndex < 0) {
      return null
    }

    if (bestIndex < 0 || bestIndex * 2 >= section7.data.rawData.length) {
      throw new VError({
        name: 'COORDINATES_OUTSIDE_GRID_ERROR',
        cause: new Error(JSON.stringify({
          lon: lon,
          lat: lat
        }))
      })
    }
    
    return convertRawValue(section7.data.rawData.readUInt16BE(bestIndex * 2))
  }

  return {
    referenceTimestamp: section1.data.referenceTimestamp,
    forecastTimestamp: section4.data.productDefinitionTemplate.forecastTimestamp,
    getValue: getValue,
    getGridLocation: getGridLocation,
    _startIndex: startIndex,
    _lengthOfRawData: section0.data.totalLength,
    sections: {
      section0: section0,
      section1: section1,
      section2: section2,
      section3: section3,
      section4: section4,
      section5: section5,
      section6: section6,
      section7: section7
    },
  }
}

function parseCompleteGrib2Buffer(grib2Buffer) {
  assert(
    _.isBuffer(grib2Buffer),
    'grib2Buffer is not a buffer: ' + typeof(grib2Buffer)
  )

  var completeResult = []
  var startIndex = 0

  while(startIndex < grib2Buffer.length) {

    const result = parseAllSections(grib2Buffer, startIndex)
    startIndex += result._lengthOfRawData

    debug(result)

    completeResult.push(result)
  }

  return completeResult
}

exports = parseCompleteGrib2Buffer
module.exports = exports
