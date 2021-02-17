// miniprogram/pages/points/points.js
//引用时间格式化工具
const util = require('../../util/dateFormat.js')
import UserService from '../../data_service/UserService.js'
var userService = new UserService();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    points: 0, //用户积分
    backgroundUrl: '', //背景图url
    weRunToPointData: [], //同步微信运动步数增加的积分详情
    addPointNum: 0, //同步微信运动步数增加的总积分
    isFailed: false, //是否同步失败
    sync:false //是否完成同步
  },
  /**
   * 同步按钮点击事件
   */
  onSyncButtonClick: function() {
    var that = this
    //同步之前先初始化数据
    that.setData({
      weRunToPointData: [],
      addPointNum: 0,
      isFailed: false
    })
    //页面提示同步中
    wx.showLoading({
      title: '同步中',
    })
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.werun']) {
          // 如果用户还未授权过，需要用户授权读取微信运动数据
          wx.authorize({
            scope: 'scope.werun',
            success() {
              that.syncWeRunData()
            },
            fail() {
              //如果用户拒绝授权，提示同步失败
              wx.hideLoading(); //隐藏同步中页面提示
              that.setData({
                isFailed: true
              })
            }
          })
        } else {
          //如果用户已授权过，直接开始同步微信运动数据
          that.syncWeRunData()
        }
      },
      fail() {
        //如果wx.getSetting失败，提示同步失败
        wx.hideLoading(); //隐藏同步中页面提示
        that.setData({
          isFailed: true
        })
      }
    })
  },

  /**
   * 同步微信运动数据
   */
  syncWeRunData: function() {
    var that = this
    wx.getWeRunData({
      success(weRunEncryptedData) {
        //console.log('scope.werun-->' + JSON.stringify(weRunEncryptedData) + "\r\n")
        //调用云函数，并同步更新用户积分、成长值
        that.syncPoints(weRunEncryptedData)
      },
      fail() {
        wx.hideLoading();
        that.setData({
          isFailed: true
        })
      }
    })
  },

  /**
   * 调用云函数，插入同步的微信运动到数据库，并同步更新用户积分
   * 解密数据和对解密后数据的数据库操作，都应该在服务端进行，加密数据无法伪造，可以避免黑客伪造客户端提交数据刷积分
   */
  syncPoints: function(weRunEncryptedData) {
    var that = this
    //调用云函数，插入同步的微信运动到数据库，并同步更新用户积分
    wx.cloud.callFunction({
      name: 'syncPoints',
      data: {
        weRunData: wx.cloud.CloudID(weRunEncryptedData.cloudID)
      },
      success: function(res) {
        var weRunToPointData = res.result
        //设置页面显示数据
        var addPointNum = 0
        for (var i in weRunToPointData) {
          addPointNum += weRunToPointData[i].changeUserPoints
          weRunToPointData[i].time = util.formatDate(new Date(weRunToPointData[i].time * 1000))
        }
        that.setData({
          addPointNum: addPointNum,
          weRunToPointData: weRunToPointData.reverse(),
          sync:true
        })
      },
      fail: function(err) {
        //调用云函数失败，显示同步失败提示
        console.log('syncPoint---err' + JSON.stringify(err) + "\r\n")
        that.setData({
          isFailed: true
        })
      },
      complete: function() {
        wx.hideLoading(); //隐藏同步中页面提示
      }
    })
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this;
    userService.getUserInfo(
      //获取用户信息回调函数
      function(userinfo) {
        that.setData({
          points: userinfo.points
        })
      });
    wx.cloud.getTempFileURL({
      fileList: ['cloud://qcie-hf7h2.7163-qcie-hf7h2-1301123626/dog.jpg'],
      success: res => {
        // get temp file URL
        that.setData({
          backgroundUrl: res.fileList[0].tempFileURL
        })
      },
      fail: err => {
        // handle error
      }
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