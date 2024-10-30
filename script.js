const mobileMenu = document.getElementById('mobile-menu');
const mobileMenuContainer = document.querySelector('.mobile-menu');

mobileMenu.addEventListener('click', () => {
    mobileMenuContainer.style.display = mobileMenuContainer.style.display === 'block' ? 'none' : 'block';
});
