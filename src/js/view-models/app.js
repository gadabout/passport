var ko = require('knockout')
  , moment = require('moment')
  , Day = require('./day')
  , BoatList = require('./boat-list');

function App() {
  this.boatList = new BoatList();

  this.currentDay = ko.observable(moment().startOf('day').unix());

  this.currentDayMoment = ko.computed(function() {
    return moment(this.currentDay() * 1000)
  }.bind(this))

  this.currentDayFormatted = ko.computed(function() {
    return this.currentDayMoment().format('l');
  }.bind(this));

  this.day = ko.computed(function() {
    return new Day(this.currentDay(), this);
  }.bind(this));

  this.prevDay = function() {
    this.currentDay(this.currentDayMoment().subtract('d', 1).unix());
  };

  this.nextDay = function() {
    this.currentDay(this.currentDayMoment().add('d', 1).unix());
  };
}

module.exports = App;
