// components/WaterFallComponent/WaterFallComponent.js
var leftHeight = 0;
var rightHeight = 0; //分别定义左右两边的高度
var query;
Component({
  options: {
    //设置组件可以使用调用该组件的Page的样式
    styleIsolation: 'apply-shared'
  },
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    productList: [], //商品信息
    leftList: [], //左瀑布流
    rightList: [], //右瀑布流
    itemWidth: 0, //图片宽度
  },
  /**
   * 组件生命周期函数-在组件实例进入页面节点树时执行
   */
  attached: function() {
    //根据手机的屏幕分辨率设置图片宽度和每张图片的最大高度
    var that = this;
    //根据手机的屏幕分辨率设置图片宽度和每张图片的最大高度
    wx.getSystemInfo({
      success: (res) => {
        var percentage = 750 / res.windowWidth;
        var margin = 60 / percentage;
        var tempitemWidth = (res.windowWidth - margin) / 2;
        that.setData({
          itemWidth: tempitemWidth
        })
      }
    });
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 数据填充
    fillData: function(isPull, listData) {
      this.setData({
        productList: listData
      })
      if (isPull) {
        //清空已加载的数据
        this.data.leftList.length = 0;
        this.data.rightList.length = 0;
        this.leftHight = 0;
        this.rightHight = 0;
      }
  
      //设置更新后的瀑布流数据，刷新瀑布流显示
      this.isLeft();
    },
    // 判断瀑布流的左右数组
    async isLeft() {
      const list = this.data.productList;
      const leftList = this.data.leftList;
      const rightList = this.data.rightList;
      query = this.createSelectorQuery();
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
  }
})