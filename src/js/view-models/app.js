var ko = require('knockout')
  , moment = require('moment')
  , Day = require('./day')
  , BoatList = require('./boat-list')
  , API_HOST = require('../config/app').API_HOST
  , ONE_HOUR = 60 * 60;

function assert(name, value, test) {
  if (value !== test) {
    return 'expected ' + name + ' to be ' + test + ' but it was ' + value + '.';
  }
}

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
    window.location.hash = this.currentDayMoment().subtract('d', 1).format('YYYY-MM-DD');
  };

  this.nextDay = function() {
    window.location.hash = this.currentDayMoment().add('d', 1).format('YYYY-MM-DD');
  };

  this.loadDayFromHash = function() {
    var date = moment(window.location.hash.substr(1))
    this.currentDay((date.isValid() ? date : moment()).startOf('day').unix());
  }

  $(window).on('hashchange', function() {
    this.loadDayFromHash();
  }.bind(this));

  this.loadDayFromHash();

  this.testCase1 = function() {
    var timeslot1 = {start_time: (this.currentDay() + 8 * ONE_HOUR), duration: 120}
      , boat1 = {capacity: 8, name: 'Amazon Express'}
      , boat2 = {capacity: 4, name: 'Amazon Express Mini'}
      , date = this.currentDayMoment().format('YYYY-MM-DD')
      , boatList = this.boatList
      , day = this.day()
      , failures = 0
      , passes = 0
      , messages = [];

    // try to find existing boats to use
    boatList.boats().forEach(function(boat) {
      if (boat.name === boat1.name && boat.capacity === boat1.capacity) {
        boat1.id = boat.id;
      }
      if (boat.name === boat2.name && boat.capacity === boat2.capacity) {
        boat2.id = boat.id;
      }
    });

    $.post(API_HOST + '/api/timeslots', {timeslot: timeslot1})
      .then(function(res) {
        timeslot1.id = res.id;
        if (boat1.id) {
          return $.when(boat1);
        }
        else {
          return $.post(API_HOST + '/api/boats', {boat: boat1});
        }
      })
      .then(function(res) {
        boat1.id = res.id;
        if (boat2.id) {
          return $.when(boat2);
        }
        else {
          return $.post(API_HOST + '/api/boats', {boat: boat2});
        }
      })
      .then(function(res) {
        boat2.id = res.id;
        boatList.loadBoats();
        return $.when(
          $.post(API_HOST + '/api/assignments', {assignment: {timeslot_id: timeslot1.id, boat_id: boat1.id}}),
          $.post(API_HOST + '/api/assignments', {assignment: {timeslot_id: timeslot1.id, boat_id: boat2.id}})
        );
      })
      .then(function() {
        day.loadTimeslots();
        return $.get(API_HOST + '/api/timeslots?date=' + date);
      })
      .then(function(res) {
        var test1 = assert('availability', res[0].availability, 8);
        if (test1) { messages.push(test1); failures++; }
        else { passes++; }
        return $.post(API_HOST + '/api/bookings', {booking: {timeslot_id: timeslot1.id, size: 6}});
      })
      .then(function() {
        day.loadTimeslots();
        return $.get(API_HOST + '/api/timeslots?date=' + date);
      })
      .then(function(res) {
        var test2 = assert('customer_count', res[0].customer_count, 6)
          , test3 = assert('availability', res[0].availability, 4);
        if (test2) { messages.push(test2); failures++; }
        else { passes++; }
        if (test3) { messages.push(test3); failures++; }
        else { passes++; }

        alert('passes: ' + passes + ', failures: ' + failures + '\n' + messages.join('\n'));
      });
  }

  this.testCase2 = function() {
    var timeslot1 = {start_time: (this.currentDay() + 8 * ONE_HOUR), duration: 120}
      , timeslot2 = {start_time: (this.currentDay() + 9 * ONE_HOUR), duration: 120}
      , boat1 = {capacity: 8, name: 'Amazon Express'}
      , date = this.currentDayMoment().format('YYYY-MM-DD')
      , boatList = this.boatList
      , day = this.day()
      , failures = 0
      , passes = 0
      , messages = [];

    // try to find existing boats to use
    boatList.boats().forEach(function(boat) {
      if (boat.name === boat1.name && boat.capacity === boat1.capacity) {
        boat1.id = boat.id;
      }
    });

    $.post(API_HOST + '/api/timeslots', {timeslot: timeslot1})
      .then(function(res) {
        timeslot1.id = res.id;
        return $.post(API_HOST + '/api/timeslots', {timeslot: timeslot2})
      })
      .then(function(res) {
        timeslot2.id = res.id;
        if (boat1.id) {
          return $.when(boat1);
        }
        else {
          return $.post(API_HOST + '/api/boats', {boat: boat1});
        }
      })
      .then(function(res) {
        boat1.id = res.id;
        boatList.loadBoats();
        return $.when(
          $.post(API_HOST + '/api/assignments', {assignment: {timeslot_id: timeslot1.id, boat_id: boat1.id}}),
          $.post(API_HOST + '/api/assignments', {assignment: {timeslot_id: timeslot2.id, boat_id: boat1.id}})
        );
      })
      .then(function() {
        day.loadTimeslots();
        return $.get(API_HOST + '/api/timeslots?date=' + date);
      })
      .then(function(res) {
        var ts1 = res.filter(function(t) { return t.id === timeslot1.id })[0]
          , ts2 = res.filter(function(t) { return t.id === timeslot2.id })[0]
          , test1 = assert('timeslot1.availability', ts1.availability, 8)
          , test2 = assert('timeslot2.availability', ts2.availability, 8);
        if (test1) { messages.push(test1); failures++; }
        else { passes++; }
        if (test2) { messages.push(test2); failures++; }
        else { passes++; }
        return $.post(API_HOST + '/api/bookings', {booking: {timeslot_id: timeslot2.id, size: 2}});
      })
      .then(function() {
        day.loadTimeslots();
        return $.get(API_HOST + '/api/timeslots?date=' + date);
      })
      .then(function(res) {
        var ts1 = res.filter(function(t) { return t.id === timeslot1.id })[0]
          , ts2 = res.filter(function(t) { return t.id === timeslot2.id })[0]
          , test3 = assert('timeslot1.availability', ts1.availability, 0)
          , test4 = assert('timeslot2.availability', ts2.availability, 6);
        if (test3) { messages.push(test3); failures++; }
        else { passes++; }
        if (test4) { messages.push(test4); failures++; }
        else { passes++; }

        alert('passes: ' + passes + ', failures: ' + failures + '\n' + messages.join('\n'));
      });
  }
}

module.exports = App;
