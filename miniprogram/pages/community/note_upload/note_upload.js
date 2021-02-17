// pages/community/note_upload/note_upload.js
import NoteService from '../../../data_service/NoteService.js'
var noteService = new NoteService();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    imageList: [], //用户已选择的图片
    inputLength: 0 //用户输入文字的长度
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
  /**
   * 计算用户输入的文字长度
   */
  bindTextareaInput: function (e) {
    this.setData({
      inputLength: e.detail.value.length
    });
  },
  /**
   * 发表笔记
   */
  postFormSubmit: function (e) {
    //页面提示发表中
    wx.showLoading({
      title: '发表中',
    })
    var content = e.detail.value.content
    noteService.postNote(
      content,
      this.data.imageList,
      function () {
        //关闭发表中的页面提示
        wx.hideLoading();
        //提示笔记发表成功
        wx.showToast({
          title: '发表笔记成功',
          icon: 'success',
          duration: 1500,
        });
        //1.5秒后自动返回笔记列表页
        setTimeout(function () {
          wx.navigateBack({
            delta: 1,
          })
        }, 1500)
      }
    )
  },
  /**
   * 添加图片按钮的用户点击事件
   */
  chooseImage() {
    const that = this
    //使用图片 API 的方法 wx.chooseImage 来让用户选择图片
    wx.chooseImage({
      sourceType: ['camera', 'album'], //用户可以拍照、也可以从相册选择图片
      sizeType: ['compressed'], //用户选择的图片压缩存储
      count: 8, //最多选择9张图片
      success(res) {
        that.setData({
          imageList: res.tempFilePaths
        })
      }
    })
  },

  /**
   * 已选择图片的用户点击事件
   */
  previewImage(e) {
    const current = e.target.dataset.src
    //使用图片 API 的方法 wx.previewImage 全屏显示用户点击的图片
    wx.previewImage({
      current,
      urls: this.data.imageList
    })
  },
})