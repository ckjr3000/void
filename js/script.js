const interests = document.getElementsByClassName("interest-btn");

Array.from(interests).forEach(interest => {
    interest.addEventListener('click', () => {
        console.log('click')
        interest.classList.toggle('active');
    });
});

const decoyBtn = document.getElementById('decoy');
const voidBtn = document.getElementById('void');
const nextPageNav = document.getElementById('next-page');

decoyBtn.addEventListener('click', () => {
    voidBtn.classList.add('active');
    nextPageNav.classList.remove('hidden');
})

