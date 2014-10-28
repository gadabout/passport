var ko = require('knockout')
  , moment = require('moment')
  , hash = require('../lib/djb2')
  , API_HOST = require('../config/app').API_HOST
  , HOUR_HEIGHT = 55
  , DAY_WIDTH = 398
  , COLORS = ['#F39C11', '#E84C3D', '#344860', '#2A80B9', '#27AE61', '#3598DB', '#8F44AD', '#16A086'];

function Timeslot(data, day) {
  this.id = data.id;

  this.startTime = ko.observable(parseInt(data.start_time)); // unix timestamp
  this.duration = ko.observable(data.duration);   // duration in minutes

  this.availability = ko.observable(data.availability)
  this.customerCount = ko.observable(data.customer_count)
  this.boatIds = ko.observableArray(data.boats)

  this.boatIdToAssign = ko.observable()

  this.color = ko.observable(COLORS[Math.abs(hash(this.id.toString())) % 8]);

  // for arranging properly
  this.column = ko.observable(1);
  this.columns = ko.observable(1);

  this.endTime = ko.computed(function() {
    return this.startTime() + this.duration() * 60;
  }.bind(this));

  this.top = ko.computed(function() {
    var hoursFromTop = (this.startTime() - day.startTime()) / 60 / 60
    return hoursFromTop * HOUR_HEIGHT + 2;
  }.bind(this));

  this.height = ko.computed(function() {
    return (this.duration() / 60 * HOUR_HEIGHT) - 4;
  }.bind(this));

  this.width = ko.computed(function() {
    return DAY_WIDTH / this.columns() - 4;
  }.bind(this));

  this.left = ko.computed(function() {
    return (this.column() - 1) * this.width() + 2 + ((this.column() - 1) * 4);
  }.bind(this));

  this.styles = ko.computed(function() {
    return  { top: this.top() + 'px'
            , height: this.height() + 'px'
            , width: this.width() + 'px'
            , left: this.left() + 'px'
            , backgroundColor: this.color()
            };
  }.bind(this));

  this.full = ko.computed(function() {
    return this.availability() <= 0;
  }.bind(this));

  this.boats = ko.computed(function() {
    return this.boatIds().map(function(id) {
      return day.app.boatList.boats().filter(function(boat) {
        return boat.id === id;
      })[0] || {name: 'Unknown Boat'};
    })
  }.bind(this));

  this.addBooking = function() {
    var howManyRaw = prompt('How many tickets would you like to book?', 1)
      , howMany = parseInt(howManyRaw)
      , params = {
          booking: {
            timeslot_id: this.id,
            size: howMany
          }
        };

    if (!howManyRaw) { return; }
    if (isNaN(howMany) || howMany < 0) { alert('Invalid ticket count specified.'); return; }

    // POST /api/bookings
    $.post(API_HOST + '/api/bookings', params, function() {
      day.loadTimeslots();
    });
  }

  this.assignBoat = function(boat) {
    return function() {
      var params = {
        assignment: {
          timeslot_id: this.id,
          boat_id: boat.id
        }
      };

      // POST /api/assignments
      $.post(API_HOST + '/api/assignments', params, function() {
        day.loadTimeslots();
      }.bind(this));
    }.bind(this);
  };
}

module.exports = Timeslot;
