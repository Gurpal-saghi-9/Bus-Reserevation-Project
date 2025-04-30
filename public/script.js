// Bus images array - using placeholder endpoint on our server
const busImages = [
    "/api/placeholder/500/300",
    "/api/placeholder/500/300",
    "/api/placeholder/500/300",
    "/api/placeholder/500/300",
    "/api/placeholder/500/300"
];

// Initialize state
let buses = [];
let currentUser = null;

// Check if user is logged in
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/user');
        
        if (response.ok) {
            currentUser = await response.json();
            updateUIForLoggedInUser();
        } else {
            currentUser = null;
            updateUIForLoggedOutUser();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        currentUser = null;
        updateUIForLoggedOutUser();
    }
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    // Hide login button, show user menu
    document.querySelector('.login-btn').classList.add('hidden');
    document.getElementById('user-logged-in').classList.remove('hidden');
    
    // Set username display
    document.getElementById('username-display').textContent = currentUser.username;
    
    // Update profile panel with user info
    document.getElementById('profile-username').textContent = currentUser.username;
    document.getElementById('profile-role').textContent = `Role: ${currentUser.role || 'Passenger'}`;
    
    if (document.getElementById('profile-email')) {
        document.getElementById('profile-email').value = currentUser.email || '';
    }
    
    if (document.getElementById('profile-fullname')) {
        document.getElementById('profile-fullname').value = currentUser.fullName || '';
    }
    
    if (document.getElementById('profile-phone')) {
        document.getElementById('profile-phone').value = currentUser.phone || '';
    }
    
    // Show/hide role-specific elements
    const adminElements = document.querySelectorAll('.admin-only');
    const driverElements = document.querySelectorAll('.driver-only');
    
    // Check user role and display appropriate elements
    if (currentUser.role === 'admin') {
        adminElements.forEach(el => el.classList.remove('hidden'));
        driverElements.forEach(el => el.classList.add('hidden'));
    } else if (currentUser.role === 'driver') {
        driverElements.forEach(el => el.classList.remove('hidden'));
        adminElements.forEach(el => el.classList.add('hidden'));
    } else {
        adminElements.forEach(el => el.classList.add('hidden'));
        driverElements.forEach(el => el.classList.add('hidden'));
    }
    
    // Load user-specific data
    if (currentUser.role === 'driver') {
        loadDriverBuses();
    } else if (currentUser.role === 'admin') {
        loadAdminData();
    }
    
    // Load user bookings
    loadUserBookings();
}

// Update UI for logged out user
function updateUIForLoggedOutUser() {
    // Show login button, hide user menu
    document.querySelector('.login-btn').classList.remove('hidden');
    document.getElementById('user-logged-in').classList.add('hidden');
    
    // Hide role-specific elements
    document.querySelectorAll('.admin-only, .driver-only').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Redirect to auth panel if on a protected panel
    const protectedPanels = [
        'profile-panel', 
        'my-bookings-panel', 
        'admin-panel', 
        'driver-panel'
    ];
    
    // Check if current visible panel is a protected one
    let currentPanel;
    document.querySelectorAll('.panel').forEach(panel => {
        if (!panel.classList.contains('hidden')) {
            currentPanel = panel.id;
        }
    });
    
    if (protectedPanels.includes(currentPanel)) {
        showPanel('auth-panel');
    }
}

