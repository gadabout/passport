var ko = require('knockout')
  , client = require('superagent')
  , UNKNOWN_BOAT = {id: null, capacity: 0, name: 'Unknown Boat'}
  , API_HOST = require('../config/app').API_HOST;

function BoatList() {

  this.boats = ko.observableArray();

  this.addBoat = function() {
    var name = prompt('Name:', 'Super Skiff')
      , capacityRaw = prompt('Capacity:', 4)
      , capacity = parseInt(capacityRaw)
      , params = {boat: {capacity: capacity, name: name}};

    if (!name || !capacityRaw) { return; }
    if (name === '' ) { alert('Invalid name specified.'); return; }
    if (isNaN(capacity) || capacity <= 0) { alert('Invalid capacity specified.'); return; }

    // POST /api/boats
    $.post(API_HOST + '/api/boats', params, function(boat) {
      this.boats.push(boat);
    }.bind(this));
  };

  this.loadBoats = function() {
    // GET /api/boats
    $.get(API_HOST + '/api/boats', function(boats) {
      this.boats(boats);
    }.bind(this));
  };

  this.loadBoats()
}

module.exports = BoatList;
