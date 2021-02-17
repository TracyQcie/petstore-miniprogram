// 初始化 云数据库
const db = wx.cloud.database()
const _ = db.command
const util = require('../util/dateFormat.js')

class ComplainService {
  /**
   * 构造函数
   */
  constructor() {

  }
  getComplainListByOrderId(orderId, successCallback) {
    var orderId = orderId
    db.collection('user_complain').where({
        orderId: orderId
      }).orderBy('date', 'desc').get()
      .then(res => {
        console.log(res)
        if (res.data.length > 0) {
          for (var i in res.data) {
            //格式化时间显示格式
            res.data[i].date = util.formatTime(res.data[i].date)
          }
        }
        typeof successCallback == "function" && successCallback(res.data);
      })
      .catch(err => {
        wx.redirectTo({
          url: '../../errorpage/errorpage'
        });
        console.error(err);
      });
  }
}

export default ComplainService