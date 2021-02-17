// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init()
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async(event, context) => {
  // const wxContext = cloud.getWXContext()
  // 订单id
  console.log(event)
  if(event.POSTBODY){
    var orderId = event.POSTBODY.orderId
    var newStatus = JSON.parse(event.POSTBODY.newStatus)
  }else{
    var orderId = event.orderId
    var newStatus = event.newStatus
  }

  await db.collection('user_order')
    .where({
      _id: orderId
    })
    .update({
      data: {
        status: newStatus //新的订单状态
      }
    })

  return `修改订单${orderId}状态为${newStatus.label}`;
}