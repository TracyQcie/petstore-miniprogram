// 云函数入口文件
// 部署：在 cloud-functions/syncWeRunToPoint 文件夹右击选择 “上传并部署”
const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init()
const db = cloud.database()
const _ = db.command
const MAX_LIMIT = 30

// 云函数入口函数
exports.main = async(event, context) => {
  var weRunData = event.weRunData;
  return await syncPoint(weRunData.data.stepInfoList);
}
/**
 * 同步微信运动数据并更新到积分数据库
 * @param {array} weRunData 从小程序API获取到的微信运动数据
 * @return {array} 积分变动数据 {time,step,changeUserPoints}
 */
async function syncPoint(weRunData) {
  const wxContext = cloud.getWXContext()
  var weRunToPointData = []
  //定义同步数据结果
  for (var i in weRunData) {
    weRunToPointData.push({
      time: weRunData[i].timestamp,
      step: weRunData[i].step,
      changeUserPoints: 0
    })
  }
  //根据微信运动数据更新积分
  for (var i in weRunData) {
    var data = weRunData[i]
    var result = weRunToPointData[i]
    //查询数据库是否已存在该条微信运动记录
    var queryResult = await db.collection('user_points')
      .where({
        timestamp: data.timestamp,
        _openid: wxContext.OPENID
      })
      .get()
    if (queryResult.data.length <= 0) {
      //如果不存在记录，则向数据库插入微信运动记录
      await db.collection('user_points')
        .add({
          data: {
            _openid: wxContext.OPENID, //云函数添加数据不会自动插入openid，需要手动定义
            date: db.serverDate(),
            changeUserPoints: data.step,
            timestamp: data.timestamp,
          }
        })
      result.changeUserPoints = data.step
    } else {
      if (queryResult.data[0].changeUserPoints < data.step) {
        //如果存在记录，但数据库步数少于小程序API返回步数，则向数据库更新微信运动记录
        await db.collection('user_points').doc(queryResult.data[0]._id)
          .update({
            data: {
              date: db.serverDate(),
              changeUserPoints: data.step
            }
          })
        result.changeUserPoints = data.step - queryResult.data[0].changeUserPoints
      }
    }
  }
  //更新用户的总可用积分

  //首先获取所有积分记录
  // 先取出集合记录总数
  const countResult = await db.collection('user_points').count()
  const total = countResult.total
  // 计算需分几次取
  const batchTimes = Math.ceil(total / MAX_LIMIT)
  // 承载所有读操作的 promise 的数组
  const tasks = []
  for (let i = 0; i < batchTimes; i++) {
    const promise = db.collection('user_points').where({
      _openid: wxContext.OPENID
    }).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
    tasks.push(promise)
  }
  // 等待所有
  var allPointRecords = (await Promise.all(tasks)).reduce((acc, cur) => ({
    data: acc.data.concat(cur.data),
    errMsg: acc.errMsg,
  }))

  //计算总积分，并更新到user表
  var totalPointsNum = 0
  allPointRecords.data.forEach(function(item) {
    totalPointsNum += item.changeUserPoints;
  });
  totalPointsNum = Math.round(totalPointsNum * 0.1);
  await db.collection('user')
    .where({
      _openid: wxContext.OPENID
    })
    .update({
      data: {
        points: totalPointsNum
      }
    })

  //调用风控规则校验
  await cloud.callFunction({
    name: 'pointsRiskControl',
    data: {
      openid: wxContext.OPENID
    }
  })

  return weRunToPointData
}