// miniprogram/pages/address/edit-address/edit-address.js
const util = require('../../../util/dateFormat.js')
import UserService from '../../../data_service/UserService.js'
var userService = new UserService();
import RegionService from '../../../data_service/RegionService.js'
var regionService = new RegionService();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: '', // 编辑地址id
    showDelete: false, //是否显示删除按钮
    receiver: '', //收件人
    phone: '', //电话
    address: '', //地址
    show: false, // 选择地址弹出层
    isDefault: false, //设置为默认地址
    region: [], //选择区域数组
    showRegion: '', //显示选中的区域
    chosenRegion: '', //当前选中区域code
    regionList: {}, //所有地区列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this;

    // 获取地区列表
    regionService.getRegionList(
      function(regionList) {
        that.setData({
          regionList: regionList
        })
      }
    )

    if (options.id) {
      that.setData({
        id: options.id
      })
      this.initPage();
    }
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

  // 如果有传过来的id参数，初始化页面
  initPage: function() {
    // 根据id获得目标地址
    var that = this;
    userService.getUsertAddressById(that.data.id,
      function(res) {
        console.log(res);
        that.setData({
          showDelete: true,
          address: res.address,
          isDefault: res.default,
          phone: res.phone,
          receiver: res.receiver,
          region: res.region,
          showRegion: res.region[0].name + ',' + res.region[1].name + ',' + res.region[2].name,
          chosenRegion: res.region[1].code
        })
      })
  },

  // 地区控件
  showPopup: function() {
    this.setData({
      show: true
    });
  },

  // 关闭地区控件(遮罩层)
  onClose: function(e) {
    this.setData({
      show: false
    });
  },

  //地区取消事件(组件)
  onRegionCancel: function(e) {
    this.setData({
      show: false
    });
  },

  // 地区选择确认事件
  onRegionComgirm: function(e) {
    var region = e.detail.values;
    this.setData({
      show: false,
      region: region,
      showRegion: region[0].name + ',' + region[1].name + ',' + region[2].name,
      chosenRegion: region[1].code
    });
  },

  //设置默认地址
  onDefaultChange: function() {
    // 需要手动对 checked 状态进行更新
    var changeDefault = !this.data.isDefault;
    this.setData({
      isDefault: changeDefault
    });
  },

  // 点击删除按钮：删除这个地址
  onDeleteClick: async function() {
    userService.deleteArrayById(this.data.id);
    wx.showToast({
      title: '删除成功',
    })
    await this.sleep(2000);
    wx.navigateBack()
  },

  // 点击保存按钮：保存这次编辑
  onSaveClick: async function(e) {
    var formValue = e.detail.value;
    var addressId = '';
    if (this.data.id == '') {
      addressId = new Date().getTime();
    } else {
      addressId = this.data.id;
    }
    var newAddress = {
      "addressId": addressId,
      "receiver": formValue.receiver,
      "phone": formValue.phone,
      "region": this.data.region,
      "address": formValue.address,
      "default": formValue.default
    }
    userService.updateUserAddressArray(newAddress);
    wx.showToast({
      title: '编辑成功',
    })
    await this.sleep(2000);
    wx.navigateBack()
  },
  sleep: function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
})