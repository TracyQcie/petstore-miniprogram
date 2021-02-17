const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init()
const db = cloud.database()
const _ = db.command

// 云函数入口函数
/**
 * 商城支付接口，支付积分购买商品
 * @param {data} 要购买的商品信息
 * {
 *    data:{
 *      productsIndex,    //[] 用户购买的商品的商品ID数组
 *      address,      //{}用户收货地址
 *      payList, //用户购买列表
 *    }
 *  }
 * @return {object} 支付结果
 * {
 *    data,    //bool 支付成功或失败
 *    errMsg   //如果支付失败，该字段包含支付失败的具体错误信息
 * }
 */
exports.main = async(event, context) => {
  console.log(event)
  const wxContext = cloud.getWXContext()
  //设置支付接口返回结果的默认值
  var result = false
  var errMsg = ''

  // 订单信息
  var payList = event.payList
  // 用户收货地址
  var address = event.address
  //----------------------------------------------------------begin
  //读取用户信息
  var user = (await db.collection('user')
    .where({
      //云函数是在服务端操作，对所有用户的数据都有操作权限
      //在云函数中查询用户数据，需要添加openid的查询条件
      _openid: wxContext.OPENID
    })
    .get()).data[0]
  //读取用户等级信息
  var levels = (await db.collection('level').get()).data
  //查询出用户的当前等级
  var userLevel = levels.filter(e => e.minGrowthValue <= user.growthValue && user.growthValue <= e.maxGrowthValue)[0]
  //折扣率
  var discount = userLevel.bonus.descount;
  //根据商品ID数组，读取商品信息
  var products = (await db.collection('product')
    .where({
      index: _.in(event.productsIndex)
    })
    .get()).data
  // 根据商品id，更新payList中的productInfo
  for (let i = 0; i < products.length; i++) {
    let index = payList.findIndex(e => e.id == products[i].id)
    console.log("index", index)
    // 校验商品是否仍在数据库中
    if (index > 0) {
      return {
        data: result,
        errMsg: '很抱歉，订单中有失效商品，无法购买'
      }
    } else {
      // 确认库存
      if (payList[index].number < products[i].storage) {
        return {
          data: result,
          errMsg: '很抱歉，商品库存不足，无法购买'
        }
      } else {
        // 更新payList信息
        payList[index].productInfo = products[i]
      }
    }

  }
  //原价合计
  var totalPrice = 0
  //实际支付价格合计
  var paymentFee = 0
  //计算合计价格
  for (var i in payList) {
    totalPrice += payList[i].productInfo.price * payList[i].number
  }
  // 实际支付价格 = 商品原价 * discount
  paymentFee += totalPrice * discount
  paymentFee = roundFun(paymentFee, 2)
  //----------------------------------------------------------end

  if (user.points < paymentFee) {
    //功能点 3 ：如果积分不足则返回支付失败并设置失败原因
    errMsg = "很抱歉，你的积分不足，无法购买"
  } else {

    //----------------------------------------------------------begin
    //向订单记录表中插入一条新记录，记录本次支付的商品与订单信息
    //插入记录后获得插入的订单记录 ID
    var orderId = (await db.collection('user_order')
      .add({
        data: {
          _openid: wxContext.OPENID, //openid
          date: db.serverDate(), //购买商品时间
          productsIndex: event.productsIndex, //用户购买的商品 ID 数组
          payList: payList, //用户购买商品信息
          address: address, //用户收货地址
          totalPrice: totalPrice, //商品原价合计
          paymentFee: paymentFee, //实际支付价格合计
          discount: discount, //折扣率
          status: 'paid', //订单状态
        }
      }))._id
    //----------------------------------------------------------end

    //----------------------------------------------------------begin
    //向积分变动记录表插入一条新记录，记录本次支付的积分变动信息
    await db.collection('user_points')
      .add({
        data: {
          _openid: wxContext.OPENID, //云函数添加数据不会自动插入openid，需要手动定义
          date: db.serverDate(), //积分变动时间
          changeUserPoints: -1 * paymentFee, //积分变动值，消耗积分为负值
          timestamp: '',
        }
      })
    //----------------------------------------------------------end
   

    //----------------------------------------------------------begin
    //用户购买商品后新的当前可用积分
    var newPoint = user.points - paymentFee
    //用户购买商品后新的用户当前总成长值（成长值为整数）
    var newGrowthValue = user.growthValue + Math.ceil(parseInt(paymentFee))
    //在用户表中更新用户的当前可用积分、当前总成长值
    var updateUserResult = await db.collection('user')
      .where({
        //云函数是在服务端操作，对所有用户的数据都有操作权限
        //在云函数中查询用户数据，需要添加openid的查询条件
        _openid: wxContext.OPENID
      })
      .update({
        data: {
          points: newPoint, //新的用户当前可用积分
          growthValue: newGrowthValue //新的用户当前总成长值
        }
      })
    if (updateUserResult.stats.updated == 1) {
      result = true
    } else {
      errMsg = "支付异常，如有疑问请联系客服"
    }
    //----------------------------------------------------------end

    //----------------------------------------------------------begin
    // 更新商品库存信息(支付成功的情况下)
    if (result == true) {
      for (let i = 0; i < payList.length; i++) {
        let productId = payList[i].id;
        let newStorage = payList[i].productInfo.storage - payList[i].number;
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

  //返回支付结果
  return {
    data: result,
    errMsg: errMsg
  }
}

//保留n位小数
function roundFun(value, n) {
  return Math.round(value * Math.pow(10, n)) / Math.pow(10, n);
}