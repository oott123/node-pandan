const Room = require('../lib/room')

const room = new Room(10003)
room.on('error', function (err) {
  console.error(err)
})
room.on('connect', function () {
  console.log('room connected!')
})
room.on('room-danmaku', function ({data}) {
  console.log(`${data.from.nickName}: ${data.content}`)
})
room.on('meta-update', function (meta) {
  console.log(`当前：${meta.audiences} 观众，${meta.exp} 经验，${meta.bamboo} 竹子`)
})
console.log('room connecting ...')
room.join()
