// Обработка подменю брендов
document.addEventListener('DOMContentLoaded', function() {
    const brandButtons = document.querySelectorAll('.brand-button');
    
    brandButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const brand = this.getAttribute('data-brand');
            const dropdown = document.getElementById(`${brand}-dropdown`);
            
            // Закрыть все открытые подменю
            document.querySelectorAll('.brand-dropdown.active').forEach(active => {
                if (active !== dropdown) {
                    active.classList.remove('active');
                    active.previousElementSibling.classList.remove('active');
                }
            });
            
            // Переключить текущее подменю
            dropdown.classList.toggle('active');
            this.classList.toggle('active');
        });
    });
    
    // Закрытие подменю при клике вне его
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.brand-item')) {
            document.querySelectorAll('.brand-dropdown.active').forEach(dropdown => {
                dropdown.classList.remove('active');
                dropdown.previousElementSibling.classList.remove('active');
            });
        }
    });
    
    // Закрытие подменю при прокрутке
    window.addEventListener('scroll', function() {
        document.querySelectorAll('.brand-dropdown.active').forEach(dropdown => {
            dropdown.classList.remove('active');
            dropdown.previousElementSibling.classList.remove('active');
        });
    });
});