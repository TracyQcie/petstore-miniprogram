// 初始化 云数据库
const db = wx.cloud.database()
const _ = db.command
//引用时间格式化工具
const util = require('../util/dateFormat.js')

/**
 *订单数据操作类
 *@class OrderService
 *@constructor
 */
class OrderService {
  /**
   * 构造函数
   */
  constructor() {
    this.listIndex = 0 //分页获取数据的当前页索引
    this.pageCount = 8 //每次分页获取多少数据
  }

  getCloseOrderList(isReset, successCallback) {
    var query = db.collection('user_order').where({
      'status.value': 'close'
    })
    this.pullDataWithQuery(query, isReset, successCallback);
  }
  getNotCloseOrderList(isReset, successCallback) {
    var query = db.collection('user_order').where({
      status: {
        value: {
          $nin: ['close']
        }
      }
    })
    this.pullDataWithQuery(query, isReset, successCallback);
  }
  /**
   * 从数据库获取用于显示的订单列表信息
   * @method getOrderList
   * @for OrderService
   * @param {bool} isReset 是否清空分页缓存
   * @param {function} successCallback(orderArray) 处理数据查询结果的回调函数
   */
  getOrderList(isReset, successCallback) {
    //构造查询条件
    var query = db.collection('user_order')
    this.pullDataWithQuery(query, isReset, successCallback);
  }

  // 根据query拉取数据库数据
  pullDataWithQuery(query, isReset, successCallback) {
    //构造查询条件
    var query = query
    var orderArray = []

    if (isReset) {
      //重置分页为初始值
      this.listIndex = 0
      this.pageCount = 4
    }

    //构造分页
    var offset = this.listIndex * this.pageCount
    //skip和limit的传入参数必须大于0
    if (offset === 0) {
      query = query
        .orderBy('date', 'desc') //按订单创建时间倒序排序
        .limit(this.pageCount) //限制返回数量为 max 条
    } else {
      query = query
        .orderBy('date', 'desc') //按订单创建时间倒序排序
        .skip(offset) // 跳过结果集中的前 offset 条，从第 offset + 1 条开始返回
        .limit(this.pageCount) //限制返回数量为 max 条
    }

    var that = this
    //执行数据库查询
    query
      .get()
      .then(res => {
        if (res.data.length > 0) {
          for (var i in res.data) {
            //格式化时间显示格式
            res.data[i].date = util.formatTime(res.data[i].date)
          }
          orderArray = res.data
            //分页显示的页码+1
            ++that.listIndex
        }
        //回调函数处理数据查询结果
        typeof successCallback == "function" && successCallback(orderArray)
      })
      .catch(err => {
        //跳转出错页面
        wx.redirectTo({
          url: '../../errorpage/errorpage'
        })
        console.error(err)
      })
  }
}

export default OrderService