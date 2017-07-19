const Room = require('../index').Room

const room = new Room(process.argv[2])
room.on('error', function (err) {
  console.error(err)
})
room.on('connect', function () {
  console.log('room connected!')
})
room.on('room-message', function (message) {
  // console.dir(message, {depth: null, breakLength: Infinity, colors: true})
  console.log(JSON.stringify(message))
})
room.on('room-danmaku', function ({data}) {
  // console.log(`${data.from.nickName}: ${data.content}`)
})
room.on('meta-update', function (meta) {
  // console.log(`当前：${meta.audiences} 观众，${meta.exp.val} 经验，${meta.bamboo} 竹子`)
})
console.log('room connecting ...')
room.join()
