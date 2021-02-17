// miniprogram/pages/search/search.js
import ProductService from '../../data_service/ProductService.js'
var productService = new ProductService();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    backgroundUrl: '', //无查询结果图
    keyword: '', //搜索关键词
    isEmptyResult: false, //搜索结果为空
    isSearched: false, //搜索结束
    isNoMoreData: false, //是否还有更多数据
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // 获取查询失败的图片
    var that = this;
    wx.cloud.getTempFileURL({
      fileList: ['cloud://qcie-hf7h2.7163-qcie-hf7h2-1301123626/404_cat.png'],
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
    if (!this.data.isNoMoreData) { //如果还有数据未加载完，则获取更多数据
      this.getProductList(false)
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  },

  //用户点击搜索
  onSearchClick: function(e) {
    var keyword = e.detail;
    console.log(keyword);
    this.setData({
      keyword: keyword,
      isSearched: true,
      isEmptyResult: false, //重置搜索结果为空标志
      isNoMoreData: false, //重置数据全部加载完毕的标志
    })
    this.getProductList(true);
  },

  //填充组件数据
  fillData: function(isPull, items) {
    var view = this.selectComponent('#waterFall');
    view.fillData(isPull, items);
  },

  //从数据库中获取搜索结果
  getProductList: function(isPull) {
    var that = this
    wx.showNavigationBarLoading() //在标题栏中显示加载
    productService.getProductListByKeyword(
      this.data.keyword,
      isPull,
      function(productArray) {
        if (productArray.length == 0) {
          that.setData({
            isEmptyResult: true //结果为空
          })
        } else {
          that.setData({
            isSearched: false //有结果，重置搜索标志
          })
          that.fillData(isPull, productArray)
          if (productArray.length <= 0) {
            that.setData({
              isNoMoreData: true //设置数据全部加载完毕的标志
            })
          }
        }
        wx.hideNavigationBarLoading() //完成停止加载
      })
  },
})