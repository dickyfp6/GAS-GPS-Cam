// ============ Butterfly Animation System ============
class ButterflyGenerator {
    constructor(containerSelector = '.butterfly-container') {
        this.container = document.querySelector(containerSelector);
        this.butterflyEmojis = ['🦋', '🦋'];
        this.activeButterflies = 0;
        this.maxButterflies = 8;
    }

    createButterfly() {
        if (this.activeButterflies >= this.maxButterflies) return;

        const butterfly = document.createElement('div');
        butterfly.className = 'butterfly';
        butterfly.textContent = this.butterflyEmojis[Math.floor(Math.random() * this.butterflyEmojis.length)];

        const startX = Math.random() * 100;
        const startY = Math.random() * -50;
        const duration = 15 + Math.random() * 10;

        butterfly.style.cssText = `
            left: ${startX}vw;
            top: ${startY}vh;
            animation: floatButter ${duration}s linear forwards;
            animation-delay: 0s;
            opacity: ${0.6 + Math.random() * 0.3};
        `;

        this.container.appendChild(butterfly);
        this.activeButterflies++;

        setTimeout(() => {
            butterfly.remove();
            this.activeButterflies--;
        }, duration * 1000);
    }

    startAnimation(interval = 3000) {
        this.animationInterval = setInterval(() => {
            this.createButterfly();
        }, interval);
    }

    stopAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
        }
    }
}

// ============ Initialize on DOM Ready ============
document.addEventListener('DOMContentLoaded', () => {
    // Initialize butterfly animation
    const butterflyGen = new ButterflyGenerator('.butterfly-container');
    butterflyGen.startAnimation(2500);

    // ============ Smooth Scroll Behavior ============
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // ============ Button Interactions ============
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Add ripple effect
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                transform: scale(0);
                animation: ripple-animation 0.6s ease-out;
            `;

            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });

    // ============ Table Row Hover Effects ============
    const tableRows = document.querySelectorAll('.data-table tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(4px)';
            this.style.transition = 'transform 0.3s ease';
        });

        row.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });

    // ============ Cards Animation on Scroll ============
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.card, .data-table').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // ============ Active Navigation Highlight ============
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav a');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;

            if (pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').slice(1) === current) {
                link.style.color = 'var(--primary-color)';
                link.style.fontWeight = '700';
            } else {
                link.style.color = 'var(--text-primary)';
                link.style.fontWeight = '500';
            }
        });
    });

    // ============ Card Click Handler ============
    const cameraCards = document.querySelectorAll('.camera-card');
    cameraCards.forEach(card => {
        card.addEventListener('click', function() {
            console.log('Camera card clicked');
            // Add your camera card click logic here
        });
    });

    console.log('✨ GPS Camera Dashboard initialized');
});

// ============ Keyboard Shortcuts ============
document.addEventListener('keydown', (e) => {
    // Press 'B' to toggle butterflies
    if (e.key.toLowerCase() === 'b') {
        const container = document.querySelector('.butterfly-container');
        if (container.style.display === 'none') {
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }
});

// ============ CSS Animation for Ripple Effect ============
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
