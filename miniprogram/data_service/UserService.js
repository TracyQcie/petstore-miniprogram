// 初始化 云数据库
const db = wx.cloud.database()
const _ = db.command

/**
 *用户信息数据操作类
 *@class UserService
 *@constructor
 */
class UserService {
  /**
   * 构造函数
   */
  constructor() {}

  /**
   * 从数据库获取用户信息
   * @method getUserInfo
   * @for UserService
   * @param {function} success_callback(userinfo) 处理数据查询结果的回调函数
   * 
   * user数据集合的权限是“仅创建者可读写”，因此在小程序客户端只能读到自己的用户信息。
   * 每个用户在user数据集合只有一条记录，因此res.data[0]就是当前登录用户的信息。
   */

  // 获取用户信息
  getUserInfo(success_callback) {
    //执行数据库查询
    db.collection('user')
      .get()
      .then(res => {
        if (res.data.length > 0) {
          //回调函数处理数据查询结果
          typeof success_callback == "function" && success_callback(res.data[0]);
        } else {
          //没有查询到用户信息的业务异常处理
          //跳转出错页面
          wx.redirectTo({
            url: '../../errorpage/errorpage'
          });
        }
      })
      .catch(err => {
        //访问数据库失败 的 系统异常处理
        //跳转出错页面
        wx.redirectTo({
          url: '../../errorpage/errorpage'
        });
        console.error(err);
      })
  }

  // 获取用户默认地址
  getUserDefaultAddress(success_callback) {
    db.collection('user')
      .get()
      .then(res => {
        var addressArray = res.data[0].addressArray;
        var defaultAddress = {};
        if (res.data.length > 0) {
          //回调函数处理数据查询结果
          if (addressArray.length <= 0) {
            defaultAddress = addressArray[0];
          } else {
            for (var i = 0; i < addressArray.length; i++) {
              if (addressArray[i].default == true) {
                defaultAddress = addressArray[i];
              }
            }
          }
          typeof success_callback == "function" && success_callback(defaultAddress);
        } else {
          //没有查询到用户信息的业务异常处理
          //跳转出错页面
          wx.redirectTo({
            url: '../../errorpage/errorpage'
          });
        }
      })
      .catch(err => {
        //访问数据库失败 的 系统异常处理
        //跳转出错页面
        wx.redirectTo({
          url: '../../errorpage/errorpage'
        });
        console.error(err);
      })
  }

  // 用id获取用户的某个地址
  getUsertAddressById(addressId, success_callback) {
    var addressId = addressId;
    db.collection('user')
      .get()
      .then(res => {
        var addressArray = res.data[0].addressArray;
        var targetAddress = {};
        if (res.data.length > 0) {
          //回调函数处理数据查询结果
          if (addressArray.length <= 0) {
            targetAddress = addressArray[0];
          } else {
            for (var i = 0; i < addressArray.length; i++) {
              if (addressArray[i].addressId == addressId) {
                targetAddress = addressArray[i];
              }
            }
          }
          typeof success_callback == "function" && success_callback(targetAddress);
        } else {
          //没有查询到用户信息的业务异常处理
          //跳转出错页面
          wx.redirectTo({
            url: '../../errorpage/errorpage'
          });
        }
      })
      .catch(err => {
        //访问数据库失败 的 系统异常处理
        //跳转出错页面
        wx.redirectTo({
          url: '../../errorpage/errorpage'
        });
        console.error(err);
      })
  }

  // 获取用户地址数组
  getUserAdderssArray(success_callback) {
    db.collection('user')
      .get()
      .then(res => {
        if (res.data.length > 0) {
          //回调函数处理数据查询结果
          typeof success_callback == "function" && success_callback(res.data[0].addressArray);
        } else {
          //没有查询到用户信息的业务异常处理
          //跳转出错页面
          wx.redirectTo({
            url: '../../errorpage/errorpage'
          });
        }
      })
      .catch(err => {
        //访问数据库失败 的 系统异常处理
        //跳转出错页面
        wx.redirectTo({
          url: '../../errorpage/errorpage'
        });
        console.error(err);
      })
  }

