// Bus images array - using placeholder endpoint on our server
const busImages = [
    "/api/placeholder/500/300",
    "/api/placeholder/500/300",
    "/api/placeholder/500/300",
    "/api/placeholder/500/300",
    "/api/placeholder/500/300"
];

// Initialize bus data storage
let buses = [];

// Load buses from server on page load
async function loadBuses() {
    try {
        const response = await fetch('/api/buses');
        if (!response.ok) {
            throw new Error('Failed to load buses');
        }
        buses = await response.json();
        updateBusLists();
        
        // If we're on the available buses panel, update it
        if (!document.getElementById('available-panel').classList.contains('hidden')) {
            showAvailableBuses();
        }
    } catch (error) {
        showAlert('Failed to load buses: ' + error.message, 'danger');
    }
}

// Functions to show/hide panels
function showPanel(panelId) {
    // Hide all panels
    document.querySelectorAll('.panel').forEach(panel => {
        panel.classList.add('hidden');
    });
    
    // Show selected panel
    document.getElementById(panelId).classList.remove('hidden');
    
    // Load buses and update
    loadBuses();
    
    // Show available buses if that panel is selected
    if (panelId === 'available-panel') {
        showAvailableBuses();
    }
}

// Show alert message
function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alertContainer.appendChild(alert);
    
    // Remove alert after 3 seconds
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// Get random bus image
function getRandomBusImage() {
    const randomIndex = Math.floor(Math.random() * busImages.length);
    return busImages[randomIndex];
}

// Function to update bus select dropdown
function updateBusLists() {
    const busSelect = document.getElementById('bus-select');
    const showBusSelect = document.getElementById('show-bus-select');
    
    // Clear existing options except the first one
    while (busSelect.options.length > 1) {
        busSelect.remove(1);
    }
    
    while (showBusSelect.options.length > 1) {
        showBusSelect.remove(1);
    }
    
    // Add bus options
    buses.forEach(bus => {
        const option1 = document.createElement('option');
        option1.value = bus.busn;
        option1.textContent = `${bus.busn} - ${bus.from} to ${bus.to} (${bus.depart})`;
        busSelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = bus.busn;
        option2.textContent = `${bus.busn} - ${bus.from} to ${bus.to} (${bus.depart})`;
        showBusSelect.appendChild(option2);
    });
}

// Show available buses
function showAvailableBuses() {
    const availableBusesContainer = document.getElementById('available-buses');
    availableBusesContainer.innerHTML = '';
    
    if (buses.length === 0) {
        availableBusesContainer.innerHTML = '<p>No buses available.</p>';
        return;
    }
    
    buses.forEach(bus => {
        // Count empty seats
        let emptySeats = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 4; j++) {
                if (bus.seats[i][j] === 'Empty') {
                    emptySeats++;
                }
            }
        }
        
        const busCard = document.createElement('div');
        busCard.className = 'bus-card';
        
        busCard.innerHTML = `
            <div class="bus-image">
                <img src="${bus.image}" alt="${bus.busType} Bus">
            </div>
            <div class="bus-details">
                <h3>${bus.busn} - ${bus.busType}</h3>
                <p><strong>Route:</strong> ${bus.from} to ${bus.to}</p>
                <p><strong>Departure:</strong> ${bus.depart} | <strong>Arrival:</strong> ${bus.arrival}</p>
                <p><strong>Available Seats:</strong> ${emptySeats} out of 32</p>
                <p><strong>Ticket Price:</strong> ₹${bus.ticketPrice || 'Not specified'}</p>
                <p><strong>Driver:</strong> ${bus.driver} (${bus.driverPhone})</p>
            </div>
        `;
        
        availableBusesContainer.appendChild(busCard);
    });
}

// Generate seat layout
function generateSeatLayout(busIndex) {
    const seatLayout = document.getElementById('seat-layout');
    seatLayout.innerHTML = '';
    
    const bus = buses[busIndex];
    let seatNumber = 1;
    
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 4; j++) {
            const seat = document.createElement('div');
            seat.className = bus.seats[i][j] === 'Empty' ? 'seat' : 'seat booked';
            seat.textContent = seatNumber;
            seat.dataset.row = i;
            seat.dataset.col = j;
            seat.dataset.number = seatNumber;
            
            if (bus.seats[i][j] !== 'Empty') {
                seat.title = `Booked by: ${bus.seats[i][j]}`;
            } else {
                seat.addEventListener('click', selectSeat);
            }
            
            seatLayout.appendChild(seat);
            seatNumber++;
        }
    }
    
    seatLayout.classList.remove('hidden');
}

// Select seat
function selectSeat(e) {
    // Remove selection from all seats
    document.querySelectorAll('.seat').forEach(seat => {
        if (!seat.classList.contains('booked')) {
            seat.classList.remove('selected');
        }
    });
    
    // Select this seat
    e.target.classList.add('selected');
    
    // Show passenger form
    document.getElementById('passenger-form').classList.remove('hidden');
    document.getElementById('selected-seat').value = e.target.dataset.number;
}

// Function to find bus by number
function findBusByNumber(busNumber) {
    return buses.findIndex(bus => bus.busn === busNumber);
}

