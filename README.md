Peek API Challenge: I'm on a Boat
==========

Peek works with activity operators who use all sorts of interesting modes of transportation.  For this problem, we're going to design a system for (fictional) Piranha View Tours, which takes its customers on a boat ride down the Amazon River.

Piranha View Tours keeps a number of different river boats, and does tours at various times in the day.  We want to create a system that answers a simple question: "What is my availability today?"

## Assumptions

* Piranha View's customers book their tour against timeslots, which have a start time and a duration.
* Piranha View owns a number of boats, each of which can hold a different number of customers.
* Zero or more boats can be assigned to any given timeslot at any time.
* In order for customers to book a timeslot, there must be that number of available spots on a boat assigned to that timeslot.
* A booking consists of a group of one or more customers doing a Piranha View tour during a particular timeslot.
* A booking group cannot be split across different boats.
* A boat can only be used for a single timeslot at any given time.

## Deliverables

Your task is to create a backend and API to support Piranha View's needs.  To get you started, this repository contains a very simple version of the calendar visualization we use in Peek Pro.  The calendar will function if you provide the proper API for it to talk to.

**To complete the challenge, create a public Github repository in the language of your choice with code that implements the API specification below.**

Things to note:
* The expected time for this project is 6-8 hours.  You should start with the basic requirements, and branch out from there.  Keep in mind this is just a demo and doesn't have to be a fully-featured piece of code!
* We give you a few basic use cases below, but we'll test against many others.
* The API below is just a suggestion, and will work out of the box with our visualization tool.  If you have a different vision of an API to solve this problem, feel free to modify our spec and let us know what changes you've made.  The only absolute requirement is that you can properly answer what availability exists at a given time.
* This is a much-simplified version of something we have implemented at Peek.  What complications can you foresee while doing this exercise?  Would your solution scale?
* A test suite that checks some interesting use cases is highly encouraged.

## Running the scheduling client

We have included in this repository a client you can run to visualize and test all the calls defined below.  The client is a node app that runs on port 3333 and functions purely in Javascript.  You shouldn't have to edit it at all if you run your API on port 3000.  Here's how to get it running:
  * git clone this repo to your local box
  * do npm install in the passport home directory
  * do npm start in the passport home directory
  * visit http://localhost:3333

## API specification

####POST /api/timeslots - create a timeslot
* Parameters:
  * timeslot[start_time]
    * Start time of the timeslot, expressed as a Unix timestamp
    * Example: 1406052000
  * timeslot[duration]
    * Length of the timeslots in minutes
    * Example: 120
* Output:
  * The created timeslot in JSON format, with the fields above, plus a unique ID, a customer count, an availability count, and a list of associated boat IDs
    * On a new timeslot, the availability and customer count will necessarily be 0, and the boats will be an empty list
  * Example: `{ id: abc123, start_time: 1406052000, duration: 120, availability: 0, customer_count: 0, boats: [] }`

####GET /api/timeslots - list timeslots
* Parameters:
  * date
    * Date in YYYY-MM-DD format for which to return timeslots
    * Example: 2014-07-22
* Output:
  * An array of timeslots in JSON format, in the same format as above
  * Example: `[{ id: abc123, start_time: 1406052000, duration: 120, availability: 4, customer_count: 4, boats: ['def456',...] }, ...]`
  * The customer count is the total number of customers booked for this timeslot.
  * The availability is the maximum booking size of any new booking on this timeslot. (See case 1 below)

####POST /api/boats - create a boat
* Parameters:
  * boat[capacity]
    * The number of passengers the boat can carry
    * Example: 8
  * boat[name]
    * The name of the boat
    * Example: "Amazon Express"
* Output:
  * The created boat in JSON format, with the fields above plus a unique ID
  * Example: `{ id: def456, capacity: 8, name: "Amazon Express" }`

####GET /api/boats - list boats
* Parameters:
  * none
