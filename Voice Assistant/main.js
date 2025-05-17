
        // API setup
        const API_KEY = "";
        const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        const voiceOrb = document.getElementById('voiceOrb');
        const voiceWaves = document.getElementById('voiceWaves');
        const responseText = document.getElementById('responseText');
        const statusEl = document.getElementById('status');
        const bars = document.querySelectorAll('.bar');
        
        let isListening = false;
        let recognition;
        let isSpeaking = false;
        let speechSynthesis = window.speechSynthesis;
        
        function setupSpeechRecognition() {
            if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
                recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                recognition.continuous = false;
                recognition.interimResults = true;
                recognition.lang = 'en-US';
                
                recognition.onstart = function() {
                    isListening = true;
                    voiceOrb.classList.add('active');
                    statusEl.textContent = 'Listening...';
                    startVisualizer();
                };
                
                recognition.onresult = function(event) {
                    const transcript = event.results[0][0].transcript;
                    if (event.results[0].isFinal) {
                        statusEl.textContent = 'Processing...';
                        processCommand(transcript);
                    }
                };
                
                recognition.onend = function() {
                    isListening = false;
                    voiceOrb.classList.remove('active');
                    stopVisualizer();
                };
                
                recognition.onerror = function(event) {
                    console.error('Recognition error:', event.error);
                    statusEl.textContent = 'Error: ' + event.error;
                    isListening = false;
                    voiceOrb.classList.remove('active');
                    stopVisualizer();
                };
            } else {
                statusEl.textContent = 'Speech recognition not supported in this browser';
            }
        }
        
        async function processCommand(text) {
            try {
                responseText.textContent = '';
                responseText.classList.remove('visible');
                
                // Call Gemini API
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: `You are a helpful assistant with a friendly, concise feminine style. Keep responses under 30 words when possible. User query: ${text}`
                                    }
                                ]
                            }
                        ]
                    })
                });
                
                const data = await response.json();
                
                if (data.candidates && data.candidates[0].content.parts[0].text) {
                    const aiResponse = data.candidates[0].content.parts[0].text;
                    speakResponse(aiResponse);
                } else {
                    throw new Error('Invalid API response');
                }
            } catch (error) {
                console.error('Error processing command:', error);
                statusEl.textContent = 'Sorry, there was an error processing your request.';
            }
        }
        
        function speakResponse(text) {
            responseText.textContent = text;
            responseText.classList.add('visible');
            
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                
                // Find a female voice
                const voices = speechSynthesis.getVoices();
                const femaleVoice = voices.find(voice => voice.name.includes('female') || voice.name.includes('Female'));
                if (femaleVoice) {
                    utterance.voice = femaleVoice;
                }
                
                utterance.rate = 1;
                utterance.pitch = 1.2;
                
                utterance.onstart = function() {
                    isSpeaking = true;
                    voiceWaves.classList.add('speaking');
                    statusEl.textContent = 'Speaking...';
                    startVisualizer();
                };
                
                utterance.onend = function() {
                    isSpeaking = false;
                    voiceWaves.classList.remove('speaking');
                    statusEl.textContent = 'Ready';
                    stopVisualizer();
                };
                
                speechSynthesis.speak(utterance);
            } else {
                statusEl.textContent = 'Speech synthesis not supported in this browser';
            }
        }
        
        voiceOrb.addEventListener('click', function() {
            if (isSpeaking) {
                speechSynthesis.cancel();
                isSpeaking = false;
                voiceWaves.classList.remove('speaking');
                statusEl.textContent = 'Ready';
                stopVisualizer();
                return;
            }
            
            if (isListening) {
                recognition.stop();
            } else {
                setupSpeechRecognition();
                recognition.start();
            }
        });
        
        // Get voices when they're available
        if ('speechSynthesis' in window) {
            speechSynthesis.onvoiceschanged = function() {
                const voices = speechSynthesis.getVoices();
                console.log('Available voices:', voices);
            };
        }
        
        // Visualizer animation
        function startVisualizer() {
            let visualizerInterval = setInterval(() => {
                bars.forEach(bar => {
                    const height = Math.floor(Math.random() * 40) + 5;
                    bar.style.height = `${height}px`;
                });
            }, 100);
            
            voiceOrb.dataset.visualizerInterval = visualizerInterval;
        }
        
        function stopVisualizer() {
            if (voiceOrb.dataset.visualizerInterval) {
                clearInterval(parseInt(voiceOrb.dataset.visualizerInterval));
                bars.forEach(bar => {
                    bar.style.height = '5px';
                });
            }
        }
        
        // Initialize voices
        if ('speechSynthesis' in window) {
            speechSynthesis.getVoices();
        }