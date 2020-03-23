/* eslint-disable array-callback-return */
import React, { Component } from 'react'
import { Table, Button, Input, message } from 'antd'
import { hot } from 'react-hot-loader/root'
import { withRouter } from 'react-router-dom'
import '../../less/normal.less'
import './style.less'
import moment from 'moment'
import fetch from '~/utils/fetch'
import urlCng from '~/config/url'
import SelectMenu from '~/component/SelectMenu'
import { getUrl, getColor } from '~/utils/index'

const pageSize = 10

@hot
@withRouter
class Livecall extends Component {
  constructor(props) {
    super(props)
    this.state = {
      data: [],
      searchContent: '',
      current: 1, // 当前页
      selected: 'all',
      total: 0,
      loading: true,
      parkList: [] // 停车场位置
    }
    this.headers = [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'ID'
      },
      {
        title: '停车场',
        dataIndex: 'parkName',
        key: 'parkName'
      },
      {
        title: '出入场',
        dataIndex: 'inOutStr',
        key: 'inOutStr'
      },
      {
        title: '车牌号',
        dataIndex: 'carNum',
        key: 'carNum'
      },
      {
        title: '呼叫时间',
        dataIndex: 'createTimeStr',
        key: 'createTimeStr'
      },
      {
        title: '等待时长',
        dataIndex: 'waitCountTime',
        key: 'waitCountTime',
        render: (text, record) => {
          const m1 = moment(record.createTimeStr)
          const m2 = moment()
          const duration = m2.diff(m1, 'seconds')
          return (
            <div
              id={`wait${record.id}${record.parkId}`}
              style={{ color: getColor(duration) }}
            >
              {duration}s
            </div>
          )
        }
      },
      {
        title: '事件处理',
        dataIndex: 'op',
        key: 'op',
        render: (text, record) => (
          // 状态 1、未接听；2、等待接听；3、通话中、4、完成；5、挂断
          <div>
            {record.status === 3 ? (
              <span className="online" onClick={() => this.answer(record)}>
                通话中
              </span>
            ) : (
              <span
                className="online"
                onClick={() => this.updateList(record, 3)}
              >
                接听
              </span>
            )}
            <span
              className="hang-up"
              onClick={() => this.updateList(record, 5)}
            >
              挂断
            </span>
            <span
              className="not-operate"
              onClick={() => this.noOperate(record)}
            >
              暂不处理
            </span>
          </div>
        )
      }
    ]
  }

  componentDidMount() {
    this.getParkPos() // 停车场下拉
    this.getList() // 列表数据
  }

  componentWillUnmount() {
    if (this.timer) {
      window.clearInterval(this.timer)
    }
  }

  // 获取停车场位置
  getParkPos = () => {
    fetch({
      url: urlCng.parkList
    }).then(res => {
      if (res.code === 1) {
        if (res.result && res.result.data) {
          const resData = res.result.data
          resData.unshift({
            id: 'all',
            name: '全部'
          })
          this.setState({
            parkList: resData
          })
        }
      }
    })
  }

  // 暂不处理
  noOperate = item => {
    fetch({
      url: urlCng.callDel,
      method: 'POST',
      data: { id: item.id }
    }).then(res => {
      if (res.code === 1) {
        this.getList()
        message.success('操作成功')
      } else {
        message.error(res.msg)
      }
    })
  }

  // 更新
  updateList = (item, status) => {
    fetch({
      url: urlCng.callUpdate,
      method: 'POST',
      data: { id: item.id, status }
    }).then(res => {
      if (res.code === 1) {
        this.getList()
        message.success('操作成功')
      } else {
        message.error(res.msg)
      }
    })
  }

  componentDidUpdate = () => {
    const { data } = this.state
    if (!data.length) return
    // this.timer = window.setInterval(() => {
    //   for (let i = 0; i < data.length; i++) {
    //     const record = data[i]
    //     const m1 = moment(record.createTimeStr)
    //     const m2 = moment()
    //     const $item = document.getElementById(
    //       `wait${record.id}${record.parkId}`
    //     )
    //     const duration = m2.diff(m1, 'seconds')
    //     if (duration <= 60) {
    //       $item.style.color = '#3CEA43'
    //     } else if (duration >= 60 && duration <= 120) {
    //       $item.style.color = '#EAB43C'
    //     } else {
    //       $item.style.color = '#EA3C3C'
    //     }
    //     $item.innerHTML = `${m2.diff(m1, 'seconds')}s`
    //   }
    // }, 1000)
  }

  // 进入详情
  answer = item => {
    this.props.history.push('/livedetail', { data: item })
  }

  getList = () => {
    const { current, searchContent, selected } = this.state // &userName=${searchContent}
    const params = {
      pageSize,
      curPage: current
    }
    // 车牌号
    if (searchContent) {
      params.carNum = searchContent
    }
    // 停车场
    if (selected !== 'all') {
      params.parkId = selected
    }
    const url = getUrl(params, `${urlCng.callWaitList}`)

    fetch({
      url
    }).then(res => {
      if (res.code === 1) {
        this.setState({
          data: res.result.data,
          total: res.result.page.totalNum,
          loading: false
        })
      } else {
        message.error(res.msg)
      }
    })
  }

  // 分页
  handlePageChange = pageNumber => {
    this.setState(
      {
        current: pageNumber
      },
      () => {
        this.getList()
      }
    )
  }

  // 下拉改变
  dropChange = (e, key) => {
    this.setState({
      [key]: e
    })
  }

  // 搜索框改变
  changeValue = e => {
    this.setState({
      searchContent: e.target.value
    })
  }

  // 筛选
  filter = () => {
    this.setState({ current: 1 }, () => {
      this.getList()
    })
  }

  render() {
    const {
      data,
      searchContent,
      current,
      selected,
      total,
      parkList,
      loading
    } = this.state
    return (
      <div className="panel">
        <div id="liveCall">
          <div className="search-wrap">
            <div>
              <SelectMenu
                data={parkList}
                change={e => this.dropChange(e, 'selected')}
                defaultValue={selected}
              />
              <Button className="filter" onClick={this.filter}>
                筛选
              </Button>
            </div>
            <div className="search">
              <Input
                className="search-content"
                placeholder="请输入车牌号关键词"
                value={searchContent}
                onChange={e => this.changeValue(e, 'username')}
              />
              <Button className="search-btn" onClick={this.filter}>
                搜索
              </Button>
            </div>
          </div>
          {/* 表格数据 */}
          <Table
            dataSource={data}
            columns={this.headers}
            scroll={{ x: true }}
            rowKey={(record, index) => index}
            loading={loading}
            locale={{ emptyText: '暂无数据' }}
            pagination={{
              total,
              pageSize,
              current,
              onChange: this.handlePageChange
            }}
          />
          <div className="total">
            共{total}条记录 <span className="page-num">每页{pageSize}条</span>
          </div>
        </div>
      </div>
    )
  }
}

export default Livecall
