const likeBtns = document.getElementsByClassName('heart');
const likeAudio = new Audio("../assets/audio/like_sound.wav");

Array.from(likeBtns).forEach((btn) => {
    btn.addEventListener('click', () => {
        btn.innerHTML = "<p>💜</p>"
        likeAudio.play();
    })
})

const notifCounter = document.getElementById('notif-counter');
const notifAudio = new Audio("../assets/audio/notif_sound.wav");
let notifCount = 0;

setInterval(() => {
    notifCount++
    notifCounter.innerText = notifCount
    notifAudio.play();
}, 10000);