// Show bus details
function showBusDetails(busIndex) {
    const busDetails = document.getElementById('bus-details');
    const bus = buses[busIndex];
    
    busDetails.innerHTML = `
        <div class="bus-image" style="height: 200px; margin-bottom: 15px;">
            <img src="${bus.image}" alt="${bus.busType} Bus" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
        </div>
        <h3>Bus Details</h3>
        <p><strong>Bus Number:</strong> ${bus.busn} | <strong>License:</strong> ${bus.license}</p>
        <p><strong>Type:</strong> ${bus.busType}</p>
        <p><strong>Driver:</strong> ${bus.driver} | <strong>Phone:</strong> ${bus.driverPhone}</p>
        <p><strong>Route:</strong> ${bus.from} to ${bus.to}</p>
        <p><strong>Departure:</strong> ${bus.depart} | <strong>Arrival:</strong> ${bus.arrival}</p>
        <p><strong>Ticket Price:</strong> ₹${bus.ticketPrice || 'Not specified'}</p>
        <p class="selected-seat-info" style="display: none;"><strong>Selected Seat:</strong> <span id="selected-seat-display"></span></p>
    `;
    
    busDetails.classList.remove('hidden');
}

// Show reservation details
function showReservationDetails(busIndex) {
    const reservationDetails = document.getElementById('reservation-details');
    const bus = buses[busIndex];
    
    let reservationsHtml = `
        <div class="bus-info">
            <div class="bus-image" style="height: 200px; margin-bottom: 15px;">
                <img src="${bus.image}" alt="${bus.busType} Bus" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
            </div>
            <h3>Bus Number: ${bus.busn} (${bus.busType})</h3>
            <p><strong>License:</strong> ${bus.license}</p>
            <p><strong>Driver:</strong> ${bus.driver} | <strong>Phone:</strong> ${bus.driverPhone}</p>
            <p><strong>Route:</strong> ${bus.from} to ${bus.to}</p>
            <p><strong>Departure:</strong> ${bus.depart} | <strong>Arrival:</strong> ${bus.arrival}</p>
            <p><strong>Ticket Price:</strong> ₹${bus.ticketPrice || 'Not specified'}</p>
        </div>
        <h3>Reserved Seats</h3>
    `;
    
    let hasReservations = false;
    let seatNumber = 1;
    
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 4; j++) {
            if (bus.seats[i][j] !== 'Empty') {
                hasReservations = true;
                reservationsHtml += `<p>Seat ${seatNumber}: ${bus.seats[i][j]}</p>`;
            }
            seatNumber++;
        }
    }
    
    if (!hasReservations) {
        reservationsHtml += '<p>No reservations found for this bus.</p>';
    }
    
    reservationDetails.innerHTML = reservationsHtml;
    reservationDetails.classList.remove('hidden');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize app by loading buses and showing install panel
    loadBuses();
    showPanel('install-panel');
    
    // Add Bus Form Submission
    document.getElementById('install-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const busn = document.getElementById('busn').value;
        const license = document.getElementById('license').value;
        const driver = document.getElementById('driver').value;
        const driverPhone = document.getElementById('driver-phone').value;
        const arrival = document.getElementById('arrival').value;
        const depart = document.getElementById('depart').value;
        const from = document.getElementById('from').value;
        const to = document.getElementById('to').value;
        const busType = document.getElementById('bus-type').value;
        
        // Create empty seats
        const seats = Array(8).fill().map(() => Array(4).fill('Empty'));
        
        const ticketPrice = document.getElementById('ticket-price').value;
        
        // Create new bus object
        const newBus = {
            busn,
            license,
            driver,
            driverPhone,
            arrival,
            depart,
            from,
            to,
            busType,
            ticketPrice,
            image: getRandomBusImage(),
            seats
        };
        
        try {
            // Send to server
            const response = await fetch('/api/buses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newBus)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to add bus');
            }
            
            // Reload buses from server
            await loadBuses();
            
            // Reset form
            document.getElementById('install-form').reset();
            
            // Show success message
            showAlert('Bus added successfully!', 'success');
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    });
    
    // Bus Select Change
    document.getElementById('bus-select').addEventListener('change', function(e) {
        const busNumber = e.target.value;
        
        if (!busNumber) {
            document.getElementById('bus-details').classList.add('hidden');
            document.getElementById('seat-layout').classList.add('hidden');
            document.getElementById('passenger-form').classList.add('hidden');
            return;
        }
        
        const busIndex = findBusByNumber(busNumber);
        if (busIndex !== -1) {
            showBusDetails(busIndex);
            generateSeatLayout(busIndex);
        }
    });
    
    // Show Bus Select Change
    document.getElementById('show-bus-select').addEventListener('change', function(e) {
        const busNumber = e.target.value;
        
        if (!busNumber) {
            document.getElementById('reservation-details').classList.add('hidden');
            return;
        }
        
        const busIndex = findBusByNumber(busNumber);
        if (busIndex !== -1) {
            showReservationDetails(busIndex);
        }
    });
    
    // Reservation Form Submission
    document.getElementById('reservation-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const busNumber = document.getElementById('bus-select').value;
        const seatNumber = parseInt(document.getElementById('selected-seat').value);
        const passengerName = document.getElementById('passenger-name').value;
        const passengerPhone = document.getElementById('passenger-phone').value;
        
        try {
            // Send reservation to server
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    busNumber,
                    seatNumber,
                    passengerName,
                    passengerPhone
                })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to book seat');
            }
            
            // Reload buses from server
            await loadBuses();
            
            // Reset form and layout
            document.getElementById('passenger-name').value = '';
            document.getElementById('passenger-phone').value = '';
            document.getElementById('selected-seat').value = '';
            document.getElementById('passenger-form').classList.add('hidden');
            
            const busIndex = findBusByNumber(busNumber);
            if (busIndex !== -1) {
                // Regenerate seat layout with new data
                generateSeatLayout(busIndex);
            }
            
            // Show success message
            showAlert('Seat booked successfully!', 'success');
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    });
});
