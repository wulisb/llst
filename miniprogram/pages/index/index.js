import WxValidate from '../../components/wxValidate.js'
var WxSearch = require('../../components/wxSearch/wxSearch.js')

const app = getApp()
const db = wx.cloud.database()
const _ = db.command

Page({
  data: {
    imgFileIds: [],
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
      }
    })
  },

  // 上传图片
  uploadImg() {
    wx.chooseImage({
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        wx.showLoading({
          title: '上传中',
        })
        const filePaths = res.tempFilePaths //临时路径
        const cloudPaths = []
        const fileIDs = []
        filePaths.forEach((item, index) => {
          cloudPaths.push(this.data.userOpenId + '_' + 'momentImg' +
                          index + filePaths[index].match(/\.[^.]+?$/)[0]) //云存储图片名字
          let _cloudPath = cloudPaths[index].toString()
          let _filePath = item.toString()
          wx.cloud.uploadFile({
            cloudPath: _cloudPath,
            filePath: _filePath,
            success: res => {
              fileIDs.push(res.fileID)
              this.setData({
                imgFileIds: fileIDs
              })
              console.log(imgFileIds)
              wx.showToast({
                title: '上传成功'
              })
            },
            fail: err => {
              console.log(err)
              wx.showToast({
                icon: 'none',
                title: '上传失败'
              })
            }
          })
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

  //发表动态
  sendMoment(e) {
    const params = e.detail.value
    //验证不通过，提示错误信息
    if (!this.WxValidate2.checkForm(params)) {
      const err = this.WxValidate2.errorList[0]
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
        opr: 'add',
        tableName: 'moment',
        datas: {
          momentTitle: e.detail.value.momentTitle,
          momentTxt: e.detail.value.momentTxt,
          authorId: this.data.userOpenId,
          source: 'user',
          momentImg: this.data.imgFileIds,
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
    this.setData({
      'wxSearchData.view.isShowSearchHistory': false,
    })
    WxSearch.wxSearchAddHisKey(this)
    wx.cloud.callFunction({
      name: 'dbOpr',
      data: {
        opr: 'get',
        tableName: 'moment',
        command: 'or',
        datas: [{
          momentTitle: db.RegExp({
            regexp: e.detail.value || e.target.dataset.key,
            options: 'i'
          })
        }, {
          momentTxt: db.RegExp({
            regexp: e.detail.value || e.target.dataset.key,
            options: 'i'
          })
        }]
      },
      success: res => {
        console.log(res)
        this.setData({
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
    this.searchMoment(e)
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
        command: 'inc',
        where: {
          _id: e.target.dataset.key._id
        },
        update: likeNum
      },
      success: res => {
        console.log(res)
        wx.showToast({
          icon: 'none',
          title: '谢谢点赞'
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
        datas: {
          memberId: e.target.dataset.key,
          clubId: this.data.clubId,
          position: 'ordinary'
        }
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
    if (this.data.clubId) {
      wx.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: res => {
          wx.showLoading({
            title: '上传中',
          })
          const filePath = res.tempFilePaths[0] //临时路径
          const logoName = 'clubLogo' + '_' + this.data.clubId;
          const cloudPath = logoName + filePath.match(/\.[^.]+?$/)[0] //云存储图片名字
          wx.cloud.uploadFile({
            cloudPath,
            filePath,
            success: res => {
              //更新数据库
              let _fileID = res.fileID
              wx.cloud.callFunction({
                name: 'dbOpr',
                data: {
                  opr: 'update',
                  tableName: 'clubInfo',
                  where: {
                    clubId: this.data.clubId
                  },
                  update: {
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
    } else {
      wx.showToast({
        icon: 'none',
        title: '请先创建社团'
      })
    }
  },

  //创建社团
  addClub(e) {
    const params = e.detail.value
    //验证不通过，提示错误信息
    if (!this.WxValidate3.checkForm(params)) {
      const err = this.WxValidate3.errorList[0]
      wx.showModal({
        content: err.msg,
        showCancel: false
      })
      return false
    }
    //验证通过，插入数据库
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
        wx.showToast({
          title: '创建社团成功'
        })
        wx.cloud.callFunction({
          name: 'dbOpr',
          data: {
            opr: 'add',
            tableName: 'clubMember',
            datas: {
              memberId: this.data.userOpenId,
              clubId: _clubId,
              position: 'chief'
            }
          },
          success: res => {
            console.log(res)
            wx.showToast({
              title: '社长你好'
            })
          }
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
    const userRules = {
      name: {
        required: true,
        minlength: 2
      },
      tel: {
        required: true,
        tel: true
      }
    }
    const momentRules = {
      momentTitle: {
        required: true
      },
      momentTxt: {
        required: true
      }
    }
    const clubRules = {
      clubName: {
        required: true
      }
    }
    // 验证字段的提示信息，若不传则调用默认的信息
    const userMessages = {
      name: {
        required: '请填写姓名',
        minlength: '请输入正确的姓名'
      },
      tel: {
        required: '请填写手机号',
        tel: '请填写正确的手机号'
      }
    }
    const momentMessages = {
      momentTitle: {
        required: '请输入标题'
      },
      momentTxt: {
        required: '请输入内容'
      }
    }
    const clubMessages = {
      clubName: {
        required: '请输入名称'
      }
    }
    this.WxValidate1 = new WxValidate(userRules, userMessages)
    this.WxValidate2 = new WxValidate(momentRules, momentMessages)
    this.WxValidate3 = new WxValidate(clubRules, clubMessages)
  },

  //编辑个人信息
  setUserInfo(e) {
    const params = e.detail.value
    //验证不通过，提示错误信息
    if (!this.WxValidate1.checkForm(params)) {
      const err = this.WxValidate1.errorList[0]
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
        where: {
          userOpenId: this.data.userOpenId
        },
        update: {
          userName: params.name,
          userTel: params.tel
        }
      },
      success: res => {
        console.log(res)
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
            userOpenId: this.data.userOpenId,
            userName: '',
            userTel: '',
            userNickName: e.detail.userInfo.nickName,
            userAvatarUrl: e.detail.userInfo.avatarUrl
          }
        }
      })
    }
  },

  onLoad(options) {
    this.getOpenId()
    this.getUserInfo()
    this.initValidate()
    WxSearch.init(this, 10, ['梁晓敏', '广东海洋大学', '电子与信息工程学院', '电气工程及其自动化'])
    WxSearch.initMindKeys(['梁晓敏', '广东海洋大学', '电子与信息工程学院', '电气工程及其自动化'])
  },

  onready() {

  },

  onshow() {

  }
})