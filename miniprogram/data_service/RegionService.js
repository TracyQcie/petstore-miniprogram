// 初始化 云数据库
const db = wx.cloud.database()
const _ = db.command

class RegionService {
  /**
   * 构造函数
   */
  constructor() {

  }
  getRegionList(successCallback) {
    db.collection('region').limit(1).get()
      .then(res => {
        typeof successCallback == "function" && successCallback(res.data[0]);
      })
      .catch(err => {
        wx.redirectTo({
          url: '../../errorpage/errorpage'
        });
        console.error(err);
      });
  }
}

export default RegionService