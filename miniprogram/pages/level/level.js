// miniprogram/pages/level/level.js
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
    levels: [], //成长体系中的所有成长等级列表
    myLevel: {}, //用户等级
    myInfo: {}, //用户信息
    nextLevel: -1, //用户的下一等级
    growthValueToNextLevel: -1, //用户还需要多长成长值才能升到下一级
    growthValueProgress: -1, //用户升级进度
    selectedLevel: {}, //用户当前选中的成长等级信息
    selectedId: 1, //用户当前选中的成长等级id
    inited: false, //是否已从数据库读取数据
    gradientColor: {
      '0%': '#ADD8E6',
      '100%': '#f67879'
    },
    backgroundUrl:''

  },

  /**
   * 计算用户等级信息
   */
  setLevelData: function(levels, myInfo) {
    var that = this
    //每个用户等级都有成长值上限和下限，用户的当前总成长值在哪个用户等级的上下限区间内，用户就是该等级
    var myLevel = levels.filter(e => e.minGrowthValue <= myInfo.growthValue && myInfo.growthValue <= e.maxGrowthValue)[0];
    var nextLevel = levels.filter(e => e.id == myLevel.id + 1)[0];
    //如果用户没有升级到最高级，就设置用户的下一等级信息
    if (nextLevel !== undefined) {
      that.setData({
        growthValueToNextLevel: nextLevel.minGrowthValue - myInfo.growthValue,
        nextLevel: nextLevel
      })
    }
    //计算升级百分比
    var growthValueProgress = Math.round((myInfo.growthValue / nextLevel.minGrowthValue) * 100);
    //设置数据用于显示
    that.setData({
      levels: levels,
      myLevel: myLevel,
      myInfo: myInfo,
      selectedLevel: myLevel,
      selectedId: myLevel.id,
      growthValueProgress: growthValueProgress
    })
    //在获取完数据后，显示界面
    that.setData({
      inited: true
    })
  },
  /**
   * 点选等级图标事件
   */
  onClickLevelIcon: function(e) {
    var selectedLevel = e.currentTarget.dataset.selected;
    this.setData({
      selectedId: selectedLevel.id,
      selectedLevel: selectedLevel
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this;
    levelService.getLevelList(
      //获取成长体系中的所有成长等级回调函数
      function(levelList) {
        var levels = levelList;
        userService.getUserInfo(
          //获取用户信息回调函数
          function(userinfo) {
            var myInfo = userinfo;
            that.setLevelData(levels, myInfo);
          })
      })
    wx.cloud.getTempFileURL({
      fileList: ['cloud://qcie-hf7h2.7163-qcie-hf7h2-1301123626/cat-w.jpg'],
      success: res => {
        that.setData({
          backgroundUrl:res.fileList[0].tempFileURL
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
  onReady: function() {},

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