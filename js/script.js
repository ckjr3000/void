// interest button behaviour

const interests = document.getElementsByClassName("interest-btn");

Array.from(interests).forEach(interest => {
    interest.addEventListener('click', () => {
        interest.classList.toggle('active');
    });
});

const decoyBtn = document.getElementById('decoy');
const voidBtn = document.getElementById('void');

decoyBtn.addEventListener('click', () => {
    voidBtn.classList.add('active');
})