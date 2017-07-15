const _ = require('lodash')

function pack0602 (data) {
  let buffers = []
  buffers.push(Buffer.from([0, 6, 0, 2]))
  let body = _.chain(data)
    .toPairs()
    .map((args) => args.join(':'))
    .join('\n')
    .value()
  let headerBuf = Buffer.allocUnsafe(2)
  headerBuf.writeInt16BE(body.length, 0)
  buffers.push(headerBuf)
  buffers.push(Buffer.from(body))
  buffers.push(Buffer.from([0, 6, 0, 0]))
  return Buffer.concat(buffers)
}

function pack0600 () {
  return Buffer.from([0, 6, 0, 0])
}

module.exports = {
  pack0602,
  pack0600
}
