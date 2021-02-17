// 初始化 云数据库
const db = wx.cloud.database()
const _ = db.command

class ProductService {
  /**
   * 构造函数
   */
  constructor() {
    this.listIndex = 0 //分页获取数据的当前页索引
    this.pageCount = 8 //每次分页获取多少数据
  }

  // 根据商品id获取商品 (callback)
  getProductById(id, successCallback) {
    db.collection('product').where({
        id: id
      }).get()
      .then(res => {
        if (res.data.length > 0) {
          //回调函数处理数据查询结果
          typeof successCallback == "function" && successCallback(res.data[0]);
        } else {
          //跳转出错页面
          wx.redirectTo({
            url: '../../errorpage/errorpage'
          })
        }
      })
      .catch(err => {
        //跳转出错页面
        wx.redirectTo({
          url: '../../errorpage/errorpage'
        })
        console.error(err)
      })
  }

  // 根据商品id获取商品 (promise)
  getCartProductList(id) {
    return new Promise((resolve, reject) => {
      db.collection('product').where({
        id: id
      }).get().then(res => {
        if (res.data.length > 0) {
          resolve(res.data[0])
        } else {
          let flag = false
          resolve(flag)
        }
      })
    })
  }

  // 获取全部商品列表
  getAllProductList(isReset, successCallback) {
    var query = db.collection('product');
    this.pullDataWithQuery(query, isReset, successCallback);
  }

  // 根据关键词获取商品列表
  getProductListByKeyword(keyword, isReset, successCallback) {
    var query = db.collection('product').where({
      name: db.RegExp({
        regexp: '.*' + keyword + '.*',
        options: 'i',
      })
    })
    this.pullDataWithQuery(query, isReset, successCallback);
  }

  // 根据商品类别获取商品
  getProductListByCategory(category, isReset, successCallback) {
    var query = db.collection('product').where({
      category: category
    })
    this.pullDataWithQuery(query, isReset, successCallback);
  }

  // 根据query拉取数据库数据
  pullDataWithQuery(query, isReset, successCallback) {
    var productArray = [];

    if (isReset) {
      //重置分页为初始值
      this.listIndex = 0
      this.pageCount = 8
    };
    //构造分页
    var offset = this.listIndex * this.pageCount
    //skip和limit的传入参数必须大于0
    if (offset === 0) {
      query = query
        .limit(this.pageCount) //限制返回数量为 max 条
    } else {
      query = query
        .skip(offset) // 跳过结果集中的前 offset 条，从第 offset + 1 条开始返回
        .limit(this.pageCount) //限制返回数量为 max 条
    }
    var that = this
    //执行数据库查询
    query
      .get()
      .then(res => {
        if (res.data.length > 0) {
          //构造用于瀑布流显示的商品列表数据
          for (var i in res.data) {
            productArray.push({
              id: res.data[i].id,
              name: res.data[i].name,
              miniImg: res.data[i].miniImg,
              bigImg: res.data[i].bigImg,
              detail: res.data[i].detail,
              price: res.data[i].price,
              category: res.data[i].category
            })
          }
          //分页显示的页码+1
          ++that.listIndex;
        }
        //回调函数处理数据查询结果
        typeof successCallback == "function" && successCallback(productArray)
      }).catch(err => {
        //跳转出错页面
        wx.redirectTo({
          url: '../../errorpage/errorpage'
        })
        console.error(err)
      })
  }
}

export default ProductService;