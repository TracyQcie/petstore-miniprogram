// 初始化 cloud
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;

const MAX_LIMIT = 30

//步骤 1 ：定义单日最大同步微信运动步数获得的积分上限为 5000
const MAXSYNCWERUNPERDAY = 5000

// 云函数入口函数
/**
 * 积分风控规则
 * @param {data} 要进行风控规则检查的用户
 * {
 *    data:{
 *      //由于本云函数是由服务端调用，而非小程序客户端调用，
 *      //cloud.getWXContext()无法获取openid，openid 需要作为参数传入
 *      openid   
 *    }
 *  }
 * @return {object} 风控规则运行结果
 * {
 *    data,    //bool true表示触发风控规则，用户账户锁定并记录风控日志 false表示正常
 * }
 */
exports.main = async(event, context) => {
  //----------------------步骤 2 分多次读取，获取当前用户的所有积分获取记录-----------------begin
  // 先取出集合记录总数
  const countResult = await db.collection('user_points').where({
    _openid: event.openid
  }).count()
  const total = countResult.total;
  // 计算需分几次取
  const batchTimes = Math.ceil(total / MAX_LIMIT);
  // 承载所有读操作的 promise 的数组
  const tasks = [];
  for (let i = 0; i < batchTimes; i++) {
    const promise = db.collection('user_points').where({
      _openid: event.openid
    }).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
    tasks.push(promise)
  }
  // 等待所有
  var allPointsRecords = (await Promise.all(tasks)).reduce((acc, cur) => ({
    data: acc.data.concat(cur.data),
    errMsg: acc.errMsg,
  }))
  //----------------------步骤 2 分多次读取，获取当前用户的所有积分获取记录-----------------end

  //----------------------步骤 3 统计每天用户从微信运动步数获得的积分总数-------------------begin
  //key-value 类型的数组，用于统计每天用户获得的积分总数
  //key是日期，value是用户当日获得的积分总数
  var addPointsGroupedByDate = new Array()
  //循环读取的每一条积分获取记录，统计每天用户获得的积分总数
  for (var i in allPointsRecords.data) {
    var item = allPointsRecords.data[i];
    var timestamp = item.timestamp;
    if (addPointsGroupedByDate[timestamp] !== undefined) {
      //如果已存在当日的积分，则累加当日积分
      addPointsGroupedByDate[timestamp] += Math.round(item.changeUserPoints);
    } else {
      //如果不存在当日积分，则新增当日积分统计记录
      addPointsGroupedByDate[timestamp] = Math.round(item.changeUserPoints);
    }
  }
  //返回值，是否触发风控规则
  var result = false;
  //循环校验用户每天获得的积分总数是否触发风控规则
  for (var key in addPointsGroupedByDate) {
    if (addPointsGroupedByDate[key] > MAXSYNCWERUNPERDAY) {
      //如果用户每天获得的积分总数是否超过积分上限
      //触发风控规则，锁定用户账号
      await db.collection('user')
        .where({
          _openid: event.openid
        })
        .update({
          data: {
            isLocked: true //修改用户锁定标志为锁定状态
          }
        })
      //设置返回值为触发风控规则
      result = true;
    }
  }
  //----------------------步骤 4 校验用户每天获得的积分总数是否超过积分上限----------------end

  //返回风控规则校验结果
  return {
    data: result
  }
}