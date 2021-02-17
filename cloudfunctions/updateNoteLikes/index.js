// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  if (event.add == false){
    await db.collection('user_note').doc(event.noteId).update({
      data: {
        upvoteNum: _.inc(-1)
      }
    })
  }else{
    await db.collection('user_note').doc(event.noteId).update({
      data: {
        upvoteNum: _.inc(1)
      }
    })
  }
 
  return {
    
  }
}