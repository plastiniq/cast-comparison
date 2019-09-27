import { UP, DOWN, BETWEEN } from './constants.js'
import regression from 'regression'

export default class {
  constructor (spread, propagation) {
    this.spread = spread || 0
    this.propagation = propagation
    this.xy = {}
    this._minY = undefined
    this._minX = undefined
    this._maxX = undefined
  }

  shape(xValue) {
    var key = isNaN(xValue) ? xValue : parseFloat(xValue)
    this.xy[key] = (this.xy[key] || 0) + 1
    this.updateBounds(key)
    return this
  }

  compare(xValue) {
    if (isNaN(xValue)) {
      return this.xy[xValue] || 0
    } else {
      var xNumber = parseFloat(xValue)
      const reg = regression.linear(Object.entries(this.xy).map(v => [parseFloat(v[0]), parseFloat(v[1])]))
    
      if (this.propagation === DOWN) {
        return xNumber < this.maxX ? reg.predict(xNumber)[1] : this.approx(xNumber)
      }
      else if (this.propagation === UP) {
        return xNumber > this.minX ? reg.predict(xNumber)[1] : this.approx(xNumber)
      } 
      else if (this.propagation === BETWEEN) {
        return xNumber > this.minX && xNumber < this.maxX ? reg.predict(xValue)[1] : this.approx(xNumber)
      } 
      else {
        return this.approx(xNumber)
      }
    }
  }

  approx (xValue) {
    if (!this.spreadDistance) {
      return this.xy[xValue] || 0
    }

    var xSequence = Object.keys(this.xy).filter(v => !isNaN(v)).map(v => parseFloat(v)).sort((a, b) => a > b ? 1 : -1)
    if (xSequence.length) {
      var xNum = parseFloat(xValue)
      return xSequence.filter(v => Math.abs(v - xNum) < this.spreadDistance).reduce((acc, curr) => {
        return acc + this.xy[curr] * (1 - Math.abs(xNum - curr) / this.spreadDistance)
      }, 0)
    }

    return 0
  }

  get spreadDistance () {
    return Math.abs(this.maxX * this.spread)
  }

  get maxY() {
    var xSet = Object.keys(this.xy).filter(v => !isNaN(v)).map(v => parseFloat(v))
    var setMax = 0

    if (xSet.length) {
      let groups = xSet.map(x1 => ({x: x1, group: xSet.filter(x2 => x2 != x1 && Math.abs(x1 - x2) < this.spreadDistance)}))
      setMax = Math.max(...groups.map(v => this.xy[v.x] + v.group.reduce((acc, curr) => {
        return acc + this.xy[curr] * (1 - Math.abs(v.x - curr) / this.spreadDistance)
      }, 0)))
    }

    return Math.max(setMax, ...Object.values(this.xy))
  }

  get minX() {
    return this._minX || 0
  }

  get maxX() {
    return this._maxX || 0
  }

  get minY() {
    return this._minY || 0
  }

  updateBounds(xValue) {
    if (!isNaN(xValue)) {
      this._minX = this._minX === undefined ? xValue : Math.min(this._minX, parseFloat(xValue))
      this._maxX = this._maxX === undefined ? xValue : Math.max(this._maxX, parseFloat(xValue))
    }
    this._minY = this._minY === undefined ? 1 : Math.min(this._minY, this.xy[xValue] || 0)
  }
}