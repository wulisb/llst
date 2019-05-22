const cloud = require('wx-server-sdk')
cloud.init()
//获取微信调用上下文
exports.main = (event, context) => {
  const {
    OPENID,
    APPID,
    UNIONID,
  } = cloud.getWXContext()
  console.log(event)
  return {
    OPENID,
    APPID,
    UNIONID,
  }
}
