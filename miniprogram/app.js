//app.js
App({
  onLaunch: function () {
    wx.cloud.init({
      traceUser: true,
    })
    //调用云函数获取用户openid，用户锁定标志，如用户未注册将自动注册
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        this.globalData.isLocked = res.result.isLocked
        this.globalData.openid = res.result.openid
      }
    })
  },
  globalData:{
    openid:null,//用户的身份标识
    isLocked:false//用户积分获取锁定标志
  }
})
