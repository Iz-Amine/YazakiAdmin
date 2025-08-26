// Global variables
let appData = { users: [], connectors: [] };
let currentPage = 'dashboard';
let currentUsersPage = 1;
let currentConnectorsPage = 1;
const itemsPerPage = 10;

// Filtered data
let filteredUsers = [];
let filteredConnectors = [];

// DOM elements
const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.querySelector('.sidebar-toggle');
const menuItems = document.querySelectorAll('.menu-item');
const pages = document.querySelectorAll('.page');
const pageTitle = document.getElementById('page-title');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
    showPage('dashboard');
});

// Load data from JSON file
async function loadData() {
    try {
        const response = await fetch('data.json');
        appData = await response.json();
        filteredUsers = [...appData.users];
        filteredConnectors = [...appData.connectors];
        
        updateDashboardStats();
        renderUsersTable();
        renderConnectorsTable();
        populateSupplierFilter();
    } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to empty arrays if data loading fails
        appData = { users: [], connectors: [] };
        filteredUsers = [];
        filteredConnectors = [];
    }
}

// Setup event listeners
function setupEventListeners() {
    // Sidebar toggle for mobile
    sidebarToggle?.addEventListener('click', function() {
        sidebar.classList.toggle('open');
    });

    // Menu navigation
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            showPage(page);
        });
    });

    // Users search and filter
    const usersSearch = document.getElementById('users-search');
    const usersRoleFilter = document.getElementById('users-role-filter');
    
    usersSearch?.addEventListener('input', function() {
        filterUsers();
    });
    
    usersRoleFilter?.addEventListener('change', function() {
        filterUsers();
    });

    // Connectors search and filter
    const connectorsSearch = document.getElementById('connectors-search');
    const connectorsSupplierFilter = document.getElementById('connectors-supplier-filter');
    
    connectorsSearch?.addEventListener('input', function() {
        filterConnectors();
    });
    
    connectorsSupplierFilter?.addEventListener('change', function() {
        filterConnectors();
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !sidebarToggle.contains(e.target) &&
            sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });
}

// Show specific page
function showPage(pageName) {
    // Update active menu item
    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === pageName) {
            item.classList.add('active');
        }
    });

    // Update active page
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'users': 'Users Management',
        'connectors': 'Connectors Management'
    };
    pageTitle.textContent = titles[pageName] || 'Dashboard';

    currentPage = pageName;

    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }
}

// Update dashboard statistics
function updateDashboardStats() {
    const totalUsersElement = document.getElementById('total-users');
    const totalConnectorsElement = document.getElementById('total-connectors');
    
    if (totalUsersElement) {
        totalUsersElement.textContent = appData.users.length;
    }
    
    if (totalConnectorsElement) {
        totalConnectorsElement.textContent = appData.connectors.length;
    }
}

// Filter users based on search and role
function filterUsers() {
    const searchTerm = document.getElementById('users-search')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('users-role-filter')?.value || '';

    filteredUsers = appData.users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm) || 
                             user.email.toLowerCase().includes(searchTerm);
        const matchesRole = !roleFilter || user.role === roleFilter;
        
        return matchesSearch && matchesRole;
    });

    currentUsersPage = 1;
    renderUsersTable();
}

// Filter connectors based on search and supplier
function filterConnectors() {
    const searchTerm = document.getElementById('connectors-search')?.value.toLowerCase() || '';
    const supplierFilter = document.getElementById('connectors-supplier-filter')?.value || '';

    filteredConnectors = appData.connectors.filter(connector => {
        const matchesSearch = connector.yazakiPN.toLowerCase().includes(searchTerm) ||
                             connector.customerPN.toLowerCase().includes(searchTerm) ||
                             connector.supplierPN.toLowerCase().includes(searchTerm);
        const matchesSupplier = !supplierFilter || connector.supplierName === supplierFilter;
        
        return matchesSearch && matchesSupplier;
    });

    currentConnectorsPage = 1;
    renderConnectorsTable();
}

