// Biến toàn cục lưu trữ danh sách sản phẩm
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let columnSort = { field: null, order: null }; // Tracking cho sort tại cột

// Sắp xếp tại cột
function sortByColumn(field) {
    // Xác định thứ tự sắp xếp
    if (columnSort.field === field) {
        // Nếu đang sắp xếp theo field này, đổi chiều
        if (columnSort.order === 'asc') {
            columnSort.order = 'desc';
        } else {
            // Reset về mặc định
            columnSort.field = null;
            columnSort.order = null;
        }
    } else {
        // Sắp xếp mới theo field mới
        columnSort.field = field;
        columnSort.order = 'asc';
    }

    // Cập nhật icon cột
    updateColumnSortIcons();

    // Áp dụng sắp xếp
    applyColumnSort();
}

// Cập nhật icon sắp xếp cột
function updateColumnSortIcons() {
    // Reset tất cả icons
    document.querySelectorAll('.sortable').forEach(th => {
        th.classList.remove('active');
        const icon = th.querySelector('.sort-icon');
        if (icon) icon.textContent = '↕';
    });

    // Cập nhật icon cho cột đang sắp xếp
    if (columnSort.field) {
        const thElement = document.getElementById('sort' + columnSort.field.charAt(0).toUpperCase() + columnSort.field.slice(1));
        if (thElement) {
            thElement.classList.add('active');
            const icon = thElement.querySelector('.sort-icon');
            if (icon) {
                icon.textContent = columnSort.order === 'asc' ? '↑' : '↓';
            }
        }
    }
}

// Áp dứng sắp xếp cột
function applyColumnSort() {
    applyCurrentSearch();
    
    if (columnSort.field && columnSort.order) {
        filteredProducts.sort((a, b) => {
            let valueA, valueB;

            if (columnSort.field === 'title') {
                valueA = a.title.toLowerCase();
                valueB = b.title.toLowerCase();
                if (columnSort.order === 'asc') {
                    return valueA.localeCompare(valueB);
                } else {
                    return valueB.localeCompare(valueA);
                }
            } else if (columnSort.field === 'price') {
                valueA = parseFloat(a.price);
                valueB = parseFloat(b.price);
                if (columnSort.order === 'asc') {
                    return valueA - valueB;
                } else {
                    return valueB - valueA;
                }
            }
        });
    }
    
    currentPage = 1;
    displayProducts();
}

// Toggle popup sắp xếp
function toggleSortMenu() {
    const menu = document.getElementById('sortMenu');
    menu.classList.toggle('show');
}

// Đóng popup khi click bên ngoài
window.onclick = function(event) {
    if (!event.target.matches('.sort-button') && !event.target.closest('.sort-button')) {
        const menu = document.getElementById('sortMenu');
        if (menu.classList.contains('show')) {
            menu.classList.remove('show');
        }
    }
}

// Chọn tùy chọn sắp xếp
function selectSort(option) {
    currentSortOption = option;
    
    // Reset column sort
    columnSort.field = null;
    columnSort.order = null;
    updateColumnSortIcons();
    
    // Cập nhật text button
    const buttonText = document.getElementById('sortButtonText');
    const sortTexts = {
        'default': 'Mặc định',
        'title-asc': 'Tên: A → Z',
        'title-desc': 'Tên: Z → A',
        'price-asc': 'Giá: Thấp → Cao',
        'price-desc': 'Giá: Cao → Thấp'
    };
    buttonText.textContent = sortTexts[option];
    
    // Cập nhật icon active
    document.querySelectorAll('.sort-option-icon').forEach(icon => {
        icon.textContent = '';
    });
    const activeIcon = document.getElementById('icon-' + option);
    if (activeIcon) {
        activeIcon.textContent = '✓';
    }
    
    // Cập nhật class active cho option
    document.querySelectorAll('.sort-option').forEach(opt => {
        opt.classList.remove('active');
    });
    event.target.closest('.sort-option').classList.add('active');
    
    // Đóng menu
    document.getElementById('sortMenu').classList.remove('show');
    
    // Áp dụng sắp xếp
    applySorting();
}

// Lấy dữ liệu từ API
async function fetchProducts() {
    try {
        const response = await fetch('https://api.escuelajs.co/api/v1/products');
        
        if (!response.ok) {
            throw new Error('Không thể tải dữ liệu');
        }

        const products = await response.json();
        allProducts = products;
        filteredProducts = products;
        displayProducts();
        
        // Gắn event tìm kiếm
        document.getElementById('searchInput').addEventListener('input', handleSearch);
        
        // Gắn event cho items per page
        document.getElementById('itemsPerPage').addEventListener('change', handleItemsPerPageChange);
    } catch (error) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        document.getElementById('error').textContent = 'Lỗi: ' + error.message;
    }
}

