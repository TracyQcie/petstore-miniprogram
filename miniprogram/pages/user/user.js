// miniprogram/pages/user/user.js
//引用用户等级与等级特权表的数据库访问类
import LevelService from '../../data_service/LevelService.js'
var levelService = new LevelService();
//引用用户信息的数据库访问类
import UserService from '../../data_service/UserService.js'
var userService = new UserService();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userAvatarUrl: '', //用户头像url
    userNickname: '', //用户昵称
    userInfo: {}, //用户信息
    userLevel: {}, //用户等级
    inited: false,
  },
  /**
   * 用户数据授权函数
   */
  authorizeUserInfo: function() {
    var that = this; //保存全局的this，避免回调冲突
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userInfo']) {
          wx.authorize({
            scope: 'scope.userInfo',
          }); //用户授权
        } else {
          wx.getUserInfo({
            success(res) {
              that.setData({
                userAvatarUrl: res.userInfo['avatarUrl'],
                userNickname: res.userInfo['nickName']
              });
            }
          }); //已授权，获取用户信息
        }
      },
      fail(res) {
        console.log(res);
      }
    });
  },

  /**
   * 微信步数授权函数
   */
  authorizeWeRun: function() {
    var that = this;
    //获取用户的当前设置
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.werun']) {
          wx.authorize({
            scope: 'scope.werun',
            success(res) {
              that.getWeRunData();
            },
            fail() {
              //如果用户拒绝授权，提示用户需要同意授权才能获取他的微信运动数据
              wx.showModal({
                title: '读取微信运动数据失败',
                content: '请在小程序设置界面（「右上角」 - 「关于」 - 「右上角」 - 「设置」）中允许我们访问微信运动数据',
              })
            }
          })
        } else {
          //如果用户已授权过，直接开始同步微信运动数据
          that.getWeRunData();
        }
      }
    })
  },
  /**
   * 获取微信运动数据
   */
  getWeRunData: function() {
    var that = this
    //调用微信运动API获取用户最近30天的运动步数
    wx.getWeRunData({
      success(weRunEncryptedData) {
        //调用云函数，获得解密后的微信运动步数
        that.getStepInfoList(weRunEncryptedData);
      }
    })
  },
  getStepInfoList: function(weRunEncryptedData) {
    var that = this
    //云调用直接获取开放数据
    wx.cloud.callFunction({
      name: 'stepInfoList',
      data: {
        //通过 wx.cloud.CloudID 构造 CloudID
        //调用云函数时，这些字段的值会被替换为 cloudID 对应的微信运动数据
        weRunData: wx.cloud.CloudID(weRunEncryptedData.cloudID)
      },
      success: function(res) {
        //保存调用云函数得到的解密后微信运动步数，用于显示
        that.setData({
          stepInfoList: res.result
        });
      },
    });
  },

  /**
   * 获取用户信息
   */
  getUserInfo: function(levels, myInfo) {
    var that = this
    //每个用户等级都有成长值上限和下限，用户的当前总成长值在哪个用户等级的上下限区间内，用户就是该等级
    var myLevel = levels.filter(e => e.minGrowthValue <= myInfo.growthValue && myInfo.growthValue <= e.maxGrowthValue)[0];
    that.setData({
      userLevel: myLevel,
      userInfo: myInfo,
    })
    //在获取完数据后，显示界面
    that.setData({
      inited: true
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.authorizeUserInfo();
    this.authorizeWeRun();
    var that = this;
    levelService.getLevelList(
      //获取成长体系中的所有成长等级回调函数
      function(levelList) {
        var levels = levelList;
        userService.getUserInfo(
          //获取用户信息回调函数
          function(userinfo) {
            var myInfo = userinfo;
            that.getUserInfo(levels, myInfo);
          })
      })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})