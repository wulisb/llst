const cloud = require('wx-server-sdk')
cloud.init({
  env: 'llst-test-389bfe'
})
const db = cloud.database()
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
      return await db.collection(event.tableName).doc(event.docId).remove()
    } catch (e) {
      console.error(e)
    }
  }
  else if (event.opr == 'get') {
    try {
      return await db.collection(event.tableName).doc(event.docId).get() || db.collection(event.tableName).where(event.datas).get()
    } catch (e) {
      console.error(e)
    }
  }
  else if(event.opr == 'update') {
    try {
      return await db.collection(event.tableName).doc(event.docId).update({
        data: event.datas
      })
    } catch (e) {
      console.error(e)
    }
  }
}