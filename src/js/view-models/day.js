var ko = require('knockout')
  , moment = require('moment')
  , Timeslot = require('./timeslot')
  , API_HOST = require('../config/app').API_HOST
  , DEFAULT_START_HOUR = 8
  , DEFAULT_END_HOUR = 20
  , ONE_HOUR = 60 * 60;

function range(start, stop){
  var arr = []
    , c = stop - start + 1;
  while (c--) {
   arr[c] = stop--
  }
  return arr;
}

function Day(date, app) {
  this.app = app;

  this.timeslots = ko.observableArray();

  this.startTime = ko.computed(function() {
    var earliestTimeslot = this.timeslots().sort(function(a, b) {
      return a.startTime() - b.startTime();
    })[0];
    return earliestTimeslot ? earliestTimeslot.startTime() - ONE_HOUR : date + (DEFAULT_START_HOUR * ONE_HOUR);
  }.bind(this));

  this.endTime = ko.computed(function() {
    var latestTimeslot = this.timeslots().sort(function(a, b) {
      return b.endTime() - a.endTime();
    })[0];
    return latestTimeslot ? latestTimeslot.endTime() : date + (DEFAULT_END_HOUR * ONE_HOUR);
  }.bind(this));

  this.hours = ko.computed(function() {
    var hours = []
      , startTime = this.startTime()
      , endTime = this.endTime();

    for(var i = startTime; i <= endTime; i += ONE_HOUR) {
      hours.push(moment(i*1000).format('ha'));
    }
    return hours;
  }.bind(this));

  // arrange timeslots nicely
  ko.computed(function() {
    var startTime = this.startTime() + ONE_HOUR / 2
      , endTime = this.endTime()
      , columns = 1
      , timeslots = this.timeslots();

    // pass 1: discover the number of columns needed
    for(var currentTime = startTime; currentTime < endTime; currentTime += ONE_HOUR) {
      (function() {
        var overlappingTimeslots = timeslots.filter(function(timeslot) {
          return timeslot.startTime() <= currentTime && timeslot.endTime() >= currentTime;
        });
        if (overlappingTimeslots.length > columns) {
          columns = overlappingTimeslots.length;
        }
      }).bind(this)();
    }

    // pass 2: place timeslots into columns
    timeslots.forEach(function(timeslot) {
      timeslot.column(null);
      timeslot.columns(columns);
    });

    for(var currentTime = startTime; currentTime < endTime; currentTime += ONE_HOUR) {
      (function() {
        var overlappingTimeslots = timeslots.filter(function(timeslot) {
              return timeslot.startTime() <= currentTime && timeslot.endTime() >= currentTime;
            }).sort(function(a, b) {
              return b.duration() - a.duration();
            })
          , takenColumns = overlappingTimeslots.map(function(ts) { return ts.column() })
                                               .filter(function(x) { return !!x })
          , availableColumns = range(1, columns).filter(function(x) { return takenColumns.indexOf(x) === -1 });

        overlappingTimeslots.forEach(function(timeslot, i) {
          if (timeslot.column() === null) {
            timeslot.column(availableColumns.shift());
          }
        })
      }).bind(this)();
    }
  }.bind(this));

  this.addTimeslot = function() {
    var timeRaw = prompt('What time should it start? Specify hour of the day from 0 to 23:', 8)
      , durationRaw = prompt('How long should it be? Specify in number of hours:', 2)
      , time = parseInt(timeRaw)
      , duration = parseInt(durationRaw)

    if (!timeRaw || !durationRaw) { return; }
    if (isNaN(time) || time < 0 || time > 23) { alert('Invalid time specified.'); return; }
    if (isNaN(duration) || duration > 24) { alert('Invalid duration specified.'); return; }

    params = {
      timeslot: {
        start_time: date + time * ONE_HOUR,
        duration: duration * 60
      }
    }

    // POST /api/timeslots
    $.post(API_HOST + '/api/timeslots', params, function(tsData) {
      this.timeslots.push(new Timeslot(tsData, this));
    }.bind(this));

  }.bind(this);

  this.loadTimeslots = function() {
    // GET /api/timeslots?date=YYYY-MM-DD
    $.get(API_HOST + '/api/timeslots?date=' + moment(date * 1000).format('YYYY-MM-DD'), function(timeslots) {
      this.timeslots(timeslots.map(function(tsData) {
        return new Timeslot(tsData, this)
      }.bind(this)));
    }.bind(this));
  };

  this.loadTimeslots();
}

module.exports = Day;