// User logout function
async function logoutUser() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            currentUser = null;
            updateUIForLoggedOutUser();
            showPanel('auth-panel');
            showAlert('Logged out successfully', 'success');
        } else {
            const result = await response.json();
            throw new Error(result.message || 'Logout failed');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Initialize app with splash screen
function initApp() {
    // Hide splash screen after animations complete
    setTimeout(() => {
        document.getElementById('splash-screen').style.display = 'none';
        
        // Check if user is logged in
        checkAuthStatus().then(() => {
            // If no user logged in, show auth panel
            if (!currentUser) {
                showPanel('auth-panel');
            } else {
                // Otherwise show available buses panel
                showPanel('available-panel');
            }
        });
    }, 2500); // Match the animation duration (2.5s)
}

// Load buses from server
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
    
    // Check for protected panels
    const protectedPanels = [
        'profile-panel', 
        'my-bookings-panel', 
        'admin-panel', 
        'driver-panel'
        // 'install-panel' removed to make it accessible to all visitors
    ];
    
    // If panel is protected and user not logged in, redirect to auth
    if (protectedPanels.includes(panelId) && !currentUser) {
        showAlert('Please login to access this feature', 'danger');
        document.getElementById(panelId).classList.add('hidden');
        document.getElementById('auth-panel').classList.remove('hidden');
        return;
    }
    
    // Role-specific panel checks
    if (panelId === 'admin-panel' && (!currentUser || currentUser.role !== 'admin')) {
        showAlert('Admin access required', 'danger');
        document.getElementById(panelId).classList.add('hidden');
        document.getElementById('available-panel').classList.remove('hidden');
        return;
    }
    
    if (panelId === 'driver-panel' && (!currentUser || currentUser.role !== 'driver')) {
        showAlert('Driver access required', 'danger');
        document.getElementById(panelId).classList.add('hidden');
        document.getElementById('available-panel').classList.remove('hidden');
        return;
    }
    
    // Allow all users to access the Add Bus panel
    // Removed the admin restriction for the install-panel
    
    // Load buses and update
    loadBuses();
    
    // Panel-specific actions
    if (panelId === 'available-panel') {
        showAvailableBuses();
    } else if (panelId === 'my-bookings-panel' && currentUser) {
        loadUserBookings();
    } else if (panelId === 'driver-panel' && currentUser && currentUser.role === 'driver') {
        loadDriverBuses();
    } else if (panelId === 'admin-panel' && currentUser && currentUser.role === 'admin') {
        loadAdminData();
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
                // Get passenger details from seat information
                // Format: "Name (Phone)"
                const passengerInfo = bus.seats[i][j];
                const passengerName = passengerInfo.split(' (')[0];
                let passengerPhone = '';
                
                if (passengerInfo.includes('(')) {
                    passengerPhone = passengerInfo.split('(')[1].replace(')', '');
                }
                
                reservationsHtml += `
                    <div class="passenger-info">
                        <p><strong>Seat ${seatNumber}:</strong> ${passengerName}</p>
                        <p><strong>Phone:</strong> ${passengerPhone}</p>
                    </div>
                `;
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

// Load user bookings
async function loadUserBookings() {
    if (!currentUser) return;
    
    try {
        const response = await fetch('/api/bookings/user');
        if (!response.ok) {
            throw new Error('Failed to load bookings');
        }
        
        const bookings = await response.json();
        const bookingsContainer = document.getElementById('user-bookings');
        
        // Clear previous bookings
        bookingsContainer.innerHTML = '';
        
        if (bookings.length === 0) {
            bookingsContainer.innerHTML = `
                <div class="no-bookings">
                    <i class="fas fa-ticket-alt fa-3x"></i>
                    <p>You don't have any bookings yet</p>
                    <button class="btn btn-primary" onclick="showPanel('reservation-panel')">Book a Seat</button>
                </div>
            `;
            return;
        }
        
        // Add each booking
        bookings.forEach(booking => {
            const bookingCard = document.createElement('div');
            bookingCard.className = 'booking-card';
            
            bookingCard.innerHTML = `
                <div class="booking-details">
                    <h4>${booking.bus.from} to ${booking.bus.to}</h4>
                    <p>Bus: ${booking.bus.busn} (${booking.bus.busType})</p>
                    <p>Seat: ${booking.seatNumber}</p>
                    <p>Date: ${new Date(booking.createdAt).toLocaleDateString()}</p>
                    <p>Departure: ${booking.bus.depart}</p>
                </div>
                <div>
                    <span class="booking-status ${booking.status.toLowerCase()}">${booking.status}</span>
                    ${booking.status === 'Confirmed' ? 
                        `<button class="btn btn-danger cancel-booking-btn" data-id="${booking.id}">Cancel</button>` : ''}
                </div>
            `;
            
            bookingsContainer.appendChild(bookingCard);
        });
        
        // Add event listeners to cancel buttons
        document.querySelectorAll('.cancel-booking-btn').forEach(btn => {
            btn.addEventListener('click', cancelBooking);
        });
        
    } catch (error) {
        showAlert('Failed to load bookings: ' + error.message, 'danger');
    }
}

// Function to cancel a booking
async function cancelBooking(e) {
    const bookingId = e.target.dataset.id;
    
    try {
        const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'Failed to cancel booking');
        }
        
        // Reload bookings
        loadUserBookings();
        showAlert('Booking cancelled successfully', 'success');
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Load driver's assigned buses
async function loadDriverBuses() {
    if (!currentUser || currentUser.role !== 'driver') return;
    
    try {
        const response = await fetch('/api/driver/buses');
        if (!response.ok) {
            throw new Error('Failed to load driver buses');
        }
        
        const driverBuses = await response.json();
        const driverBusesContainer = document.getElementById('driver-buses');
        const driverBusSelect = document.getElementById('driver-bus-select');
        const statusBusSelect = document.getElementById('status-bus-select');
        const routeBusSelect = document.getElementById('route-bus-select');
        
        // Clear previous buses
        driverBusesContainer.innerHTML = '';
        driverBusSelect.innerHTML = '<option value="">Select a bus</option>';
        statusBusSelect.innerHTML = '<option value="">Select a bus</option>';
        routeBusSelect.innerHTML = '<option value="">Select a bus</option>';
        
        if (driverBuses.length === 0) {
            driverBusesContainer.innerHTML = `
                <div class="no-buses">
                    <i class="fas fa-bus fa-3x"></i>
                    <p>No buses assigned to you yet</p>
                </div>
            `;
            return;
        }
        
        // Add each bus to the driver panel
        driverBuses.forEach(bus => {
            // Create bus card
            const busCard = document.createElement('div');
            busCard.className = 'bus-card';
            
            // Count filled seats
            let filledSeats = 0;
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 4; j++) {
                    if (bus.seats[i][j] !== 'Empty') {
                        filledSeats++;
                    }
                }
            }
            
            busCard.innerHTML = `
                <div class="bus-image">
                    <img src="${bus.image}" alt="${bus.busType} Bus">
                </div>
                <div class="bus-details">
                    <h3>${bus.busn} - ${bus.busType}</h3>
                    <p><strong>Route:</strong> ${bus.from} to ${bus.to}</p>
                    <p><strong>Departure:</strong> ${bus.depart}</p>
                    <p><strong>Passengers:</strong> ${filledSeats} / 32</p>
                    <p><strong>Status:</strong> <span class="bus-status">${bus.status || 'Scheduled'}</span></p>
                    <button class="btn btn-primary view-passengers-btn" data-busn="${bus.busn}">View Passengers</button>
                </div>
            `;
            
            driverBusesContainer.appendChild(busCard);
            
            // Add to select dropdowns
            const option1 = document.createElement('option');
            option1.value = bus.busn;
            option1.textContent = `${bus.busn} - ${bus.from} to ${bus.to}`;
            driverBusSelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = bus.busn;
            option2.textContent = `${bus.busn} - ${bus.from} to ${bus.to}`;
            statusBusSelect.appendChild(option2);
            
            const option3 = document.createElement('option');
            option3.value = bus.busn;
            option3.textContent = `${bus.busn} - ${bus.from} to ${bus.to}`;
            routeBusSelect.appendChild(option3);
        });
        
        // Add event listeners
        document.querySelectorAll('.view-passengers-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const busn = btn.dataset.busn;
                driverBusSelect.value = busn;
                loadPassengers(busn);
            });
        });
        
    } catch (error) {
        showAlert('Failed to load driver buses: ' + error.message, 'danger');
    }
}

