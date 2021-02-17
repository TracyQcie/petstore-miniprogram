// miniprogram/pages/pay/pay.js
import Dialog from '@vant/weapp/dialog/dialog';
import Toast from '@vant/weapp/toast/toast';
import LevelService from '../../data_service/LevelService.js'
var levelService = new LevelService();
import UserService from '../../data_service/UserService.js'
var userService = new UserService();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    chosenAddress: {}, //选择地址
    payList: [], //待支付商品列表
    mode: "product", //模式
    totalPrice: 0, //商品原价合计
    paymentFee: 0, //实际支付价格合计
    discount: 1, //折扣率
    myInfo: {}, //用户信息
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var mode = options.mode
    var that = this;
    userService.getUserDefaultAddress(function(res) {
      that.setData({
        chosenAddress: res
      })
    })
    levelService.getLevelList(
      //获取成长体系中的所有成长等级回调函数
      function(levelList) {
        var levels = levelList;
        userService.getUserInfo(
          //获取用户信息回调函数
          function(userinfo) {
            var myInfo = userinfo;
            that.getDiscount(levels, myInfo);
            that.setData({
              myInfo: myInfo
            })
          })
      })
    var payList = wx.getStorageSync('paylist');
    this.setData({
      payList: payList,
      mode: mode
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

  },

  getDiscount: function(levels, myInfo) {
    var that = this
    //每个用户等级都有成长值上限和下限，用户的当前总成长值在哪个用户等级的上下限区间内，用户就是该等级
    var myLevel = levels.filter(e => e.minGrowthValue <= myInfo.growthValue && myInfo.growthValue <= e.maxGrowthValue)[0];
    //在获取完数据后，显示界面
    that.setData({
      discount: myLevel.bonus.descount
    })
    // 获得折扣后再计算价格
    this.calPrice()
  },

  /**
   * 根据用户享受的折扣率计算总价和折扣价
   */
  calPrice: function() {
    //原价合计
    var totalPrice = 0
    //实际支付价格合计
    var paymentFee = 0
    var payList = wx.getStorageSync('paylist');
    var discount = this.data.discount
    //计算合计价格
    if (payList) {
      for (var i in payList) {
        totalPrice += payList[i].productInfo.price * payList[i].number
      }
      // 实际支付价格 = 商品原价 * discount
      paymentFee = totalPrice * discount
      paymentFee = this.roundFun(paymentFee, 2)
      //设置商品价格数据
      this.setData({
        totalPrice: totalPrice,
        paymentFee: paymentFee
      });
    }
  },

  onChosenButtonClick: function(e) {
    wx.navigateTo({
      url: `../address/my-address/my-address`,
    })
  },

  // 提交订单 
  onSummitOrder: async function() {
    var that = this;
    // 如果用户积分不足，提示并返回
    if (this.data.myInfo.points < this.data.paymentFee) {
      this.failToast('很抱歉，你的积分不足，无法购买');
    } else {
      var that = this
      //支付操作，需要弹出确认支付窗口进行二次确认
      Dialog.confirm({
        title: '积分支付',
        message: '你即将支付' + this.data.paymentFee.toString()
      }).then(() => {
        // on confirm
        // 用户确认支付，页面提示支付中
        wx.showLoading({
          title: '支付中',
        })
        var productsIndex = []
        for (var i in that.data.payList) {
          productsIndex.push(that.data.payList[i].id)
        }
        //调用云函数执行购买购物车中所有商品的操作
        wx.cloud.callFunction({
          name: 'payProduct',
          data: {
            productsIndex: productsIndex,
            address: this.data.chosenAddress,
            payList: this.data.payList
          },
          success: async function(res) {
            //根据云函数返回值，决定显示支付成功、支付失败或其他提示
            if (res.result.data == true) {
              Toast.success('支付成功');
              if (that.data.mode == 'cart') {
                that.deleteCartStorage(productsIndex)
              }
              await that.sleep(2000);
              wx.navigateBack()
            } else {
              that.failToast(res.result.errMsg)
            }
          },
          fail: function(err) {
            //调用云函数失败，显示支付失败提示界面
            console.log('onPayButtonClick---err' + JSON.stringify(err) + "\r\n")
          },
          complete: function() {
            wx.hideLoading(); //关闭支付中页面提示
          }
        })
      }).catch(() => {
        // on cancel
      });
    }
  },
  // 等待
  sleep: function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  failToast: async function(content) {
    var str = content
    Toast(str);
    // 返回原页面
    await this.sleep(2000);
    wx.navigateBack()
  },

  // 删除购物车缓存
  deleteCartStorage: function(productIndex) {
    var productIndex = productIndex;
    var cart = wx.getStorageSync('cart');
    for (let i = 0; i < productIndex.length; i++) {
      //在缓存数据中查找到要删除的商品
      var index = cart.findIndex(e => e.id == productIndex[i])
      if (index > -1) {
        //根据索引号在购物车缓存中删除商品
        cart.splice(index, 1)
      }
    }
    wx.setStorage({
      key: 'cart',
      data: cart,
    })
  },
  //保留n位小数
  roundFun: function (value, n) {
    return Math.round(value * Math.pow(10, n)) / Math.pow(10, n);
  },
})