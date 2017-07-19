# pandan

熊猫 TV 弹幕连接解析库

## 使用方法

```javascript
let room = new (require('pandan').Room)(10029)
room.on('room-danmaku', function ({data}) {
  console.log(`${data.from.nickName}: ${data.content}`)
})
room.join()
```

详见：[examples](./examples)

## 弹幕数据样例

请看：[events_examples](./events_examples)

## 授权协议

MIT