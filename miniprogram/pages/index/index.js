import wxValidate from '../../components/wxValidate.js'
var wxSearch = require('../../components/wxSearch/wxSearch.js')

const app = getApp()
const db = wx.cloud.database()

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
    canIUse: wx.canIUse('button.open-type.getUserInfo')
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
          momentImg: this.imgFileId
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
  wxSearchFn(e) {
    var that = this
    wxSearch.wxSearchAddHisKey(that);
    wx.showToast({
      icon: 'none',
      title: '功能暂时未开通'
    })
  },
  wxSearchInput(e) {
    var that = this
    wxSearch.wxSearchInput(e, that);
  },
  wxSearchFocus(e) {
    var that = this
    wxSearch.wxSearchFocus(e, that);
  },
  wxSearchBlur(e) {
    var that = this
    wxSearch.wxSearchBlur(e, that);
  },
  wxSearchKeyTap(e) {
    var that = this
    wxSearch.wxSearchKeyTap(e, that);
  },
  wxSearchDeleteKey(e) {
    var that = this
    wxSearch.wxSearchDeleteKey(e, that);
  },
  wxSearchDeleteAll(e) {
    var that = this;
    wxSearch.wxSearchDeleteAll(that);
  },
  wxSearchTap(e) {
    var that = this
    wxSearch.wxSearchHiddenPancel(that);
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
        const imgName = 'clubLogo' + this.clubId;
        const cloudPath = imgName + filePath.match(/\.[^.]+?$/)[0] //云存储图片名字
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
                docId: app.globalData.clubDoc,
                datas: {
                  clubLogo: _fileID
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

  //添加成员
  addMember(e){
    wx.showToast({
      icon: 'none',
      title: '功能暂时未开通'
    })
  },

  //创建社团
  addClub(e) {
    //插入数据库
    db.collection('clubInfo').count().then(res => {
      let _clubId = res.total + 1
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
    this.wxValidate = new wxValidate(rules, messages)
  },

  //编辑个人信息
  setUserInfo(e) {
    const params = e.detail.value
    //验证不通过，提示错误信息
    if (!this.wxValidate.checkForm(params)) {
      const err = this.wxValidate.errorList[0]
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
        docId: app.globalData.userDoc,
        datas: {
          userName: params.name,
          userTel: params.tel
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
  bindgetuserinfo(e) {
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
    wxSearch.init(this, 20, ['梁晓敏', '广东海洋大学', '电子与信息工程学院', '电气工程及其自动化']);
    wxSearch.initMindKeys(['梁晓敏', '广东海洋大学', '电子与信息工程学院', '电气工程及其自动化']);
  }

})