// Show route details for selected bus
function showRouteDetails(busn) {
    const busIndex = findBusByNumber(busn);
    if (busIndex === -1) return;
    
    const bus = buses[busIndex];
    const routeDetails = document.getElementById('route-details');
    
    // Update route information
    document.getElementById('route-start').textContent = bus.from;
    document.getElementById('route-end').textContent = bus.to;
    
    // Calculate a random but realistic distance based on city names (for demo purposes)
    // In a real app, we would use a mapping API to get actual distances
    const cityHash = (bus.from.length * 10) + (bus.to.length * 5);
    const distance = 100 + (cityHash % 900); // Distance between 100-1000 km
    const time = (distance / 60).toFixed(1);  // Approx time at 60 km/h
    
    document.getElementById('route-distance').textContent = distance;
    document.getElementById('route-time').textContent = time;
    document.getElementById('route-departure').textContent = bus.depart;
    document.getElementById('route-arrival').textContent = bus.arrival;
    
    // Show the route details
    routeDetails.classList.remove('hidden');
}

// Load passengers for a specific bus
async function loadPassengers(busn) {
    try {
        const response = await fetch(`/api/driver/buses/${busn}/passengers`);
        if (!response.ok) {
            throw new Error('Failed to load passengers');
        }
        
        const passengers = await response.json();
        const passengerList = document.getElementById('passenger-list');
        
        // Clear previous passengers
        passengerList.innerHTML = '';
        
        if (passengers.length === 0) {
            passengerList.innerHTML = `
                <div class="no-passengers">
                    <i class="fas fa-users fa-3x"></i>
                    <p>No passengers for this bus yet</p>
                </div>
            `;
            return;
        }
        
        // Add each passenger
        passengers.forEach(passenger => {
            const passengerItem = document.createElement('div');
            passengerItem.className = 'passenger-item';
            
            passengerItem.innerHTML = `
                <div>
                    <strong>${passenger.name}</strong>
                    <p>Seat: ${passenger.seatNumber}</p>
                </div>
                <div>
                    <p>Phone: ${passenger.phone}</p>
                </div>
            `;
            
            passengerList.appendChild(passengerItem);
        });
        
    } catch (error) {
        showAlert('Failed to load passengers: ' + error.message, 'danger');
    }
}