* Output:
  * An array of boats in JSON format, in the same format as above
  * Example: `[{ id: def456, capacity: 8, name: "Amazon Express" }, ...]`

####POST /api/assignments - assign boat to timeslot
* Parameters:
  * assignment[timeslot_id]
    * A valid timeslot id
    * Example: abc123
  * assignment[boat_id]
    * A valid boat id
    * Example: def456
* Output:
  * none

####POST /api/bookings - create a booking
* Parameters:
  * booking[timeslot_id]
    * A valid timeslot id
    * Example: abc123
  * booking[size]
    * The size of the booking party
    * Example: 4
* Output:
  * none

##Test Cases
This repository contains a client with which you can construct and visualize test cases.  To get you started, here are a couple basic cases you'll want to handle:

####Case 1:
* POST /api/timeslots, params=`{ start_time: 1406052000, duration: 120 }`
* POST /api/boats, params=`{ capacity: 8, name: "Amazon Express" }`
* POST /api/boats, params=`{ capacity: 4, name: "Amazon Express Mini" }`
* POST /api/assignments, params=`{ timeslot_id: <timeslot-1-id>, boat_id: <boat-1-id> }`
* POST /api/assignments, params=`{ timeslot_id: <timeslot-1-id>, boat_id: <boat-2-id> }`
* GET /api/timeslots, params=`{ date: '2014-07-22' }`
    * correct response is:

        ```
        [
          {
            id:  <timeslot-1-id>,
            start_time: 1406052000,
            duration: 120,
            availability: 8,
            customer_count: 0,
            boats: [<boat-1-id>, <boat-2-id>]
          }
        ]
        ```

* POST /api/bookings, params=`{ timeslot_id: <timeslot-1-id>, size: 6 }`
* GET /api/timeslots, params=`{ date: "2014-07-22" }`
    * correct response is:

        ```
        [
          {
            id:  <timeslot-1-id>,
            start_time: 1406052000,
            duration: 120,
            availability: 4,
            customer_count: 6,
            boats: [<boat-1-id>, <boat-2-id>]
          }
        ]
        ```

* Explanation: The first party of six goes on the Amazon Express, leaving 2 slots on that boat and 4 on the other.  The max party you can now handle is four.

####Case 2:
* POST /api/timeslots, params=`{ start_time: 1406052000, duration: 120 }`
* POST /api/timeslots, params=`{ start_time: 1406055600, duration: 120 }`
* POST /api/boats, params=`{ capacity: 8, name: "Amazon Express" }`
* POST /api/assignments, params=`{ timeslot_id: <timeslot-1-id>, boat_id: <boat-1-id> }`
* POST /api/assignments, params=`{ timeslot_id: <timeslot-2-id>, boat_id: <boat-1-id> }`
* GET /api/timeslots, params=`{ date: '2014-07-22' }`
    * correct response is:

        ```
        [
          {
            id:  <timeslot-1-id>,
            start_time: 1406052000,
            duration: 120,
            availability: 8,
            customer_count: 0,
            boats: [<boat-1-id>]
          },
          {
            id:  <timeslot-2-id>,
            start_time: 1406055600,
            duration: 120,
            availability: 8,
            customer_count: 0,
            boats: [<boat-1-id>]
          }
        ]
        ```

* POST /api/bookings, params=`{ timeslot_id: <timeslot-2-id>, size: 2 }`
* GET /api/timeslots, params=`{ date: '2014-07-22' }`
  * correct response is:

      ```
      [
        {
          id:  <timeslot-1-id>,
          start_time: 1406052000,
          duration: 120,
          availability: 0,
          customer_count: 0,
          boats: [<boat-1-id>]
        },
        {
          id:  <timeslot-2-id>,
          start_time: 1406055600,
          duration: 120,
          availability: 6,
          customer_count: 2,
          boats: [<boat-1-id>]
        }
      ]
      ```

* Explanation: Once you book against the second timeslot, it is now using the boat.  It gets the boat's remaining capacity, leaving the other timeslot without a boat and unbookable.
