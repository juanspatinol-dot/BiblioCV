window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.hero__navbar');
    
    if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});