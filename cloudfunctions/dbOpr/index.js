const cloud = require('wx-server-sdk')
cloud.init({
  env: 'llst-test-389bfe'
})
const db = cloud.database()
const _ = db.command
//数据库的CRUD操作
exports.main = async (event, context) => {
  if (event.opr == 'add') {
    try {
      return await db.collection(event.tableName).add({
        data: event.datas
      })
    } catch (e) {
      console.error(e)
    }
  }
  else if (event.opr == 'remove') {
    try {
      return await db.collection(event.tableName).where(event.datas).remove()
    } catch (e) {
      console.error(e)
    }
  }
  else if (event.opr == 'get') {
    if (event.command=='or'){
      try {
        return await db.collection(event.tableName).where(_.or(event.datas)).get()
      } catch (e) {
        console.error(e)
      }
    }else{
      try {
        return await db.collection(event.tableName).where(event.datas).get()
      } catch (e) {
        console.error(e)
      }
    } 
  }
  else if(event.opr == 'update') {
    try {
      return await db.collection(event.tableName).where(event.datas.where).update(
        event.datas.update
      )
    } catch (e) {
      console.error(e)
    }
  }
}