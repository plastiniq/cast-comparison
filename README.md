# cast-comparison

Classification and comparison of Javascript objects.

## Installing

### Using Npm
1. Run `npm install cast-comparison`
2. Import it into your script `import Cast from 'cast-comparison'`

### Downloading File
1. Download "comparator.umd.js" from the [latest release](https://github.com/plastiniq/cast-comparison/releases/latest/download/comparator.umd.js) 
2. Add it into your html `<script src="comparator.umd.js"></script>`

## Usage Example
Let's create an optional config. We will clarify how to calculate an inaccurate match for properties in our objects. 

```javascript
  var config = {
    wheels: [0.2, Cast.BETWEEN],
    length: [0.2, Cast.UP],
    seats: [0.3, Cast.BETWEEN],
    maxSpeed: [0.2, Cast.DOWN]
  }
```

Take a look at the arrays that are assigned to the properties of our object:

`[0.2, Cast.BETWEEN]`

The first value is the spread of inaccuracy. 
Indicates at what maximum difference the parameters will be considered similar.
Possible values: from 0 to 1.

The second value is the propagations of inaccuracy.
Specifies the range in which the compared value will be considered similar.
Possible values: 

`'between'` - any value between the minimum and maximum in the group

`'up'` - any value that is greater than the minimum in the group

`'down'` - any value that is less than the maximum in the group

`null` - no propagation.

![Spread and Propagation](https://github.com/plastiniq/cast-comparison/blob/master/illustrations/spread-propagation.svg)


Now create a template based on some data we know

```javascript
  var trucksCast = new Cast(config)

  var knownTrucks = [
    { wheels: 6, length: 10, seats: 3, maxSpeed: 180 },
    { wheels: 6, length: 12, seats: 3, maxSpeed: 160 },
    { wheels: 4, length: 6, seats: 2, maxSpeed: 180 },
    { wheels: 4, length: 8, seats: 2, maxSpeed: 180 },
    { wheels: 8, length: 12, seats: 5, maxSpeed: 160 }
  ]

  trucksCast.shape(knownTrucks)
```

Test

```javascript
  var firstCar = { wheels: 6, length: 10, seats: 2, maxSpeed: 160 } // truck
  var secondCar = { wheels: 4, length: 4, seats: 4, maxSpeed: 200 } // passenger car

  console.log(`Chance that the firstCar is a truck: ${trucksCast.compare(firstCar) * 100}%`)
  console.log(`Chance that the secondCar is a truck: ${trucksCast.compare(secondCar) * 100}%`)
```