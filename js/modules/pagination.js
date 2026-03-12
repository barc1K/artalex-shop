const itemsPerPage = 48;
let currentPage = 1;
let totalPages = 0;

// ==================== ПАГИНАЦИЯ ====================
function updatePagination() {
    const paginationContainer = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    if (currentPage > 1) {
        const prevUrl = buildPageUrl(currentPage - 1);
        paginationHTML += `<a href="${prevUrl}" class="page-link"><i class="fas fa-chevron-left"></i></a>`;
    } else {
        paginationHTML += `<span class="page-link disabled"><i class="fas fa-chevron-left"></i></span>`;
    }
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageUrl = buildPageUrl(i);
        paginationHTML += `
            <a href="${pageUrl}" class="page-link ${i === currentPage ? 'active' : ''}">
                ${i}
            </a>
        `;
    }
    
    if (currentPage < totalPages) {
        const nextUrl = buildPageUrl(currentPage + 1);
        paginationHTML += `<a href="${nextUrl}" class="page-link"><i class="fas fa-chevron-right"></i></a>`;
    } else {
        paginationHTML += `<span class="page-link disabled"><i class="fas fa-chevron-right"></i></span>`;
    }
    
    paginationContainer.innerHTML = paginationHTML;
}