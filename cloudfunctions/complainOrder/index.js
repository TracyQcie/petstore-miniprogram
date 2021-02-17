// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init()
const db = cloud.database()
const _ = db.command


// 云函数入口函数
exports.main = async(event, context) => {
  const wxContext = cloud.getWXContext()

  // 订单id
  var orderId = event.orderId
  // 用户申请退款原因
  var issue = event.issue
  // 订单原来状态
  var lastStatus = event.lastStatus

  var status = {
    value: 'waiting',
    label: '等待处理'
  }
  //----------------------------------------------------------begin
  //读取用户信息
  var user = (await db.collection('user')
    .where({
      _openid: wxContext.OPENID
    })
    .get()).data[0]

  // 用户id
  var userId = user._id;
  //----------------------------------------------------------end
  console.log('orderId', orderId)
  console.log('issue', issue)
  console.log('lastStatus', lastStatus)
  console.log('userId', userId)
  //----------------------------------------------------------begin
  //向申诉列表插入一条记录
  await db.collection('user_complain')
    .add({
      data: {
        _openid: wxContext.OPENID, //云函数添加数据不会自动插入openid，需要手动定义
        date: db.serverDate(), // 订单申诉时间
        userId: userId,
        orderId: orderId,
        issue: issue,
        lastStatus: lastStatus,
        status: status,
        response: '', //管理员答复
      }
    })
  //----------------------------------------------------------end
}