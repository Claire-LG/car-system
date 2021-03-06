import { withRouter } from 'react-router-dom'
import { hot } from 'react-hot-loader/root'
import React, { Component } from 'react'
import {
  Input,
  Button,
  message,
  DatePicker,
  Modal,
  Popconfirm,
  LocaleProvider,
} from 'antd'
import '../../../less/normal.less'
import './style.less'
import moment from 'moment'
import zh_CN from 'antd/lib/locale-provider/zh_CN'
import SelectMenu from '~/component/SelectMenu'
import urlCng from '~/config/url'
import fetch from '~/utils/fetch'
import { getColor, getUrl } from '~/utils'
import CollapseComponent from './CollapseComponent'
import eventObject from '~/config/eventSignal'

import 'moment/locale/zh-cn'

const { RangePicker } = DatePicker
const { TextArea } = Input
const dropData = [
  {
    id: 'car',
    name: '车牌',
  },
  {
    id: 'time',
    name: '时间',
  },
]
@hot
@withRouter
class RightComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      questionSelected: props.data && props.data.problemId,
      comments: '',
      carNumber: (props.data && props.data.carNum) || '',
      probleList: [],
      type: 'car',
      visible: false,
      deatilData: [], // 弹框信息
    }
    this.strTime = ''
    this.flag = false
    this.selectCarObj = {}
    this.operateType = ''
  }

  componentDidMount() {
    this.getProblemList()
    this.updateSystemTime()
    this.dataObject = this.props.data
    this.updateDuration()

    eventObject.clearSetInternal.add(this.clearDuration)
  }

  componentWillReceiveProps(nextProps) {
    this.dataObject = nextProps.data
    this.updateDuration()
  }

  componentWillUnmount() {
    if (this.updateTimer) clearTimeout(this.updateTimer)
    this.clearDuration()
    eventObject.clearSetInternal.remove(this.clearDuration)
  }

  // 移除右边时间定时器
  clearDuration = () => {
    if (this.interValDuration) clearInterval(this.interValDuration)
  }

  updateDuration = () => {
    if (!Object.keys(this.dataObject).length) {
      return
    }
    if (this.dataObject.status === 3) {
      this.interValDuration = setInterval(() => {
        this.renderDuration()
      }, 1000)
    } else {
      this.renderDuration()
      this.clearDuration()
    }
  }

  renderDuration = () => {
    const p = document.getElementById('duration')
    if (p) {
      const m1 = moment(this.dataObject.createTimeStr)
      const m2 = moment()
      const duration = m2.diff(m1, 'seconds')
      if (duration < 0) {
        p.innerText = '0s'
      } else {
        p.innerText = `${duration}s`
      }
      p.style.color = getColor(duration)
    }
  }

  updateSystemTime = () => {
    if (this.updateTimer) clearTimeout(this.updateTimer)
    const p = document.getElementById('nowTime')
    if (p) {
      const time = new Date()
      const year = time.getFullYear()
      let month = time.getMonth() + 1
      let day = time.getDate()
      let hour = time.getHours()
      let minutes = time.getMinutes()
      let seconds = time.getSeconds()
      if (month < 10) month = `0${month}`
      if (day < 10) day = `0${day}`
      if (minutes < 10) minutes = `0${minutes}`
      if (hour < 10) hour = `0${hour}`
      if (seconds < 10) seconds = `0${seconds}`
      const str = `${year}-${month}-${day} ${hour}:${minutes}:${seconds}`
      p.innerText = str
      this.updateTimer = window.setTimeout(this.updateSystemTime, 1000)
    }
  }

  getProblemList = () => {
    fetch({
      url: urlCng.callProblem,
    }).then(res => {
      if (res.code === 1) {
        const data = []
        for (let i = 0; i < res.result.length; i++) {
          data.push({
            id: res.result[i].code,
            name: res.result[i].text,
          })
        }
        this.setState({
          probleList: data,
        })
      }
    })
  }

  dropChange = (e, key) => {
    this.setState({
      [key]: e,
    })
  }

  handleChange = v => {
    this.setState({
      comments: v.target.value,
    })
  }

  // 提交
  submit = () => {
    if (!Object.keys(this.selectCarObj).length) {
      message.warning('未检索车牌不能提交')
      return
    }
    if (!this.operateType) {
      message.warning('请选择处理方式')
      return
    }
    const { comments, questionSelected } = this.state
    const { data } = this.props
    if (comments.length < 4) {
      message.warning('问题描述需要大于4个文字')
      return
    }
    const operatedSum = document.getElementById('allSecond').innerText
    const params = Object.assign(
      {},
      {
        remark: comments,
        id: data.id,
        problemId: questionSelected,
        status: 4,
        operatedType: this.operateType,
        operatedSum: operatedSum && parseInt(operatedSum),
      },
      this.selectCarObj
    )
    if (data.id) {
      fetch({
        url: urlCng.callUpdate,
        method: 'POST',
        data: params,
      }).then(res => {
        if (res.code === 1) {
          message.success('提交成功')
          this.props.goback()
          setTimeout(() => {
            window.location.reload()
          }, 50)
          this.props.close()
        } else {
          message.success('提交失败')
        }
      })
    }
  }

  changeValue = (e, key) => {
    this.strCarInput = e.target.value
    this.setState({
      [key]: e.target.value,
    })
  }

  filter = () => {
    fetch({
      url: urlCng.callUpdate,
    }).then(res => {
      if (res.code === 1) {
        message.success('提交成功')
      } else {
        message.success('提交失败')
      }
    })
  }

  // 入场
  open = () => {
    this.operateType = 1 // 免费开闸
    if (!this.flag) {
      fetch({
        url: urlCng.open,
        method: 'POST',
      }).then(res => {
        if (res.code === 1) {
          this.flag = true
          message.success('开闸成功')
        } else {
          message.success('开失败成功')
        }
      })
    }
  }

  // 现场处理
  operateCurrent = () => {
    this.operateType = 3
  }

  // 检索
  search = () => {
    const { carNumber } = this.state
    const params = {
      plate_number: carNumber,
      probably_start_time: this.startDate || '',
      probably_end_time: this.endDate || '',

    }
    const url = getUrl(params, `${urlCng.searchCar}`)

    fetch({
      url,
    }).then(res => {
      if (res.code === 1) {
        this.setState({
          visible: true,
          deatilData: res.result,
        })
      } else {
        message.success('检索失败')
      }
    })
  }

  handleCancel = () => {
    this.setState({
      visible: false,
    })
  }

  selectCarItem = item => {
    this.selectCarObj = item
    const objDom = document.getElementById('modifyCarNumber')
    objDom.innerText = `车牌号:  ${this.selectCarObj.carNum}`
    objDom.style.display = 'block'
    this.handleCancel()
  }

  // 时间改变
  onChangeDate = (dates, dateStrings) => {
    this.strDate = `${dateStrings[0]}:00 至 ${dateStrings[1]}:00`
    this.startDate = dateStrings[0]
    this.endDate = dateStrings[1]
  }

  render() {
    const {
      questionSelected,
      comments,
      carNumber,
      probleList,
      type,
      visible,
      deatilData,
    } = this.state
    const { data } = this.props
    const dataKeys = Object.keys(data)
    return (
      <div className="right">
        <div className="top-title">
          <span style={{ marginLeft: '13.5pt' }}>
            {dataKeys.length && data.parkName}
          </span>
          <span id="nowTime" style={{ marginRight: '13.5pt' }} />
        </div>
        <div className="wrap-info car">
          <SelectMenu
            data={dropData}
            className="select-type"
            change={e => this.dropChange(e, 'type')}
            defaultValue={type}
            style={{ width: '100pt', marginRight: '5pt' }}
          />
          {type === 'car' ? (
            <Input
              placeholder="请输入车牌关键词"
              className="car-num"
              value={carNumber}
              onChange={e => this.changeValue(e, 'carNumber')}
            />
          ) : (
            <LocaleProvider locale={zh_CN}>
              <RangePicker
                allowClear
                showTime={{ format: 'HH' }}
                format="YYYY-MM-DD HH"
                onChange={this.onChangeDate}
                style={{ width: '310px' }}
                placeholder={['开始时间', '结束时间']}
              />
            </LocaleProvider>
          )}
        </div>
        <div className="wrap-info" id="modifyCarNumber" style={{ marginTop: '20pt' }} />
        <div
          className="wrap-info"
          style={{ marginTop: '10px', justifyContent: 'flex-end' }}
        >
          <Button className="filter" onClick={this.search}>
            检索
          </Button>
        </div>
        {/* 操作按钮 */}
        <div className="wrap-info">
          <div className="info-item" style={{ minWidth: '140px' }}>
            <p className="text">等待时长</p>
            <p className="duration" id="duration" />
          </div>
          <div className="info-item">
            <Popconfirm
              title="请确认是否对闸口进行放行?"
              onConfirm={this.open}
              okText="确定"
              cancelText="取消"
            >
              <div className="op-btn in">
                {data.inOut === 2 ? '入场' : '出场'}开闸
              </div>
            </Popconfirm>
          </div>
          <div className="info-item">
            <Popconfirm
              title="请联系停车场管理人员 电话:15317035193"
              okText="确定"
              cancelText="取消"
              style={{ width: '200px' }}
            >
              <div className="op-btn operate" onClick={this.operateCurrent}>
                现场处理
              </div>
            </Popconfirm>
          </div>
        </div>
        {/* 提交内容 */}
        <div className="wrap-bottom">
          <div className="drop-wrap">
            <div className="label">问题类型:</div>
            <SelectMenu
              data={probleList}
              style={{ background: '#eee', width: '85%' }}
              className="detailDrop"
              change={e => this.dropChange(e, 'questionSelected')}
              defaultValue={questionSelected}
            />
          </div>
          <TextArea
            placeholder="请描述问题(4-100)"
            autosize={{ minRows: 3, maxRows: 6 }}
            value={comments}
            onChange={v => this.handleChange(v)}
            maxLength="100"
            minLength="4"
            style={{
              borderRadius: '2pt',
              width: '100%',
              resize: 'none',
              background: '#EAF0FD',
              color: '#707070',
              fontSize: '10pt',
              marginTop: '15pt',
              marginBottom: '25.5pt',
            }}
          />
          <Button className="sumbit" onClick={this.submit}>
            提交
          </Button>
        </div>
        {/* 弹框 */}
        <Modal
          title={type === 'car' ? '车牌检索' : '时间检索'}
          visible={visible}
          className="watch-image-dialog panle-dialog"
          okText="确认"
          cancelText=""
          onCancel={this.handleCancel}
          width={908}
          destroyOnClose
          confirmLoading={false}
        >
          <CollapseComponent
            type={type}
            data={deatilData}
            selectData={data}
            keyword={carNumber}
            str={type === 'car' ? this.strCarInput : this.strDate}
            selectCarItem={this.selectCarItem}
          />
        </Modal>
      </div>
    )
  }
}

export default RightComponent
