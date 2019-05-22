import WxValidate from '../../components/wxValidate.js'
var WxSearch = require('../../components/wxSearch/wxSearch.js')

const app = getApp()
const db = wx.cloud.database()
const _ = db.command

Page({
  data: {
    //社团信息
    clubDoc: '',
    clubId: '',
    clubName: '',
    clubLogo: '',
    //图片信息
    imgFileId: '',
    //用户信息
    userDoc: '',
    userOpenId: '',
    userName: '',
    userTel: '',
    nickName: '',
    avatarUrl: '../../images/user-unlogin.png',
    logged: false,
    //判断小程序的API，回调，参数，组件等是否在当前版本可用
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    //搜索记录
  },

  //调用云函数获取openId
  getOpenId() {
    wx.cloud.callFunction({
      name: 'getId',
      success: res => {
        this.setData({
          userOpenId: res.result.OPENID
        })
        app.globalData.userOpenId = res.result.OPENID
      }
    })
  },

  // 上传图片
  uploadImg() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        wx.showLoading({
          title: '上传中',
        })
        const filePath = res.tempFilePaths[0] //临时路径
        const imgName = 'momentImg' + parseInt(Math.random() * 1000000);
        const cloudPath = imgName + filePath.match(/\.[^.]+?$/)[0] //云存储图片名字
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: res => {
            this.setData({
              imgFileId: res.fileID
            })
          },
          fail: () => {
            wx.showToast({
              icon: 'none',
              title: '请重新选择'
            })
          },
          complete: () => {
            wx.hideLoading()
          }
        })
      },
    })
  },

  //发表动态
  sendMoment(e) {
    wx.cloud.callFunction({
      name: 'dbOpr',
      data: {
        opr: 'add',
        tableName: 'moment',
        datas: {
          momentTitle: e.detail.value.momentTitle,
          momentTxt: e.detail.value.momentTxt,
          authorId: app.globalData.userOpenId,
          source: 'user',
          momentImg: this.imgFileId,
          likeNum: 0,
          createTime: db.serverDate()
        }
      },
      success: () => {
        wx.showToast({
          title: '发表成功'
        })
      }
    })
  },

  //搜索动态
  searchMoment(e) {
    WxSearch.wxSearchAddHisKey(this)
    wx.cloud.callFunction({
      name: 'dbOpr',
      data: {
        opr: 'get',
        tableName: 'moment',
        
        datas: {
          momentTitle: db.RegExp({
              regexp: e.detail.value,
              options: 'i'
            })
          }
          
      },
      success: res => {
        console.log(res)
        this.setData({
          'wxSearchData.view.isShowSearchHistory':false,
          searchMomentResult: res.result.data
        })
      }
    })
  },
  wxSearchInput(e) {
    WxSearch.wxSearchInput(e, this)
  },
  wxSearchclearInput(e) {
    WxSearch.wxSearchclearInput(this)
  },
  wxSearchFocus(e) {
    WxSearch.wxSearchFocus(e, this)
  },
  wxSearchBlur(e) {
    WxSearch.wxSearchBlur(e, this)
  },
  wxSearchKeyTap(e) {
    WxSearch.wxSearchKeyTap(e, this)
  },
  wxSearchDeleteKey(e) {
    WxSearch.wxSearchDeleteKey(e, this)
  },
  wxSearchDeleteAll(e) {
    WxSearch.wxSearchDeleteAll(this)
  },
  wxSearchTap(e) {
    WxSearch.wxSearchHiddenPancel(this)
  },

  //点赞动态
  likeMoment(e) {
    console.log(e)
    wx.cloud.callFunction({
      name: 'dbOpr',
      data: {
        opr: 'update',
        tableName: 'moment',
        datas: {
          where: {
            docId: e.tatget.dataset._id
          },
          update: {
            likeNum: _.inc(1)
          }
        }
      },
      success: res => {
        this.setData({
          clubLogo: _fileID
        })
        wx.showToast({
          title: '上传成功'
        })
      }
    })
  },

  //搜索用户
  searchUser(e) {
    wx.cloud.callFunction({
      name: 'dbOpr',
      data: {
        opr: 'get',
        tableName: 'userInfo',
        command: 'or',
        datas: [{
          userName: e.detail.value
        }, {
          userNickName: e.detail.value
        }]
      },
      success: res => {
        console.log(res)
        this.setData({
          searchUserResult: res.result.data
        })
      }
    })
  },

  //添加成员
  addMember(e) {
    wx.cloud.callFunction({
      name: 'dbOpr',
      data: {
        opr: 'add',
        tableName: 'clubMember',
        datas: e.tatget.dataset
      },
      success: res => {
        console.log(res)
        wx.showToast({
          title: '添加成功'
        })
      }
    })
  },

  // 上传logo
  uploadLogo() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        wx.showLoading({
          title: '上传中',
        })
        const filePath = res.tempFilePaths[0] //临时路径
        const logoName = 'clubLogo' + this.data.clubId;
        const cloudPath = logoName + filePath.match(/\.[^.]+?$/)[0] //云存储图片名字
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: res => {
            this.setData({
              imgFileId: res.fileID
            })
            //更新数据库
            let _fileID = res.fileID
            wx.cloud.callFunction({
              name: 'dbOpr',
              data: {
                opr: 'update',
                tableName: 'clubInfo',
                datas: {
                  where: {
                    docId: app.globalData.clubDoc
                  },
                  update: {
                    clubLogo: _fileID
                  }
                }
              },
              success: res => {
                this.setData({
                  clubLogo: _fileID
                })
                wx.showToast({
                  title: '上传成功'
                })
              },
              fail: () => {
                wx.showToast({
                  icon: 'none',
                  title: '上传失败'
                })
              }
            })
          },
          fail: () => {
            wx.showToast({
              icon: 'none',
              title: '请重新选择'
            })
          },
          complete: () => {
            wx.hideLoading()
          }
        })
      },
    })
  },

  //创建社团
  addClub(e) {
    //插入数据库
    let _clubId = parseInt(Math.random() * 1000000)
    wx.cloud.callFunction({
      name: 'dbOpr',
      data: {
        opr: 'add',
        tableName: 'clubInfo',
        datas: {
          clubId: _clubId,
          clubName: e.detail.value.clubName,
          clubLogo: ''
        }
      },
      success: res => {
        console.log(res)
        this.setData({
          clubDoc: res.result._id,
          clubId: _clubId,
          clubName: e.detail.value.clubName
        })
        app.globalData.clubDoc = res.result._id
        wx.showToast({
          title: '创建社团成功'
        })
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '创建社团失败'
        })
      }
    })
  },

  //配置表单验证函数
  initValidate() {
    // 验证字段的规则
    const rules = {
      name: {
        required: true,
        minlength: 2
      },
      tel: {
        required: true,
        tel: true
      }
    }
    // 验证字段的提示信息，若不传则调用默认的信息
    const messages = {
      name: {
        required: '请填写姓名',
        minlength: '请输入正确的名称'
      },
      tel: {
        required: '请填写手机号',
        tel: '请填写正确的手机号'
      }
    }
    this.WxValidate = new WxValidate(rules, messages)
  },

  //编辑个人信息
  setUserInfo(e) {
    const params = e.detail.value
    //验证不通过，提示错误信息
    if (!this.WxValidate.checkForm(params)) {
      const err = this.WxValidate.errorList[0]
      wx.showModal({
        content: err.msg,
        showCancel: false
      })
      return false
    }
    //验证通过，更新数据库
    wx.cloud.callFunction({
      name: 'dbOpr',
      data: {
        opr: 'update',
        tableName: 'userInfo',
        datas: {
          where: {
            docId: app.globalData.userDoc
          },
          update: {
            userName: params.name,
            userTel: params.tel
          }
        }
      },
      success: res => {
        this.setData({
          userName: params.name,
          userTel: params.tel
        })
        wx.showToast({
          title: '保存成功'
        })
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '保存失败'
        })
      }
    })
  },

  // 查看是否授权登录，获取用户信息
  getUserInfo() {
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              app.globalData.nickName = res.userInfo.nickName
              app.globalData.avatarUrl = res.userInfo.avatarUrl
              this.setData({
                nickName: res.userInfo.nickName,
                avatarUrl: res.userInfo.avatarUrl
              })
            }
          })
        }
      }
    })
  },

  //用户已授权登录，显示用户信息
  bindGetUserinfo(e) {
    if (e.detail.userInfo) {
      app.globalData.logged = true
      this.setData({
        logged: true
      })
      //插入数据库
      wx.cloud.callFunction({
        name: 'dbOpr',
        data: {
          opr: 'add',
          tableName: 'userInfo',
          datas: {
            userOpenId: app.globalData.userOpenId,
            userName: '',
            userTel: '',
            userNickName: app.globalData.nickName,
            userAvatarUrl: app.globalData.avatarUrl
          }
        },
        success: res => {
          this.setData({
            userDoc: res.result._id
          })
          app.globalData.userDoc = res.result._id
        }
      })
    }
  },

  onLoad(options) {
    this.initValidate()
    this.getOpenId()
    this.getUserInfo()
    WxSearch.init(this, 10, ['梁晓敏', '广东海洋大学', '电子与信息工程学院', '电气工程及其自动化']);
    WxSearch.initMindKeys(['梁晓敏', '广东海洋大学', '电子与信息工程学院', '电气工程及其自动化']);
  }
})