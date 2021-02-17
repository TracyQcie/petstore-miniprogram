// miniprogram/pages/store/store.js
import ProductService from '../../data_service/ProductService.js'
var productService = new ProductService();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    background: ['../../images/swiper-1.png', '../../images/swiper-2.png', '../../images/swiper-3.png'], //轮播图图片
    selectedCategory: "all", //用户当前选择的分类
    isNoMoreData: false, //记录是否已加载完所有分页数据
  },

  //点击搜索栏事件
  onSearchBarFocus: function() {
    wx.navigateTo({
      url: '../search/search',
      success: function(res) {
      },
      fail: function(res) {
        console.log(res);
      }
    })
  },
  //点击分类按钮事件
  onClickCategoryIcon: function(e) {
    var selectedCategory = e.currentTarget.dataset.category;
    this.setData({
      selectedCategory: selectedCategory, //设置当前选中的类别
      isNoMoreData: false, //重置数据全部加载完毕的标志
    })
    this.getProductList(true);
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    //页面回到顶部
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 0
    })
    this.setData({
      selectedCategory: "all",
      isNoMoreData: false, //重置数据全部加载完毕的标志
    });
    this.getProductList(true)
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

  /**
   * 填充数据到瀑布流组件
   */
  fillData: function(isPull, items) {
    var view = this.selectComponent('#waterFall');
    view.fillData(isPull, items);
  },

  /**
   * 从数据库获取产品列表
   */
  getProductList: function(isPull) {
    var that = this
    wx.showNavigationBarLoading() //在标题栏中显示加载
    //从数据库获取用户选中分类的商品列表信息
    if (this.data.selectedCategory == "all") {
      productService.getAllProductList(isPull,
        function(productArray) {
          that.fillData(isPull, productArray)
          if (productArray.length <= 0) {
            that.setData({
              isNoMoreData: true //设置数据全部加载完毕的标志
            })
          }
          wx.hideNavigationBarLoading() //完成停止加载
        })
    } else {
      productService.getProductListByCategory(
        this.data.selectedCategory,
        isPull,
        function(productArray) {
          that.fillData(isPull, productArray)
          if (productArray.length <= 0) {
            that.setData({
              isNoMoreData: true //设置数据全部加载完毕的标志
            })
          }
          wx.hideNavigationBarLoading() //完成停止加载
        })
    }
  },
})