// Load admin data
async function loadAdminData() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    try {
        // Load users for admin panel
        const usersResponse = await fetch('/api/admin/users');
        if (usersResponse.ok) {
            const users = await usersResponse.json();
            updateAdminUserTable(users);
        }
        
        // Load all buses for admin panel
        const busesResponse = await fetch('/api/admin/buses');
        if (busesResponse.ok) {
            const buses = await busesResponse.json();
            updateAdminBusTable(buses);
        }
        
        // Load all bookings for admin panel
        const bookingsResponse = await fetch('/api/admin/bookings');
        if (bookingsResponse.ok) {
            const bookings = await bookingsResponse.json();
            updateAdminBookingsTable(bookings);
        }
        
        // Load drivers for assignment dropdown
        const driversResponse = await fetch('/api/admin/drivers');
        if (driversResponse.ok) {
            const drivers = await driversResponse.json();
            updateDriverAssignmentDropdown(drivers);
        }
        
    } catch (error) {
        showAlert('Failed to load admin data: ' + error.message, 'danger');
    }
}

// Update admin users table
function updateAdminUserTable(users) {
    const usersTable = document.getElementById('users-table').querySelector('tbody');
    usersTable.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${user.role || 'passenger'}</td>
            <td>
                <button class="admin-action-btn edit" data-id="${user.id}" title="Edit User">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="admin-action-btn delete" data-id="${user.id}" title="Delete User">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        usersTable.appendChild(row);
    });
}

