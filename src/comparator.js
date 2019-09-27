import Cast from './cast.js'
import { UP, DOWN, BETWEEN } from './constants.js'

export default class {
  constructor (config) {
    this.config = config
    this.properties = {}
  }

  train (value) {
    if (Array.isArray(value)) {
      value.forEach(v => this.trainSingle(v))
    } else {
      this.trainSingle(value)
    }
  }

  trainSingle (obj) {
    for (let key in obj) {
      var value = obj[key]
      var spread = (this.config && this.config[key] && this.config[key][0]) || 0
      var propagation = (this.config && this.config[key] && this.config[key][1]) || null
      this.properties[key] = (this.properties[key] && this.properties[key].shape(value)) || new Cast(spread, propagation).shape(value)
    }
  }

  test (obj) {
    var sum = 0
    var maxOutput = Object.values(this.properties).reduce((acc, val) => acc + val.maxY, 0)

    for (let key in obj) {
      let value = Array.isArray(obj[key]) ? obj[key][0] : obj[key]
      sum += (this.properties[key] && this.properties[key].compare(value)) || 0
    }
    return sum / maxOutput
  }

  flatten (into, currentKey = '', target = {}) {
    for (let i in into) {
      if (into.hasOwnProperty(i)) {
        let newKey = i
        let newVal = into[i]
        
        if (currentKey.length > 0) {
            newKey = currentKey + '_' + i
        }
        
        if (typeof newVal === 'object') {
            this.dive(newKey, newVal, target)
        } else {
            target[newKey] = newVal
        }
      }
    }
  }

  static get UP () {
    return UP
  }

  static get DOWN () {
    return DOWN
  }

  static get BETWEEN () {
    return BETWEEN
  }
}