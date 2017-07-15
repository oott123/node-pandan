const axios = require('axios')
const debug = require('debug')('pandan:roomapi')

function getChatInfo (roomId) {
  return Promise.resolve(axios.get(`http://api.homer.panda.tv/chatroom/getinfo?roomid=${roomId}`))
    .then(function ({data}) {
      debug('got room info', data)
      if (data.errno !== 0) {
        throw new Error(data.errmsg)
      }
      return data.data
    })
}

function getInfo(roomId) {
  return Promise.resolve(axios.get(`https://room.api.m.panda.tv/index.php?method=room.shareapi&roomid=${roomId}`))
  .then(function ({data} {
    return data
  }))
}

module.exports = {
  getChatInfo
}