// Update admin buses table
function updateAdminBusTable(buses) {
    const busesTable = document.getElementById('buses-table').querySelector('tbody');
    busesTable.innerHTML = '';
    
    buses.forEach(bus => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${bus.id}</td>
            <td>${bus.busn}</td>
            <td>${bus.from}</td>
            <td>${bus.to}</td>
            <td>${bus.depart}</td>
            <td>${bus.driver}</td>
            <td>
                <button class="admin-action-btn edit" data-id="${bus.id}" title="Edit Bus">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="admin-action-btn delete" data-id="${bus.id}" title="Delete Bus">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        busesTable.appendChild(row);
    });
    
    // Update assign bus dropdown
    const assignBusSelect = document.getElementById('assign-bus');
    assignBusSelect.innerHTML = '<option value="">Select a bus</option>';
    
    buses.forEach(bus => {
        const option = document.createElement('option');
        option.value = bus.id;
        option.textContent = `${bus.busn} - ${bus.from} to ${bus.to}`;
        assignBusSelect.appendChild(option);
    });
}

// Update driver assignment dropdown
function updateDriverAssignmentDropdown(drivers) {
    const assignDriverSelect = document.getElementById('assign-driver');
    assignDriverSelect.innerHTML = '<option value="">Select a driver</option>';
    
    drivers.forEach(driver => {
        const option = document.createElement('option');
        option.value = driver.id;
        option.textContent = driver.username;
        assignDriverSelect.appendChild(option);
    });
}

