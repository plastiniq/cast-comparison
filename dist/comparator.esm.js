import regression from 'regression';

const BETWEEN = 'between';
const DOWN = 'down';
const UP = 'up';

class Cast {
  constructor (spread, propagation) {
    this.spread = spread || 0;
    this.propagation = propagation;
    this.xy = {};
    this._minY = undefined;
    this._minX = undefined;
    this._maxX = undefined;
  }

  shape(xValue) {
    var key = isNaN(xValue) ? xValue : parseFloat(xValue);
    this.xy[key] = (this.xy[key] || 0) + 1;
    this.updateBounds(key);
    return this
  }

  compare(xValue) {
    if (!Object.keys(this.xy).length) {
      return 0
    }
    else if (isNaN(xValue)) {
      return this.xy[xValue] || 0
    } else {
      var xNumber = parseFloat(xValue);
      const reg = regression.linear(Object.entries(this.xy).map(v => [parseFloat(v[0]), parseFloat(v[1])]));
    
      if (this.propagation === DOWN) {
        return xNumber < this.maxX ? Math.max(reg.predict(xValue)[1], this.approx(xNumber)) : this.approx(xNumber)
      }
      else if (this.propagation === UP) {
        return xNumber > this.minX ? Math.max(reg.predict(xValue)[1], this.approx(xNumber)) : this.approx(xNumber)
      } 
      else if (this.propagation === BETWEEN) {
        return xNumber > this.minX && xNumber < this.maxX ? Math.max(reg.predict(xValue)[1], this.approx(xNumber)) : this.approx(xNumber)
      } 
      else {
        return this.approx(xNumber)
      }
    }
  }

  intersection(xValue) {
    if (!Object.keys(this.xy).length) {
      return 0
    }
    else if (isNaN(xValue)) {
      return this.xy[xValue] || 0
    } else {
      var value = parseFloat(xValue);
      var maxGroup = this.findMaxGroup(value);
      return this.intersect(value, maxGroup.x) * maxGroup.y
    }
  }

  approx (xValue) {
    if (!this.spreadDistance) {
      return this.xy[xValue] || 0
    }

    var xSequence = Object.keys(this.xy).filter(v => !isNaN(v)).map(v => parseFloat(v)).sort((a, b) => a > b ? 1 : -1);
    if (xSequence.length) {
      var xNum = parseFloat(xValue);
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
    return this.xByMaxY.y
  }

  get groups () {
    var xValues = Object.keys(this.xy);

    if (!xValues.length) {
      return []
    }

    var xNumbers = xValues.filter(v => !isNaN(v)).map(v => parseFloat(v));
    var groups = [];

    const neighbors = (arr, value) => {
      return arr.filter(x => x != value && Math.abs(value - x) < this.spreadDistance)
    };

    const mergeGroup = (anchor, group) => {
      return this.xy[anchor] + group.reduce((acc, curr) => (acc + this.xy[curr] * (1 - Math.abs(anchor - curr) / this.spreadDistance)), 0)
    };

    if (xNumbers.length) {
      groups = xNumbers.map(x => ({ x, y: mergeGroup(x, neighbors(xNumbers, x)) }));
    }

    return groups.concat(xValues.filter(v => isNaN(v)).map(v => ({ x: v, y: this.xy[v] })))
  }

  get xByMaxY () {
    var groups = this.groups.sort((a, b) => a.y > b.y ? -1 : 1);
    return groups.length ? groups[0] : { x: 0, y: 0 }
  }

  findMaxGroup (value) {
    if (isNaN(value)) {
      return this.xByMaxY
    }
    var numValue = parseFloat(value);
    var groups = this.groups.sort((a, b) => this.intersect(a.x, numValue) * a.y > this.intersect(b.x, numValue) * b.y ? -1 : 1);
    return groups.length ? groups[0] : { x: 0, y: 0 }
  }

  intersect (v1, v2) {
    return Math.min(v1, v2) / Math.max(v1, v2)
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
      this._minX = this._minX === undefined ? xValue : Math.min(this._minX, parseFloat(xValue));
      this._maxX = this._maxX === undefined ? xValue : Math.max(this._maxX, parseFloat(xValue));
    }
    this._minY = this._minY === undefined ? 1 : Math.min(this._minY, this.xy[xValue] || 0);
  }
}

class comparator {
  constructor (config) {
    this.config = config;
    this.properties = {};
  }

  train (value) {
    if (Array.isArray(value)) {
      value.forEach(v => this.trainSingle(v));
    } else {
      this.trainSingle(value);
    }
  }

  trainSingle (obj) {
    for (let key in obj) {
      var value = obj[key];
      var spread = (this.config && this.config[key] && this.config[key][0]) || 0;
      var propagation = (this.config && this.config[key] && this.config[key][1]) || null;
      this.properties[key] = this.properties[key] || new Cast(spread, propagation);

      if (value !== '' && value !== undefined) {
        this.properties[key].shape(value);
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
    var sum = 0;

    for (let key in obj) {
      sum += (this.properties[key] && this.properties[key].compare(obj[key])) || 0;
    }

    return this.totalOutput ? sum / this.totalOutput : 0
  }

  intersection (obj) {
    var sum = 0;
    var total = 0;

    for (let key in obj) {
      sum += (this.properties[key] && this.properties[key].intersection(obj[key])) || 0;
      total += (this.properties[key] && this.properties[key].findMaxGroup(obj[key]).y) || 0;
    }

    return total ? sum / total : 0
  }

  flatten (into, currentKey = '', target = {}) {
    for (let i in into) {
      if (into.hasOwnProperty(i)) {
        let newKey = i;
        let newVal = into[i];
        
        if (currentKey.length > 0) {
            newKey = currentKey + '_' + i;
        }
        
        if (typeof newVal === 'object') {
            this.dive(newKey, newVal, target);
        } else {
            target[newKey] = newVal;
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

export default comparator;
