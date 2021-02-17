// miniprogram/pages/test/test.js
import ProductService from '../../data_service/ProductService.js'
var productService = new ProductService();
let leftHeight = 0,rightHeight = 0; //分别定义左右两边的高度
let query;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    product: {}, //当前商品
    leftList: [], //左瀑布流
    rightList: [], //右瀑布流
    itemWidth: 0, //图片宽度
    isNoMoreData: false,//所有数据已经加载完
  },
  async isLeft() {
    const list = this.data.product;
    const leftList = this.data.leftList;
    const rightList = this.data.rightList;
    query = wx.createSelectorQuery();
    for (const item of list) {
      leftHeight <= rightHeight ? leftList.push(item) : rightList.push(item); //判断两边高度，来觉得添加到那边
      await this.getBoxHeight(leftList, rightList);
    }
  },
  getBoxHeight(leftList, rightList) { //获取左右两边高度
    return new Promise((resolve, reject) => {
      this.setData({
        leftList,
        rightList
      }, () => {
        query.select('#left').boundingClientRect();
        query.select('#right').boundingClientRect();
        query.exec((res) => {
          leftHeight = res[0].height; //获取左边列表的高度
          rightHeight = res[1].height; //获取右边列表的高度
          resolve();
        });
      });
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this;
    //根据手机的屏幕分辨率设置图片宽度和每张图片的最大高度
    wx.getSystemInfo({
      success: (res) => {
        var percentage = 750 / res.windowWidth;
        var margin = 60 / percentage;
        var tempitemWidth = (res.windowWidth - margin) / 2;
        var tempmaxHeight = tempitemWidth / 0.5;
        that.setData({
          itemWidth: tempitemWidth,
          maxHeight: tempmaxHeight
        })
      }
    });
    productService.getAllProductList(true,
      function(productlist) {
        var productList = productlist;
        that.setData({
          product: productList
        });
        that.isLeft();
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