  //删除某个地址
  deleteArrayById(addressId) {
    var that = this;
    var addressId = addressId;
    this.getUserAdderssArray(function(res) {
      var oldAddressArray = res;
      var newAddressArray = [];
      if (oldAddressArray.length == 0) {
        newAddressArray = [];
      } else {
        for (var i = 0; i < oldAddressArray.length; i++) {
          if (oldAddressArray[i].addressId != addressId) {
            let temp = {
              "addressId": oldAddressArray[i].addressId,
              "receiver": oldAddressArray[i].receiver,
              "phone": oldAddressArray[i].phone,
              "region": oldAddressArray[i].region,
              "address": oldAddressArray[i].address,
              "default": oldAddressArray[i].default
            }
            newAddressArray.push(temp);
          }
          // 检查此时数组中是否有设置默认地址，没有的话将数组第一个地址设置为默认
          if (!that.isAddressHasDafault(newAddressArray)) {
            newAddressArray[0].default = true;
          }
        }
        wx.cloud.callFunction({
          // 云函数名称
          name: 'updateUserAddress',
          // 传给云函数的参数
          data: {
            "newAddressArray": newAddressArray
          },
          success: function(res) {
            console.log(res)
          },
          fail: console.error
        })
      }
    })
  }

  // 更新用户地址信息
  async updateUserAddressArray(newAddress) {
    var that = this;
    var newAddress = newAddress; //传进来的新地址
    var oldAddressArray = [];
    var newAddressArray = [];
    let p = new Promise((resolve, reject) => {
      // 异步操作
      that.getUserInfo(function(res) {
        resolve(res.addressArray);
      })
    });
    p.then((data) => {
      oldAddressArray = data;
      // console.log("newAddress", newAddress);
      // console.log('2', oldAddressArray);
      // console.log("3", oldAddressArray.length);
      if (oldAddressArray.length <= 0) {
        // 用户地址数组为空的情况
        // 直接插入新地址
        // 没有设置的情况下默认将第一个地址设为默认地址
        newAddress.default = true;
        oldAddressArray.push(newAddress);
      } else {
        // 用户地址数组不为空的情况
        if (newAddress.default) {
          // 如果新地址有设置为默认，先清空以前的默认设置
          oldAddressArray = this.clearDefault(oldAddressArray);
          console.log("clear", oldAddressArray);
        }
        var addressIndex = this.isAddressExist(newAddress, oldAddressArray);
        if (addressIndex >= 0) {
          // 新地址已经存在，更新
          oldAddressArray[addressIndex] = newAddress;
        } else {
          // 不存在，插入
          oldAddressArray.push(newAddress);
          // console.log("push", oldAddressArray);
        }
        // 检查此时数组中是否有设置默认地址，没有的话将数组第一个地址设置为默认
        if (!that.isAddressHasDafault(oldAddressArray)) {
          oldAddressArray[0].default = true;
        }
      }
      newAddressArray = oldAddressArray;
      // console.log("4", newAddressArray);
      wx.cloud.callFunction({
        // 云函数名称
        name: 'updateUserAddress',
        // 传给云函数的参数
        data: {
          "newAddressArray": newAddressArray
        },
        success: function(res) {
          console.log(res)
        },
        fail: console.error
      })

    }, (err) => {
      console.log('rejected', err);
    });
  }

  // 判断地址是否在地址数组中
  isAddressExist(newAddress, oldAddressArray) {
    for (var i = 0; i < oldAddressArray.length; i++) {
      if (oldAddressArray[i].addressId == newAddress.addressId) {
        // 如果存在，返回下标
        return i;
      }
    }
    // 不存在，返回-1
    return -1;
  }

  isAddressHasDafault(oldAddressArray) {
    for (var i = 0; i < oldAddressArray.length; i++) {
      if (oldAddressArray[i].default == true) {
        return true;
      }
    }
    // 不存在，返回-1
    return false;
  }

  // 清除默认标志
  clearDefault(oldAddressArray) {
    var oldAddressArray = oldAddressArray;
    var tempAddressArray = [];
    for (var i = 0; i < oldAddressArray.length; i++) {
      let temp = {
        "addressId": oldAddressArray[i].addressId,
        "receiver": oldAddressArray[i].receiver,
        "phone": oldAddressArray[i].phone,
        "region": oldAddressArray[i].region,
        "address": oldAddressArray[i].address,
        "default": false
      }
      tempAddressArray.push(temp);
    }
    return tempAddressArray;
  }
}

export default UserService;