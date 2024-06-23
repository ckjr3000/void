let ctx;
let source;
let gainNodeLeft, gainNodeRight;
let gainVal = 0.5;
let filterNode;
let bitcrusherNode;
let bitDepth = 16;
let stereoPanner;
let compressor;
let bitcrusherGainNode;
let startingPitches = [1000, 5000, 10000, 15000];
let pitchValue;
let isPlaying = [false, false, false, false];

// open the void
const openBtn = document.getElementById('open');
const startSection = document.getElementById('start');
const voidSection = document.getElementById('void');

openBtn.addEventListener('click', () => {
    startSection.classList.add('hidden');
    voidSection.classList.remove('hidden');
    ctx = new AudioContext();
    initialiseSoundSource();
})

// play
let playBtns = document.getElementsByClassName('play-btn');
Array.from(playBtns).forEach((btn, index)=> {
    btn.addEventListener('click', () => {
        if (isPlaying[index] === false) {
            gainNodeLeft.gain.setValueAtTime(gainVal, ctx.currentTime);
            gainNodeRight.gain.setValueAtTime(gainVal, ctx.currentTime);
            filterNode.frequency.linearRampToValueAtTime(startingPitches[index], ctx.currentTime + 0.05);
        }
    })
})

function initialiseSoundSource() {
    const numChannels = 2;
    const sampleRate = ctx.sampleRate;
    const duration = 2;
    const numFrames = sampleRate * duration;

    const buffer = ctx.createBuffer(numChannels, numFrames, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const nowBuffering = buffer.getChannelData(channel);
        for (let i = 0; i < numFrames; i++) {
            nowBuffering[i] = Math.random() * 2 - 1; 
        }
    }

    source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const splitter = ctx.createChannelSplitter(2);
    gainNodeLeft = ctx.createGain();
    gainNodeRight = ctx.createGain();
    stereoPanner = ctx.createStereoPanner();
    const merger = ctx.createChannelMerger(2);

    filterNode = ctx.createBiquadFilter();
    filterNode.type = 'lowpass';

    bitcrusherNode = createBitcrusherNode();

    // Gain node to compensate bitcrusher volume increase
    bitcrusherGainNode = ctx.createGain();
    bitcrusherGainNode.gain.setValueAtTime(1, ctx.currentTime);

    // Initialize the compressor node
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-40, ctx.currentTime);
    compressor.knee.setValueAtTime(30, ctx.currentTime);
    compressor.ratio.setValueAtTime(12, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.25, ctx.currentTime);

    gainNodeLeft.gain.setValueAtTime(0, ctx.currentTime);
    gainNodeRight.gain.setValueAtTime(0, ctx.currentTime);
    stereoPanner.pan.setValueAtTime(0, ctx.currentTime);
    filterNode.frequency.setValueAtTime(20000, ctx.currentTime);

    source.connect(splitter);
    splitter.connect(gainNodeLeft, 0);
    splitter.connect(gainNodeRight, 1);
    gainNodeLeft.connect(merger, 0, 0);
    gainNodeRight.connect(merger, 0, 1);
    merger.connect(stereoPanner);
    stereoPanner.connect(filterNode);
    filterNode.connect(bitcrusherNode);
    bitcrusherNode.connect(bitcrusherGainNode); 
    bitcrusherGainNode.connect(compressor); 
    compressor.connect(ctx.destination);

    source.start();
}

// pan
const panValueInput = document.getElementById('pan-val');
let panValue = 0;

panValueInput.addEventListener('change', (e) => {
    panValue = parseFloat(e.target.value);
    setPanning(panValue);
});

function setPanning(panValue) {
    panValue = Math.min(1, Math.max(-1, panValue));
    stereoPanner.pan.linearRampToValueAtTime(panValue, ctx.currentTime + 0.05);
}