// Hiển thị sản phẩm trong bảng
function displayProducts() {
    const tbody = document.getElementById('productBody');
    tbody.innerHTML = '';

    // Tính toán phân trang
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    paginatedProducts.forEach(product => {
        const row = document.createElement('tr');
        
        // Lấy hình ảnh trực tiếp từ API
        let imageUrl = '';
        
        if (product.images && product.images.length > 0) {
            let rawImage = product.images[0];
            if (typeof rawImage === 'string') {
                // Loại bỏ ký tự đặc biệt
                imageUrl = rawImage.replace(/[\[\]"']/g, '').trim();
            }
        }

        row.innerHTML = `
            <td>${product.id}</td>
            <td><img src="${imageUrl}" alt="${product.title}" class="product-image" 
                 crossorigin="anonymous" referrerpolicy="no-referrer"
                 onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=&quot;width:100px;height:100px;background:#ddd;display:flex;align-items:center;justify-content:center;border-radius:4px;font-size:10px;color:#666;text-align:center;&quot;>No Image</div>'"></td>
            <td class="product-name"><strong>${product.title}</strong></td>
            <td class="price">$${product.price}</td>
            <td><span class="category">${product.category ? product.category.name : 'N/A'}</span></td>
        `;
        
        // Thêm event hover để hiển thị mô tả
        row.addEventListener('mouseenter', function(e) {
            showDescriptionTooltip(e, product.description);
        });
        
        row.addEventListener('mouseleave', function() {
            hideDescriptionTooltip();
        });
        
        row.addEventListener('mousemove', function(e) {
            updateTooltipPosition(e);
        });

        tbody.appendChild(row);
    });

    document.getElementById('loading').style.display = 'none';
    document.getElementById('productTable').style.display = 'table';
    document.getElementById('paginationContainer').style.display = 'flex';
    
    renderPagination();
}

// Render phân trang
function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginationContainer = document.getElementById('paginationContainer');
    
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, filteredProducts.length);
    
    let paginationHTML = `
        <div class="pagination-info">
            Hiển thị ${startItem}-${endItem} của ${filteredProducts.length} sản phẩm
        </div>
        <div class="pagination-controls">
            <button class="pagination-button" onclick="goToPage(1)" ${currentPage === 1 ? 'disabled' : ''}>
                ❮❮ Đầu
            </button>
            <button class="pagination-button" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                ❮ Trước
            </button>
    `;
    
    // Hiển thị số trang
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="page-number ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">
                ${i}
            </button>
        `;
    }
    
    paginationHTML += `
            <button class="pagination-button" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                Sau ❯
            </button>
            <button class="pagination-button" onclick="goToPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
                Cuối ❯❯
            </button>
        </div>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

// Chuyển trang
function goToPage(page) {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        displayProducts();
    }
}

// Thay đổi số items per page
function handleItemsPerPageChange(event) {
    itemsPerPage = parseInt(event.target.value);
    currentPage = 1;
    displayProducts();
}

// Áp dụng sắp xếp
function applySorting() {
    applyCurrentSearch();
    
    if (currentSortOption === 'default') {
        // Không làm gì, giữ thứ tự mặc định
    } else if (currentSortOption === 'title-asc') {
        filteredProducts.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
    } else if (currentSortOption === 'title-desc') {
        filteredProducts.sort((a, b) => b.title.toLowerCase().localeCompare(a.title.toLowerCase()));
    } else if (currentSortOption === 'price-asc') {
        filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (currentSortOption === 'price-desc') {
        filteredProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    }
    
    currentPage = 1;
    displayProducts();
}

// Áp dụng tìm kiếm hiện tại (helper function)
function applyCurrentSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    if (searchTerm === '') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.title.toLowerCase().includes(searchTerm)
        );
    }
}

// Xử lý tìm kiếm
function handleSearch(event) {
    // Nếu đang dùng column sort, giữ nguyên
    if (columnSort.field) {
        applyColumnSort();
    } else {
        applySorting();
    }
}

// Hiển thị tooltip mô tả
let tooltipElement = null;

function showDescriptionTooltip(event, description) {
    // Tạo tooltip nếu chưa có
    if (!tooltipElement) {
        tooltipElement = document.createElement('div');
        tooltipElement.className = 'description-tooltip';
        document.body.appendChild(tooltipElement);
    }
    
    tooltipElement.textContent = description || 'Không có mô tả';
    updateTooltipPosition(event);
    
    // Hiển thị tooltip
    setTimeout(() => {
        tooltipElement.classList.add('show');
    }, 100);
}

function hideDescriptionTooltip() {
    if (tooltipElement) {
        tooltipElement.classList.remove('show');
    }
}

function updateTooltipPosition(event) {
    if (tooltipElement) {
        const offsetX = 15;
        const offsetY = 15;
        
        let left = event.pageX + offsetX;
        let top = event.pageY + offsetY;
        
        // Kiểm tra nếu tooltip vượt quá màn hình
        const tooltipRect = tooltipElement.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        if (left + tooltipRect.width > windowWidth) {
            left = event.pageX - tooltipRect.width - offsetX;
        }
        
        if (top + tooltipRect.height > windowHeight + window.scrollY) {
            top = event.pageY - tooltipRect.height - offsetY;
        }
        
        tooltipElement.style.left = left + 'px';
        tooltipElement.style.top = top + 'px';
    }
}

// Gọi hàm khi trang được load
fetchProducts();
