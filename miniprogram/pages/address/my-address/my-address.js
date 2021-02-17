// miniprogram/pages/address/my-address/my-address.js
import UserService from '../../../data_service/UserService.js'
var userService = new UserService();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    defaultAddress: {}, //默认地址
    userAddressList: [], //用户地址列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {

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
    var that = this;
    // 获取默认地址
    userService.getUserDefaultAddress(function(res) {
      that.setData({
        defaultAddress: res
      })
    })
    // 获取所有地址列表
    userService.getUserAdderssArray(function(res) {
      that.setData({
        userAddressList: res
      })
    })
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
  // 点击地址容器
  onAddressContantClick: function(e) {
    var that = this;
    var allPages = getCurrentPages();
    var prevPage = allPages[allPages.length - 2]; //上一个页面
    //直接调用上一个页面对象的setData()方法，把数据存到上一个页面中去
    // var chosenAddress = {};
    console.log(e.currentTarget.dataset.id)
    userService.getUsertAddressById(e.currentTarget.dataset.id, function(res) {
      console.log(res)
      // chosenAddress = {
      //   "addressId": res.addressId,
      //   "receiver": res.receiver,
      //   "phone": res.phone,
      //   "region": res.region,
      //   "address": res.address,
      //   "default": res.default
      // }
      prevPage.setData({
        chosenAddress: res
      });
      wx.navigateBack();
    })
    // console.log(chosenAddress);
  },

  // 点击编辑按钮
  onEditButtonClick: function(e) {
    console.log(e);
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `../edit-address/edit-address?id=${id}`,
    })
  }
})