const EventEmitter = require('events')
const ChatRoomConnection = require('./connection')
const _ = require('lodash')
const debug = require('debug')('pandan:packet')
const Promise = require('bluebird')

class ChatPacket extends EventEmitter {
  constructor (roomId) {
    super()
    this._roomId = roomId
    this._con = new ChatRoomConnection(roomId)
  }
  _getPacket () {
    return this._con.getData(4)
      .then((header) => {
        let typeKey = header.toString('hex')
        const typeMap = {
          '00060006': 'short',
          '00060003': 'full',
          '00060001': 'pong',
          'others': 'others'
        }
        if (!typeMap[typeKey]) {
          typeKey = 'others'
        }
        let type = typeMap[typeKey]
        debug('packet type', type)
        return this[`_get${_.capitalize(type)}Packet`](typeKey)
          .then((data) => {
            debug('packet parsed', data)
            return {type, data}
          })
      })
      .then(({type, data}) => {
        this.emit('packet', {
          type, data
        })
        this.emit(`packet-${type}`, data)
      })
      .finally(() => this._getPacket())
  }
  _getPongPacket () {
    this._con.pong()
    return Promise.resolve('pong')
  }
  _getShortPacket () {
    return this._con.getData(2)
      .then((lengthBuf) => lengthBuf.readInt16BE(0))
      .then((length) => this._con.getData(length))
      .then((bodyBuf) => {
        let str = bodyBuf.toString()
        return _.fromPairs(str.split('\n').map((v) => v.split(':')))
      })
  }
  _getFullPacket () {
    let result = {}
    return this._getShortPacket()
      .then((meta) => { result.meta = meta })
      .then(() => this._con.getData(4))
      .then((lengthBuf) => lengthBuf.readInt32BE(0))
      .then((length) => this._con.getData(length))
      .then((bodyBuf) => {
        result.body = []
        while (bodyBuf.length > 0) {
          let length = bodyBuf.readInt32BE(12)
          let start = 16
          let end = start + length
          result.body.push(bodyBuf.slice(start, end).toString())
          bodyBuf = bodyBuf.slice(end)
        }
      })
      .then(() => result)
  }
  _getOtherPacket (key) {
    debug('got unknown packet, have no idea what to do', key)
    return Promise.resolve('???')
  }
  start () {
    this._con.connect()
    this._getPacket()
  }
  stop () {
    this._con.close()
    this._promise = Promise.resolve()
  }
}
module.exports = ChatPacket
