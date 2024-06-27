let ctx, gainNodeLeft, gainNodeRight;
let playBtns = document.getElementsByClassName('play-btn');
let buffers = [];
let splitters = [];
let gainNodesLeft = [];
let gainNodesRight = [];
let stereoPanners = [];
let mergers = [];
let filterNodes = [];
let lpNodes = [];
let qValues = [0, 10, 30, 60];
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

        // Variables for Voss-McCartney pink noise algorithm
        const b0 = new Float32Array(bufferSize);
        const b1 = new Float32Array(bufferSize);
        const b2 = new Float32Array(bufferSize);
        const b3 = new Float32Array(bufferSize);
        const b4 = new Float32Array(bufferSize);
        const b5 = new Float32Array(bufferSize);
        const b6 = new Float32Array(bufferSize);
    
        // Fill the buffer with pink noise
        for (let i = 0; i < bufferSize; i++) {
            b0[i] = Math.random() * 2 - 1;
            if (i % 2 === 0) b1[i] = Math.random() * 2 - 1;
            if (i % 4 === 0) b2[i] = Math.random() * 2 - 1;
            if (i % 8 === 0) b3[i] = Math.random() * 2 - 1;
            if (i % 16 === 0) b4[i] = Math.random() * 2 - 1;
            if (i % 32 === 0) b5[i] = Math.random() * 2 - 1;
            if (i % 64 === 0) b6[i] = Math.random() * 2 - 1;
    
            dataLeft[i] = (b0[i] + b1[i] + b2[i] + b3[i] + b4[i] + b5[i] + b6[i]) / 7;
            dataRight[i] = (b0[i] + b1[i] + b2[i] + b3[i] + b4[i] + b5[i] + b6[i]) / 7;
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

    // Q factor
    filterNodes[i].Q.value = qValues[i];

    // Global lowpass filter
    lpNodes[i] = ctx.createBiquadFilter();
    lpNodes[i].type = 'lowpass';
    lpNodes[i].frequency.setValueAtTime(18000, ctx.currentTime);


    // Connect everything together
    buffers[i].connect(splitters[i]);
    splitters[i].connect(gainNodesLeft[i], 0);
    splitters[i].connect(gainNodesRight[i], 1);
    gainNodesLeft[i].connect(mergers[i], 0, 0);
    gainNodesRight[i].connect(mergers[i], 0, 1);
    mergers[i].connect(stereoPanners[i]);
    stereoPanners[i].connect(filterNodes[i]);
    filterNodes[i].connect(lpNodes[i]);
    lpNodes[i].connect(ctx.destination);

    // start audio (with no gain)
    buffers[i].start();
}

// pan control
const panValueInputs = document.getElementsByClassName('pan-val');
let panValues = [0, 0, 0, 0];

Array.from(panValueInputs).forEach((input, i) => {
    input.addEventListener('input', (e) => {
        panValues[i] = parseFloat(e.target.value);
        panValue = Math.min(1, Math.max(-1, panValues[i]));
        stereoPanners[i].pan.linearRampToValueAtTime(panValue, ctx.currentTime + 0.05);
    })
})

// Timestretch control
const stretchValueInputs = document.getElementsByClassName('stretch-val');
let stretchValues = [0, 0, 0, 0];

Array.from(stretchValueInputs).forEach((input, i) => {
    input.addEventListener('input', (e) => {
        stretchValues[i] = e.target.value;
        buffers[i].playbackRate.linearRampToValueAtTime(stretchValues[i], ctx.currentTime + 0.05);
    })
})

// Frequency control
const freqValueInputs = document.getElementsByClassName('pitch-val');
let freqValues = [500, 1000, 10000, 20000];

Array.from(freqValueInputs).forEach((input, i) => {
    input.addEventListener('input', (e) => {
        freqValues[i] = e.target.value;
        filterNodes[i].frequency.linearRampToValueAtTime(freqValues[i], ctx.currentTime + 0.05);
    })
})

// Q factor control
const qValueInputs = document.getElementsByClassName('q-val');

Array.from(qValueInputs).forEach((input, i) => {
    input.addEventListener('input', (e) => {
        qValues[i] = e.target.value;
        filterNodes[i].Q.value = qValues[i];
    })
})

// Volume control
const volValueInputs = document.getElementsByClassName('vol-val');
let volValues = [1, 1, 1, 1];

Array.from(volValueInputs).forEach((input, i) => {
    input.addEventListener('input', (e) => {
        volValues[i] = e.target.value;
        gainNodesLeft[i].gain.linearRampToValueAtTime(volValues[i], ctx.currentTime + 0.05);
        gainNodesRight[i].gain.linearRampToValueAtTime(volValues[i], ctx.currentTime + 0.05);
    })
})

// Randomiser buttons

// Pan
const randPans = document.getElementsByClassName('rand-pan');
let randPansActive = [false, false, false, false];
let panIntervalSizes = [1000, 1000, 1000, 1000];
let panIntervals = [null, null, null, null];

Array.from(randPans).forEach((btn, i) => {
    btn.addEventListener('click', () => {
        if (!randPansActive[i]){
            randPansActive[i] = true;
            randomisePan(i);
        } else {
            randPansActive[i] = false;
            clearInterval(panIntervals[i]);
            panIntervals[i] = null;
        }
    })
})