// Update admin bookings table
function updateAdminBookingsTable(bookings) {
    const bookingsTable = document.getElementById('bookings-table').querySelector('tbody');
    bookingsTable.innerHTML = '';
    
    bookings.forEach(booking => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${booking.id}</td>
            <td>${booking.user.username}</td>
            <td>${booking.bus.busn}</td>
            <td>${booking.seatNumber}</td>
            <td>${booking.status}</td>
            <td>${booking.paymentStatus || 'Pending'}</td>
            <td>
                <button class="admin-action-btn edit" data-id="${booking.id}" title="Edit Booking">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="admin-action-btn delete" data-id="${booking.id}" title="Delete Booking">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        bookingsTable.appendChild(row);
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize app with splash screen
    initApp();
    
    // Auth tab switching
    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all tabs
            document.querySelectorAll('.auth-tab-btn').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Add active class to clicked tab
            btn.classList.add('active');
            
            // Hide all auth forms
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            
            // Show the form associated with this tab
            const formId = btn.dataset.tab;
            document.getElementById(formId).classList.add('active');
        });
    });
    
    // Admin tab switching
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all tabs
            document.querySelectorAll('.admin-tab-btn').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Add active class to clicked tab
            btn.classList.add('active');
            
            // Hide all admin panels
            document.querySelectorAll('.admin-tab-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            
            // Show the panel associated with this tab
            const panelId = btn.dataset.tab;
            document.getElementById(panelId).classList.add('active');
        });
    });
    
    // Login form submission
    document.getElementById('login-form-el').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Login failed');
            }
            
            const user = await response.json();
            currentUser = user;
            
            // Update UI
            updateUIForLoggedInUser();
            showPanel('available-panel');
            showAlert('Login successful', 'success');
            
            // Reset form
            document.getElementById('login-form-el').reset();
            
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    });
    
    // Signup form submission
    document.getElementById('signup-form-el').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('signup-username').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const fullName = document.getElementById('signup-fullname').value;
        const phone = document.getElementById('signup-phone').value;
        const role = document.getElementById('signup-role').value;
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    fullName,
                    phone,
                    role
                })
            });
            
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Registration failed');
            }
            
            const user = await response.json();
            currentUser = user;
            
            // Update UI
            updateUIForLoggedInUser();
            showPanel('available-panel');
            showAlert('Registration successful', 'success');
            
            // Reset form
            document.getElementById('signup-form-el').reset();
            
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    });
    
    // Profile form submission
    document.getElementById('profile-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!currentUser) {
            showAlert('You must be logged in to update your profile', 'danger');
            return;
        }
        
        const email = document.getElementById('profile-email').value;
        const fullName = document.getElementById('profile-fullname').value;
        const phone = document.getElementById('profile-phone').value;
        
        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    fullName,
                    phone
                })
            });
            
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to update profile');
            }
            
            const updatedUser = await response.json();
            currentUser = updatedUser;
            
            // Update UI with new user data
            updateUIForLoggedInUser();
            showAlert('Profile updated successfully', 'success');
            
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    });
    
    // Password change form submission
    document.getElementById('password-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!currentUser) {
            showAlert('You must be logged in to change your password', 'danger');
            return;
        }
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        
        try {
            const response = await fetch('/api/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });
            
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to change password');
            }
            
            // Reset form
            document.getElementById('password-form').reset();
            showAlert('Password changed successfully', 'success');
            
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    });
    
    // Driver bus status buttons
    document.getElementById('bus-departed-btn').addEventListener('click', async function() {
        updateBusStatus('departed');
    });
    
    document.getElementById('bus-arrived-btn').addEventListener('click', async function() {
        updateBusStatus('arrived');
    });
    
    document.getElementById('bus-cancelled-btn').addEventListener('click', async function() {
        updateBusStatus('cancelled');
    });
    
    // Driver bus select for passenger list
    document.getElementById('driver-bus-select').addEventListener('change', function(e) {
        const busn = e.target.value;
        if (busn) {
            loadPassengers(busn);
        }
    });
    
    // Route planning bus select
    document.getElementById('route-bus-select').addEventListener('change', function(e) {
        const busn = e.target.value;
        if (busn) {
            showRouteDetails(busn);
        } else {
            document.getElementById('route-details').classList.add('hidden');
        }
    });
    
    // Save route notes button
    document.getElementById('save-notes-btn').addEventListener('click', function() {
        const notes = document.getElementById('route-notes').value;
        const busn = document.getElementById('route-bus-select').value;
        
        if (busn && notes) {
            // In a real application, we would save this to the server
            // For now, just show a success message
            showAlert('Route notes saved successfully', 'success');
        } else {
            showAlert('Please select a bus and enter notes', 'danger');
        }
    });
    
    // Admin driver assignment
    document.getElementById('assign-btn').addEventListener('click', async function() {
        const busId = document.getElementById('assign-bus').value;
        const driverId = document.getElementById('assign-driver').value;
        
        if (!busId || !driverId) {
            showAlert('Please select both bus and driver', 'danger');
            return;
        }
        
        try {
            const response = await fetch('/api/admin/assign-driver', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    busId,
                    driverId
                })
            });
            
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to assign driver');
            }
            
            // Reload admin data
            loadAdminData();
            showAlert('Driver assigned successfully', 'success');
            
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    });
    
    // Add Bus Form Submission
    document.getElementById('install-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // All users can add buses now, removed admin check
        
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
    
    // Bus status update function
    async function updateBusStatus(status) {
        const busn = document.getElementById('status-bus-select').value;
        
        if (!busn) {
            showAlert('Please select a bus first', 'danger');
            return;
        }
        
        try {
            const response = await fetch(`/api/driver/buses/${busn}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || `Failed to mark bus as ${status}`);
            }
            
            // Reload driver buses
            loadDriverBuses();
            showAlert(`Bus marked as ${status} successfully`, 'success');
            
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    }
    
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
        
        // Check if user is logged in
        if (!currentUser) {
            showAlert('Please login to book a seat', 'danger');
            showPanel('auth-panel');
            return;
        }
        
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
                    passengerPhone,
                    userId: currentUser.id // Include the user ID
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
            
            // Update user bookings if on the my-bookings panel
            if (!document.getElementById('my-bookings-panel').classList.contains('hidden')) {
                loadUserBookings();
            }
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    });
});
