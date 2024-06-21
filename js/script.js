// Add this to your JavaScript file or within a <script> tag in your HTML file
document.addEventListener("DOMContentLoaded", function() {
    const logo = document.querySelector(".logo");
    const typewriter = document.querySelector(".typewriter h1");
    const interests = document.querySelector("ul");
    const instruction = document.querySelector("p");

    // Initially hide the elements
    typewriter.style.display = 'none';
    instruction.style.display = 'none';
    interests.style.display = 'none';

    // Center the logo first
    setTimeout(() => {
        logo.classList.add("moved");
        typewriter.style.display = 'block';
    }, 1000);

    // Show the typewriter effect and then the interests
    typewriter.addEventListener('animationend', () => {
        console.log('yo')
        instruction.style.display = 'block';
        interests.style.display = 'block';
    });
});
