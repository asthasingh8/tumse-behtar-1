document.addEventListener('DOMContentLoaded', () => {
    const song = document.getElementById('song');
    const loadingScreen = document.getElementById('loading-screen');
    const enterScreen = document.getElementById('enter-screen');
    const enterButton = document.getElementById('enter-button');
    const mainContainer = document.getElementById('main-container');
    const lyricContainer = document.querySelector('.lyric-line');
    const equalizerSpans = document.querySelectorAll('#equalizer span');
    const cursorGlow = document.getElementById('cursor-glow');
    const songTitle = document.querySelector('.song-title');
    const lyricsContainer = document.getElementById('lyrics-container');
    const playPauseBtn = document.getElementById('play-pause-btn');

    const lyrics = [
  { time: 6, text: "Ra-ra-ra, ra-ra-ra" },
  { time: 11, text: "Ra-ra-ra, ra-ra, ra-ra-ra-ra" },

  { time: 19.21, text: "Tumhara mera milna likha toh hoga kaheen" },
  { time: 28.27, text: "Naseebon ka sitaara mila toh hoga kaheen" },

  { time: 31.77, text: "Na jaane kyun, ae humnasheen" },
  { time: 35.00, text: "Hai mere dil ko yeh yaqeen" },
  { time: 38.03, text: "Ki tum sang ho toh bigdi baatein saari ban jaayengi" },

  { time: 45.05, text: "Tum jo hans do, roothi raatein saari mann jaayengi" },
  { time: 51.70, text: "Tumse behtar, tumse pyaara, yaara, koi nahi" },
  { time: 58.08, text: "Aasmaan pe tumse roshan taara koi nahi" },

  { time: 64.83, text: "Tumse behtar, tumse pyaara, yaara, koi nahi" },
  { time: 71.76, text: "Aasmaan pe tumse roshan taara koi nahi" },
  { time: 76.76, text: "Aasmaan pe tumse roshan taara koi nahi" },

];


    let audioContext, analyser, source;
    let equalizerAnimationId;
    let loadingTimeout;
    let lastLyricTimeout = null;

    function showEnterScreen() {
        clearTimeout(loadingTimeout);
        if (!loadingScreen.classList.contains('hidden')) {
            loadingScreen.classList.add('hidden');
            enterScreen.style.display = 'flex';
        }
    }

    // Check if song can be played
    song.addEventListener('canplay', showEnterScreen);

    // Set a timeout as a fallback
    loadingTimeout = setTimeout(() => {
        console.warn("Audio is taking a long time to load. Showing enter screen as a fallback.");
        showEnterScreen();
    }, 10000); // 10 seconds

    // Fallback if song fails to load
    song.addEventListener('error', () => {
        clearTimeout(loadingTimeout);
        loadingScreen.innerHTML = '<p>Failed to load song. Please ensure "assets/audio.mp3" exists.</p>';
    });


    enterButton.addEventListener('click', () => {
        enterScreen.style.opacity = '0';
        enterScreen.style.transition = 'opacity 1s ease';
        setTimeout(() => {
            enterScreen.classList.add('hidden');
            mainContainer.classList.remove('hidden');
            playSong();
        }, 1000);
    });

    playPauseBtn.addEventListener('click', () => {
        if (song.paused) {
            playSong();
        } else {
            pauseSong();
        }
    });

    function playSong() {
        song.play().catch(e => console.error("Playback failed:", e));
        playPauseBtn.classList.remove('play');
        playPauseBtn.classList.add('pause');
        if (!audioContext) {
            setupAudioApi();
        }
        if (!equalizerAnimationId) {
            renderEqualizer();
        }
    }

    function pauseSong() {
        song.pause();
        playPauseBtn.classList.remove('pause');
        playPauseBtn.classList.add('play');
        if (equalizerAnimationId) {
            cancelAnimationFrame(equalizerAnimationId);
            equalizerAnimationId = null;
            for (let i = 0; i < equalizerSpans.length; i++) {
                equalizerSpans[i].style.height = `5%`;
            }
        }
    }

    function setupAudioApi() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        source = audioContext.createMediaElementSource(song);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        analyser.fftSize = 64;
    }

    let currentLyricIndex = -1;

    song.addEventListener('timeupdate', () => {
        const currentTime = song.currentTime;
        const lyricIndex = lyrics.findIndex(lyric => currentTime >= lyric.time && (lyrics.indexOf(lyric) + 1 === lyrics.length || currentTime < lyrics[lyrics.indexOf(lyric) + 1].time));

        if (lyricIndex !== -1 && lyricIndex !== currentLyricIndex) {
            currentLyricIndex = lyricIndex;
            displayLyric(lyrics[lyricIndex].text);

            if (lyricIndex === lyrics.length - 1 && !lastLyricTimeout) {
                // Last lyric is being displayed, and we haven't set a timeout yet
                lastLyricTimeout = setTimeout(() => {
                    // Fade out volume
                    let volume = song.volume;
                    const fadeOutInterval = setInterval(() => {
                        volume -= 0.1;
                        if (volume >= 0) {
                            song.volume = Math.max(0, volume); // Ensure volume doesn't go below 0
                        } else {
                            song.pause();
                            // Also update the play/pause button state
                            playPauseBtn.classList.remove('pause');
                            playPauseBtn.classList.add('play');
                            clearInterval(fadeOutInterval);
                        }
                    }, 200); // Fade out over 2 seconds
                }, 10000); // 10 seconds after the last lyric appears
            }
        }
    });

    function displayLyric(text) {
        lyricContainer.classList.remove('visible', 'glowing');
        lyricContainer.innerHTML = ''; // Clear previous content

        setTimeout(() => {
            lyricContainer.classList.add('visible');
            const words = text.split(' ');
            words.forEach((word, index) => {
                const wordSpan = document.createElement('span');
                wordSpan.textContent = word;
                wordSpan.className = 'word';
                wordSpan.style.transitionDelay = `${index * 0.1}s`;
                lyricContainer.appendChild(wordSpan);
                lyricContainer.appendChild(document.createTextNode(' '));
            });

            // Trigger typewriter effect
            setTimeout(() => {
                const wordSpans = lyricContainer.querySelectorAll('.word');
                wordSpans.forEach(span => {
                    span.style.opacity = '1';
                    span.style.transform = 'translateY(0)';
                });
            }, 100);

            // Add glowing effect after a delay
            setTimeout(() => {
                lyricContainer.classList.add('glowing');
            }, 2000); // Glow starts 2 seconds after line appears
        }, 100);
    }

    // Micro-interactions
    document.addEventListener('mousemove', (e) => {
        cursorGlow.style.left = `${e.clientX}px`;
        cursorGlow.style.top = `${e.clientY}px`;

        const x = (window.innerWidth / 2 - e.clientX) / window.innerWidth * 2;
        const y = (window.innerHeight / 2 - e.clientY) / window.innerHeight * 2;

        lyricsContainer.style.transform = `rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
        songTitle.style.transform = `rotateY(${x * 3}deg) rotateX(${-y * 3}deg)`;
    });

    // Equalizer Animation
    function renderEqualizer() {
        if (!analyser) return;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function animate() {
            equalizerAnimationId = requestAnimationFrame(animate);
            analyser.getByteFrequencyData(dataArray);
            
            for (let i = 0; i < equalizerSpans.length; i++) {
                const barHeight = (dataArray[i * 2] / 255) * 100;
                equalizerSpans[i].style.height = `${Math.max(5, barHeight)}%`;
            }
        }
        animate();
    }

    // Particle Canvas
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];

    function createParticle() {
        const x = Math.random() * canvas.width;
        const y = canvas.height + 50;
        const radius = Math.random() * 1.5 + 0.5; // Smaller bokeh lights
        const speed = Math.random() * 2 + 0.5;
        const opacity = Math.random() * 0.5 + 0.2;
        const color = `rgba(255, 138, 0, ${opacity})`;

        particles.push({ x, y, radius, speed, color });
    }

    // Heart particles
    function createHeart() {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 10 + 5;
        const speedY = Math.random() * 0.5 + 0.2;
        const opacity = Math.random() * 0.3 + 0.1;
        
        particles.push({ type: 'heart', x, y, size, speedY, opacity, initialY: y });
    }

    function drawHeart(particle) {
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
        ctx.beginPath();
        const topCurveHeight = particle.size * 0.3;
        ctx.moveTo(particle.x, particle.y + topCurveHeight);
        // top left curve
        ctx.bezierCurveTo(
          particle.x, particle.y, 
          particle.x - particle.size / 2, particle.y, 
          particle.x - particle.size / 2, particle.y + topCurveHeight
        );
        // bottom left curve
        ctx.bezierCurveTo(
          particle.x - particle.size / 2, particle.y + (particle.size + topCurveHeight) / 2, 
          particle.x, particle.y + (particle.size + topCurveHeight) / 2, 
          particle.x, particle.y + particle.size
        );
        // bottom right curve
        ctx.bezierCurveTo(
          particle.x, particle.y + (particle.size + topCurveHeight) / 2, 
          particle.x + particle.size / 2, particle.y + (particle.size + topCurveHeight) / 2, 
          particle.x + particle.size / 2, particle.y + topCurveHeight
        );
        // top right curve
        ctx.bezierCurveTo(
          particle.x + particle.size / 2, particle.y, 
          particle.x, particle.y, 
          particle.x, particle.y + topCurveHeight
        );
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }


    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((p, index) => {
            if (p.type === 'heart') {
                p.y -= p.speedY;
                p.x += Math.sin(p.y / 50) * 0.5; // Gentle sway
                if (p.y < -20) {
                    p.y = canvas.height + 20;
                }
                drawHeart(p);

            } else { // Bokeh
                p.y -= p.speed;
                if (p.y < -50) {
                    particles.splice(index, 1);
                } else {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();
                }
            }
        });

        if (Math.random() > 0.95) {
            createParticle();
        }
        
        requestAnimationFrame(animateParticles);
    }
    
    for(let i = 0; i < 15; i++) {
        createHeart();
    }

    animateParticles();

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    // Beat drop effect (hardcoded for demo)
    const beatDrops = [10, 30, 50, 75, 90]; 
    beatDrops.forEach(time => {
        setTimeout(() => {
            setInterval(() => {
                if (!song.paused) {
                    particles.forEach(p => {
                        if (p.type === 'heart') {
                            // expand heart
                            p.size *= 1.2;
                            setTimeout(() => p.size /= 1.2, 300);
                        }
                    });
                }
            }, lyrics.find(l => l.time === time) ? (lyrics[lyrics.indexOf(lyrics.find(l => l.time === time)) + 1].time - time) * 1000 : 5000);
        }, time * 1000);
    });
});