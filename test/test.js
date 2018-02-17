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

const grib2 = require('../index')
const assert = require('assert')
const _ = require('lodash')
const fs = require('fs-extra')
const VALID_SINGLE_GRIB_FILE = './sample_data/COSMODE_single_level_elements_T_2M_2018011803_002.grib2'
const VALID_MULTIPLE_GRIB_FILES = './sample_data/COSMODE_single_level_elements_ASWDIR_S_2018011803_006.grib2'
describe('./index.js', () => {
  describe('parseCompleteGrib2Buffer()', () => {
    it('should parse the buffer successfully if valid grib2 file content is ' +
    'provided that contains a single grib2 instance', async () => {
      const fileContentBuffer = await fs.readFile(
        VALID_SINGLE_GRIB_FILE, {encoding: null}
      )
      const grib2Array = await grib2(fileContentBuffer)

      assert(_.isArray(grib2Array))
      assert(grib2Array.length === 1)
      assert(
        grib2Array[0].referenceTimestamp === 1516244400000,
        'wrong referenceTimestamp'
      )
      assert(
        grib2Array[0].forecastTimestamp === 1516251600000,
        'wrong forecastTimestamp'
      )
      assert(
        Math.abs(grib2Array[0].getValue(3,45) - 274.275) < 1e-2,
        'wrong value'
      )
    })

    it('should parse the buffer successfully if valid grib2 file content is ' +
    'provided that contains multiple grib2 instances', async () => {
      const fileContentBuffer = await fs.readFile(
        VALID_MULTIPLE_GRIB_FILES, {encoding: null}
      )
      const grib2Array = await grib2(fileContentBuffer)


      assert(_.isArray(grib2Array), 'not an array')
      assert(grib2Array.length === 4, 'array not size 4')
      assert(
        grib2Array[0].referenceTimestamp === 1516244400000,
        'wrong referenceTimestamp'
      )
      assert(
        grib2Array[0].forecastTimestamp === 1516266000000,
        'wrong forecastTimestamp'
      )
      assert(
        Math.abs(grib2Array[0].getValue(3,45) - 0) < 1e-2,
        'wrong value'
      )
    })

    it('should throw an error if a null buffer is provided', async () => {
      try {
        await grib2(null)
      } catch (error) {
        assert(_.isError(error) && error.code === 'ERR_ASSERTION', 'not an AssertionError')
        return
      }

      assert(false, 'no error thrown')
    })

    it('should throw an error if a buffer with invalid length is provided', async () => {
      try {
        const fileContentBuffer = await fs.readFile(
          VALID_MULTIPLE_GRIB_FILES, {encoding: null}
        )
        await grib2(fileContentBuffer.slice(0, fileContentBuffer.length - 1))
      } catch (error) {
        assert(
          _.isError(error) && error.name === 'INVALID_LENGTH_ERROR',
          'not an INVALID_LENGTH_ERROR'
        )
        return
      }

      assert(false, 'no error thrown')
    })
  })
})
