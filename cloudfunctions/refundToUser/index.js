// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init()
const db = cloud.database()
const _ = db.command

// 云函数入口函数
/**
 * 用户退款接口
 */
exports.main = async(event, context) => {
  const wxContext = cloud.getWXContext()

  console.log(event)
  // 获取event参数

  // 是否要更新库存: 发货前退款（true）/ 发货后退款（false)
  var resetStorage = event.POSTBODY.resetStorage
  // 用户id
  var userId = event.POSTBODY.userId

  // 购买商品id数组
  var productIndex = event.POSTBODY.productIndex

  // 用户购买商品详情
  var payList = event.POSTBODY.payList

  // 用户退回款项
  var paymentFee = event.POSTBODY.paymentFee


  //读取用户信息
  var user = (await db.collection('user')
    .where({
      _id: userId
    })
    .get()).data[0]

  var userOpenId = user._openid
  console.log('user', user)
  //根据商品ID数组，读取商品信息
  var products = (await db.collection('product')
    .where({
      id: _.in(productIndex)
    })
    .get()).data
  console.log(products)
  
  //----------------------------------------------------------begin
  //向积分变动记录表插入一条新记录，记录本次支付的积分变动信息
  await db.collection('user_points')
    .add({
      data: {
        _openid: userOpenId, //云函数添加数据不会自动插入openid，需要手动定义
        date: db.serverDate(), //积分变动时间
        changeUserPoints:  paymentFee, //积分变动值，消耗积分为负值
        timestamp: '',
      }
    })
  //----------------------------------------------------------end

  //----------------------------------------------------------begin
  //退款后新的当前可用积分
  var newPoint = user.points + paymentFee
  //在用户表中更新用户的当前可用积分
  await db.collection('user')
    .where({
      _id: userId
    })
    .update({
      data: {
        points: newPoint //新的用户当前可用积分
      }
    })
  //----------------------------------------------------------end

  //----------------------------------------------------------begin
  // 更新商品库存信息(发货前的情况下)
  if (resetStorage == true) {
    for (let i = 0; i < products.length; i++) {
      let productId = products[i].id;
      let index = payList.findIndex(e => e.id == productId)
      let newStorage = products[i].storage + payList[index].number;
      await db.collection('product')
        .where({
          id: productId
        })
        .update({
          data: {
            storage: newStorage
          }
        })
    }
  }
  //----------------------------------------------------------end

}