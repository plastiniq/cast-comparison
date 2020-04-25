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
      this.properties[key] = this.properties[key] || new Cast(spread, propagation)

      if (value !== '' && value !== undefined) {
        this.properties[key].shape(value)
      }
    }
  }

  get totalOutput () {
    return Object.values(this.properties).reduce((acc, val) => acc + val.maxY, 0)
  }

  get maxOutput () {
    return Object.values(this.properties).reduce((acc, val) => Math.max(acc, val.maxY), 0)
  }

  test (obj) {
    var sum = 0

    for (let key in obj) {
      sum += (this.properties[key] && this.properties[key].compare(obj[key])) || 0
    }

    return this.totalOutput ? sum / this.totalOutput : 0
  }

  intersection (obj) {
    var sum = 0
    var total = 0

    for (let key in obj) {
      sum += (this.properties[key] && this.properties[key].intersection(obj[key])) || 0
      total += (this.properties[key] && this.properties[key].findMaxGroup(obj[key]).y) || 0
    }

    return total ? sum / total : 0
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