// randomise pan
const randPan = document.getElementById('rand-pan');
let randPanActive = false;
let panInterval;
randPan.addEventListener('click', () => {
    if (!randPanActive) {
        randPanActive = true;
        panInterval = setInterval(() => {
            panValue = Math.random() * 2 - 1;
            stereoPanner.pan.linearRampToValueAtTime(panValue, ctx.currentTime + 0.05);
            panValueInput.value = panValue;
        }, 500);
    } else {
        randPanActive = false;
        clearInterval(panInterval);
        stereoPanner.pan.linearRampToValueAtTime(0, ctx.currentTime + 0.05); 
        panValueInput.value = 0; 
    }
});

// time stretch
const stretchValueInput = document.getElementById('stretch-val');
let stretchValue = 1;

stretchValueInput.addEventListener('change', (e) => {
    stretchValue = e.target.value;
    source.playbackRate.linearRampToValueAtTime(stretchValue, ctx.currentTime + 0.05);
});

// randomise stretch
const randStretch = document.getElementById('rand-stretch');
let randStretchActive = false;
let stretchInterval;
randStretch.addEventListener('click', () => {
    if (!randStretchActive) {
        randStretchActive = true;
        stretchInterval = setInterval(() => {
            stretchValue = Math.random() * (2 - 0.5) + 0.5;
            source.playbackRate.linearRampToValueAtTime(stretchValue, ctx.currentTime + 0.05);
            stretchValueInput.value = stretchValue;
        }, 500);
    } else {
        randStretchActive = false;
        clearInterval(stretchInterval);
        source.playbackRate.linearRampToValueAtTime(stretchValue, ctx.currentTime + 0.05);
        stretchValueInput.value = 1; 
    }
});

// pitch
const pitchValueInput = document.getElementById('pitch-val');

pitchValueInput.addEventListener('change', (e) => {
    pitchValue = e.target.value;
    filterNode.frequency.linearRampToValueAtTime(pitchValue, ctx.currentTime + 0.05);
});

// randomise pitch
const randPitch = document.getElementById('rand-pitch');
let randPitchActive = false;
let pitchInterval;
randPitch.addEventListener('click', () => {
    if (!randPitchActive) {
        randPitchActive = true;
        pitchInterval = setInterval(() => {
            pitchValue = Math.random() * 24000;
            filterNode.frequency.linearRampToValueAtTime(pitchValue, ctx.currentTime + 0.05);
            pitchValueInput.value = pitchValue;
        }, 500);
    } else {
        randPitchActive = false;
        clearInterval(pitchInterval);
        filterNode.frequency.linearRampToValueAtTime(pitchValue, ctx.currentTime + 0.05);
        pitchValueInput.value = pitchValue; 
    }
});

// bitcrush
function createBitcrusherNode() {
    const bufferSize = 4096;
    const bitcrusherNode = ctx.createScriptProcessor(bufferSize, 2, 2);

    bitcrusherNode.onaudioprocess = function(event) {
        for (let channel = 0; channel < event.inputBuffer.numberOfChannels; channel++) {
            const input = event.inputBuffer.getChannelData(channel);
            const output = event.outputBuffer.getChannelData(channel);

            for (let i = 0; i < input.length; i++) {
                let reduction = Math.pow(2, 16 - bitDepth);
                output[i] = Math.sign(input[i]) * (1 - Math.pow(1 - Math.abs(input[i]), reduction));
            }
        }
    };

    return bitcrusherNode;
}

const bitcrushValueInput = document.getElementById('crush-val');

bitcrushValueInput.addEventListener('change', (e) => {
    bitDepth = e.target.value;
    if (bitDepth < 16) {
        bitcrusherGainNode.gain.setValueAtTime(0.5, ctx.currentTime); 
    } else {
        bitcrusherGainNode.gain.setValueAtTime(1, ctx.currentTime);
    }
});

// randomise crush
const randCrush = document.getElementById('rand-crush');
let randCrushActive = false;
let crushInterval;
randCrush.addEventListener('click', () => {
    if (!randCrushActive) {
        randCrushActive = true;
        crushInterval = setInterval(() => {
            bitDepth = Math.random() * (16 - 12) + 12;
            bitcrushValueInput.value = bitDepth;
        }, 500);
    } else {
        randCrushActive = false;
        clearInterval(crushInterval);
        bitDepth = 16;
        bitcrushValueInput.value = bitDepth; 
    }
});
