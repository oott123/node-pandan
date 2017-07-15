const roomApi = require('./roomApi')
const EventEmitter = require('events')
const _ = require('lodash')
const net = require('net')
const Promise = require('bluebird')
const pack = require('./pack')
const debug = require('debug')('pandan:connection')

class ChatRoomConnection extends EventEmitter {
  constructor (roomId) {
    super()
    this._roomId = roomId
    this._buffer = Buffer.from([])
    this._queue = []
    this._state = 'PENDING'
    this._pingInterval = 60000
    this._pingTimeout = 120000 - 1
  }
  connect () {
    this._state = 'CONNECTING'
    return Promise.resolve()
      .then(() => roomApi.getChatInfo(this._roomId))
      .then((chatInfo) => {
        this._chatInfo = chatInfo
        this._server = _.sample(chatInfo['chat_addr_list'])
        return this._makeConnection()
      })
      .then(() => this._joinRoom())
  }
  _makeConnection () {
    debug('connecting to', this._server)
    let [host, port] = this._server.split(':')
    this._connection = net.connect(port, host);
    (['data', 'close', 'error']).forEach((event) => {
      this._connection.on(event, this[`_on${_.capitalize(event)}`].bind(this))
    })
    return new Promise((resolve, reject) => {
      this._state = 'CONNECTED'
      this._connection.once('connect', resolve)
    })
  }
  _joinRoom () {
    const c = this._chatInfo
    let roomData = {
      u: `${c.rid}@${c.appid}`,
      k: 1,
      t: 300,
      ts: c.ts,
      sign: c.sign,
      authtype: c.authType
    }
    let joinPacket = pack.pack0602(roomData)
    debug('join room packet:', joinPacket.toString('hex'), JSON.stringify(joinPacket.toString()))
    return Promise.fromCallback(this._connection.write.bind(this._connection, joinPacket))
  }
  _startPing () {
    clearInterval(this._pingTimer)
    this._lastPong = Date.now()
    this._pingTimer = setInterval(this._pinger.bind(this), this._pingInterval)
  }
  _pinger () {
    if (Date.now() - this._lastPong > this._pingTimeout) {
      debug('ping timeout, destroyed')
      return this._connection.destroy()
    }
    debug('ping')
    this._connection.write(pack.pack0600())
  }
  _onData (data) {
    debug('got data', data.toString('hex'), data.toString())
    this._buffer = Buffer.concat([this._buffer, data])
    debug('buffer length', this._buffer.length)
    this._resolveData()
  }
  _resolveData () {
    while (this._queue.length && this._queue[0].desiredLength <= this._buffer.length) {
      let front = this._queue.shift()
      let desiredBuffer = this._buffer.slice(0, front.desiredLength)
      debug('finish a packet', front.desiredLength, desiredBuffer.toString('hex'), JSON.stringify(desiredBuffer.toString()))
      this._buffer = this._buffer.slice(front.desiredLength)
      front.defer.resolve(desiredBuffer)
    }
  }
  _onClose (message) {
    debug('connection closed', message)
    clearTimeout(this._reconnectTimer)
    clearInterval(this._pingInterval)
    if (this._state === 'CLOSED') {
      return
    }
    this._state = 'PENDING'
    this._reconnectTimer = setTimeout(() => {
      debug('reconnect start')
      this.connect()
    }, 3000)
  }
  _onError (err) {
    this._onClose(err)
  }
  getData (desiredLength) {
    let defer = {}
    defer.promise = new Promise(function (resolve, reject) {
      defer.resolve = resolve
      defer.reject = reject
    })
    this._queue.push({defer, desiredLength})
    this._resolveData()
    return defer.promise
  }
  pong () {
    debug('pong')
    this._lastPong = Date.now()
  }
  close () {
    this._state = 'CLOSED'
    this._connection.destroy()
    this._onClose()
  }
}

module.exports = ChatRoomConnection
