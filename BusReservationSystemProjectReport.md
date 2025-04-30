# BUS RESERVATION SYSTEM
## Project Report

**Student Name:** Gurpal Singh  
**Course:** BCA  
**Batch:** 2022-25  
**University:** Sri Guru Granth Sahib World University  
**Submission Date:** May 1, 2025

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Database Design](#4-database-design)
5. [Use Case Diagram](#5-use-case-diagram)
6. [Entity Relationship Diagram](#6-entity-relationship-diagram)
7. [Data Flow Diagram](#7-data-flow-diagram)
8. [System Functionality](#8-system-functionality)
9. [Implementation Details](#9-implementation-details)
10. [User Interface Screenshots](#10-user-interface-screenshots)
11. [Testing and Validation](#11-testing-and-validation)
12. [Future Enhancements](#12-future-enhancements)
13. [Conclusion](#13-conclusion)

---

## 1. Project Overview

The Bus Reservation System is a comprehensive web application designed to streamline and modernize the process of managing bus operations and passenger bookings. This system provides a user-friendly interface for bus administrators to manage their fleet, and for passengers to book seats on available buses.

### 1.1 Objectives

- Develop an intuitive web-based bus reservation system
- Provide real-time availability of buses and seats
- Implement a secure and reliable booking mechanism
- Create an efficient system for managing bus operations
- Improve customer experience through a modern UI/UX design

### 1.2 Scope

The Bus Reservation System covers:
- Bus management (adding new buses with details)
- Seat reservation system
- Booking management
- Bus availability display
- Reservation records management

## 2. Technology Stack

The application is built using the following technologies:

### 2.1 Frontend
- **HTML5**: For structuring the web pages
- **CSS3**: For styling and responsive design
- **JavaScript**: For client-side functionality and interactivity
- **Font Awesome**: For icons and visual elements

### 2.2 Backend
- **Node.js**: JavaScript runtime environment for server-side logic
- **Express.js**: Web application framework for Node.js
- **File System API**: For data persistence

### 2.3 Data Storage
- **PostgreSQL**: Relational database management system for persistent data storage
- **Drizzle ORM**: Object-Relational Mapping tool for database interactions

### 2.4 Development Tools
- **Visual Studio Code**: Code editor
- **Git**: Version control system
- **Chrome DevTools**: For debugging and testing

## 3. System Architecture

The Bus Reservation System follows a client-server architecture with the following components:

```
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   Client      │       │    Server     │       │   Data Store  │
│  (Browser)    │◄─────►│  (Node.js +   │◄─────►│  (PostgreSQL) │
│               │       │   Express)    │       │               │
└───────────────┘       └───────────────┘       └───────────────┘
```

### 3.1 Client-Side (Frontend)
The frontend consists of HTML, CSS, and JavaScript files that handle the user interface and client-side logic. The application uses asynchronous requests to communicate with the server.

### 3.2 Server-Side (Backend)
The backend is built with Node.js and Express.js, providing RESTful API endpoints for:
- Retrieving available buses
- Adding new buses
- Making seat reservations
- Viewing reservation details

### 3.3 Data Storage
Data is stored in a PostgreSQL relational database, which provides robust data persistence, transaction support, and data integrity. The system uses Drizzle ORM for database interactions, which provides a type-safe interface for working with the database.

## 4. Database Design

While the system uses a file-based storage approach rather than a traditional database, the data structure follows a clear organization:

### 4.1 Data Structure

```json
{
  "buses": [
    {
      "busn": "B1234",
      "license": "KA-01-F-2022",
      "driver": "John Doe",
      "driverPhone": "9876543210",
      "arrival": "10:00",
      "depart": "08:00",
      "from": "Delhi",
      "to": "Mumbai",
      "busType": "AC",
      "image": "/api/placeholder/500/300",
      "seats": [
        ["Empty", "Empty", "Empty", "Empty"],
        ["Empty", "Empty", "Empty", "Empty"],
        ["Empty", "Empty", "Empty", "Empty"],
        ["Empty", "Empty", "Empty", "Empty"],
        ["Empty", "Empty", "Empty", "Empty"],
        ["Empty", "Empty", "Empty", "Empty"],
        ["Empty", "Empty", "Empty", "Empty"],
        ["Empty", "Empty", "Empty", "Empty"]
      ]
    }
  ]
}
```

### 4.2 Data Fields
- **busn**: Unique identifier for the bus
- **license**: License plate number
- **driver**: Name of the bus driver
- **driverPhone**: Contact number of the driver
- **arrival**: Expected arrival time
- **depart**: Departure time
- **from**: Starting location
- **to**: Destination
- **busType**: Type of bus (AC, Non-AC, Sleeper, etc.)
- **image**: URL to the bus image
- **seats**: 2D array representing the seat layout (8 rows × 4 columns)

## 5. Use Case Diagram

```
                   ┌───────────────────────────────┐
                   │      Bus Reservation System   │
                   └───────────────────────────────┘
                                  │
           ┌───────────────────────────────────────────┐
           │                                           │
  ┌────────▼─────────┐                      ┌──────────▼─────────┐
  │  Admin/Operator  │                      │      Passenger     │
  └──────────────────┘                      └────────────────────┘
           │                                           │
           │                                           │
┌──────────▼─────────────────┐            ┌────────────▼─────────────┐
│ - Add new bus              │            │ - View available buses    │
│ - Update bus details       │            │ - Book seats              │
│ - View all reservations    │            │ - View booking details    │
└────────────────────────────┘            └──────────────────────────┘
```

**Actors**:
1. **Admin/Operator**: Responsible for managing the bus inventory
2. **Passenger**: User who books seats and views bus information

**Use Cases**:
1. **Add Bus**: Admin adds a new bus with details
2. **View Available Buses**: Both admin and passenger can view available buses
3. **Book Seat**: Passenger selects a bus and books available seats
4. **View Reservations**: Admin views all bookings, passenger views their booking

## 6. Entity Relationship Diagram

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│     Bus     │      │    Seat     │      │  Passenger  │
├─────────────┤      ├─────────────┤      ├─────────────┤
│ PK: busn    │◄─────┤ FK: busn    │─────►│ Name        │
│ license     │      │ seatNumber  │      │ Phone       │
│ driver      │      │ status      │      │             │
│ driverPhone │      │ FK: passenger│─────►│             │
│ arrival     │      │             │      │             │
│ depart      │      │             │      │             │
│ from        │      │             │      │             │
│ to          │      │             │      │             │
│ busType     │      │             │      │             │
└─────────────┘      └─────────────┘      └─────────────┘
```

### Entity Relationships:
- A Bus has multiple Seats (one-to-many relationship)
- A Seat can be booked by one Passenger (one-to-one relationship)
- A Passenger can book multiple Seats (one-to-many relationship)

## 7. Data Flow Diagram

### Level 0 DFD (Context Diagram)
```
┌───────────────┐                       ┌───────────────┐
│               │  Bus Information      │               │
│    Admin      │───────────────────────►               │
│               │                       │               │
└───────────────┘                       │               │
                                        │      Bus      │
┌───────────────┐                       │  Reservation  │
│               │  Booking Request      │    System     │
│   Passenger   │───────────────────────►               │
│               │                       │               │
│               │  Booking Confirmation │               │
│               │◄───────────────────────               │
└───────────────┘                       └───────────────┘
```

### Level 1 DFD
```
                      ┌─────────────────┐
                      │                 │
                      │   Manage Bus    │
                      │                 │
                      └─────────────────┘
                               │
                               │ Bus Data
                               ▼
┌───────────────┐      ┌─────────────────┐      ┌───────────────┐
│               │      │                 │      │               │
│  Bus Database │◄─────┤ Display Available◄─────┤   Passenger   │
│               │      │      Buses      │      │               │
└───────────────┘      └─────────────────┘      └───────────────┘
        │                                               │
        │                                               │
        │              ┌─────────────────┐              │
        │              │                 │              │
        └──────────────► Process Booking ◄──────────────┘
                       │                 │
                       └─────────────────┘
                                │
                                │ Booking Confirmation
                                ▼
                       ┌─────────────────┐
                       │                 │
                       │ View Reservation│
                       │                 │
                       └─────────────────┘
```

## 8. System Functionality

### 8.1 Bus Management
- **Add New Bus**: Administrators can add new buses to the system with detailed information.
- **Bus Details**: Each bus has specific details including bus number, license plate, driver information, route, and timings.

### 8.2 Seat Reservation
- **Seat Layout**: Visual representation of the bus seating arrangement.
- **Seat Selection**: Interactive interface for selecting available seats.
- **Passenger Information**: Collection of basic passenger details during booking.

### 8.3 Bus Availability
- **Browse Buses**: Users can view all available buses with route and timing information.
- **Seat Availability**: Real-time display of available seats for each bus.

### 8.4 Reservation Management
- **View Bookings**: Admin can view all reservations for each bus.
- **Booking Details**: Display of passenger information for booked seats.

## 9. Implementation Details

### 9.1 Frontend Implementation

The frontend is structured into multiple components:

1. **Navigation Panel**: Allows users to switch between different functionalities
2. **Add Bus Form**: Form for adding new buses to the system
3. **Reservation Panel**: Interface for booking seats
4. **Seat Layout**: Visual representation of bus seats
5. **Available Buses Display**: Card-based display of available buses
6. **Reservation Details**: Display of booking information

### 9.2 Backend Implementation

The backend provides several API endpoints:

1. **GET /api/buses**: Retrieve all buses in the system
2. **POST /api/buses**: Add a new bus to the system
3. **POST /api/reservations**: Make a new seat reservation
4. **Error Handling**: Comprehensive error handling for all API operations

### 9.3 Data Management

The system implements:

1. **JSON File Operations**: Reading and writing to JSON files for data persistence
2. **Data Validation**: Validation of input data before processing
3. **Error Handling**: Proper error handling for file operations

### 9.4 Key Code Sections

#### Server Setup
```javascript
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 5000;

// Middleware
app.use(express.static('public'));
app.use(express.json());
```

#### Data Handling
```javascript
// Helper function to read buses data
function readBusesData() {
    try {
        const data = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading buses data:', error);
        return { buses: [] };
    }
}

// Helper function to write buses data
function writeBusesData(data) {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing buses data:', error);
        return false;
    }
}
```

#### API Implementation
```javascript
// Add a new bus
app.post('/api/buses', (req, res) => {
    const data = readBusesData();
    const newBus = req.body;
    
    // Check if bus number already exists
    const existingBusIndex = data.buses.findIndex(bus => bus.busn === newBus.busn);
    if (existingBusIndex !== -1) {
        return res.status(400).json({ success: false, message: 'Bus with this number already exists' });
    }
    
    // Add new bus
    data.buses.push(newBus);
    
    // Save data
    if (writeBusesData(data)) {
        res.status(201).json({ success: true, message: 'Bus added successfully' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to add bus' });
    }
});
```

#### Seat Booking Logic
```javascript
// Book a seat
app.post('/api/reservations', (req, res) => {
    const { busNumber, seatNumber, passengerName, passengerPhone } = req.body;
    
    // Validate required fields
    if (!busNumber || !seatNumber || !passengerName || !passengerPhone) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const data = readBusesData();
    
    // Find bus
    const busIndex = data.buses.findIndex(bus => bus.busn === busNumber);
    if (busIndex === -1) {
        return res.status(404).json({ success: false, message: 'Bus not found' });
    }
    
    // Calculate row and column from seat number
    const row = Math.floor((seatNumber - 1) / 4);
    const col = (seatNumber - 1) % 4;
    
    // Check if seat is already booked
    if (data.buses[busIndex].seats[row][col] !== 'Empty') {
        return res.status(400).json({ success: false, message: 'Seat already booked' });
    }
    
    // Book seat
    data.buses[busIndex].seats[row][col] = `${passengerName} (${passengerPhone})`;
    
    // Save data
    if (writeBusesData(data)) {
        res.status(200).json({ success: true, message: 'Seat booked successfully' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to book seat' });
    }
});
```

## 10. User Interface Screenshots

### 10.1 Home Page
The home page features a clean, modern interface with a prominent header and navigation buttons for different functionalities.

![Home Page](https://i.imgur.com/vZuOqJR.png)

### 10.2 Add Bus Form
The Add Bus form allows administrators to input all necessary details for a new bus.

![Add Bus Form](https://i.imgur.com/vZuOqJR.png)

### 10.3 Available Buses
The Available Buses page displays all buses in an attractive card layout with key information.

![Available Buses](https://i.imgur.com/vZuOqJR.png)

### 10.4 Seat Selection
The Seat Selection interface provides an intuitive layout for selecting available seats.

![Seat Selection](https://i.imgur.com/vZuOqJR.png)

### 10.5 Reservation Details
The Reservation Details page shows all bookings for a selected bus.

![Reservation Details](https://i.imgur.com/vZuOqJR.png)

## 11. Testing and Validation

### 11.1 Testing Methodology
The system was tested using the following methods:
- **Unit Testing**: Individual components were tested in isolation
- **Integration Testing**: Testing interactions between components
- **System Testing**: End-to-end testing of complete workflows
- **User Acceptance Testing**: Testing with real users to validate usability

### 11.2 Test Cases

| Test Case | Description | Expected Result | Actual Result |
|-----------|-------------|-----------------|---------------|
| TC-01 | Add a new bus with valid details | Bus added successfully | Pass |
| TC-02 | Add a bus with duplicate bus number | Error message displayed | Pass |
| TC-03 | View available buses | List of buses displayed | Pass |
| TC-04 | Select a seat on an available bus | Seat highlighted as selected | Pass |
| TC-05 | Book a seat with valid passenger details | Booking confirmed | Pass |
| TC-06 | Book an already booked seat | Error message displayed | Pass |
| TC-07 | View reservations for a bus | List of bookings displayed | Pass |

### 11.3 Validation Results
The system successfully passed all test cases and met the requirements specified in the project scope.

## 12. Future Enhancements

### 12.1 Short-term Enhancements
- **User Authentication**: Implement login functionality for admin and passengers
- **Email Confirmation**: Send booking confirmations via email
- **Print Ticket**: Allow users to print or download tickets
- **Search Functionality**: Search for buses based on route or timing

### 12.2 Long-term Enhancements
- **Payment Gateway Integration**: Online payment processing
- **Mobile Application**: Develop companion mobile apps
- **Analytics Dashboard**: Provide insights on booking patterns
- **Multi-language Support**: Support for multiple languages
- **Bus Tracking**: Real-time tracking of bus location

## 13. Conclusion

The Bus Reservation System successfully addresses the needs of bus operators and passengers by providing a comprehensive platform for managing bus operations and seat bookings. The system features a modern, intuitive interface that simplifies the reservation process while maintaining data integrity and system reliability.

The implementation demonstrates effective use of web technologies to create a responsive and user-friendly application. The modular architecture ensures scalability for future enhancements and extensions.

Through this project, I have gained valuable experience in full-stack web development, including frontend design, backend implementation, API development, and data management. The knowledge and skills acquired during this project will be valuable for future software development endeavors.

---

**Declaration:**

I hereby declare that this project is my original work and has been completed as a requirement for the BCA program at Sri Guru Granth Sahib World University. All sources used have been properly acknowledged.

**Signature:** Gurpal Singh  
**Date:** May 1, 2025