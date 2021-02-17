// miniprogram/pages/community/note_index/note_index.js
//引用笔记的数据库访问类
import NoteService from '../../../data_service/NoteService.js'
var noteService = new NoteService()
//引用点赞的数据库访问类
import UpvoteService from '../../../data_service/UpvoteService.js'
var upvoteService = new UpvoteService()

const app = getApp() //定义app用于获取全局变量中的用户openid
var sliderWidth = 117; //weui的navbar需要设置slider的宽度，用于计算中间位置
Page({

  /**
   * 页面的初始数据
   */
  data: {
    activeIndex: 0, //navbar的当前选中选项
    sliderOffset: 0, //weui的navbar参数
    sliderLeft: 0, //weui的navbar参数
    isNoMoreData: false, //记录是否已加载完所有分页数据
    noteArray: []
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
    this.getNoteList(true)
  },

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
      isNoMoreData: false, //重置数据全部加载完毕的标志
    });
    this.getNoteList(true)
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
      this.getNoteList(false)
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  },
  /**
   * navbar Click事件，切换Tab
   */
  navBarTabClick: function(e) {
    //如果切换Tab才响应
    if (e.currentTarget.dataset.id != this.data.activeIndex) {
      this.setData({
        noteArray:[],
        sliderOffset: e.currentTarget.offsetLeft,
        activeIndex: e.currentTarget.dataset.id, //记录navbar的当前选中选项
        isNoMoreData: false, //重置数据全部加载完毕的标志
      });
      //切换选项卡需要重新加载瀑布流数据
      this.getNoteList(true)
    }
  },

  /**
   * 从数据库获取笔记列表
   */
  getNoteList(isPull) {
    wx.showNavigationBarLoading() //在标题栏中显示加载
    if (this.data.activeIndex == 0) {
      //全部笔记
      this.getAllNoteList(isPull)
    } else if (this.data.activeIndex == 1) {
      //用户点赞过的笔记
      this.getUpvotedNoteList(isPull)
    } else {
      //用户发表的笔记
      this.getMyNoteList(isPull)
    }
  },

  /**
   * 从数据库获取全部笔记列表
   */
  getAllNoteList(isPull) {
    var that = this
    noteService.getNoteList(
      '',
      isPull,
      function(noteArray) {
        wx.hideNavigationBarLoading() //完成停止加载
        // console.log("全部", noteArray)
        if (noteArray.length <= 0) {
          that.setData({
            isNoMoreData: true //设置数据全部加载完毕的标志
          })
        } else {
          that.setData({
            noteArray: noteArray
          })
        }
      })
  },

  /**
   * 从数据库获取我发表的笔记列表
   */
  getMyNoteList(isPull) {
    var that = this
    noteService.getNoteList(
      app.globalData.openid,
      isPull,
      function(noteArray) {
        wx.hideNavigationBarLoading() //完成停止加载
        // console.log("我的", noteArray)
        if (noteArray.length <= 0) {
          that.setData({
            isNoMoreData: true //设置数据全部加载完毕的标志
          })
        } else {
          that.setData({
            noteArray: noteArray
          })
        }
      })
  },

  /**
   * 从数据库获取我赞过的笔记列表
   */
  getUpvotedNoteList(isPull) {
    var that = this
    //先分页获取我的点赞记录
    upvoteService.getMyUpvoteList(
      isPull,
      function(upvoteArray) {
        // console.log("收藏", upvoteArray)
        var indexArray = []
        for (var i in upvoteArray) {
          indexArray.push(upvoteArray[i].noteId)
        }
        //获取点赞记录对应的笔记具体内容
        noteService.getNotesByIndex(
          indexArray,
          function(noteArray) {
            wx.hideNavigationBarLoading() //完成停止加载
            if (noteArray.length <= 0) {
              that.setData({
                isNoMoreData: true //设置数据全部加载完毕的标志
              })
            } else {
              that.setData({
                noteArray: noteArray
              })
            }
          })
      })
  },
})