function randomisePan(i){
    if (panIntervals[i]) {
        clearInterval(panIntervals[i]);
    }
    panIntervals[i] = setInterval(() => {
        panValues[i] = Math.random() * 2 - 1;
        stereoPanners[i].pan.linearRampToValueAtTime(panValues[i], ctx.currentTime + 0.05);
        panValueInputs[i].value = panValues[i];
    }, panIntervalSizes[i]);
}

// Timestretch
const randStretches = document.getElementsByClassName('rand-stretch');
let randStretchesActive = [false, false, false, false];
let stretchIntervalSizes = [1000, 1000, 1000, 1000];
let stretchIntervals = [null, null, null, null];

Array.from(randStretches).forEach((btn, i) => {
    btn.addEventListener('click', () => {
        if (!randStretchesActive[i]){
            randStretchesActive[i] = true;
            randomiseStretch(i);
        } else {
            randStretchesActive[i] = false;
            clearInterval(stretchIntervals[i]);
            stretchIntervals[i] = null;
        }
    })
})

function randomiseStretch(i){
    if (stretchIntervals[i]){
        clearInterval(stretchIntervals[i]);
    }
    stretchIntervals[i] = setInterval(() => {
        stretchValues[i] = Math.random() * (2 - 0.5) + 0.5;
        buffers[i].playbackRate.linearRampToValueAtTime(stretchValues[i], ctx.currentTime + 0.05);
        stretchValueInputs[i].value = stretchValues[i];
    }, stretchIntervalSizes[i]);
}

// Frequency
const randFreqs = document.getElementsByClassName('rand-pitch');
let randFreqsActive = [false, false, false, false];
let freqIntervalSizes = [1000, 1000, 1000, 1000];
let freqIntervals = [null, null, null, null];

Array.from(randFreqs).forEach((btn, i) => {
    btn.addEventListener('click', () => {
        if (!randFreqsActive[i]){
            console.log('click')
            randFreqsActive[i] = true;
            randomiseFreq(i);
        } else {
            randFreqsActive[i] = false;
            clearInterval(freqIntervals[i]);
            freqIntervals[i] = null;
        }
    })
})

function randomiseFreq(i){
    console.log('opopo')
    if(freqIntervals[i]){
        clearInterval(freqIntervals[i])
    }
    freqIntervals[i] = setInterval(() => {
        freqValues[i] = Math.random() * 24000;
        filterNodes[i].frequency.linearRampToValueAtTime(freqValues[i], ctx.currentTime + 0.05);
        freqValueInputs[i].value = freqValues[i];
    }, freqIntervalSizes[i]);
}

// Q factor
const randQs = document.getElementsByClassName('rand-q');
let randQsActive = [false, false, false, false];
let qIntervalSizes = [1000, 1000, 1000, 1000];
let qIntervals = [null, null, null, null];

Array.from(randQs).forEach((btn, i) => {
    btn.addEventListener('click', () => {
        if (!randQsActive[i]){
            randQsActive[i] = true;
            randomiseQ(i);
        } else {
            randQsActive[i] = false;
            clearInterval(qIntervals[i]);
            qIntervals[i] = null;
        }
    })
})

function randomiseQ(i){
    if (qIntervals[i]){
        clearInterval(qIntervals[i]);
    }
    qIntervals[i] = setInterval(() => {
        qValues[i] = Math.floor(Math.random() * 60);
        filterNodes[i].Q.value = qValues[i];
        qValueInputs[i].value = qValues[i];
    }, qIntervalSizes[i]);
}

// Interval Size Selection

// Pan
const panIntInputs = document.getElementsByClassName('pan-interval');
Array.from(panIntInputs).forEach((input, i) => {
    input.addEventListener('input', (e) => {
        panIntervalSizes[i] = e.target.value;
        if (randPansActive[i]){
            randomisePan(i);
        }
    })
})

// Timestretch
const stretchIntInputs = document.getElementsByClassName('stretch-interval');
Array.from(stretchIntInputs).forEach((input, i) => {
    input.addEventListener('input', (e) => {
        stretchIntervalSizes[i] = e.target.value;
        if (randStretchesActive[i]){
            randomiseStretch(i);
        }
    })
})

// Frequency
const freqIntInputs = document.getElementsByClassName('pitch-interval');
Array.from(freqIntInputs).forEach((input, i) => {
    input.addEventListener('input', (e) => {
        freqIntervalSizes[i] = e.target.value;
        if (randFreqsActive[i]){
            randomiseFreq(i);
        }
    })
})

// Q factor
const qIntInputs = document.getElementsByClassName('q-interval');
Array.from(qIntInputs).forEach((input, i) => {
    input.addEventListener('input', (e) => {
        qIntervalSizes[i] = e.target.value;
        if (randQsActive[i]){
            randomiseQ(i);
        }
    })
})

// Incrementally revealing controls

const stretchSections = document.getElementsByClassName('timestretch');
setTimeout(() => {
    Array.from(stretchSections).forEach(input => {
        input.classList.remove('hidden');
    })
}, 5000);

const freqSections = document.getElementsByClassName('pitch');
setTimeout(() => {
    Array.from(freqSections).forEach(input => {
        input.classList.remove('hidden');
    })
}, 10000);

const qSections = document.getElementsByClassName('q-factor');
setTimeout(() => {
    Array.from(qSections).forEach(input => {
        input.classList.remove('hidden');
    })
}, 15000);