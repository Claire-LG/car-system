import { hot } from 'react-hot-loader/root'
import React, { Component } from 'react'
import '../../../less/normal.less'
import './panle.less'
import { Collapse, Button, Input, message } from 'antd'
import urlCng from '~/config/url'
import fetch from '~/utils/fetch'

const { Panel } = Collapse

@hot
class CarNumber extends Component {
  constructor(props) {
    super(props)
    this.state = {
      edit: false,
      data: this.props.data
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      data: nextProps.data
    })
  }

  renderHeader = item => {
    const { type } = this.props
    if (!item) return <span />
    return (
      <div className="header-info">
        <span>
          {item.plate_number}&nbsp;&nbsp;&nbsp;
          {type === 'car' ? '' : `${item.start_time_str}`}
        </span>
        <span>展开详情</span>
      </div>
    )
  }

  // 修改车牌
  editCar = () => {
    this.setState({
      edit: true
    })
  }

  // 提交
  submit = item => {
    // 更新的车牌 this[`textInput${item.id}`].state.value
    fetch({
      url: urlCng.updateCarNum,
      method: 'POST'
    }).then(res => {
      if (res.code === 1) {
        message.success('更新成功')
        this.props.onCancel && this.props.onCancel()
      } else {
        message.error('更新失败')
      }
    })
  }

  getContent = item => {
    const { edit } = this.state
    return (
      <div className="detail-content">
        <div className="left">
          <div className="item">
            <p className="name">车牌号</p>
            {edit ? (
              <Input
                ref={input => {
                  this[`textInput${item.id}`] = input
                }}
                defaultValue={item.plate_number}
                style={{ width: '60pt', height: '20pt' }}
              />
            ) : (
              <p className="value">{item.plate_number}</p>
            )}
            <span className="edit" onClick={this.editCar}>
              修正
            </span>
          </div>
          <div className="item">
            <p className="name">停车场</p>
            <p className="value">{item.parking_name}</p>
          </div>
          <div className="item">
            <p className="name">缴费情况</p>
            <p className="vaule">{item.pay_status}</p>
          </div>
          <div className="item">
            <p className="name">金额</p>
            <p className="value">{item.paid_amount}</p>
          </div>
          <Button className="btn" onClick={() => this.submit(item)}>
            提交
          </Button>
        </div>
        <div className="right">
          <div className="wrap-top">
            <div className="item">
              <p className="name">出场时间</p>
              <p className="value">{item.start_time_str}</p>
            </div>
            <div className="item">
              <p className="name">入场时间</p>
              <p className="value">{item.start_time_str}</p>
            </div>
          </div>
          <div className="wrap-top" style={{ marginTop: '20pt' }}>
            <div>
              <p className="name">车辆图片</p>
              <img src={item.picture_url_out} />
            </div>
            <div>
              <p className="name">车辆图片</p>
              <img src={item.picture_url_in} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  render() {
    const { type, str } = this.props
    const { data } = this.state
    return (
      <div className="panel">
        {type === 'car' ? (
          <div className="info">车牌关键字：{str}</div>
        ) : (
          <div className="info">时间:{str}</div>
        )}
        {data && data.length ? (
          <Collapse accordion className="panle-dialog">
            {data.map((item, i) => (
              <Panel header={this.renderHeader(item)} key={i} showArrow={false}>
                {this.getContent(item)}
              </Panel>
            ))}
          </Collapse>
        ) : (
          <div className="empty">
            <img src={require('../../../images/home/no-img.png')} />
            未搜索到车牌
          </div>
        )}
      </div>
    )
  }
}

export default CarNumber