// Render users table
function renderUsersTable() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    const startIndex = (currentUsersPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageUsers = filteredUsers.slice(startIndex, endIndex);

    tbody.innerHTML = '';

    pageUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="badge ${user.role}">${user.role}</span></td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editUser(${user.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete" onclick="deleteUser(${user.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    renderUsersPagination();
}

// Render connectors table
function renderConnectorsTable() {
    const tbody = document.getElementById('connectors-table-body');
    if (!tbody) return;

    const startIndex = (currentConnectorsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageConnectors = filteredConnectors.slice(startIndex, endIndex);

    tbody.innerHTML = '';

    pageConnectors.forEach(connector => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${connector.yazakiPN}</td>
            <td>${connector.customerPN}</td>
            <td>${connector.supplierPN}</td>
            <td>${connector.supplierName}</td>
            <td>$${connector.price.toFixed(2)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editConnector('${connector.yazakiPN}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete" onclick="deleteConnector('${connector.yazakiPN}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    renderConnectorsPagination();
}

// Render users pagination
function renderUsersPagination() {
    const pagination = document.getElementById('users-pagination');
    if (!pagination) return;

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    
    pagination.innerHTML = '';

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentUsersPage === 1;
    prevBtn.onclick = () => {
        if (currentUsersPage > 1) {
            currentUsersPage--;
            renderUsersTable();
        }
    };
    pagination.appendChild(prevBtn);

    // Page numbers
    const startPage = Math.max(1, currentUsersPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = i === currentUsersPage ? 'active' : '';
        pageBtn.onclick = () => {
            currentUsersPage = i;
            renderUsersTable();
        };
        pagination.appendChild(pageBtn);
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentUsersPage === totalPages;
    nextBtn.onclick = () => {
        if (currentUsersPage < totalPages) {
            currentUsersPage++;
            renderUsersTable();
        }
    };
    pagination.appendChild(nextBtn);

    // Page info
    const pageInfo = document.createElement('span');
    pageInfo.className = 'pagination-info';
    pageInfo.textContent = `Page ${currentUsersPage} of ${totalPages} (${filteredUsers.length} users)`;
    pagination.appendChild(pageInfo);
}

// Render connectors pagination
function renderConnectorsPagination() {
    const pagination = document.getElementById('connectors-pagination');
    if (!pagination) return;

    const totalPages = Math.ceil(filteredConnectors.length / itemsPerPage);
    
    pagination.innerHTML = '';

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentConnectorsPage === 1;
    prevBtn.onclick = () => {
        if (currentConnectorsPage > 1) {
            currentConnectorsPage--;
            renderConnectorsTable();
        }
    };
    pagination.appendChild(prevBtn);

    // Page numbers
    const startPage = Math.max(1, currentConnectorsPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = i === currentConnectorsPage ? 'active' : '';
        pageBtn.onclick = () => {
            currentConnectorsPage = i;
            renderConnectorsTable();
        };
        pagination.appendChild(pageBtn);
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentConnectorsPage === totalPages;
    nextBtn.onclick = () => {
        if (currentConnectorsPage < totalPages) {
            currentConnectorsPage++;
            renderConnectorsTable();
        }
    };
    pagination.appendChild(nextBtn);

    // Page info
    const pageInfo = document.createElement('span');
    pageInfo.className = 'pagination-info';
    pageInfo.textContent = `Page ${currentConnectorsPage} of ${totalPages} (${filteredConnectors.length} connectors)`;
    pagination.appendChild(pageInfo);
}

// Populate supplier filter dropdown
function populateSupplierFilter() {
    const supplierFilter = document.getElementById('connectors-supplier-filter');
    if (!supplierFilter) return;

    const suppliers = [...new Set(appData.connectors.map(c => c.supplierName))].sort();
    
    // Clear existing options except "All Suppliers"
    supplierFilter.innerHTML = '<option value="">All Suppliers</option>';
    
    suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier;
        option.textContent = supplier;
        supplierFilter.appendChild(option);
    });
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Action functions (placeholders for future implementation)
function editUser(userId) {
    alert(`Edit user functionality would be implemented here for user ID: ${userId}`);
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        // Remove user from data
        appData.users = appData.users.filter(user => user.id !== userId);
        filterUsers();
        updateDashboardStats();
        alert('User deleted successfully');
    }
}

function editConnector(yazakiPN) {
    alert(`Edit connector functionality would be implemented here for Yazaki PN: ${yazakiPN}`);
}

function deleteConnector(yazakiPN) {
    if (confirm('Are you sure you want to delete this connector?')) {
        // Remove connector from data
        appData.connectors = appData.connectors.filter(connector => connector.yazakiPN !== yazakiPN);
        filterConnectors();
        updateDashboardStats();
        alert('Connector deleted successfully');
    }
}

// Handle window resize for responsive behavior
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        sidebar.classList.remove('open');
    }
});
