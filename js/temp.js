let ctx, gainNodeLeft, gainNodeRight;
let playBtns = document.getElementsByClassName('play-btn');
let buffers = [];
let splitters = [];
let gainNodesLeft = [];
let gainNodesRight = [];
let stereoPanners = [];
let mergers = [];
let filterNodes = [];
let isPlaying = [false, false, false, false];

// open the void
const openBtn = document.getElementById('open');
const startSection = document.getElementById('start');
const voidSection = document.getElementById('void');

openBtn.addEventListener('click', () => {
    startSection.classList.add('hidden');
    voidSection.classList.remove('hidden');
    ctx = new AudioContext();
    Array.from(playBtns).forEach((btn, i) => {
        initSoundSource(i);
        btn.addEventListener('click', () => {
            if(!isPlaying[i]){
                gainNodesLeft[i].gain.linearRampToValueAtTime(1, ctx.currentTime + 0.05);
                gainNodesRight[i].gain.linearRampToValueAtTime(1, ctx.currentTime + 0.05);
                isPlaying[i] = true;
            } else {
                gainNodesLeft[i].gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
                gainNodesRight[i].gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
                isPlaying[i] = false;
            }
        })
    })
})

function initSoundSource(i){
    // Creates a buffer source for every play btn on the page
    buffers[i] = ctx.createBufferSource();
    buffers[i].loop = true;

    // Creates left and right data channel on the buffer
    const bufferSize = 2 * ctx.sampleRate; 
    const bufferLeft = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const dataLeft = bufferLeft.getChannelData(0);
    const bufferRight = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const dataRight = bufferRight.getChannelData(0);

    // Puts white noise in each channel
    for (let i = 0; i < bufferSize; i++) {
        dataLeft[i] = Math.random() * 2 - 1;
        dataRight[i] = Math.random() * 2 - 1;
    }

    // Merges left and right into one stereo buffer
    const stereoBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    stereoBuffer.copyToChannel(dataLeft, 0);
    stereoBuffer.copyToChannel(dataRight, 1);

    // Sets that as the content of each plat btn's buffer
    buffers[i].buffer = stereoBuffer;

    // Uses channel splitter to handle panning
    splitters[i] = ctx.createChannelSplitter(2);
    gainNodesLeft[i] = ctx.createGain();
    gainNodesLeft[i].gain.setValueAtTime(0, ctx.currentTime);
    gainNodesRight[i] = ctx.createGain();
    gainNodesRight[i].gain.setValueAtTime(0, ctx.currentTime);
    stereoPanners[i] = ctx.createStereoPanner();
    mergers[i] = ctx.createChannelMerger(2);

    // Bandpass filter
    filterNodes[i] = ctx.createBiquadFilter();
    filterNodes[i].type = 'lowpass';

    // Connect everything together
    buffers[i].connect(splitters[i]);
    splitters[i].connect(gainNodesLeft[i], 0);
    splitters[i].connect(gainNodesRight[i], 1);
    gainNodesLeft[i].connect(mergers[i], 0, 0);
    gainNodesRight[i].connect(mergers[i], 0, 1);
    mergers[i].connect(stereoPanners[i]);
    stereoPanners[i].connect(filterNodes[i]);
    filterNodes[i].connect(ctx.destination);

    // start audio (with no gain)
    buffers[i].start();
}

// pan control
const panValueInputs = document.getElementsByClassName('pan');
let panValues = [0, 0, 0, 0];

Array.from(panValueInputs).forEach((input, i) => {
    input.addEventListener('change', (e) => {
        panValues[i] = parseFloat(e.target.value);
        panValue = Math.min(1, Math.max(-1, panValues[i]));
        stereoPanners[i].pan.linearRampToValueAtTime(panValue, ctx.currentTime + 0.05);
    })
})

// Frequency control
const freqValueInputs = document.getElementsByClassName('pitch');
let freqValues = [500, 1000, 10000, 20000];

Array.from(freqValueInputs).forEach((input, i) => {
    input.addEventListener('change', (e) => {
        freqValues[i] = e.target.value;
        filterNodes[i].frequency.linearRampToValueAtTime(freqValues[i], ctx.currentTime + 0.05);
    })
})