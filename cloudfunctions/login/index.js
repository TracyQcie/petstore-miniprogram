// 云函数模板
// 部署：在 cloud-functions/login 文件夹右击选择 “上传并部署”

const cloud = require('wx-server-sdk');

// 初始化 cloud
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 云函数入口函数
/**
 * 获取当前用户的OpenId、锁定标志并自动注册
 * @return {object} 用户信息
 * {
 *    openid, //当前用户的openid
 *    isLocked //当前用户的锁定标志
 * }
 */
exports.main = async(event, context) => {
  // 获取 WX Context (微信调用上下文)，包括 OPENID、APPID、及 UNIONID（需满足 UNIONID 获取条件）
  const wxContext = cloud.getWXContext()

  const db = cloud.database()
  const _ = db.command

  //查询用户是否已注册
  var queryResult = (await db.collection('user')
    .where({
      //云函数是在服务端操作，对所有用户的数据都有操作权限
      //在云函数中查询用户数据，需要添加openid的查询条件
      _openid: wxContext.OPENID
    })
    .count()).total;

  //如果用户还未注册，自动注册（即在 user 表中添加该用户信息）
  if (queryResult <= 0) {
    await db.collection('user').add({
      data: {
        _openid: wxContext.OPENID, //需要手动定义openid
        date: db.serverDate(),
        points: 0, //初始积分默认为0
        growthValue: 50, //初始成长值默认50
        isLocked: false //是否因触发风控规则被锁定
      }
    })
  }

  //已注册，获取当前用户信息
  var userInfo = (await db.collection('user')
    .where({
      _openid: wxContext.OPENID
    })
    .get()).data[0]

  //返回用户的openid与锁定标志
  return {
    openid: wxContext.OPENID,
    isLocked: userInfo.isLocked
  }
}