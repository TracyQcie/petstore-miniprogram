// miniprogram/pages/cart/cart.js
import Dialog from '@vant/weapp/dialog/dialog';
import Toast from '@vant/weapp/toast/toast';
import ProductService from '../../data_service/ProductService.js'
var productService = new ProductService();
import LevelService from '../../data_service/LevelService.js'
var levelService = new LevelService();
import UserService from '../../data_service/UserService.js'
var userService = new UserService();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    pay: true, //当前管理模式
    cart: [], //购物车状态
    cartTotal: 0, //购物车数量
    checkboxResult: [], //选中的checkbox
    allCheck: false, //默认不全选
    paymentFee: 0, //实际支付价格
    totalPrice: 0, //商品总价格
    levelDiscount: 1 //用户可享受的折扣
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.setLevelDiscount();
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
    this.initCart();
    // 清空支付列表
    wx.setStorage({
      key: "paylist",
      data: [],
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
  // 点击商品checkbox事件
  onCheckboxChange: function(e) {
    if (e.detail.length < this.data.cart.length) {
      this.setData({
        allCheck: false
      })
    }
    this.setData({
      checkboxResult: e.detail
    });
    this.calPrice()
  },
  // 点击全选checkbox事件
  onAllCheckChange: function() {
    var allCheck = !this.data.allCheck;
    if (allCheck) {
      let temp = [];
      for (let i = 0; i < this.data.cart.length; i++) {
        temp.push(this.data.cart[i].id);
      }
      this.setData({
        checkboxResult: temp,
        allCheck: true
      })
    } else {
      this.setData({
        checkboxResult: [],
        allCheck: false
      })
    }
    this.calPrice();
  },

  // 初始化购物车数据
  initCart: async function() {
    wx.showLoading({
      title: '加载中...',
    })
    var that = this;
    var value = wx.getStorageSync("cart");
    var cart = [];
    if (value) {
      for (let i = 0; i < value.length; i++) {
        let id = value[i].id;
        var productInfo = await productService.getCartProductList(id);
        if (productInfo == false) {
          continue;
        } else {
          // 如果缓存中的购买量大于库存量，将购买量更新为库存
          let number = value[i].number <= productInfo.storage ? value[i].number : productInfo.storage;
          let temp = {
            id: id,
            productInfo: productInfo,
            number: number
          }
          cart.push(temp)
        }
      }
      this.setData({
        cart: cart,
        cartTotal: cart.length
      })
    } else {
      this.setData({
        cart: []
      });
    }
    wx.hideLoading();
  },

  /**
   * 获取并设置用户及购物车信息数据
   */
  setLevelDiscount: function() {
    var that = this
    levelService.getLevelList(
      //获取成长体系中的所有成长等级回调函数
      function(levelList) {
        var levels = levelList
        userService.getUserInfo(
          //获取用户信息回调函数
          function(userinfo) {
            var myInfo = userinfo
            //设置用户信息
            var myLevel = levels.filter(e => e.minGrowthValue <= myInfo.growthValue && myInfo.growthValue <= e.maxGrowthValue)[0]
            that.setData({
              levelDiscount: myLevel.bonus.descount,
            })
          })
      })
  },

  // 统计当前总价
  calPrice: function() {
    var totalPrice = 0;
    var paymentFee = 0;
    var discount = this.data.levelDiscount;
    var cart = this.data.cart;
    var checkboxResult = this.data.checkboxResult;
    for (let i = 0; i < checkboxResult.length; i++) {
      let index = cart.findIndex(e => e.id == checkboxResult[i]);
      totalPrice += cart[index].productInfo.price * cart[index].number;
    }
    // 实际支付价格 = 商品原价 * discount(保留两位小数)
    paymentFee = totalPrice * discount
    paymentFee = this.roundFun(paymentFee, 2)
    this.setData({
      totalPrice: totalPrice,
      paymentFee: paymentFee
    })
  },
  // 修改加入购物车数量按钮
  onNumberChange: function(e) {
    var id = e.currentTarget.dataset.id;
    var number = e.detail;
    var index = this.data.cart.findIndex(e => e.id == id)
    var storage = this.data.cart[index].productInfo.storage;
    if (number > storage) {
      Toast('该商品不能购买更多哦~');
      let changedata = "cart[" + index + "].number"
      this.setData({
        [changedata]: storage
      })
    } else {
      this.data.cart[index].number = number;
    }
    wx.setStorage({
      key: "cart",
      data: this.data.cart,
    })
    if ((this.data.cart.findIndex(e => e.id == id)) >= 0) {
      this.calPrice();
    }
  },

  // 点击管理按钮切换模式
  onClickManage: function() {
    this.setData({
      pay: !this.data.pay
    })
  },
  // 点击清空按钮
  onClickClear: function() {
    //清空购物车的显示数据
    Dialog.confirm({
      title: '购物车-清空',
      message: '确认要清空购物车中所有商品吗？'
    }).then(() => {
      // on confirm
      this.setData({
        cart: [],
        cartTotal: 0,
        checkboxResult: []
      });
      //缓存中清除购物车数据
      wx.removeStorage({
        key: 'cart',
      })
    }).catch(() => {
      // on cancel
    });
  },
  // 点击删除按钮
  onClickDelete: function() {
    //从缓存读取购物车数据
    var that = this;
    Dialog.confirm({
      title: '购物车-删除',
      message: '确认要删除这些商品？'
    }).then(() => {
      // on confirm
      var value = wx.getStorageSync('cart');
      var checkboxResult = this.data.checkboxResult;
      if (value) {
        for (let i = 0; i < checkboxResult.length; i++) {
          //在缓存数据中查找到要删除的商品
          var index = value.findIndex(e => e.id == checkboxResult[i])
          if (index > -1) {
            //根据索引号在购物车缓存中删除商品
            value.splice(index, 1)
          }
        }
        wx.setStorage({
          key: 'cart',
          data: value,
        })
        that.setData({
          cart: value,
          cartTotal: value.length,
          checkboxResult: []
        });
        this.calPrice()
      } else {

      }
    }).catch(() => {
      // on cancel
    });
  },
  // 点击结算按钮，跳转到支付页面
  onClickPay: function() {
    var checkboxResult = this.data.checkboxResult;
    var cart = this.data.cart;
    var buyProduct = [];
    for (let i = 0; i < checkboxResult.length; i++) {
      let index = cart.findIndex(e => e.id == checkboxResult[i]);
      let temp = {
        id: cart[index].id,
        productInfo: cart[index].productInfo,
        number: cart[index].number
      }
      buyProduct.push(temp);
    }
    wx.setStorage({
      key: "paylist",
      data: buyProduct,
    })
    console.log(buyProduct);
    wx.navigateTo({
      url: '../pay/pay?mode=cart',
    })
  },
  //保留n位小数
  roundFun:function(value, n) {
    return Math.round(value * Math.pow(10, n)) / Math.pow(10, n);
  },
})