const EventEmitter = require('events')
const ChatPacket = require('./packet')
const debug = require('debug')('pandan:room')
const _ = require('lodash')
const typeNames = {
  '1': 'danmaku',
  '30': 'online',
  '31': 'offline',
  '311': 'player-banner',
  '205': 'audience-amount-full',
  '206': 'bamboo',
  '207': 'audience-amount',
  '208': 'bamboo-height',
  '212': 'exp',
  '306': 'gift'
}

class Room extends EventEmitter {
  constructor (roomId) {
    super()
    this._roomId = roomId
    this._roomMeta = {}
    this._cp = new ChatPacket(roomId)
    this._cp.on('packet-full', this._onPacket.bind(this))
    this._cp.once('packet-short', this._onConnect.bind(this))
  }
  get roomMeta () {
    return this._roomMeta
  }
  _setMeta (obj) {
    _.each(obj, (value, key) => {
      console.log(key, value)
      this.emit(`meta-${key}-update`, value)
      this._roomMeta[key] = value
    })
    this.emit('meta-update', this._roomMeta)
  }
  join () {
    return this._cp.start()
  }
  _onConnect (data) {
    debug('onconnect', data)
    if (data.id === '0') {
      this._cp.stop()
      this.emit('error', new Error(`Connect error ${data.r}`))
    } else {
      this.emit('connect', {id: data.id})
    }
  }
  _onPacket ({meta, body}) {
    debug('on packet', meta, body)
    if (meta.ack !== '0') {
      debug('meta ack is not zero')
      return
    }
    body.map(JSON.parse.bind(JSON)).forEach((message) => {
      debug('message type', message.type)
      this.emit('room-message', message)
      this.emit(`room-message-${message.type}`, message)
      let name = typeNames[message.type]
      if (name) {
        this.emit(`room-${name}`, message)
      }
      let key = '_' + _.camelCase(`on-${name}`)
      if (typeof this[key] === 'function') {
        this[key](message)
      }
    })
  }
  _onExp ({data}) {
    this._setMeta({exp: parseFloat(data.content)})
  }
  _onAudienceAmount ({data}) {
    this._setMeta({audiences: parseInt(data.content)})
  }
  _onBanbooHeight ({data}) {
    this._setMeta({bamboo: parseInt(data.content)})
  }
}

module.exports = Room
