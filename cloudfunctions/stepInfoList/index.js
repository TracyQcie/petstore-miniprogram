// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const MAX_LIMIT = 30;//避免数据量大时卡顿，一次取30条数据
const db = cloud.database();//初始化数据库

// 云函数入口函数
exports.main = async(event, context) => {
  var weRunData = event.weRunData;
  await syncUserPoints(weRunData.data.stepInfoList);//调用从微信运动获得成长值的同步方法
  return weRunData.data.stepInfoList;
}

// 同步微信运动数据
async function syncUserPoints(weRunData) {
  const wxContext = cloud.getWXContext(); // 获取用户信息
  // 对每一天的微信运动数据依次执行下列步骤
  for (var i in weRunData) {
    var data = weRunData[i];
    // 查询数据库是否已存在该条微信运动记录
    queryResult = await db.collection('user_points')
      .where({
        timestamp: data.timestamp,
        _openid: wxContext.OPENID
      }) // 查询当前用户的运动记录
      .get()
    if (queryResult.data.length <= 0) {
      // 如果不存在记录，则向数据库插入微信运动记录
      await db.collection('user_points')
        .add({
          data: {
            _openid: wxContext.OPENID, // 需要手动定义openid
            date: db.serverDate(),
            changeUserPoints: data.step,
            timestamp: data.timestamp
          }
        })
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
      }
    }
  }
  // 更新用户当前总积分
  // 获取所有积分记录
  // 先取出集合记录总数
  const countResult = await db.collection('user_points').count();
  const total = countResult.total;
  // 计算需分几次取
  const batchTimes = Math.ceil(total / MAX_LIMIT);
  // 承载所有读操作的 promise 的数组
  const tasks = [];
  for (let i = 0; i < batchTimes; i++) {
    const promise = db.collection('user_points').where({
      _openid: wxContext.OPENID
    }).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get();
    tasks.push(promise);
  }
  // 等待所有
  var allPointsRecords = (await Promise.all(tasks)).reduce((acc, cur) => ({
    data: acc.data.concat(cur.data),
    errMsg: acc.errMsg,
  }));

  //计算总积分，并更新到user表
  var totalPoints = 0;
  allPointsRecords.data.forEach(function(item) {
    totalPoints += item.changeUserPoints;
  });
  //1 微信步数 = 0.1 用户积分 取整数
  totalPoints = Math.round(totalPoints*0.1);
  await db.collection('user')
    .where({
      _openid: wxContext.OPENID
    })
    .update({
      data: {
        points: totalPoints
      }
    }); // 更新用户当前总积分

  //调用风险控制函数
  await cloud.callFunction({
    name: 'pointsRiskControl',
    data: {
      openid: wxContext.OPENID
    }
  });
}