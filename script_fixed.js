document.addEventListener('DOMContentLoaded', function() {
    const editor = document.getElementById('editor');
    const wordCountElement = document.getElementById('wordCount');
    const charCountElement = document.getElementById('charCount');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const saveBtn = document.getElementById('saveBtn');
    const aiHelpBtn = document.getElementById('aiHelpBtn');
    const suggestionList = document.getElementById('suggestionList');
    
    // Ø¹Ù†Ø§ØµØ± Ù…Ø±Ø¨ÙˆØ· Ø¨Ù‡ ØªÙ†Ø¸ÛŒÙ…Ø§Øª
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const apiKeyInput = document.getElementById('apiKey');
    const validateApiBtn = document.getElementById('validateApiBtn');
    const apiStatus = document.getElementById('apiStatus');
    const modelSelect = document.getElementById('modelSelect');
    const modelInfo = document.getElementById('modelInfo');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    
    // Ù…ØªØºÛŒØ±Ù‡Ø§ÛŒ Ù…Ø±Ø¨ÙˆØ· Ø¨Ù‡ ØªÙ†Ø¸ÛŒÙ…Ø§Øª
    let apiKey = localStorage.getItem('aiWriter_apiKey') || '';
    let selectedModel = localStorage.getItem('aiWriter_selectedModel') || '';
    let availableModels = [];
    let isApiConnected = false;
    
    // Ù…ØªØºÛŒØ±Ù‡Ø§ÛŒ Ù…Ø±ØªØ¨Ø· Ø¨Ø§ Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§
    let projects = [];
    let currentProject = null;
    
    // Ù…ØªØºÛŒØ± Ø¨Ø±Ø§ÛŒ Ù†Ú¯Ù‡Ø¯Ø§Ø±ÛŒ ØªØ§ÛŒÙ…Ø± Ø°Ø®ÛŒØ±Ù‡â€ŒØ³Ø§Ø²ÛŒ Ø®ÙˆØ¯Ú©Ø§Ø±
    let autoSaveTimer = null;
    
    // Ø¨Ø§Ø²ÛŒØ§Ø¨ÛŒ Ù…ØªÙ† Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯Ù‡
    function loadSavedText() {
        // Ø§Ú¯Ø± Ù¾Ø±ÙˆÚ˜Ù‡ ÙØ¹Ù„ÛŒ ÙˆØ¬ÙˆØ¯ Ù†Ø¯Ø§Ø±Ø¯ØŒ Ù…ØªÙ† Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯Ù‡ Ù‚Ø¨Ù„ÛŒ Ø±Ø§ Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ Ú©Ù†
        if (!currentProject) {
            const savedText = localStorage.getItem('aiWriter_text');
            if (savedText) {
                editor.value = savedText;
                updateWordAndCharCount();
            }
        }
    }
    
    // Ø°Ø®ÛŒØ±Ù‡ Ù…ØªÙ† Ø¯Ø± localStorage Ù‡Ù†Ú¯Ø§Ù… ØªØºÛŒÛŒØ±
    function saveText() {
        if (currentProject) {
            updateProject(currentProject.id, {
                content: editor.value,
                title: document.getElementById('currentProjectTitle').value
            });
        } else {
            localStorage.setItem('aiWriter_text', editor.value);
        }
    }
    
    // Ø±ÙˆÛŒØ¯Ø§Ø¯ ØªØºÛŒÛŒØ± Ù…ØªÙ†
    editor.addEventListener('input', function() {
        updateWordAndCharCount();
        saveText();
    });
    
    // Ú©Ù†ØªØ±Ù„ ÙˆÛŒÚ˜Ú¯ÛŒ ØªØ¹Ø¯Ø§Ø¯ Ú©Ù„Ù…Ø§Øª Ùˆ Ú©Ø§Ø±Ø§Ú©ØªØ±Ù‡Ø§
    function updateWordAndCharCount() {
        const text = editor.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        const chars = text.length;
        
        wordCountElement.textContent = words;
        charCountElement.textContent = chars;
    }
    
    // ... Ø³Ø§ÛŒØ± ØªÙˆØ§Ø¨Ø¹ Ù…ÙˆØ¬ÙˆØ¯ ...
    
    // Ø¯Ú©Ù…Ù‡ Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø®ÙˆØ¯Ú©Ø§Ø± Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§
    document.getElementById('extractCharactersBtn').addEventListener('click', function() {
        extractCharactersFromStory();
    });
    
    // Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø®ÙˆØ¯Ú©Ø§Ø± Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§ Ø§Ø² Ù…ØªÙ† Ø¯Ø§Ø³ØªØ§Ù†
    async function extractCharactersFromStory() {
        if (!currentProject) {
            alert('Ù„Ø·ÙØ§Ù‹ Ø§Ø¨ØªØ¯Ø§ ÛŒÚ© Ù¾Ø±ÙˆÚ˜Ù‡ Ø±Ø§ Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ù†ÛŒØ¯.');
            return;
        }
        
        const storyText = editor.value.trim();
        if (!storyText) {
            alert('Ù…ØªÙ† Ø¯Ø§Ø³ØªØ§Ù† Ø®Ø§Ù„ÛŒ Ø§Ø³Øª. Ù„Ø·ÙØ§Ù‹ Ø§Ø¨ØªØ¯Ø§ Ù…ØªÙ†ÛŒ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.');
            return;
        }
        
        // Ù†Ù…Ø§ÛŒØ´ ÙˆØ¶Ø¹ÛŒØª Ø¯Ø± Ø­Ø§Ù„ Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ
        const charactersList = document.getElementById('charactersList');
        charactersList.innerHTML = `
            <div class="loading-characters">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Ø¯Ø± Ø­Ø§Ù„ Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§...</p>
            </div>
        `;
        
        try {
            // Ø³Ø§Ø®Øª Ù¾Ø±Ø§Ù…Ù¾Øª Ø¨Ø±Ø§ÛŒ Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§
            const prompt = `
            Ù…ØªÙ† Ø²ÛŒØ± Ø±Ø§ Ø¨Ø§ Ø¯Ù‚Øª Ø¨Ø®ÙˆØ§Ù† Ùˆ ØªÙ…Ø§Ù… Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§ÛŒ Ø¯Ø§Ø³ØªØ§Ù† Ø±Ø§ Ø´Ù†Ø§Ø³Ø§ÛŒÛŒ Ú©Ù†. Ø¨Ø±Ø§ÛŒ Ù‡Ø± Ø´Ø®ØµÛŒØª Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ø²ÛŒØ± Ø±Ø§ Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ú©Ù†:
            1. Ù†Ø§Ù… Ø´Ø®ØµÛŒØª
            2. Ù†Ù‚Ø´ Ø¯Ø± Ø¯Ø§Ø³ØªØ§Ù† (Ø´Ø®ØµÛŒØª Ø§ØµÙ„ÛŒØŒ Ø¶Ø¯ Ù‚Ù‡Ø±Ù…Ø§Ù†ØŒ Ø´Ø®ØµÛŒØª ÙØ±Ø¹ÛŒ ÛŒØ§ Ø´Ø®ØµÛŒØª Ø¬Ø²Ø¦ÛŒ)
            3. ÙˆÛŒÚ˜Ú¯ÛŒâ€ŒÙ‡Ø§ÛŒ Ø¸Ø§Ù‡Ø±ÛŒ (Ø¯Ø± ØµÙˆØ±Øª Ø°Ú©Ø± Ø¯Ø± Ù…ØªÙ†)
            4. ÙˆÛŒÚ˜Ú¯ÛŒâ€ŒÙ‡Ø§ÛŒ Ø´Ø®ØµÛŒØªÛŒ (Ø®Ù„Ù‚ Ùˆ Ø®ÙˆØŒ Ø®ØµÙˆØµÛŒØ§Øª Ø±ÙØªØ§Ø±ÛŒ Ùˆ ØºÛŒØ±Ù‡)
            5. Ù¾ÛŒØ´ÛŒÙ†Ù‡ Ùˆ ØªØ§Ø±ÛŒØ®Ú†Ù‡ (Ø§Ú¯Ø± Ø¯Ø± Ù…ØªÙ† Ø¢Ù…Ø¯Ù‡ Ø§Ø³Øª)
            6. Ø§Ù‡Ø¯Ø§Ù Ùˆ Ø§Ù†Ú¯ÛŒØ²Ù‡â€ŒÙ‡Ø§

            Ù¾Ø§Ø³Ø® Ø±Ø§ Ø¨Ù‡ ØµÙˆØ±Øª JSON Ø¨Ø§ ÙØ±Ù…Øª Ø²ÛŒØ± Ø¨Ø±Ú¯Ø±Ø¯Ø§Ù†:
            [
                {
                    "name": "Ù†Ø§Ù… Ø´Ø®ØµÛŒØª",
                    "role": "protagonist ÛŒØ§ antagonist ÛŒØ§ supporting ÛŒØ§ minor",
                    "physical": "ÙˆÛŒÚ˜Ú¯ÛŒâ€ŒÙ‡Ø§ÛŒ Ø¸Ø§Ù‡Ø±ÛŒ",
                    "personality": "ÙˆÛŒÚ˜Ú¯ÛŒâ€ŒÙ‡Ø§ÛŒ Ø´Ø®ØµÛŒØªÛŒ",
                    "backstory": "Ù¾ÛŒØ´ÛŒÙ†Ù‡ Ùˆ ØªØ§Ø±ÛŒØ®Ú†Ù‡",
                    "goals": "Ø§Ù‡Ø¯Ø§Ù Ùˆ Ø§Ù†Ú¯ÛŒØ²Ù‡â€ŒÙ‡Ø§"
                },
                {...}
            ]
            
            Ø§Ú¯Ø± Ø§Ø·Ù„Ø§Ø¹Ø§ØªÛŒ Ø¯Ø± Ù…ØªÙ† Ù†ÛŒØ§Ù…Ø¯Ù‡ØŒ Ø¢Ù† ÙÛŒÙ„Ø¯ Ø±Ø§ Ø®Ø§Ù„ÛŒ Ø¨Ú¯Ø°Ø§Ø±. ÙÙ‚Ø· JSON Ø®Ø±ÙˆØ¬ÛŒ Ø±Ø§ Ø¨Ø±Ú¯Ø±Ø¯Ø§Ù†ØŒ Ø¨Ø¯ÙˆÙ† Ù‡ÛŒÚ† ØªÙˆØ¶ÛŒØ­ Ø§Ø¶Ø§ÙÛŒ.
            
            Ù…ØªÙ† Ø¯Ø§Ø³ØªØ§Ù†:
            ${storyText}
            `;
            
            // Ø¯Ø±Ø®ÙˆØ§Ø³Øª Ø¨Ù‡ API
            const response = await fetchAIResponse(prompt);
            
            // ØªÙ„Ø§Ø´ Ø¨Ø±Ø§ÛŒ Ù¾Ø§Ø±Ø³ Ú©Ø±Ø¯Ù† Ù¾Ø§Ø³Ø® Ø¨Ù‡ Ø¹Ù†ÙˆØ§Ù† JSON
            let characters = [];
            try {
                // Ø¬Ø¯Ø§ Ú©Ø±Ø¯Ù† Ø¨Ø®Ø´ JSON Ø§Ø² Ù¾Ø§Ø³Ø®
                const jsonMatch = response.match(/\[\s*\{.*?\}\s*\]/s);
                if (jsonMatch) {
                    characters = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('ÙØ±Ù…Øª JSON ÛŒØ§ÙØª Ù†Ø´Ø¯');
                }
            } catch (jsonError) {
                console.error('Ø®Ø·Ø§ Ø¯Ø± Ù¾Ø§Ø±Ø³ Ú©Ø±Ø¯Ù† JSON:', jsonError);
                // ØªÙ„Ø§Ø´ Ø¨Ø±Ø§ÛŒ Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø¯Ø³ØªÛŒ Ø§Ø·Ù„Ø§Ø¹Ø§Øª
                characters = parseCharactersManually(response);
            }
            
            if (characters.length === 0) {
                charactersList.innerHTML = `
                    <div class="no-characters-found">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Ù‡ÛŒÚ† Ø´Ø®ØµÛŒØªÛŒ Ø¯Ø± Ù…ØªÙ† Ø´Ù†Ø§Ø³Ø§ÛŒÛŒ Ù†Ø´Ø¯. Ù„Ø·ÙØ§Ù‹ Ù…ØªÙ† Ø·ÙˆÙ„Ø§Ù†ÛŒâ€ŒØªØ±ÛŒ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯ ÛŒØ§ Ø¬Ø²Ø¦ÛŒØ§Øª Ø¨ÛŒØ´ØªØ±ÛŒ Ø¯Ø±Ø¨Ø§Ø±Ù‡ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§ Ø¨Ù†ÙˆÛŒØ³ÛŒØ¯.</p>
                    </div>
                `;
                return;
            }
            
            // Ø°Ø®ÛŒØ±Ù‡ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§ Ø¯Ø± Ù¾Ø±ÙˆÚ˜Ù‡
            const projectCharacters = currentProject.characters || [];
            characters.forEach(character => {
                // Ø¨Ø±Ø±Ø³ÛŒ ØªÚ©Ø±Ø§Ø±ÛŒ Ù†Ø¨ÙˆØ¯Ù† Ø´Ø®ØµÛŒØª
                const existingIndex = projectCharacters.findIndex(c => c.name && c.name.toLowerCase() === character.name.toLowerCase());
                
                if (existingIndex >= 0) {
                    // Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø´Ø®ØµÛŒØª Ù…ÙˆØ¬ÙˆØ¯
                    projectCharacters[existingIndex] = {
                        ...projectCharacters[existingIndex],
                        ...character,
                        id: projectCharacters[existingIndex].id
                    };
                } else {
                    // Ø§ÙØ²ÙˆØ¯Ù† Ø´Ø®ØµÛŒØª Ø¬Ø¯ÛŒØ¯
                    projectCharacters.push({
                        ...character,
                        id: Date.now() + Math.random().toString(36).substr(2, 9)
                    });
                }
            });
            
            // Ø°Ø®ÛŒØ±Ù‡ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§ Ø¯Ø± Ù¾Ø±ÙˆÚ˜Ù‡
            currentProject.characters = projectCharacters;
            updateProject(currentProject.id, { characters: projectCharacters });
            
            // Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ù„ÛŒØ³Øª Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§
            updateCharactersList();
            
            // Ù†Ù…Ø§ÛŒØ´ Ù¾ÛŒØ§Ù… Ù…ÙˆÙÙ‚ÛŒØª
            showMessage(`${characters.length} Ø´Ø®ØµÛŒØª Ø¨Ø§ Ù…ÙˆÙÙ‚ÛŒØª Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø´Ø¯`);
            
        } catch (error) {
            console.error('Ø®Ø·Ø§ Ø¯Ø± Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§:', error);
            charactersList.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Ø®Ø·Ø§ Ø¯Ø± Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§. Ù„Ø·ÙØ§Ù‹ Ø¯ÙˆØ¨Ø§Ø±Ù‡ ØªÙ„Ø§Ø´ Ú©Ù†ÛŒØ¯.</p>
                </div>
            `;
        }
    }
    
    // ØªØ§Ø¨Ø¹ Ú©Ù…Ú©ÛŒ Ø¨Ø±Ø§ÛŒ Ù¾Ø§Ø±Ø³ Ø¯Ø³ØªÛŒ Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§ Ø¯Ø± ØµÙˆØ±Øª Ø®Ø·Ø§ Ø¯Ø± JSON
    function parseCharactersManually(response) {
        const characters = [];
        
        // Ø§Ù„Ú¯ÙˆÛŒ Ø³Ø§Ø¯Ù‡ Ø¨Ø±Ø§ÛŒ Ø´Ù†Ø§Ø³Ø§ÛŒÛŒ Ø¨Ø®Ø´â€ŒÙ‡Ø§ÛŒ Ù…Ø±Ø¨ÙˆØ· Ø¨Ù‡ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§
        const characterBlocks = response.split(/\d+\.\s*[^:]+:/);
        
        for (let i = 1; i < characterBlocks.length; i++) {
            const block = characterBlocks[i].trim();
            
            // Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ù†Ø§Ù… Ø´Ø®ØµÛŒØª
            const nameMatch = block.match(/Ù†Ø§Ù…[^:]*:\s*([^\n]+)/);
            const name = nameMatch ? nameMatch[1].trim() : '';
            
            if (!name) continue;
            
            // Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø³Ø§ÛŒØ± ÙˆÛŒÚ˜Ú¯ÛŒâ€ŒÙ‡Ø§
            const roleMatch = block.match(/Ù†Ù‚Ø´[^:]*:\s*([^\n]+)/);
            const physicalMatch = block.match(/Ø¸Ø§Ù‡Ø±ÛŒ[^:]*:\s*([^\n]+)/);
            const personalityMatch = block.match(/Ø´Ø®ØµÛŒØªÛŒ[^:]*:\s*([^\n]+)/);
            const backstoryMatch = block.match(/Ù¾ÛŒØ´ÛŒÙ†Ù‡[^:]*:\s*([^\n]+)/);
            const goalsMatch = block.match(/Ø§Ù‡Ø¯Ø§Ù[^:]*:\s*([^\n]+)/);
            
            // ØªØ¨Ø¯ÛŒÙ„ Ù†Ù‚Ø´ Ø¨Ù‡ Ø§Ù†Ú¯Ù„ÛŒØ³ÛŒ
            let role = 'supporting';
            if (roleMatch) {
                const roleText = roleMatch[1].toLowerCase();
                if (roleText.includes('Ø§ØµÙ„ÛŒ')) {
                    role = 'protagonist';
                } else if (roleText.includes('Ø¶Ø¯') || roleText.includes('Ø´Ø±ÙˆØ±') || roleText.includes('Ù…Ù†ÙÛŒ')) {
                    role = 'antagonist';
                } else if (roleText.includes('ÙØ±Ø¹ÛŒ')) {
                    role = 'supporting';
                } else if (roleText.includes('Ø¬Ø²Ø¦ÛŒ')) {
                    role = 'minor';
                }
            }
            
            characters.push({
                name: name,
                role: role,
                physical: physicalMatch ? physicalMatch[1].trim() : '',
                personality: personalityMatch ? personalityMatch[1].trim() : '',
                backstory: backstoryMatch ? backstoryMatch[1].trim() : '',
                goals: goalsMatch ? goalsMatch[1].trim() : ''
            });
        }
        
        return characters;
    }
    
    // Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ù„ÛŒØ³Øª Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§
    function updateCharactersList() {
        const charactersList = document.getElementById('charactersList');
        charactersList.innerHTML = '';
        
        if (!currentProject || !currentProject.characters || currentProject.characters.length === 0) {
            charactersList.innerHTML = `
                <div class="no-characters">
                    <p>Ø´Ø®ØµÛŒØªÛŒ ÛŒØ§ÙØª Ù†Ø´Ø¯. Ø¨Ø±Ø§ÛŒ Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø®ÙˆØ¯Ú©Ø§Ø± Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§ Ø§Ø² Ø¯Ú©Ù…Ù‡ Ø¨Ø§Ù„Ø§ Ø§Ø³ØªÙØ§Ø¯Ù‡ Ú©Ù†ÛŒØ¯.</p>
                </div>
            `;
            return;
        }
        
        // Ù…Ø±ØªØ¨â€ŒØ³Ø§Ø²ÛŒ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§ Ø¨Ø± Ø§Ø³Ø§Ø³ Ù†Ù‚Ø´
        const characters = [...currentProject.characters].sort((a, b) => {
            const roleOrder = { protagonist: 1, antagonist: 2, supporting: 3, minor: 4 };
            return (roleOrder[a.role] || 5) - (roleOrder[b.role] || 5);
        });
        
        characters.forEach(character => {
            const characterItem = document.createElement('div');
            characterItem.className = 'character-item';
            characterItem.dataset.id = character.id;
            
            const roleName = getCharacterRoleName(character.role);
            
            characterItem.innerHTML = `
                <div class="character-item-name">${character.name}</div>
                <div class="character-item-role">${roleName}</div>
            `;
            
            characterItem.addEventListener('click', function() {
                document.querySelectorAll('.character-item').forEach(item => {
                    item.classList.remove('active');
                });
                this.classList.add('active');
                showCharacterDetails(character.id);
            });
            
            charactersList.appendChild(characterItem);
        });
    }
    
    // Ø¯Ø±ÛŒØ§ÙØª Ù†Ø§Ù… ÙØ§Ø±Ø³ÛŒ Ù†Ù‚Ø´ Ø´Ø®ØµÛŒØª
    function getCharacterRoleName(role) {
        switch(role) {
            case 'protagonist': return 'Ø´Ø®ØµÛŒØª Ø§ØµÙ„ÛŒ';
            case 'antagonist': return 'Ø¶Ø¯ Ù‚Ù‡Ø±Ù…Ø§Ù†';
            case 'supporting': return 'Ø´Ø®ØµÛŒØª ÙØ±Ø¹ÛŒ';
            case 'minor': return 'Ø´Ø®ØµÛŒØª Ø¬Ø²Ø¦ÛŒ';
            default: return 'Ù†Ø§Ù…Ø´Ø®Øµ';
        }
    }
    
    // Ù†Ù…Ø§ÛŒØ´ Ø¬Ø²Ø¦ÛŒØ§Øª Ø´Ø®ØµÛŒØª Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡
    function showCharacterDetails(characterId) {
        const character = currentProject.characters.find(c => c.id === characterId);
        if (!character) return;
        
        const noSelectionMessage = document.querySelector('.character-detail-panel .no-selection-message');
        const characterEditForm = document.querySelector('.character-edit-form');
        
        noSelectionMessage.style.display = 'none';
        characterEditForm.style.display = 'block';
        
        // Ù¾Ø± Ú©Ø±Ø¯Ù† ÙØ±Ù… Ø¨Ø§ Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ø´Ø®ØµÛŒØª
        document.getElementById('characterNameInput').value = character.name || '';
        document.getElementById('characterRoleInput').value = character.role || 'supporting';
        document.getElementById('characterPhysicalInput').value = character.physical || '';
        document.getElementById('characterPersonalityInput').value = character.personality || '';
        document.getElementById('characterBackstoryInput').value = character.backstory || '';
        document.getElementById('characterGoalsInput').value = character.goals || '';
        
        // Ø§Ø¶Ø§ÙÙ‡ Ú©Ø±Ø¯Ù† Ø´Ù†Ø§Ø³Ù‡ Ø´Ø®ØµÛŒØª Ø¨Ù‡ ÙØ±Ù…
        characterEditForm.dataset.characterId = characterId;
    }
    
    // Ø§ÛŒØ¬Ø§Ø¯ Ù…ÙˆØ¯Ø§Ù„ ØªÙˆÙ„ÛŒØ¯ Ø§ÛŒØ¯Ù‡
    const ideaModal = document.createElement('div');
    ideaModal.id = 'ideaModal';
    ideaModal.className = 'modal';
    ideaModal.innerHTML = `
        <div class="modal-content idea-modal-content">
            <div class="modal-header">
                <h3>ØªÙˆÙ„ÛŒØ¯ Ø§ÛŒØ¯Ù‡</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="idea-categories">
                    <button class="idea-category-btn active" data-category="character">Ø§ÛŒØ¯Ù‡ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§</button>
                    <button class="idea-category-btn" data-category="story">Ø§ÛŒØ¯Ù‡ Ø¯Ø§Ø³ØªØ§Ù†</button>
                    <button class="idea-category-btn" data-category="dialogue">Ø§ÛŒØ¯Ù‡ Ø¯ÛŒØ§Ù„ÙˆÚ¯</button>
                </div>
                <div class="idea-content">
                    <div class="idea-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Ø¯Ø± Ø­Ø§Ù„ ØªÙˆÙ„ÛŒØ¯ Ø§ÛŒØ¯Ù‡â€ŒÙ‡Ø§ÛŒ Ø¬Ø¯ÛŒØ¯...</p>
                    </div>
                    <div class="idea-result"></div>
                    <div class="idea-error" style="display: none;">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Ø®Ø·Ø§ Ø¯Ø± Ø¯Ø±ÛŒØ§ÙØª Ø§ÛŒØ¯Ù‡â€ŒÙ‡Ø§. Ù„Ø·ÙØ§Ù‹ Ø¯ÙˆØ¨Ø§Ø±Ù‡ ØªÙ„Ø§Ø´ Ú©Ù†ÛŒØ¯.</p>
                    </div>
                </div>
                <div class="idea-actions">
                    <button id="regenerateIdeaBtn" class="btn"><i class="fas fa-sync-alt"></i> ØªÙˆÙ„ÛŒØ¯ Ù…Ø¬Ø¯Ø¯</button>
                    <button id="copyIdeaBtn" class="btn"><i class="fas fa-copy"></i> Ú©Ù¾ÛŒ</button>
                    <button id="useIdeaBtn" class="btn"><i class="fas fa-check"></i> Ø§Ø³ØªÙØ§Ø¯Ù‡</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(ideaModal);
    
    // Ø¹Ù†Ø§ØµØ± Ù…ÙˆØ¯Ø§Ù„ ØªÙˆÙ„ÛŒØ¯ Ø§ÛŒØ¯Ù‡
    const closeIdeaModalBtn = ideaModal.querySelector('.close-modal');
    const ideaCategoryBtns = ideaModal.querySelectorAll('.idea-category-btn');
    const ideaLoading = ideaModal.querySelector('.idea-loading');
    const ideaResult = ideaModal.querySelector('.idea-result');
    const ideaError = ideaModal.querySelector('.idea-error');
    const regenerateIdeaBtn = document.getElementById('regenerateIdeaBtn');
    const copyIdeaBtn = document.getElementById('copyIdeaBtn');
    const useIdeaBtn = document.getElementById('useIdeaBtn');
    
    // Ù…ØªØºÛŒØ± Ø¨Ø±Ø§ÛŒ Ù†Ú¯Ù‡Ø¯Ø§Ø±ÛŒ Ø§ÛŒØ¯Ù‡ ÙØ¹Ù„ÛŒ
    let currentIdea = '';
    let currentCategory = 'character';
    
    // Ø§Ø³ØªØ§ÛŒÙ„ Ø¨Ø±Ø§ÛŒ Ù…ÙˆØ¯Ø§Ù„ ØªÙˆÙ„ÛŒØ¯ Ø§ÛŒØ¯Ù‡
    const ideaStyleElement = document.createElement('style');
    ideaStyleElement.textContent = `
        .idea-modal-content {
            max-width: 600px;
        }
        
        .idea-categories {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        
        .idea-category-btn {
            padding: 8px 15px;
            background-color: var(--light-color);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .idea-category-btn.active {
            background-color: var(--accent-color);
            color: white;
        }
        
        .idea-content {
            min-height: 200px;
            max-height: 400px;
            overflow-y: auto;
            padding: 15px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            margin-bottom: 20px;
        }
        
        .idea-loading, .idea-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 200px;
            gap: 15px;
        }
        
        .idea-loading i, .idea-error i {
            font-size: 2rem;
        }
        
        .idea-error i {
            color: var(--error-color);
        }
        
        .idea-result {
            line-height: 1.6;
        }
        
        .idea-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        
        #generateIdeaBtn {
            background-color: var(--accent-color);
            color: white;
        }
        
        #generateIdeaBtn:hover {
            background-color: var(--accent-hover-color);
        }
    `;
    document.head.appendChild(ideaStyleElement);
    
    // Ø¹Ù†Ø§ØµØ± Ù…Ø¯ÛŒØ±ÛŒØª Ù¾Ø±ÙˆÚ˜Ù‡
    const projectTitleInput = document.getElementById('currentProjectTitle');
    const newProjectBtn = document.getElementById('newProjectBtn');
    const createProjectBtn = document.getElementById('createProjectBtn');
    const newProjectModal = document.getElementById('newProjectModal');
    const closeNewProjectModal = newProjectModal.querySelector('.close-modal');
    
    // Ø¨Ø§Ø²ÛŒØ§Ø¨ÛŒ Ù…ØªÙ† Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯Ù‡
    function loadSavedText() {
        // Ø§Ú¯Ø± Ù¾Ø±ÙˆÚ˜Ù‡ ÙØ¹Ù„ÛŒ ÙˆØ¬ÙˆØ¯ Ù†Ø¯Ø§Ø±Ø¯ØŒ Ù…ØªÙ† Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯Ù‡ Ù‚Ø¨Ù„ÛŒ Ø±Ø§ Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ Ú©Ù†
        if (!currentProject) {
            const savedText = localStorage.getItem('aiWriter_text');
            if (savedText) {
                editor.value = savedText;
                updateWordAndCharCount();
            }
        }
    }
    
    // Ø°Ø®ÛŒØ±Ù‡ Ù…ØªÙ† Ø¯Ø± localStorage Ù‡Ù†Ú¯Ø§Ù… ØªØºÛŒÛŒØ±
    function saveText() {
        if (currentProject) {
            updateProject(currentProject.id, {
                content: editor.value,
                title: document.getElementById('currentProjectTitle').value
            });
        } else {
            localStorage.setItem('aiWriter_text', editor.value);
        }
    }
    
    // Ø±ÙˆÛŒØ¯Ø§Ø¯ ØªØºÛŒÛŒØ± Ù…ØªÙ†
    editor.addEventListener('input', function() {
        updateWordAndCharCount();
        saveText();
    });
    
    // Ø§ÛŒØ¬Ø§Ø¯ Ø§Ù„Ù…Ø§Ù†â€ŒÙ‡Ø§ÛŒ Ø¬Ø³ØªØ¬ÙˆÛŒ Ù…Ø¯Ù„
    function createModelSearchElements() {
        // Ø­Ø°Ù select Ù…ÙˆØ¬ÙˆØ¯
        const parentElement = modelSelect.parentElement;
        parentElement.removeChild(modelSelect);
        
        // Ø§ÛŒØ¬Ø§Ø¯ Ú©Ø§Ù†ØªÛŒÙ†Ø± Ø¬Ø³ØªØ¬Ùˆ
        const searchContainer = document.createElement('div');
        searchContainer.className = 'select-search-container';
        
        // Ø§ÛŒØ¬Ø§Ø¯ ÙˆØ±ÙˆØ¯ÛŒ Ø¬Ø³ØªØ¬Ùˆ
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'modelSearchInput';
        searchInput.className = 'select-search-input';
        searchInput.placeholder = 'Ø¬Ø³ØªØ¬Ùˆ Ø¯Ø± Ù…Ø¯Ù„â€ŒÙ‡Ø§...';
        searchInput.disabled = true;
        
        // Ø§ÛŒØ¬Ø§Ø¯ Ø¢ÛŒÚ©ÙˆÙ† Ø¬Ø³ØªØ¬Ùˆ
        const searchIcon = document.createElement('span');
        searchIcon.className = 'select-search-icon';
        searchIcon.innerHTML = '<i class="fas fa-search"></i>';
        
        // Ø§ÛŒØ¬Ø§Ø¯ Ù„ÛŒØ³Øª Ú©Ø´ÙˆÛŒÛŒ
        const dropdown = document.createElement('div');
        dropdown.className = 'select-search-dropdown';
        dropdown.id = 'modelSearchDropdown';
        
        // Ø§Ø¶Ø§ÙÙ‡ Ú©Ø±Ø¯Ù† Ø§Ù„Ù…Ø§Ù†â€ŒÙ‡Ø§ Ø¨Ù‡ Ú©Ø§Ù†ØªÛŒÙ†Ø±
        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(searchIcon);
        searchContainer.appendChild(dropdown);
        
        // Ø§Ø¶Ø§ÙÙ‡ Ú©Ø±Ø¯Ù† Ú©Ø§Ù†ØªÛŒÙ†Ø± Ø¨Ù‡ ÙˆØ§Ù„Ø¯
        parentElement.insertBefore(searchContainer, parentElement.firstChild);
        
        return {
            container: searchContainer,
            input: searchInput,
            dropdown: dropdown
        };
    }
    
    // Ø§ÛŒØ¬Ø§Ø¯ Ø§Ù„Ù…Ø§Ù†â€ŒÙ‡Ø§ÛŒ Ø¬Ø³ØªØ¬ÙˆÛŒ Ù…Ø¯Ù„
    const modelSearchElements = createModelSearchElements();
    
    // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ú©Ù„ÛŒÚ© Ø±ÙˆÛŒ ÙˆØ±ÙˆØ¯ÛŒ Ø¬Ø³ØªØ¬Ùˆ
    modelSearchElements.input.addEventListener('click', function() {
        if (!this.disabled) {
            toggleSearchDropdown(true);
        }
    });
    
    // Ø±ÙˆÛŒØ¯Ø§Ø¯ ØªØ§ÛŒÙ¾ Ø¯Ø± ÙˆØ±ÙˆØ¯ÛŒ Ø¬Ø³ØªØ¬Ùˆ
    modelSearchElements.input.addEventListener('input', function() {
        filterModels(this.value);
    });
    
    // Ú©Ù„ÛŒÚ© Ø¨ÛŒØ±ÙˆÙ† Ø§Ø² Ù„ÛŒØ³Øª Ú©Ø´ÙˆÛŒÛŒ Ø¨Ø±Ø§ÛŒ Ø¨Ø³ØªÙ† Ø¢Ù†
    document.addEventListener('click', function(event) {
        if (!modelSearchElements.container.contains(event.target)) {
            toggleSearchDropdown(false);
        }
    });
    
    // Ù†Ù…Ø§ÛŒØ´ ÛŒØ§ Ù…Ø®ÙÛŒ Ú©Ø±Ø¯Ù† Ù„ÛŒØ³Øª Ú©Ø´ÙˆÛŒÛŒ
    function toggleSearchDropdown(show) {
        if (show) {
            modelSearchElements.dropdown.classList.add('show');
        } else {
            modelSearchElements.dropdown.classList.remove('show');
        }
    }
    
    // ÙÛŒÙ„ØªØ± Ú©Ø±Ø¯Ù† Ù…Ø¯Ù„â€ŒÙ‡Ø§ Ø¨Ø± Ø§Ø³Ø§Ø³ Ù…ØªÙ† Ø¬Ø³ØªØ¬Ùˆ
    function filterModels(searchText) {
        const options = modelSearchElements.dropdown.querySelectorAll('.select-search-option');
        const categories = modelSearchElements.dropdown.querySelectorAll('.select-search-category');
        
        searchText = searchText.toLowerCase();
        let hasResults = false;
        
        // Ø±Ø³Øª Ú©Ø±Ø¯Ù† Ù†Ù…Ø§ÛŒØ´ Ù‡Ù…Ù‡ Ø¯Ø³ØªÙ‡â€ŒÙ‡Ø§
        categories.forEach(category => {
            category.style.display = 'block';
        });
        
        // Ø¨Ø±Ø±Ø³ÛŒ Ù‡Ø± Ú¯Ø²ÛŒÙ†Ù‡
        options.forEach(option => {
            const text = option.textContent.toLowerCase();
            const categoryId = option.getAttribute('data-category');
            
            if (text.includes(searchText)) {
                option.style.display = 'block';
                hasResults = true;
                
                // Ù†Ù…Ø§ÛŒØ´ Ø¯Ø³ØªÙ‡ Ù…Ø±Ø¨ÙˆØ·Ù‡
                document.querySelector(`.select-search-category[data-category="${categoryId}"]`).style.display = 'block';
            } else {
                option.style.display = 'none';
            }
        });
        
        // Ù¾Ù†Ù‡Ø§Ù† Ú©Ø±Ø¯Ù† Ø¯Ø³ØªÙ‡â€ŒÙ‡Ø§ÛŒ Ø®Ø§Ù„ÛŒ
        categories.forEach(category => {
            const categoryId = category.getAttribute('data-category');
            const visibleOptions = modelSearchElements.dropdown.querySelectorAll(`.select-search-option[data-category="${categoryId}"]:not([style*="display: none"])`);
            
            if (visibleOptions.length === 0) {
                category.style.display = 'none';
            }
        });
        
        // Ù†Ù…Ø§ÛŒØ´ Ù¾ÛŒØ§Ù… "Ù†ØªÛŒØ¬Ù‡â€ŒØ§ÛŒ ÛŒØ§ÙØª Ù†Ø´Ø¯" Ø§Ú¯Ø± Ù‡ÛŒÚ† Ù…Ø¯Ù„ÛŒ Ù¾ÛŒØ¯Ø§ Ù†Ø´Ø¯
        const noResultsElement = modelSearchElements.dropdown.querySelector('.select-search-no-results');
        if (noResultsElement) {
            noResultsElement.style.display = hasResults ? 'none' : 'block';
        }
    }
    
    // Ø§Ú¯Ø± Ø§Ø² Ù‚Ø¨Ù„ Ú©Ù„ÛŒØ¯ API Ùˆ Ù…Ø¯Ù„ Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯Ù‡â€ŒØ§Ù†Ø¯ØŒ Ø¢Ù†â€ŒÙ‡Ø§ Ø±Ø§ Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ Ú©Ù†ÛŒÙ…
    function loadSavedSettings() {
        if (apiKey) {
            apiKeyInput.value = apiKey;
            validateApiKey();
        }
    }
    
    // Ø°Ø®ÛŒØ±Ù‡ ØªÙ†Ø¸ÛŒÙ…Ø§Øª
    saveSettingsBtn.addEventListener('click', function() {
        if (!isApiConnected) {
            alert('Ù„Ø·ÙØ§Ù‹ Ø§Ø¨ØªØ¯Ø§ Ø§Ø¹ØªØ¨Ø§Ø± API Ø±Ø§ Ø¨Ø±Ø±Ø³ÛŒ Ú©Ù†ÛŒØ¯.');
            return;
        }
        
        // Ø¨Ø±Ø±Ø³ÛŒ Ø§ÛŒÙ†Ú©Ù‡ Ø¢ÛŒØ§ Ù…Ø¯Ù„ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡ Ø§Ø³Øª
        const selectedModelId = getSelectedModelId();
        if (!selectedModelId) {
            alert('Ù„Ø·ÙØ§Ù‹ ÛŒÚ© Ù…Ø¯Ù„ Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ù†ÛŒØ¯.');
            return;
        }
        
        // Ø°Ø®ÛŒØ±Ù‡ ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ø¯Ø± localStorage
        localStorage.setItem('aiWriter_apiKey', apiKey);
        localStorage.setItem('aiWriter_selectedModel', selectedModelId);
        selectedModel = selectedModelId;
        
        // Ù†Ù…Ø§ÛŒØ´ Ù¾ÛŒØ§Ù… Ù…ÙˆÙÙ‚ÛŒØª
        alert('ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ø¨Ø§ Ù…ÙˆÙÙ‚ÛŒØª Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯.');
        
        // Ø¨Ø³ØªÙ† Ù…ÙˆØ¯Ø§Ù„
        settingsModal.classList.remove('show');
    });
    
    // Ø¯Ø±ÛŒØ§ÙØª Ø´Ù†Ø§Ø³Ù‡ Ù…Ø¯Ù„ Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡
    function getSelectedModelId() {
        const selected = modelSearchElements.dropdown.querySelector('.select-search-option.selected');
        return selected ? selected.getAttribute('data-value') : '';
    }
    
    // Ø¨Ø§Ø² Ùˆ Ø¨Ø³ØªÙ‡ Ú©Ø±Ø¯Ù† Ù…ÙˆØ¯Ø§Ù„ ØªÙ†Ø¸ÛŒÙ…Ø§Øª
    settingsBtn.addEventListener('click', function() {
        settingsModal.classList.add('show');
    });
    
    closeModalBtn.addEventListener('click', function() {
        settingsModal.classList.remove('show');
    });
    
    // Ú©Ù„ÛŒÚ© Ø®Ø§Ø±Ø¬ Ø§Ø² Ù…ÙˆØ¯Ø§Ù„ Ø¨Ø±Ø§ÛŒ Ø¨Ø³ØªÙ† Ø¢Ù†
    window.addEventListener('click', function(event) {
        if (event.target === settingsModal) {
            settingsModal.classList.remove('show');
        }
    });
    
    // Ø¨Ø±Ø±Ø³ÛŒ Ø§Ø¹ØªØ¨Ø§Ø± Ú©Ù„ÛŒØ¯ API
    validateApiBtn.addEventListener('click', validateApiKey);
    
    async function validateApiKey() {
        const key = apiKeyInput.value.trim();
        
        if (!key) {
            alert('Ù„Ø·ÙØ§Ù‹ ÛŒÚ© Ú©Ù„ÛŒØ¯ API ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.');
            return;
        }
        
        // ØªØºÛŒÛŒØ± ÙˆØ¶Ø¹ÛŒØª Ù†Ù…Ø§ÛŒØ´ÛŒ
        apiStatus.className = 'api-status checking';
        apiStatus.innerHTML = '<i class="fas fa-spinner"></i>';
        validateApiBtn.disabled = true;
        
        try {
            // Ø¯Ø±ÛŒØ§ÙØª Ù„ÛŒØ³Øª Ù…Ø¯Ù„â€ŒÙ‡Ø§ Ø§Ø² Ø§ÙˆÙ¾Ù† Ø±ÙˆØªØ±
            const response = await fetch('https://openrouter.ai/api/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Ø®Ø·Ø§ Ø¯Ø± Ø§Ø¹ØªØ¨Ø§Ø±Ø³Ù†Ø¬ÛŒ API');
            }
            
            const data = await response.json();
            
            // Ø§Ú¯Ø± Ø¨Ø§ Ù…ÙˆÙÙ‚ÛŒØª Ø¯Ø±ÛŒØ§ÙØª Ø´Ø¯ØŒ Ù„ÛŒØ³Øª Ù…Ø¯Ù„â€ŒÙ‡Ø§ Ø±Ø§ Ø°Ø®ÛŒØ±Ù‡ Ú©Ù†ÛŒÙ…
            availableModels = data.data || [];
            
            // ÙˆØ¶Ø¹ÛŒØª Ø§ØªØµØ§Ù„ Ø±Ø§ Ø¨Ù‡ Ù…ØªØµÙ„ ØªØºÛŒÛŒØ± Ø¯Ù‡ÛŒÙ…
            apiStatus.className = 'api-status connected';
            apiStatus.innerHTML = '<i class="fas fa-check-circle"></i>';
            isApiConnected = true;
            
            // ÙØ¹Ø§Ù„ Ú©Ø±Ø¯Ù† Ø§Ù†ØªØ®Ø§Ø¨ Ù…Ø¯Ù„
            modelSearchElements.input.disabled = false;
            
            // Ù¾Ø± Ú©Ø±Ø¯Ù† Ù„ÛŒØ³Øª Ù…Ø¯Ù„â€ŒÙ‡Ø§
            populateModelSearchDropdown(availableModels);
            
            // ÙØ¹Ø§Ù„ Ú©Ø±Ø¯Ù† Ø¯Ú©Ù…Ù‡ Ø°Ø®ÛŒØ±Ù‡
            saveSettingsBtn.classList.remove('disabled');
            
            // Ø°Ø®ÛŒØ±Ù‡ Ú©Ù„ÛŒØ¯ API
            apiKey = key;
            
        } catch (error) {
            console.error(error);
            apiStatus.className = 'api-status not-connected';
            apiStatus.innerHTML = '<i class="fas fa-times-circle"></i>';
            isApiConnected = false;
            
            // ØºÛŒØ±ÙØ¹Ø§Ù„ Ú©Ø±Ø¯Ù† Ø§Ù†ØªØ®Ø§Ø¨ Ù…Ø¯Ù„
            modelSearchElements.input.disabled = true;
            modelSearchElements.dropdown.innerHTML = '';
            modelSearchElements.input.value = '';
            
            // Ù†Ù…Ø§ÛŒØ´ Ø®Ø·Ø§
            alert('Ú©Ù„ÛŒØ¯ API Ù†Ø§Ù…Ø¹ØªØ¨Ø± Ø§Ø³Øª ÛŒØ§ Ø®Ø·Ø§ÛŒÛŒ Ø¯Ø± Ø§ØªØµØ§Ù„ Ø±Ø® Ø¯Ø§Ø¯Ù‡ Ø§Ø³Øª.');
        } finally {
            validateApiBtn.disabled = false;
        }
    }
    
    // Ù¾Ø± Ú©Ø±Ø¯Ù† Ù„ÛŒØ³Øª Ú©Ø´ÙˆÛŒÛŒ Ù…Ø¯Ù„â€ŒÙ‡Ø§
    function populateModelSearchDropdown(models) {
        // Ù…Ø±ØªØ¨â€ŒØ³Ø§Ø²ÛŒ Ù…Ø¯Ù„â€ŒÙ‡Ø§ Ø¨Ø± Ø§Ø³Ø§Ø³ Ø§Ø±Ø§Ø¦Ù‡â€ŒØ¯Ù‡Ù†Ø¯Ù‡
        const modelsByProvider = {};
        
        models.forEach(model => {
            const provider = model.provider || 'Ù†Ø§Ù…Ø´Ø®Øµ';
            if (!modelsByProvider[provider]) {
                modelsByProvider[provider] = [];
            }
            modelsByProvider[provider].push(model);
        });
        
        // ØªØ®Ù„ÛŒÙ‡ Ù„ÛŒØ³Øª Ú©Ø´ÙˆÛŒÛŒ
        modelSearchElements.dropdown.innerHTML = '';
        
        // Ø§Ø¶Ø§ÙÙ‡ Ú©Ø±Ø¯Ù† Ù…Ø¯Ù„â€ŒÙ‡Ø§ Ø¨Ù‡ Ù„ÛŒØ³Øª Ú©Ø´ÙˆÛŒÛŒ Ø¨Ø§ Ú¯Ø±ÙˆÙ‡â€ŒØ¨Ù†Ø¯ÛŒ Ùˆ Ù…Ø±ØªØ¨â€ŒØ³Ø§Ø²ÛŒ
        const sortedProviders = Object.keys(modelsByProvider).sort();
        
        // Ø§Ú¯Ø± Ù‡ÛŒÚ† Ù…Ø¯Ù„ÛŒ ÙˆØ¬ÙˆØ¯ Ù†Ø¯Ø§Ø´Øª
        if (sortedProviders.length === 0) {
            const noModels = document.createElement('div');
            noModels.className = 'select-search-no-results';
            noModels.textContent = 'Ù‡ÛŒÚ† Ù…Ø¯Ù„ÛŒ ÛŒØ§ÙØª Ù†Ø´Ø¯';
            modelSearchElements.dropdown.appendChild(noModels);
            return;
        }
        
        // Ø§Ø¶Ø§ÙÙ‡ Ú©Ø±Ø¯Ù† Ø¹Ù†ØµØ± Ø¨Ø±Ø§ÛŒ Ù†Ù…Ø§ÛŒØ´ "Ù†ØªÛŒØ¬Ù‡â€ŒØ§ÛŒ ÛŒØ§ÙØª Ù†Ø´Ø¯" Ø¯Ø± Ø­Ø§Ù„Øª Ø¬Ø³ØªØ¬Ùˆ
        const noResults = document.createElement('div');
        noResults.className = 'select-search-no-results';
        noResults.textContent = 'Ù†ØªÛŒØ¬Ù‡â€ŒØ§ÛŒ Ø¨Ø±Ø§ÛŒ Ø¬Ø³ØªØ¬ÙˆÛŒ Ø´Ù…Ø§ ÛŒØ§ÙØª Ù†Ø´Ø¯';
        noResults.style.display = 'none';
        modelSearchElements.dropdown.appendChild(noResults);
        
        // Ø§Ø¶Ø§ÙÙ‡ Ú©Ø±Ø¯Ù† Ø§Ø±Ø§Ø¦Ù‡â€ŒØ¯Ù‡Ù†Ø¯Ú¯Ø§Ù† Ùˆ Ù…Ø¯Ù„â€ŒÙ‡Ø§ÛŒ Ø¢Ù†â€ŒÙ‡Ø§ Ø¨Ù‡ ØªØ±ØªÛŒØ¨ Ø§Ù„ÙØ¨Ø§ÛŒÛŒ
        sortedProviders.forEach((provider, providerIndex) => {
            // Ø§Ø¶Ø§ÙÙ‡ Ú©Ø±Ø¯Ù† Ø¹Ù†ÙˆØ§Ù† Ø¯Ø³ØªÙ‡
            const category = document.createElement('div');
            category.className = 'select-search-category';
            category.textContent = provider;
            category.setAttribute('data-category', `category-${providerIndex}`);
            modelSearchElements.dropdown.appendChild(category);
            
            // Ù…Ø±ØªØ¨â€ŒØ³Ø§Ø²ÛŒ Ù…Ø¯Ù„â€ŒÙ‡Ø§ Ø¯Ø± Ù‡Ø± Ø¯Ø³ØªÙ‡ Ø¨Ø± Ø§Ø³Ø§Ø³ Ù†Ø§Ù…
            const sortedModels = modelsByProvider[provider].sort((a, b) => {
                const nameA = a.name || a.id;
                const nameB = b.name || b.id;
                return nameA.localeCompare(nameB);
            });
            
            // Ø§Ø¶Ø§ÙÙ‡ Ú©Ø±Ø¯Ù† Ù…Ø¯Ù„â€ŒÙ‡Ø§
            sortedModels.forEach(model => {
                const option = document.createElement('div');
                option.className = 'select-search-option';
                option.textContent = model.name || model.id;
                option.setAttribute('data-value', model.id);
                option.setAttribute('data-category', `category-${providerIndex}`);
                
                // Ø§Ú¯Ø± Ø§ÛŒÙ† Ù…Ø¯Ù„ Ù‚Ø¨Ù„Ø§Ù‹ Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡ØŒ Ø¢Ù† Ø±Ø§ Ø¹Ù„Ø§Ù…Øªâ€ŒÚ¯Ø°Ø§Ø±ÛŒ Ú©Ù†ÛŒÙ…
                if (selectedModel === model.id) {
                    option.classList.add('selected');
                    modelSearchElements.input.value = option.textContent;
                    updateModelInfo(model);
                }
                
                // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ú©Ù„ÛŒÚ© Ø¨Ø±Ø§ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ù…Ø¯Ù„
                option.addEventListener('click', function() {
                    // Ø­Ø°Ù Ú©Ù„Ø§Ø³ Ø§Ù†ØªØ®Ø§Ø¨ Ø§Ø² Ù‡Ù…Ù‡ Ú¯Ø²ÛŒÙ†Ù‡â€ŒÙ‡Ø§
                    const allOptions = modelSearchElements.dropdown.querySelectorAll('.select-search-option');
                    allOptions.forEach(opt => opt.classList.remove('selected'));
                    
                    // Ø§Ø¶Ø§ÙÙ‡ Ú©Ø±Ø¯Ù† Ú©Ù„Ø§Ø³ Ø§Ù†ØªØ®Ø§Ø¨ Ø¨Ù‡ Ø§ÛŒÙ† Ú¯Ø²ÛŒÙ†Ù‡
                    this.classList.add('selected');
                    
                    // Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ù…ØªÙ† ÙˆØ±ÙˆØ¯ÛŒ
                    modelSearchElements.input.value = this.textContent;
                    
                    // Ø¨Ø³ØªÙ† Ù„ÛŒØ³Øª Ú©Ø´ÙˆÛŒÛŒ
                    toggleSearchDropdown(false);
                    
                    // Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ù…Ø¯Ù„
                    const modelId = this.getAttribute('data-value');
                    const model = availableModels.find(m => m.id === modelId);
                    if (model) {
                        updateModelInfo(model);
                    }
                });
                
                modelSearchElements.dropdown.appendChild(option);
            });
        });
    }
    
    // Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ù…Ø¯Ù„ Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡
    function updateModelInfo(model) {
        let infoHTML = '';
        
        if (model.name) {
            infoHTML += `<p><strong>Ù†Ø§Ù…: </strong>${model.name}</p>`;
        }
        
        infoHTML += `<p><strong>Ø§Ø±Ø§Ø¦Ù‡â€ŒØ¯Ù‡Ù†Ø¯Ù‡: </strong>${model.provider || 'Ù†Ø§Ù…Ø´Ø®Øµ'}</p>`;
        
        if (model.description) {
            infoHTML += `<p><strong>ØªÙˆØ¶ÛŒØ­Ø§Øª: </strong>${model.description}</p>`;
        }
        
        if (model.context_length) {
            infoHTML += `<p><strong>Ø­Ø¯Ø§Ú©Ø«Ø± Ø·ÙˆÙ„ Ù…ØªÙ†: </strong>${model.context_length.toLocaleString()} Ú©Ø§Ø±Ø§Ú©ØªØ±</p>`;
        }
        
        modelInfo.innerHTML = infoHTML;
    }
    
    // Ú©Ù†ØªØ±Ù„ ÙˆÛŒÚ˜Ú¯ÛŒ ØªØ¹Ø¯Ø§Ø¯ Ú©Ù„Ù…Ø§Øª Ùˆ Ú©Ø§Ø±Ø§Ú©ØªØ±Ù‡Ø§
    function updateWordAndCharCount() {
        const text = editor.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        const chars = text.length;
        
        wordCountElement.textContent = words;
        charCountElement.textContent = chars;
    }
    
    // Ø¯Ú©Ù…Ù‡ Ù¾Ø§Ú© Ú©Ø±Ø¯Ù†
    clearBtn.addEventListener('click', function() {
        if (confirm('Ø¢ÛŒØ§ Ù…Ø·Ù…Ø¦Ù† Ù‡Ø³ØªÛŒØ¯ Ú©Ù‡ Ù…ÛŒâ€ŒØ®ÙˆØ§Ù‡ÛŒØ¯ Ù…ØªÙ† Ø±Ø§ Ù¾Ø§Ú© Ú©Ù†ÛŒØ¯ØŸ')) {
            editor.value = '';
            updateWordAndCharCount();
            localStorage.removeItem('aiWriter_text');
        }
    });
    
    // Ø¯Ú©Ù…Ù‡ Ú©Ù¾ÛŒ
    copyBtn.addEventListener('click', function() {
        editor.select();
        document.execCommand('copy');
        
        // Ø§Ù†ÛŒÙ…ÛŒØ´Ù† ØªØ£ÛŒÛŒØ¯ Ú©Ù¾ÛŒ Ø´Ø¯Ù†
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-check"></i> Ú©Ù¾ÛŒ Ø´Ø¯';
        
        setTimeout(() => {
            this.innerHTML = originalText;
        }, 2000);
    });
    
    // Ø¯Ú©Ù…Ù‡ Ø°Ø®ÛŒØ±Ù‡
    saveBtn.addEventListener('click', function() {
        const text = editor.value;
        const blob = new Blob([text], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Ù…ØªÙ†-Ù…Ù†.txt';
        a.click();
        
        URL.revokeObjectURL(url);
    });
    
    // Ø¯Ú©Ù…Ù‡ Ú©Ù…Ú© Ù‡ÙˆØ´Ù…Ù†Ø¯
    aiHelpBtn.addEventListener('click', async function() {
        const text = editor.value.trim();
        
        if (text) {
            // Ø¨Ø±Ø±Ø³ÛŒ Ø¢ÛŒØ§ Ú©Ø§Ø±Ø¨Ø± API Ùˆ Ù…Ø¯Ù„ Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ø±Ø¯Ù‡ Ø§Ø³Øª
            if (!apiKey || !selectedModel) {
                alert('Ù„Ø·ÙØ§Ù‹ Ø§Ø¨ØªØ¯Ø§ API Ùˆ Ù…Ø¯Ù„ Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ Ø±Ø§ Ø¯Ø± ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ù¾ÛŒÚ©Ø±Ø¨Ù†Ø¯ÛŒ Ú©Ù†ÛŒØ¯.');
                settingsModal.classList.add('show');
                return;
            }
            
            // Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ù…ØªÙ† Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡ Ùˆ Ù…ØªÙ† Ú©Ø§Ù…Ù„ Ø±Ø§ Ø¨Ø§ Ù‡Ù… Ù†Ù…Ø§ÛŒØ´ Ù…ÛŒâ€ŒØ¯Ù‡ÛŒÙ…
            let suggestions = [];
            
            // Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ø¨Ø±Ø§ÛŒ Ù…ØªÙ† Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡
            const selectedText = getSelectedText();
            if (selectedText) {
                const selectedSuggestions = generateSelectedTextSuggestions(selectedText);
                suggestions = [...suggestions, ...selectedSuggestions];
            }
            
            // Ù‡Ù…ÛŒØ´Ù‡ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ù…ØªÙ† Ú©Ø§Ù…Ù„ Ø±Ø§ Ù†Ù…Ø§ÛŒØ´ Ø¨Ø¯Ù‡
            const fullTextSuggestions = generateFullTextSuggestions(text);
            suggestions = [...suggestions, ...fullTextSuggestions];
            
            // Ù†Ù…Ø§ÛŒØ´ Ù‡Ù…Ù‡ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª
            displaySuggestions(suggestions);
        } else {
            alert('Ù„Ø·ÙØ§Ù‹ Ø§Ø¨ØªØ¯Ø§ Ù…ØªÙ†ÛŒ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.');
        }
    });
    
    // Ø¯Ø±ÛŒØ§ÙØª Ù…ØªÙ† Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡
    function getSelectedText() {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        
        if (start !== end) {
            return {
                text: editor.value.substring(start, end),
                start: start,
                end: end
            };
        }
        
        return null;
    }
    
    // ØªÙˆÙ„ÛŒØ¯ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ø¨Ø±Ø§ÛŒ Ú©Ù„ Ù…ØªÙ† - Ø¨Ø¯ÙˆÙ† ØªÙˆÙ„ÛŒØ¯ Ù…Ø­ØªÙˆØ§
    function generateFullTextSuggestions(text) {
        // Ø§Ø±Ø§Ø¦Ù‡ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ø¨Ø¯ÙˆÙ† Ø¯Ø±ÛŒØ§ÙØª Ù…Ø­ØªÙˆØ§ Ø§Ø² API
        return [
            {
                title: 'Ø§Ø¯Ø§Ù…Ù‡ Ù…ØªÙ† Ø¯Ø§Ø³ØªØ§Ù†',
                text: 'Ú†Ù†Ø¯ Ù¾Ø§Ø±Ø§Ú¯Ø±Ø§Ù Ù¾ÛŒÙˆØ³ØªÙ‡ Ùˆ Ù…Ù†Ø³Ø¬Ù… Ø¨Ø±Ø§ÛŒ Ø§Ø¯Ø§Ù…Ù‡ Ø¯Ø§Ø³ØªØ§Ù† Ø´Ù…Ø§',
                type: 'completion',
                prompt: `Ø´Ù…Ø§ ÛŒÚ© Ù†ÙˆÛŒØ³Ù†Ø¯Ù‡ Ø¯Ø§Ø³ØªØ§Ù† Ø­Ø±ÙÙ‡â€ŒØ§ÛŒ Ùˆ Ø®Ø¨Ø±Ù‡ Ù‡Ø³ØªÛŒØ¯. 

Ø§Ø¨ØªØ¯Ø§ Ø¯Ø§Ø³ØªØ§Ù† Ø²ÛŒØ± Ø±Ø§ Ø¨Ø§ Ø¯Ù‚Øª Ù…Ø·Ø§Ù„Ø¹Ù‡ Ú©Ù†ÛŒØ¯. Ø³Ù¾Ø³ ÛŒÚ© Ø®Ù„Ø§ØµÙ‡ Ø°Ù‡Ù†ÛŒ Ø§Ø² Ø¯Ø§Ø³ØªØ§Ù†ØŒ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§ØŒ Ù…ÙˆÙ‚Ø¹ÛŒØªâ€ŒÙ‡Ø§ Ùˆ Ù†Ù‚Ø·Ù‡â€ŒØ§ÛŒ Ú©Ù‡ Ø¯Ø§Ø³ØªØ§Ù† Ù‚Ø·Ø¹ Ø´Ø¯Ù‡ ØªÙ‡ÛŒÙ‡ Ú©Ù†ÛŒØ¯ØŒ Ø§Ù…Ø§ Ø§ÛŒÙ† Ø®Ù„Ø§ØµÙ‡ Ø±Ø§ Ù†Ù†ÙˆÛŒØ³ÛŒØ¯.

Ø¯Ø§Ø³ØªØ§Ù† Ø±Ø§ Ø¯Ù‚ÛŒÙ‚Ø§Ù‹ Ø§Ø² Ù‡Ù…Ø§Ù† Ù†Ù‚Ø·Ù‡â€ŒØ§ÛŒ Ú©Ù‡ Ù‚Ø·Ø¹ Ø´Ø¯Ù‡ Ø§Ø¯Ø§Ù…Ù‡ Ø¯Ù‡ÛŒØ¯ØŒ Ø¨Ø¯ÙˆÙ† Ù‡ÛŒÚ† Ù…Ù‚Ø¯Ù…Ù‡ ÛŒØ§ ØªÙˆØ¶ÛŒØ­ Ø§Ø¶Ø§ÙÛŒ. Ø­ØªÛŒ ÛŒÚ© Ú©Ù„Ù…Ù‡ ØªÙˆØ¶ÛŒØ­ ÛŒØ§ Ù…Ù‚Ø¯Ù…Ù‡ Ù†Ù†ÙˆÛŒØ³ÛŒØ¯ØŒ ÙÙ‚Ø· Ø§Ø¯Ø§Ù…Ù‡ Ù…Ø³ØªÙ‚ÛŒÙ… Ø¯Ø§Ø³ØªØ§Ù† Ø±Ø§ Ø¨Ù†ÙˆÛŒØ³ÛŒØ¯.

Ø§Ø¯Ø§Ù…Ù‡ Ø¯Ø§Ø³ØªØ§Ù† Ø¨Ø§ÛŒØ¯:
1. Ú©Ø§Ù…Ù„Ø§Ù‹ Ø¨Ø§ Ø¨Ø®Ø´â€ŒÙ‡Ø§ÛŒ Ù‚Ø¨Ù„ÛŒ Ø¯Ø§Ø³ØªØ§Ù† ÛŒÚ©Ù¾Ø§Ø±Ú†Ù‡ Ùˆ Ù…Ø±ØªØ¨Ø· Ø¨Ø§Ø´Ø¯
2. Ù‡Ù…Ø§Ù† Ø³Ø¨Ú© Ù†Ú¯Ø§Ø±Ø´ÛŒØŒ Ù„Ø­Ù† Ùˆ ÙØ¶Ø§ÛŒ Ø¯Ø§Ø³ØªØ§Ù† Ø§ØµÙ„ÛŒ Ø±Ø§ Ø­ÙØ¸ Ú©Ù†Ø¯
3. Ø¨Ù‡ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§ØŒ Ø¬Ø²Ø¦ÛŒØ§Øª Ùˆ Ø¯Ù†ÛŒØ§ÛŒ Ø¯Ø§Ø³ØªØ§Ù† ÙˆÙØ§Ø¯Ø§Ø± Ø¨Ø§Ø´Ø¯
4. Ø¨Ù‡ Ø·ÙˆØ± Ù…Ù†Ø·Ù‚ÛŒ Ø±ÙˆÛŒØ¯Ø§Ø¯Ù‡Ø§ Ùˆ Ù…ÙˆÙ‚Ø¹ÛŒØªâ€ŒÙ‡Ø§ÛŒ Ù…ÙˆØ¬ÙˆØ¯ Ø±Ø§ Ú¯Ø³ØªØ±Ø´ Ø¯Ù‡Ø¯
5. Ø­Ø¯Ø§Ù‚Ù„ 3 Ù¾Ø§Ø±Ø§Ú¯Ø±Ø§Ù Ù…Ù†Ø³Ø¬Ù… Ùˆ Ù…Ø±ØªØ¨Ø· Ø¨Ù‡ Ù‡Ù… Ø¨Ø§Ø´Ø¯
6. Ø¨Ù‡ â€ŒØ·ÙˆØ± Ø·Ø¨ÛŒØ¹ÛŒ Ùˆ Ø±ÙˆØ§Ù† Ø§Ø² Ø¢Ø®Ø±ÛŒÙ† Ø¬Ù…Ù„Ù‡ Ø¯Ø§Ø³ØªØ§Ù† Ø§ØµÙ„ÛŒ Ø§Ø¯Ø§Ù…Ù‡ ÛŒØ§Ø¨Ø¯
7. Ù‡ÛŒÚ† Ø¨Ø§Ø²Ú¯ÙˆÛŒÛŒ ÛŒØ§ Ø®Ù„Ø§ØµÙ‡â€ŒØ§ÛŒ Ø§Ø² Ù‚Ø³Ù…Øªâ€ŒÙ‡Ø§ÛŒ Ù‚Ø¨Ù„ÛŒ Ø¯Ø§Ø³ØªØ§Ù† Ù†Ø¯Ø§Ø´ØªÙ‡ Ø¨Ø§Ø´Ø¯

Ø¯Ø§Ø³ØªØ§Ù† Ø§ØµÙ„ÛŒ:
"""
${text}
"""

Ø§Ø¯Ø§Ù…Ù‡ Ù…Ø³ØªÙ‚ÛŒÙ… Ø¯Ø§Ø³ØªØ§Ù† Ø§Ø² Ø¯Ù‚ÛŒÙ‚Ø§Ù‹ Ù‡Ù…Ø§Ù† Ù†Ù‚Ø·Ù‡â€ŒØ§ÛŒ Ú©Ù‡ Ù‚Ø·Ø¹ Ø´Ø¯Ù‡ Ø§Ø³Øª:`,
                needsFetch: true
            },
            {
                title: 'Ø§ØµÙ„Ø§Ø­ Ø³Ø¨Ú© Ù†Ú¯Ø§Ø±Ø´',
                text: 'Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ Ø§ØµÙ„Ø§Ø­ Ø³Ø¨Ú© Ù†Ú¯Ø§Ø±Ø´ÛŒ Ù…ØªÙ† Ø´Ù…Ø§',
                type: 'style',
                prompt: `Ø´Ù…Ø§ ÛŒÚ© ÙˆÛŒØ±Ø§Ø³ØªØ§Ø± Ø­Ø±ÙÙ‡â€ŒØ§ÛŒ Ù‡Ø³ØªÛŒØ¯. Ù„Ø·ÙØ§Ù‹ Ø§ÛŒÙ† Ù…ØªÙ† Ø±Ø§ Ø§Ø² Ù†Ø¸Ø± Ø³Ø¨Ú© Ù†Ú¯Ø§Ø±Ø´ÛŒ Ø¨Ø±Ø±Ø³ÛŒ Ú©Ù†ÛŒØ¯ Ùˆ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ù…Ø´Ø®Øµ Ùˆ Ú©Ø§Ø±Ø¨Ø±Ø¯ÛŒ Ø¨Ø±Ø§ÛŒ Ø¨Ù‡Ø¨ÙˆØ¯ Ø¢Ù† Ø§Ø±Ø§Ø¦Ù‡ Ø¯Ù‡ÛŒØ¯. Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ø¨Ø§ÛŒØ¯ Ù…Ø³ØªÙ‚ÛŒÙ…Ø§Ù‹ Ø¨Ù‡ Ù†Ù‚Ø§Ø· Ù‚ÙˆØª Ùˆ Ø¶Ø¹Ù Ø³Ø¨Ú© Ù†Ú¯Ø§Ø±Ø´ÛŒ Ø§Ø´Ø§Ø±Ù‡ Ú©Ù†Ù†Ø¯:

"""
${text}
"""`,
                needsFetch: true
            },
            {
                title: 'Ø¨Ù‡Ø¨ÙˆØ¯ Ø§Ù†Ø³Ø¬Ø§Ù…',
                text: 'Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ Ø¨Ù‡Ø¨ÙˆØ¯ Ø§Ù†Ø³Ø¬Ø§Ù… Ùˆ Ø§Ø±ØªØ¨Ø§Ø· Ø¨ÛŒÙ† Ø¨Ø®Ø´â€ŒÙ‡Ø§ÛŒ Ù…ØªÙ† Ø´Ù…Ø§',
                type: 'coherence',
                prompt: `Ø´Ù…Ø§ ÛŒÚ© ÙˆÛŒØ±Ø§Ø³ØªØ§Ø± Ù…ØªØ®ØµØµ Ø¯Ø± Ø§Ù†Ø³Ø¬Ø§Ù… Ù…ØªÙ† Ù‡Ø³ØªÛŒØ¯. Ù„Ø·ÙØ§Ù‹ Ø§ÛŒÙ† Ù…ØªÙ† Ø±Ø§ Ø§Ø² Ù†Ø¸Ø± Ø§Ù†Ø³Ø¬Ø§Ù…ØŒ Ù¾ÛŒÙˆØ³ØªÚ¯ÛŒ Ùˆ Ø§Ø±ØªØ¨Ø§Ø· Ù…Ù†Ø·Ù‚ÛŒ Ø¨ÛŒÙ† Ø¨Ø®Ø´â€ŒÙ‡Ø§ Ø¨Ø±Ø±Ø³ÛŒ Ú©Ù†ÛŒØ¯ Ùˆ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ù…Ø´Ø®Øµ Ø¨Ø±Ø§ÛŒ Ø¨Ù‡Ø¨ÙˆØ¯ Ø¢Ù† Ø§Ø±Ø§Ø¦Ù‡ Ø¯Ù‡ÛŒØ¯:

"""
${text}
"""`,
                needsFetch: true
            }
        ];
    }
    
    // ØªÙˆÙ„ÛŒØ¯ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ø¨Ø±Ø§ÛŒ Ù…ØªÙ† Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡ - Ø¨Ø¯ÙˆÙ† ØªÙˆÙ„ÛŒØ¯ Ù…Ø­ØªÙˆØ§
    function generateSelectedTextSuggestions(selection) {
        // Ø§Ø±Ø§Ø¦Ù‡ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ø¨Ø¯ÙˆÙ† Ø¯Ø±ÛŒØ§ÙØª Ù…Ø­ØªÙˆØ§ Ø§Ø² API
        return [
            {
                title: 'Ø¨Ø§Ø²Ù†ÙˆÛŒØ³ÛŒ Ù¾Ø§Ø±Ø§Ú¯Ø±Ø§Ù',
                text: 'Ø¨Ø§Ø²Ù†ÙˆÛŒØ³ÛŒ Ù…ØªÙ† Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡ Ø¨Ø§ Ø³Ø§Ø®ØªØ§Ø± Ø±Ø³Ù…ÛŒâ€ŒØªØ± Ùˆ Ù…Ù†Ø³Ø¬Ù…â€ŒØªØ±',
                type: 'rewrite',
                selectionData: selection,
                prompt: `Ø´Ù…Ø§ ÛŒÚ© Ù†ÙˆÛŒØ³Ù†Ø¯Ù‡ Ø­Ø±ÙÙ‡â€ŒØ§ÛŒ Ù‡Ø³ØªÛŒØ¯. Ø§ÛŒÙ† Ù…ØªÙ† Ø±Ø§ Ø¨Ø§Ø²Ù†ÙˆÛŒØ³ÛŒ Ú©Ù†ÛŒØ¯ Ø¨Ø§ Ø±Ø¹Ø§ÛŒØª Ø³Ø§Ø®ØªØ§Ø± Ø±Ø³Ù…ÛŒâ€ŒØªØ± Ùˆ Ù…Ù†Ø³Ø¬Ù…â€ŒØªØ± Ø¨Ø¯ÙˆÙ† ØªØºÛŒÛŒØ± Ù…Ø¹Ù†ÛŒ Ø§ØµÙ„ÛŒ:
"""
${selection.text}
"""`,
                needsFetch: true
            },
            {
                title: 'Ø¨Ù‡Ø¨ÙˆØ¯ Ø§Ø­Ø³Ø§Ø³Ø§Øª Ù…ØªÙ†',
                text: 'Ø¨Ø§Ø²Ù†ÙˆÛŒØ³ÛŒ Ù…ØªÙ† Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡ Ø¨Ø§ Ø§Ø­Ø³Ø§Ø³Ø§Øª Ø¨ÛŒØ´ØªØ± Ùˆ Ù„Ø­Ù† Ø¹Ø§Ø·ÙÛŒâ€ŒØªØ±',
                type: 'emotion',
                selectionData: selection,
                prompt: `Ø´Ù…Ø§ ÛŒÚ© Ù†ÙˆÛŒØ³Ù†Ø¯Ù‡ Ø§Ø­Ø³Ø§Ø³ÛŒ Ù‡Ø³ØªÛŒØ¯. Ø§ÛŒÙ† Ù…ØªÙ† Ø±Ø§ Ø¨Ø§ Ø§Ø­Ø³Ø§Ø³Ø§Øª Ø¨ÛŒØ´ØªØ± Ùˆ Ù„Ø­Ù† Ø¹Ø§Ø·ÙÛŒâ€ŒØªØ± Ø¨Ø§Ø²Ù†ÙˆÛŒØ³ÛŒ Ú©Ù†ÛŒØ¯ Ø¨Ø¯ÙˆÙ† ØªØºÛŒÛŒØ± Ù…Ø¹Ù†ÛŒ Ø§ØµÙ„ÛŒ:
"""
${selection.text}
"""`,
                needsFetch: true
            },
            {
                title: 'Ø§ØµÙ„Ø§Ø­ Ù†Ú¯Ø§Ø±Ø´ÛŒ',
                text: 'Ø§ØµÙ„Ø§Ø­ Ù…ØªÙ† Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡ Ø§Ø² Ù†Ø¸Ø± Ù†Ú¯Ø§Ø±Ø´ÛŒ Ùˆ Ø¯Ø³ØªÙˆØ±ÛŒ',
                type: 'grammar',
                selectionData: selection,
                prompt: `Ø´Ù…Ø§ ÛŒÚ© ÙˆÛŒØ±Ø§Ø³ØªØ§Ø± Ø­Ø±ÙÙ‡â€ŒØ§ÛŒ Ù‡Ø³ØªÛŒØ¯. Ø§ÛŒÙ† Ù…ØªÙ† Ø±Ø§ Ø§Ø² Ù†Ø¸Ø± Ù†Ú¯Ø§Ø±Ø´ÛŒ Ùˆ Ø¯Ø³ØªÙˆØ±ÛŒ ØªØµØ­ÛŒØ­ Ú©Ù†ÛŒØ¯ Ùˆ Ù†Ø´Ø§Ù†Ù‡â€ŒÚ¯Ø°Ø§Ø±ÛŒ Ù…Ù†Ø§Ø³Ø¨ Ø§Ø¶Ø§ÙÙ‡ Ù†Ù…Ø§ÛŒÛŒØ¯:
"""
${selection.text}
"""`,
                needsFetch: true
            }
        ];
    }
    
    // ØªÙˆÙ„ÛŒØ¯ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ø¨Ø§ API Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ
    async function generateAISuggestionsWithAPI(textData) {
        // Ù†Ù…Ø§ÛŒØ´ Ø­Ø§Ù„Øª Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ
        suggestionList.innerHTML = '<div class="suggestion loading-suggestion"><i class="fas fa-spinner fa-spin"></i><p>Ø¯Ø± Ø­Ø§Ù„ Ø¢Ù…Ø§Ø¯Ù‡â€ŒØ³Ø§Ø²ÛŒ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª...</p></div>';
        
        try {
            // ØªÙˆÙ„ÛŒØ¯ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ù…ØªÙ†Ø§Ø³Ø¨ Ø¨Ø§ Ù†ÙˆØ¹ Ø¯Ø±Ø®ÙˆØ§Ø³Øª
            let suggestions = [];
            
            if (textData.fullText) {
                // Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ Ø¨Ø±Ø§ÛŒ Ú©Ù„ Ù…ØªÙ†
                suggestions = generateFullTextSuggestions(textData.text);
            } else {
                // Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ Ø¨Ø±Ø§ÛŒ Ù…ØªÙ† Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡
                suggestions = generateSelectedTextSuggestions(textData);
            }
            
            // Ù†Ù…Ø§ÛŒØ´ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª
            displaySuggestions(suggestions);
            
        } catch (error) {
            console.error('Ø®Ø·Ø§ Ø¯Ø± Ø¢Ù…Ø§Ø¯Ù‡â€ŒØ³Ø§Ø²ÛŒ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª:', error);
            suggestionList.innerHTML = '<div class="suggestion error-suggestion"><i class="fas fa-exclamation-circle"></i><p>Ø®Ø·Ø§ Ø¯Ø± Ø¢Ù…Ø§Ø¯Ù‡â€ŒØ³Ø§Ø²ÛŒ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª. Ù„Ø·ÙØ§Ù‹ Ø¯ÙˆØ¨Ø§Ø±Ù‡ ØªÙ„Ø§Ø´ Ú©Ù†ÛŒØ¯.</p></div>';
        }
    }
    
    // Ø¯Ø±ÛŒØ§ÙØª Ù¾Ø§Ø³Ø® Ø§Ø² API Ø¨Ø±Ø§ÛŒ ÛŒÚ© Ù¾Ø±Ø§Ù…Ù¾Øª Ù…Ø´Ø®Øµ
    async function fetchAIResponse(prompt) {
        try {
            // Ø¨Ø±Ø±Ø³ÛŒ Ø§ÛŒÙ†Ú©Ù‡ Ø¢ÛŒØ§ API Ùˆ Ù…Ø¯Ù„ Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡â€ŒØ§Ù†Ø¯
            if (!apiKey || !selectedModel) {
                alert('Ù„Ø·ÙØ§Ù‹ Ø§Ø¨ØªØ¯Ø§ API Ùˆ Ù…Ø¯Ù„ Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ Ø±Ø§ Ø¯Ø± ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ù¾ÛŒÚ©Ø±Ø¨Ù†Ø¯ÛŒ Ú©Ù†ÛŒØ¯.');
                settingsModal.classList.add('show');
                return null;
            }

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: [
                        { role: 'system', content: 'Ø´Ù…Ø§ ÛŒÚ© Ø¯Ø³ØªÛŒØ§Ø± Ù†ÙˆÛŒØ³Ù†Ø¯Ù‡ Ø­Ø±ÙÙ‡â€ŒØ§ÛŒ Ù‡Ø³ØªÛŒØ¯. Ù„Ø·ÙØ§Ù‹ Ù¾Ø§Ø³Ø® Ú©ÙˆØªØ§Ù‡ Ùˆ Ù…Ø³ØªÙ‚ÛŒÙ… Ø¨Ø¯Ù‡ÛŒØ¯ØŒ ÙÙ‚Ø· Ù…ØªÙ† Ø¯Ø±Ø®ÙˆØ§Ø³ØªÛŒ Ø±Ø§ Ø¨Ø±Ú¯Ø±Ø¯Ø§Ù†ÛŒØ¯ Ø¨Ø¯ÙˆÙ† Ù‡ÛŒÚ† ØªÙˆØ¶ÛŒØ­ Ø§Ø¶Ø§ÙÛŒ.' },
                        { role: 'user', content: prompt }
                    ]
                })
            });
            
            if (!response.ok) {
                throw new Error('Ø®Ø·Ø§ Ø¯Ø± Ø¯Ø±ÛŒØ§ÙØª Ù¾Ø§Ø³Ø® Ø§Ø² API');
            }
            
            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Ø®Ø·Ø§ Ø¯Ø± Ø§Ø±ØªØ¨Ø§Ø· Ø¨Ø§ API:', error);
            return null;
        }
    }
    
    // Ù†Ù…Ø§ÛŒØ´ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ø¯Ø± Ø±Ø§Ø¨Ø· Ú©Ø§Ø±Ø¨Ø±ÛŒ
    function displaySuggestions(suggestions) {
        // Ù¾Ø§Ú© Ú©Ø±Ø¯Ù† Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ù‚Ø¨Ù„ÛŒ
        suggestionList.innerHTML = '';
        
        // Ù†Ù…Ø§ÛŒØ´ Ù‡Ù…Ù‡ Ø¢ÛŒØªÙ…â€ŒÙ‡Ø§ Ø¯Ø± ÛŒÚ© ØµÙØ­Ù‡ (Ø§Ø¨ØªØ¯Ø§ Ø¢ÛŒØªÙ…â€ŒÙ‡Ø§ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ù†Ø´Ø¯Ù‡)
        const fullTextSuggestions = suggestions.filter(s => !['rewrite', 'emotion', 'grammar'].includes(s.type));
        const selectedTextSuggestions = suggestions.filter(s => ['rewrite', 'emotion', 'grammar'].includes(s.type));
        
        // Ø§Ú¯Ø± Ú©Ø§Ø±Ø¨Ø± Ù…ØªÙ†ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ù†Ú©Ø±Ø¯Ù‡ØŒ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ù…ØªÙ† Ú©Ø§Ù…Ù„ Ùˆ Ø±Ø§Ù‡Ù†Ù…Ø§ Ø±Ø§ Ù†Ø´Ø§Ù† Ø¨Ø¯Ù‡
        if (selectedTextSuggestions.length === 0) {
            // Ø§ÙØ²ÙˆØ¯Ù† Ø±Ø§Ù‡Ù†Ù…Ø§ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ù…ØªÙ†
            const helpElement = document.createElement('div');
            helpElement.className = 'suggestion help-suggestion';
            
            const helpIcon = document.createElement('i');
            helpIcon.className = 'fas fa-lightbulb';
            
            const helpText = document.createElement('p');
            helpText.innerHTML = '<strong>Ø±Ø§Ù‡Ù†Ù…Ø§:</strong> Ø¨Ø±Ø§ÛŒ Ø¯Ø±ÛŒØ§ÙØª Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ø¨Ø§Ø²Ù†ÙˆÛŒØ³ÛŒØŒ Ø¨Ù‡Ø¨ÙˆØ¯ Ø§Ø­Ø³Ø§Ø³Ø§Øª Ùˆ Ø§ØµÙ„Ø§Ø­ Ù†Ú¯Ø§Ø±Ø´ÛŒØŒ Ø§Ø¨ØªØ¯Ø§ Ø¨Ø®Ø´ÛŒ Ø§Ø² Ù…ØªÙ† Ø±Ø§ Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ù†ÛŒØ¯ Ùˆ Ø³Ù¾Ø³ Ø±ÙˆÛŒ Ø¯Ú©Ù…Ù‡ "Ú©Ù…Ú© Ù‡ÙˆØ´Ù…Ù†Ø¯" Ú©Ù„ÛŒÚ© Ú©Ù†ÛŒØ¯.';
            
            // Ø§ÙØ²ÙˆØ¯Ù† Ø¯Ú©Ù…Ù‡ Ø¨Ø³ØªÙ† Ø±Ø§Ù‡Ù†Ù…Ø§
            const closeButton = document.createElement('span');
            closeButton.className = 'close-help';
            closeButton.innerHTML = '<i class="fas fa-times"></i>';
            closeButton.addEventListener('click', function() {
                helpElement.style.display = 'none';
            });
            
            helpElement.appendChild(helpIcon);
            helpElement.appendChild(helpText);
            helpElement.appendChild(closeButton);
            suggestionList.appendChild(helpElement);
        }
        
        // Ø§Ø¶Ø§ÙÙ‡ Ú©Ø±Ø¯Ù† Ù‡Ù…Ù‡ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ø¨Ù‡ Ù„ÛŒØ³Øª (Ø§ÙˆÙ„ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ù…ØªÙ† Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡ØŒ Ø³Ù¾Ø³ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ù…ØªÙ† Ú©Ø§Ù…Ù„)
        [...selectedTextSuggestions, ...fullTextSuggestions].forEach(suggestion => {
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'suggestion';
            suggestionElement.dataset.type = suggestion.type;
            
            const title = document.createElement('h4');
            title.textContent = suggestion.title;
            title.className = 'suggestion-title';
            
            const p = document.createElement('p');
            p.textContent = suggestion.text;
            p.className = 'suggestion-text';
            
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'suggestion-buttons';
            
            const fetchButton = document.createElement('button');
            fetchButton.className = 'fetch-btn';
            fetchButton.textContent = 'Ø¯Ø±ÛŒØ§ÙØª Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯';
            
            // Ø¯Ú©Ù…Ù‡ Ø§Ø¹Ù…Ø§Ù„ Ø¯Ø± Ø§Ø¨ØªØ¯Ø§ ØºÛŒØ±ÙØ¹Ø§Ù„ Ø§Ø³Øª
            const applyButton = document.createElement('button');
            applyButton.className = 'apply-btn disabled';
            applyButton.textContent = 'Ø§Ø¹Ù…Ø§Ù„';
            applyButton.disabled = true;
            
            // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ø¯Ø±ÛŒØ§ÙØª Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ Ø§Ø² Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ
            fetchButton.addEventListener('click', async function() {
                // ØªØºÛŒÛŒØ± ÙˆØ¶Ø¹ÛŒØª Ø¨Ù‡ Ø­Ø§Ù„Øª Ø¯Ø± Ø­Ø§Ù„ Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ
                p.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ø¯Ø± Ø­Ø§Ù„ Ø¯Ø±ÛŒØ§ÙØª Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯...';
                fetchButton.disabled = true;
                
                try {
                    // Ø¯Ø±ÛŒØ§ÙØª Ù¾Ø§Ø³Ø® Ø§Ø² API
                    const response = await fetchAIResponse(suggestion.prompt);
                    
                    if (response) {
                        // Ø¨Ø±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ù…ØªÙ† Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯
                        p.textContent = response;
                        
                        // Ø§Ú¯Ø± Ù†ÙˆØ¹ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ Ø§Ø¯Ø§Ù…Ù‡ Ù…ØªÙ† Ø§Ø³ØªØŒ Ù…ØªÙ† Ú©Ø§Ù…Ù„ Ø±Ø§ Ø¨Ù‡ Ø±ÙˆØ² Ú©Ù†ÛŒÙ…
                        if (suggestion.type === 'completion') {
                            suggestion.text = response;
                        } else if (['rewrite', 'emotion', 'grammar'].includes(suggestion.type)) {
                            suggestion.text = response;
                        }
                        
                        // ÙØ¹Ø§Ù„ Ú©Ø±Ø¯Ù† Ø¯Ú©Ù…Ù‡ Ø§Ø¹Ù…Ø§Ù„
                        applyButton.classList.remove('disabled');
                        applyButton.disabled = false;
                    } else {
                        p.textContent = 'Ø®Ø·Ø§ Ø¯Ø± Ø¯Ø±ÛŒØ§ÙØª Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯. Ù„Ø·ÙØ§Ù‹ Ø¯ÙˆØ¨Ø§Ø±Ù‡ ØªÙ„Ø§Ø´ Ú©Ù†ÛŒØ¯.';
                    }
                } catch (error) {
                    console.error('Ø®Ø·Ø§ Ø¯Ø± Ø¯Ø±ÛŒØ§ÙØª Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯:', error);
                    p.textContent = 'Ø®Ø·Ø§ Ø¯Ø± Ø¯Ø±ÛŒØ§ÙØª Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯. Ù„Ø·ÙØ§Ù‹ Ø¯ÙˆØ¨Ø§Ø±Ù‡ ØªÙ„Ø§Ø´ Ú©Ù†ÛŒØ¯.';
                } finally {
                    // ÙØ¹Ø§Ù„ Ú©Ø±Ø¯Ù† Ø¯ÙˆØ¨Ø§Ø±Ù‡ Ø¯Ú©Ù…Ù‡ Ø¯Ø±ÛŒØ§ÙØª
                    fetchButton.disabled = false;
                }
            });
            
            // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ø§Ø¹Ù…Ø§Ù„ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯
            applyButton.addEventListener('click', function() {
                applySuggestion(suggestion);
            });
            
            // Ø§Ø¶Ø§ÙÙ‡ Ú©Ø±Ø¯Ù† Ù‚Ø§Ø¨Ù„ÛŒØª Ú©Ù„ÛŒÚ© Ø±ÙˆÛŒ Ú©Ù„ Ø¢ÛŒØªÙ… Ø¨Ø±Ø§ÛŒ Ø¯Ø±ÛŒØ§ÙØª Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯
            suggestionElement.addEventListener('click', function(e) {
                // Ø§Ú¯Ø± Ø±ÙˆÛŒ Ø¯Ú©Ù…Ù‡â€ŒÙ‡Ø§ Ú©Ù„ÛŒÚ© Ù†Ø´Ø¯Ù‡ Ø¨Ø§Ø´Ø¯
                if (!e.target.closest('button')) {
                    // Ø§Ú¯Ø± Ø¯Ú©Ù…Ù‡ Ø¯Ø±ÛŒØ§ÙØª Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ ØºÛŒØ±ÙØ¹Ø§Ù„ Ù†ÛŒØ³ØªØŒ Ø±ÙˆÛŒ Ø¢Ù† Ú©Ù„ÛŒÚ© Ú©Ù†
                    if (!fetchButton.disabled) {
                        fetchButton.click();
                    }
                }
            });
            
            // Ø§ÙØ²ÙˆØ¯Ù† Ú©Ù„Ø§Ø³ Ù‚Ø§Ø¨Ù„ Ú©Ù„ÛŒÚ©
            suggestionElement.classList.add('clickable-suggestion');
            
            buttonContainer.appendChild(fetchButton);
            buttonContainer.appendChild(applyButton);
            
            suggestionElement.appendChild(title);
            suggestionElement.appendChild(p);
            suggestionElement.appendChild(buttonContainer);
            suggestionList.appendChild(suggestionElement);
        });
        
        // Ù†Ù…Ø§ÛŒØ´ Ø§Ù†ÛŒÙ…ÛŒØ´Ù† Ø¨Ø±Ø§ÛŒ Ø¬Ù„Ø¨ ØªÙˆØ¬Ù‡ Ú©Ø§Ø±Ø¨Ø±
        document.getElementById('aiSuggestions').classList.add('highlight');
        setTimeout(() => {
            document.getElementById('aiSuggestions').classList.remove('highlight');
        }, 1000);
    }
    
    // Ø§Ø¹Ù…Ø§Ù„ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯
    async function applySuggestion(suggestion) {
        // Ø¨Ø³ØªÙ‡ Ø¨Ù‡ Ù†ÙˆØ¹ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ØŒ Ø¹Ù…Ù„Ú©Ø±Ø¯ Ù…ØªÙØ§ÙˆØªÛŒ Ø¯Ø§Ø´ØªÙ‡ Ø¨Ø§Ø´ÛŒÙ…
        if (suggestion.type === 'completion') {
            // Ø¯Ø± Ù…ÙˆØ±Ø¯ ØªÚ©Ù…ÛŒÙ„ Ù…ØªÙ†ØŒ Ù…Ø­ØªÙˆØ§ Ø±Ø§ Ø¨Ù‡ Ø§Ù†ØªÙ‡Ø§ÛŒ Ù…ØªÙ† Ø§Ø¶Ø§ÙÙ‡ Ù…ÛŒâ€ŒÚ©Ù†ÛŒÙ…
            const text = editor.value;
            
            // Ø¨Ø±Ø±Ø³ÛŒ Ø¯Ù‚ÛŒÙ‚â€ŒØªØ± Ù†Ø­ÙˆÙ‡ Ø§ØªØµØ§Ù„ Ù…ØªÙ† Ø¨Ø§ ØªÙˆØ¬Ù‡ Ø¨Ù‡ Ø¢Ø®Ø±ÛŒÙ† Ø¬Ù…Ù„Ù‡ Ø¯Ø§Ø³ØªØ§Ù†
            let separator = '';
            const trimmedText = text.trim();
            
            // Ø¢ÛŒØ§ Ø¢Ø®Ø±ÛŒÙ† Ø¬Ù…Ù„Ù‡ Ú©Ø§Ù…Ù„ Ø§Ø³Øª ÛŒØ§ Ù†Ø§ØªÙ…Ø§Ù…ØŸ
            const lastCharacter = trimmedText.slice(-1);
            const endsWithPunctuation = /[.!?ØŒØ›:ØŸ!.]/.test(lastCharacter);
            const endsWithQuote = /["'Â»"]/.test(lastCharacter);
            const lastLine = trimmedText.split('\n').pop().trim();
            
            // ØªÙ†Ø¸ÛŒÙ… Ø¬Ø¯Ø§Ú©Ù†Ù†Ø¯Ù‡ Ù…Ù†Ø§Ø³Ø¨
            if (trimmedText.endsWith('\n\n')) {
                // Ø§Ú¯Ø± Ù…ØªÙ† Ø¨Ø§ Ø¯Ùˆ Ø®Ø· Ø¬Ø¯ÛŒØ¯ Ù¾Ø§ÛŒØ§Ù† Ù…ÛŒâ€ŒÛŒØ§Ø¨Ø¯ØŒ Ù†ÛŒØ§Ø²ÛŒ Ø¨Ù‡ Ø¬Ø¯Ø§Ú©Ù†Ù†Ø¯Ù‡ Ù†ÛŒØ³Øª
                separator = '';
            } else if (trimmedText.endsWith('\n')) {
                // Ø§Ú¯Ø± Ù…ØªÙ† Ø¨Ø§ ÛŒÚ© Ø®Ø· Ø¬Ø¯ÛŒØ¯ Ù¾Ø§ÛŒØ§Ù† Ù…ÛŒâ€ŒÛŒØ§Ø¨Ø¯ØŒ Ù†ÛŒØ§Ø²ÛŒ Ø¨Ù‡ Ø¬Ø¯Ø§Ú©Ù†Ù†Ø¯Ù‡ Ù†ÛŒØ³Øª
                separator = '';
            } else if (endsWithPunctuation && !endsWithQuote && lastLine.length > 20) {
                // Ø§Ú¯Ø± Ø¨Ø§ Ù†Ù‚Ø·Ù‡ØŒ Ø¹Ù„Ø§Ù…Øª Ø³Ø¤Ø§Ù„ Ùˆ ØºÛŒØ±Ù‡ Ù¾Ø§ÛŒØ§Ù† Ù…ÛŒâ€ŒÛŒØ§Ø¨Ø¯ Ùˆ Ø®Ø· Ø¢Ø®Ø± Ø·ÙˆÙ„Ø§Ù†ÛŒ Ø§Ø³ØªØŒ ÛŒÚ© Ø®Ø· Ø¬Ø¯ÛŒØ¯ Ø§Ø¶Ø§ÙÙ‡ Ù…ÛŒâ€ŒÚ©Ù†ÛŒÙ…
                separator = '\n';
            } else if (endsWithPunctuation && !endsWithQuote) {
                // Ø§Ú¯Ø± Ø¨Ø§ Ù†Ù‚Ø·Ù‡ Ù¾Ø§ÛŒØ§Ù† Ù…ÛŒâ€ŒÛŒØ§Ø¨Ø¯ Ùˆ Ø¢Ø®Ø±ÛŒÙ† Ø®Ø· Ú©ÙˆØªØ§Ù‡ Ø§Ø³Øª (Ø§Ø­ØªÙ…Ø§Ù„Ø§Ù‹ Ø®Ø· Ø¯ÛŒØ§Ù„ÙˆÚ¯)ØŒ ÙÙ‚Ø· ÛŒÚ© ÙØ§ØµÙ„Ù‡ Ø§Ø¶Ø§ÙÙ‡ Ù…ÛŒâ€ŒÚ©Ù†ÛŒÙ…
                separator = ' ';
            } else if (endsWithQuote) {
                // Ø§Ú¯Ø± Ø¨Ø§ Ù†Ù‚Ù„ Ù‚ÙˆÙ„ Ù¾Ø§ÛŒØ§Ù† Ù…ÛŒâ€ŒÛŒØ§Ø¨Ø¯ØŒ Ø§Ø­ØªÙ…Ø§Ù„Ø§Ù‹ Ø§Ø¯Ø§Ù…Ù‡ Ø¯ÛŒØ§Ù„ÙˆÚ¯ Ø§Ø³ØªØŒ ÙÙ‚Ø· ÛŒÚ© ÙØ§ØµÙ„Ù‡ Ø§Ø¶Ø§ÙÙ‡ Ù…ÛŒâ€ŒÚ©Ù†ÛŒÙ…
                separator = ' ';
            } else {
                // Ø§Ú¯Ø± Ù…ØªÙ† Ø¨Ø§ ÛŒÚ© Ø¬Ù…Ù„Ù‡ Ù†Ø§ØªÙ…Ø§Ù… Ù¾Ø§ÛŒØ§Ù† Ù…ÛŒâ€ŒÛŒØ§Ø¨Ø¯ØŒ Ù‡ÛŒÚ† Ø¬Ø¯Ø§Ú©Ù†Ù†Ø¯Ù‡â€ŒØ§ÛŒ Ø§Ø¶Ø§ÙÙ‡ Ù†Ù…ÛŒâ€ŒÚ©Ù†ÛŒÙ…
                separator = '';
            }
            
            // Ù‚Ø¨Ù„ Ø§Ø² Ø§Ø¶Ø§ÙÙ‡ Ú©Ø±Ø¯Ù† Ù…ØªÙ† Ø¬Ø¯ÛŒØ¯ØŒ Ø§Ø¨ØªØ¯Ø§ Ø¢Ù† Ø±Ø§ Ù¾Ø±Ø¯Ø§Ø²Ø´ Ù…ÛŒâ€ŒÚ©Ù†ÛŒÙ… ØªØ§ Ù…Ø·Ù…Ø¦Ù† Ø´ÙˆÛŒÙ… Ø¨Ø§ Ù…ØªÙ† Ù‚Ø¨Ù„ÛŒ Ù‡Ù…Ø®ÙˆØ§Ù†ÛŒ Ø¯Ø§Ø±Ø¯
            let processedNewText = suggestion.text.trim();
            const firstCharOfNewText = processedNewText.charAt(0);
            
            // Ø§Ú¯Ø± Ù…ØªÙ† Ø§ØµÙ„ÛŒ Ø¨Ø§ Ù†Ù‚Ø·Ù‡ Ù¾Ø§ÛŒØ§Ù† ÛŒØ§ÙØªÙ‡ Ùˆ Ù…ØªÙ† Ø¬Ø¯ÛŒØ¯ Ø¨Ø§ Ø­Ø±Ù Ø¨Ø²Ø±Ú¯ Ø´Ø±ÙˆØ¹ Ù†Ø´Ø¯Ù‡ØŒ Ø§ØµÙ„Ø§Ø­ Ù…ÛŒâ€ŒÚ©Ù†ÛŒÙ…
            if (endsWithPunctuation && firstCharOfNewText === firstCharOfNewText.toLowerCase() && 
                !/["'Â«]/.test(firstCharOfNewText) && !/\d/.test(firstCharOfNewText)) {
                processedNewText = firstCharOfNewText.toUpperCase() + processedNewText.slice(1);
            }
            
            // Ø§ÙØ²ÙˆØ¯Ù† Ù…ØªÙ† Ø§Ø¯Ø§Ù…Ù‡ Ø¯Ø§Ø³ØªØ§Ù†
            editor.value = text + separator + processedNewText;
            
            // Ø§Ù†ØªÙ‚Ø§Ù„ Ù…Ú©Ø§Ù†â€ŒÙ†Ù…Ø§ Ø¨Ù‡ Ø§Ù†ØªÙ‡Ø§ÛŒ Ù…ØªÙ†
            editor.setSelectionRange(editor.value.length, editor.value.length);
            editor.focus();
        } else if (['rewrite', 'emotion', 'grammar'].includes(suggestion.type)) {
            // Ø¨Ø±Ø§ÛŒ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ù…ØªÙ† Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡ØŒ Ø§Ø² Ù…ØªÙ† Ø¢Ù…Ø§Ø¯Ù‡ Ø´Ø¯Ù‡ Ø¯Ø± Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ Ø§Ø³ØªÙØ§Ø¯Ù‡ Ù…ÛŒâ€ŒÚ©Ù†ÛŒÙ…
            const before = editor.value.substring(0, suggestion.selectionData.start);
            const after = editor.value.substring(suggestion.selectionData.end);
            editor.value = before + suggestion.text + after;
            
            // ØªÙ†Ø¸ÛŒÙ… Ù…Ú©Ø§Ù†â€ŒÙ†Ù…Ø§ Ù¾Ø³ Ø§Ø² Ù…ØªÙ† Ø¬Ø§ÛŒÚ¯Ø²ÛŒÙ† Ø´Ø¯Ù‡
            const newPosition = suggestion.selectionData.start + suggestion.text.length;
            editor.setSelectionRange(newPosition, newPosition);
            editor.focus();
        } else if (suggestion.type === 'style' || suggestion.type === 'coherence') {
            // Ø§ÛŒÙ† Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ù…Ø¹Ù…ÙˆÙ„Ø§Ù‹ ÙÙ‚Ø· ØªÙˆØµÛŒÙ‡â€ŒÙ‡Ø§ÛŒÛŒ Ù‡Ø³ØªÙ†Ø¯ Ú©Ù‡ Ú©Ø§Ø±Ø¨Ø± Ø¨Ø§ÛŒØ¯ Ø®ÙˆØ¯Ø´ Ø§Ø¹Ù…Ø§Ù„ Ú©Ù†Ø¯
            alert('Ø§ÛŒÙ† Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ Ø¨Ù‡ Ø¹Ù†ÙˆØ§Ù† Ø±Ø§Ù‡Ù†Ù…Ø§ÛŒÛŒ Ø¨Ø±Ø§ÛŒ Ø¨Ù‡Ø¨ÙˆØ¯ Ù…ØªÙ† Ø´Ù…Ø§ Ø§Ø±Ø§Ø¦Ù‡ Ø´Ø¯Ù‡ Ø§Ø³Øª. Ù„Ø·ÙØ§Ù‹ Ø¨Ø§ ØªÙˆØ¬Ù‡ Ø¨Ù‡ Ø¢Ù†ØŒ Ù…ØªÙ† Ø®ÙˆØ¯ Ø±Ø§ ÙˆÛŒØ±Ø§ÛŒØ´ Ú©Ù†ÛŒØ¯.');
        }
        
        // Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø´Ù…Ø§Ø±Ù†Ø¯Ù‡ Ú©Ù„Ù…Ø§Øª Ùˆ Ø°Ø®ÛŒØ±Ù‡ Ù…ØªÙ†
        updateWordAndCharCount();
        saveText();
    }
    
    // Ø§ÙÚ©Øª ØªØ§ÛŒÙ¾ Ø¯Ø± Ù¾ÛŒØ´â€ŒÙ†Ù…Ø§ÛŒØ´
    if (editor.placeholder) {
        const placeholder = editor.placeholder;
        editor.placeholder = '';
        
        let i = 0;
        const typeInterval = setInterval(() => {
            if (i < placeholder.length) {
                editor.placeholder += placeholder.charAt(i);
                i++;
            } else {
                clearInterval(typeInterval);
            }
        }, 100);
    }
    
    // Ø§Ø¶Ø§ÙÙ‡ Ú©Ø±Ø¯Ù† Ú©Ù„Ø§Ø³ ÙØ¹Ø§Ù„ Ø¨Ù‡ Ø§Ù„Ù…Ø§Ù†â€ŒÙ‡Ø§ Ù‡Ù†Ú¯Ø§Ù… Ù‡Ø§ÙˆØ±
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseover', function() {
            this.classList.add('active');
        });
        
        button.addEventListener('mouseout', function() {
            this.classList.remove('active');
        });
    });
    
    // Ø§Ø³ØªØ§ÛŒÙ„ Ø¨Ø±Ø§ÛŒ Ø­Ø§Ù„Øª Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ Ùˆ Ø®Ø·Ø§
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .loading-suggestion, .error-suggestion {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .loading-suggestion i {
            color: var(--accent-color);
            font-size: 18px;
        }
        
        .error-suggestion i {
            color: var(--error-color);
            font-size: 18px;
        }
        
        .suggestion-buttons {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
        
        .fetch-btn {
            background-color: var(--dark-color);
            color: #fff;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        
        .fetch-btn:hover {
            background-color: var(--dark-hover-color);
        }
        
        .fetch-btn:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
        
        .apply-btn.disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
        
        .clickable-suggestion {
            cursor: pointer;
            transition: background-color 0.2s, transform 0.2s;
            border: 1px solid transparent;
        }
        
        .clickable-suggestion:hover {
            background-color: var(--light-hover-color);
            transform: translateY(-2px);
            border: 1px solid var(--accent-color);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .clickable-suggestion .suggestion-title {
            color: var(--accent-color);
        }
        
        #suggestionList {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
        }
        
        .suggestion {
            padding: 15px;
            border-radius: 8px;
            background-color: white;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .help-suggestion {
            grid-column: 1 / -1;
            background-color: #f8f9fa;
            border-left: 4px solid var(--accent-color);
        }
    `;
    document.head.appendChild(styleElement);
    
    // Ø§Ø¬Ø±Ø§ÛŒ Ø§ÙˆÙ„ÛŒÙ‡ Ø´Ù…Ø§Ø±Ù†Ø¯Ù‡ Ú©Ù„Ù…Ø§Øª Ùˆ Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ ØªÙ†Ø¸ÛŒÙ…Ø§Øª
    updateWordAndCharCount();
    loadSavedSettings();
    loadSavedText();
    
    // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ø¯Ú©Ù…Ù‡ ØªÙˆÙ„ÛŒØ¯ Ø§ÛŒØ¯Ù‡
    generateIdeaBtn.addEventListener('click', function() {
        // Ø¨Ø±Ø±Ø³ÛŒ ØªÙ†Ø¸ÛŒÙ…Ø§Øª API
        if (!apiKey || !selectedModel) {
            alert('Ù„Ø·ÙØ§Ù‹ Ø§Ø¨ØªØ¯Ø§ API Ùˆ Ù…Ø¯Ù„ Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ Ø±Ø§ Ø¯Ø± ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ù¾ÛŒÚ©Ø±Ø¨Ù†Ø¯ÛŒ Ú©Ù†ÛŒØ¯.');
            settingsModal.classList.add('show');
            return;
        }
        
        // Ù†Ù…Ø§ÛŒØ´ Ù…ÙˆØ¯Ø§Ù„
        ideaModal.classList.add('show');
        
        // ØªÙˆÙ„ÛŒØ¯ Ø§ÛŒØ¯Ù‡ Ø¨Ø±Ø§ÛŒ Ø¯Ø³ØªÙ‡ ÙØ¹Ù„ÛŒ
        generateIdea(currentCategory);
    });
    
    // Ø¨Ø³ØªÙ† Ù…ÙˆØ¯Ø§Ù„ ØªÙˆÙ„ÛŒØ¯ Ø§ÛŒØ¯Ù‡
    closeIdeaModalBtn.addEventListener('click', function() {
        ideaModal.classList.remove('show');
    });
    
    // Ú©Ù„ÛŒÚ© Ø®Ø§Ø±Ø¬ Ø§Ø² Ù…ÙˆØ¯Ø§Ù„ Ø¨Ø±Ø§ÛŒ Ø¨Ø³ØªÙ† Ø¢Ù†
    window.addEventListener('click', function(event) {
        if (event.target === ideaModal) {
            ideaModal.classList.remove('show');
        }
    });
    
    // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ø¯Ú©Ù…Ù‡â€ŒÙ‡Ø§ÛŒ Ø¯Ø³ØªÙ‡â€ŒØ¨Ù†Ø¯ÛŒ Ø§ÛŒØ¯Ù‡
    ideaCategoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Ø­Ø°Ù Ú©Ù„Ø§Ø³ active Ø§Ø² Ù‡Ù…Ù‡ Ø¯Ú©Ù…Ù‡â€ŒÙ‡Ø§
            ideaCategoryBtns.forEach(b => b.classList.remove('active'));
            
            // Ø§ÙØ²ÙˆØ¯Ù† Ú©Ù„Ø§Ø³ active Ø¨Ù‡ Ø¯Ú©Ù…Ù‡ Ú©Ù„ÛŒÚ© Ø´Ø¯Ù‡
            this.classList.add('active');
            
            // ØªÙ†Ø¸ÛŒÙ… Ø¯Ø³ØªÙ‡ ÙØ¹Ù„ÛŒ
            currentCategory = this.dataset.category;
            
            // ØªÙˆÙ„ÛŒØ¯ Ø§ÛŒØ¯Ù‡ Ø¨Ø±Ø§ÛŒ Ø¯Ø³ØªÙ‡ Ø¬Ø¯ÛŒØ¯
            generateIdea(currentCategory);
        });
    });
    
    // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ø¯Ú©Ù…Ù‡ ØªÙˆÙ„ÛŒØ¯ Ù…Ø¬Ø¯Ø¯
    regenerateIdeaBtn.addEventListener('click', function() {
        generateIdea(currentCategory);
    });
    
    // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ø¯Ú©Ù…Ù‡ Ú©Ù¾ÛŒ
    copyIdeaBtn.addEventListener('click', function() {
        if (currentIdea) {
            // Ú©Ù¾ÛŒ Ø§ÛŒØ¯Ù‡ Ø¨Ù‡ Ú©Ù„ÛŒÙ¾â€ŒØ¨ÙˆØ±Ø¯
            navigator.clipboard.writeText(currentIdea)
                .then(() => {
                    // Ø§Ù†ÛŒÙ…ÛŒØ´Ù† ØªØ£ÛŒÛŒØ¯ Ú©Ù¾ÛŒ Ø´Ø¯Ù†
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check"></i> Ú©Ù¾ÛŒ Ø´Ø¯';
                    
                    setTimeout(() => {
                        this.innerHTML = originalText;
                    }, 2000);
                })
                .catch(err => {
                    console.error('Ø®Ø·Ø§ Ø¯Ø± Ú©Ù¾ÛŒ Ú©Ø±Ø¯Ù†: ', err);
                });
        }
    });
    
    // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ø¯Ú©Ù…Ù‡ Ø§Ø³ØªÙØ§Ø¯Ù‡
    useIdeaBtn.addEventListener('click', function() {
        if (currentIdea) {
            // Ø§ÙØ²ÙˆØ¯Ù† Ø§ÛŒØ¯Ù‡ Ø¨Ù‡ ÙˆÛŒØ±Ø§ÛŒØ´Ú¯Ø±
            const cursorPos = editor.selectionStart;
            const textBefore = editor.value.substring(0, cursorPos);
            const textAfter = editor.value.substring(cursorPos);
            
            // Ø¨Ø±Ø±Ø³ÛŒ Ù†ÛŒØ§Ø² Ø¨Ù‡ ÙØ§ØµÙ„Ù‡ ÛŒØ§ Ø®Ø· Ø¬Ø¯ÛŒØ¯
            let separator = '';
            if (textBefore.length > 0 && !textBefore.endsWith('\n')) {
                separator = '\n\n';
            }
            
            // Ø§ÙØ²ÙˆØ¯Ù† Ø§ÛŒØ¯Ù‡ Ø¨Ù‡ Ù…ØªÙ†
            editor.value = textBefore + separator + currentIdea + (textAfter.startsWith('\n') ? '' : '\n') + textAfter;
            
            // ØªÙ†Ø¸ÛŒÙ… Ù…Ú©Ø§Ù†â€ŒÙ†Ù…Ø§ Ù¾Ø³ Ø§Ø² Ø§ÛŒØ¯Ù‡
            const newCursorPos = cursorPos + separator.length + currentIdea.length + (textAfter.startsWith('\n') ? 0 : 1);
            editor.setSelectionRange(newCursorPos, newCursorPos);
            editor.focus();
            
            // Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø´Ù…Ø§Ø±Ù†Ø¯Ù‡ Ú©Ù„Ù…Ø§Øª Ùˆ Ø°Ø®ÛŒØ±Ù‡ Ù…ØªÙ†
            updateWordAndCharCount();
            saveText();
            
            // Ø¨Ø³ØªÙ† Ù…ÙˆØ¯Ø§Ù„
            ideaModal.classList.remove('show');
        }
    });
    
    // ØªØ§Ø¨Ø¹ ØªÙˆÙ„ÛŒØ¯ Ø§ÛŒØ¯Ù‡ Ø¨Ø± Ø§Ø³Ø§Ø³ Ø¯Ø³ØªÙ‡
    async function generateIdea(category) {
        // Ù†Ù…Ø§ÛŒØ´ Ø­Ø§Ù„Øª Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ
        ideaLoading.style.display = 'flex';
        ideaResult.style.display = 'none';
        ideaError.style.display = 'none';
        
        try {
            // Ø³Ø§Ø®Øª Ù¾Ø±Ø§Ù…Ù¾Øª Ø¨Ø± Ø§Ø³Ø§Ø³ Ø¯Ø³ØªÙ‡
            let prompt = '';
            switch (category) {
                case 'character':
                    prompt = 'Ù„Ø·ÙØ§Ù‹ 5 Ø§ÛŒØ¯Ù‡ Ø¨Ø±Ø§ÛŒ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§ÛŒ Ø¯Ø§Ø³ØªØ§Ù†ÛŒ Ø¬Ø°Ø§Ø¨ Ùˆ Ú†Ù†Ø¯ Ø¨Ø¹Ø¯ÛŒ Ø§Ø±Ø§Ø¦Ù‡ Ø¯Ù‡ÛŒØ¯. Ø¨Ø±Ø§ÛŒ Ù‡Ø± Ø´Ø®ØµÛŒØªØŒ Ù†Ø§Ù…ØŒ Ø®ØµÙˆØµÛŒØ§Øª Ø´Ø®ØµÛŒØªÛŒ Ø§ØµÙ„ÛŒ Ùˆ ÛŒÚ© Ù¾ÛŒØ´â€ŒØ²Ù…ÛŒÙ†Ù‡ Ú©ÙˆØªØ§Ù‡ Ø¨Ù†ÙˆÛŒØ³ÛŒØ¯.';
                    break;
                case 'story':
                    prompt = 'Ù„Ø·ÙØ§Ù‹ 5 Ø§ÛŒØ¯Ù‡ Ø¯Ø§Ø³ØªØ§Ù†ÛŒ Ø¬Ø°Ø§Ø¨ Ø¯Ø± Ú˜Ø§Ù†Ø±Ù‡Ø§ÛŒ Ù…Ø®ØªÙ„Ù Ø§Ø±Ø§Ø¦Ù‡ Ø¯Ù‡ÛŒØ¯. Ø¨Ø±Ø§ÛŒ Ù‡Ø± Ø§ÛŒØ¯Ù‡ØŒ ÛŒÚ© Ø¹Ù†ÙˆØ§Ù†ØŒ Ø®Ù„Ø§ØµÙ‡ Ø¯Ø§Ø³ØªØ§Ù† Ùˆ Ù†Ú©ØªÙ‡â€ŒØ§ÛŒ Ù…Ù†Ø­ØµØ± Ø¨Ù‡ ÙØ±Ø¯ Ú©Ù‡ Ø¢Ù† Ø±Ø§ Ù…ØªÙ…Ø§ÛŒØ² Ù…ÛŒâ€ŒÚ©Ù†Ø¯ Ø¨Ù†ÙˆÛŒØ³ÛŒØ¯.';
                    break;
                case 'dialogue':
                    prompt = 'Ù„Ø·ÙØ§Ù‹ 5 Ù†Ù…ÙˆÙ†Ù‡ Ø¯ÛŒØ§Ù„ÙˆÚ¯ Ù‚ÙˆÛŒ Ùˆ ØªØ£Ø«ÛŒØ±Ú¯Ø°Ø§Ø± Ø¨Ø±Ø§ÛŒ Ù…ÙˆÙ‚Ø¹ÛŒØªâ€ŒÙ‡Ø§ÛŒ Ù…Ø®ØªÙ„Ù Ø¯Ø§Ø³ØªØ§Ù†ÛŒ Ø§Ø±Ø§Ø¦Ù‡ Ø¯Ù‡ÛŒØ¯. Ø¨Ø±Ø§ÛŒ Ù‡Ø± Ø¯ÛŒØ§Ù„ÙˆÚ¯ØŒ Ø²Ù…ÛŒÙ†Ù‡ Ùˆ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§ÛŒ Ø¯Ø±Ú¯ÛŒØ± Ø±Ø§ ØªÙˆØ¶ÛŒØ­ Ø¯Ù‡ÛŒØ¯.';
                    break;
                default:
                    prompt = 'Ù„Ø·ÙØ§Ù‹ 5 Ø§ÛŒØ¯Ù‡ Ø®Ù„Ø§Ù‚Ø§Ù†Ù‡ Ø¨Ø±Ø§ÛŒ Ù†ÙˆÛŒØ³Ù†Ø¯Ú¯ÛŒ Ø§Ø±Ø§Ø¦Ù‡ Ø¯Ù‡ÛŒØ¯.';
            }
            
            // Ø¯Ø±ÛŒØ§ÙØª Ø§ÛŒØ¯Ù‡ Ø§Ø² API
            const result = await fetchAIResponse(prompt);
            
            if (result) {
                // ØªÙ†Ø¸ÛŒÙ… Ù†ØªÛŒØ¬Ù‡
                currentIdea = result;
                
                // Ù†Ù…Ø§ÛŒØ´ Ù†ØªÛŒØ¬Ù‡ Ø¨Ø§ Ù‚Ø§Ù„Ø¨â€ŒØ¨Ù†Ø¯ÛŒ Ù…Ù†Ø§Ø³Ø¨
                const formattedResult = result
                    .replace(/\n/g, '<br>')
                    .replace(/(\d+[\-\.\)]+)/g, '<strong>$1</strong>');
                
                ideaResult.innerHTML = formattedResult;
                ideaResult.style.display = 'block';
            } else {
                throw new Error('Ù†ØªÛŒØ¬Ù‡â€ŒØ§ÛŒ Ø¯Ø±ÛŒØ§ÙØª Ù†Ø´Ø¯.');
            }
        } catch (error) {
            console.error('Ø®Ø·Ø§ Ø¯Ø± ØªÙˆÙ„ÛŒØ¯ Ø§ÛŒØ¯Ù‡:', error);
            ideaError.style.display = 'flex';
        } finally {
            ideaLoading.style.display = 'none';
        }
    }

    // Ù…Ø¯ÛŒØ±ÛŒØª Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§
    function loadProjects() {
        const savedProjects = localStorage.getItem('aiWriter_projects');
        if (savedProjects) {
            projects = JSON.parse(savedProjects);
            updateProjectsList();
        }
    }

    function saveProjects() {
        localStorage.setItem('aiWriter_projects', JSON.stringify(projects));
    }

    function createNewProject(title, type, description) {
        const newProject = {
            id: Date.now().toString(),
            title: title,
            type: type,
            description: description || '',
            content: '',
            created: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            structure: [],
            characters: []
        };
        
        projects.push(newProject);
        saveProjects();
        setCurrentProject(newProject.id);
        return newProject;
    }

    function updateProject(projectId, updates) {
        const projectIndex = projects.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
            projects[projectIndex] = { ...projects[projectIndex], ...updates, lastModified: new Date().toISOString() };
            saveProjects();
        }
    }

    function deleteProject(projectId) {
        projects = projects.filter(p => p.id !== projectId);
        saveProjects();
        
        if (currentProject && currentProject.id === projectId) {
            if (projects.length > 0) {
                setCurrentProject(projects[0].id);
            } else {
                setCurrentProject(null);
            }
        }
        
        updateProjectsList();
    }

    function setCurrentProject(projectId) {
        // Ø°Ø®ÛŒØ±Ù‡ Ù¾Ø±ÙˆÚ˜Ù‡ ÙØ¹Ù„ÛŒ Ù‚Ø¨Ù„ Ø§Ø² ØªØºÛŒÛŒØ±
        if (currentProject) {
            updateProject(currentProject.id, {
                content: editor.value,
                title: document.getElementById('currentProjectTitle').value
            });
        }
        
        if (!projectId) {
            currentProject = null;
            editor.value = '';
            document.getElementById('currentProjectTitle').value = '';
            updateWordAndCharCount();
            return;
        }
        
        const project = projects.find(p => p.id === projectId);
        if (project) {
            currentProject = project;
            editor.value = project.content;
            document.getElementById('currentProjectTitle').value = project.title;
            updateWordAndCharCount();
            
            // Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ UI Ø¨Ø±Ø§ÛŒ Ù†Ø´Ø§Ù† Ø¯Ø§Ø¯Ù† Ù¾Ø±ÙˆÚ˜Ù‡ ÙØ¹Ø§Ù„
            document.querySelectorAll('.project-card').forEach(card => {
                if (card.dataset.projectId === projectId) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
        }
    }

    function updateProjectsList() {
        const projectsList = document.getElementById('projectsList');
        projectsList.innerHTML = '';
        
        if (projects.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-projects-message';
            emptyMessage.innerHTML = `
                <i class="fas fa-book"></i>
                <p>Ù‡Ù†ÙˆØ² Ù‡ÛŒÚ† Ù¾Ø±ÙˆÚ˜Ù‡â€ŒØ§ÛŒ Ø§ÛŒØ¬Ø§Ø¯ Ù†Ú©Ø±Ø¯Ù‡â€ŒØ§ÛŒØ¯. Ø¨Ø±Ø§ÛŒ Ø´Ø±ÙˆØ¹ Ø±ÙˆÛŒ Ø¯Ú©Ù…Ù‡ "Ù¾Ø±ÙˆÚ˜Ù‡ Ø¬Ø¯ÛŒØ¯" Ú©Ù„ÛŒÚ© Ú©Ù†ÛŒØ¯.</p>
            `;
            projectsList.appendChild(emptyMessage);
            return;
        }
        
        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = `project-card ${currentProject && currentProject.id === project.id ? 'active' : ''}`;
            projectCard.dataset.projectId = project.id;
            
            // Ù…Ø­Ø§Ø³Ø¨Ù‡ ØªØ¹Ø¯Ø§Ø¯ Ú©Ù„Ù…Ø§Øª
            const wordCount = project.content.split(/\s+/).filter(word => word.length > 0).length;
            
            // ØªØ¨Ø¯ÛŒÙ„ ØªØ§Ø±ÛŒØ® Ø¨Ù‡ ÙØ±Ù…Øª Ù†Ù…Ø§ÛŒØ´ÛŒ
            const lastModifiedDate = new Date(project.lastModified);
            const formattedDate = lastModifiedDate.toLocaleDateString('fa-IR');
            
            projectCard.innerHTML = `
                <h3>${project.title}</h3>
                <div class="project-meta">${getProjectTypeName(project.type)} â€¢ Ø¢Ø®Ø±ÛŒÙ† ÙˆÛŒØ±Ø§ÛŒØ´: ${formattedDate}</div>
                <div class="project-stats">
                    <span><i class="fas fa-font"></i> ${wordCount} Ú©Ù„Ù…Ù‡</span>
                    <span><i class="fas fa-user"></i> ${project.characters.length} Ø´Ø®ØµÛŒØª</span>
                </div>
                <div class="project-actions">
                    <button class="btn small-btn delete-project-btn"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ú©Ù„ÛŒÚ© Ø¨Ø±Ø§ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ù¾Ø±ÙˆÚ˜Ù‡
            projectCard.addEventListener('click', function(e) {
                // Ø§Ú¯Ø± Ø¯Ú©Ù…Ù‡ Ø­Ø°Ù Ú©Ù„ÛŒÚ© Ø´Ø¯Ù‡ØŒ Ú©Ø§Ø±ÛŒ Ù†Ú©Ù† (Ø±ÙˆÛŒØ¯Ø§Ø¯ Ø¢Ù† Ø¬Ø¯Ø§Ú¯Ø§Ù†Ù‡ Ù…Ø¯ÛŒØ±ÛŒØª Ù…ÛŒâ€ŒØ´ÙˆØ¯)
                if (e.target.closest('.delete-project-btn')) return;
                
                setCurrentProject(project.id);
                
                // ØªØºÛŒÛŒØ± Ø¨Ù‡ ØªØ¨ ÙˆÛŒØ±Ø§ÛŒØ´Ú¯Ø±
                document.querySelector('.tab-btn[data-tab="editor"]').click();
            });
            
            // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ø¯Ú©Ù…Ù‡ Ø­Ø°Ù
            const deleteBtn = projectCard.querySelector('.delete-project-btn');
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (confirm(`Ø¢ÛŒØ§ Ù…Ø·Ù…Ø¦Ù† Ù‡Ø³ØªÛŒØ¯ Ú©Ù‡ Ù…ÛŒâ€ŒØ®ÙˆØ§Ù‡ÛŒØ¯ Ù¾Ø±ÙˆÚ˜Ù‡ "${project.title}" Ø±Ø§ Ø­Ø°Ù Ú©Ù†ÛŒØ¯ØŸ`)) {
                    deleteProject(project.id);
                }
            });
            
            projectsList.appendChild(projectCard);
        });
    }

    function getProjectTypeName(type) {
        switch (type) {
            case 'novel': return 'Ø±Ù…Ø§Ù†';
            case 'short_story': return 'Ø¯Ø§Ø³ØªØ§Ù† Ú©ÙˆØªØ§Ù‡';
            case 'screenplay': return 'ÙÛŒÙ„Ù…Ù†Ø§Ù…Ù‡';
            case 'other': default: return 'Ø³Ø§ÛŒØ±';
        }
    }

    // Ø±ÙˆÛŒØ¯Ø§Ø¯ ØªØºÛŒÛŒØ± Ø¹Ù†ÙˆØ§Ù† Ù¾Ø±ÙˆÚ˜Ù‡
    projectTitleInput.addEventListener('input', function() {
        if (currentProject) {
            updateProject(currentProject.id, { title: this.value });
            updateProjectsList();
        }
    });
    
    // Ø±ÙˆÛŒØ¯Ø§Ø¯Ù‡Ø§ÛŒ Ù…Ø¯ÛŒØ±ÛŒØª ØªØ¨â€ŒÙ‡Ø§
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // ØªØºÛŒÛŒØ± ÙˆØ¶Ø¹ÛŒØª active ØªØ¨â€ŒÙ‡Ø§
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Ù†Ù…Ø§ÛŒØ´ Ù…Ø­ØªÙˆØ§ÛŒ ØªØ¨ ÙØ¹Ø§Ù„
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            document.getElementById(`${tabId}Tab`).style.display = 'block';
        });
    });
    
    // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ø¨Ø§Ø² Ú©Ø±Ø¯Ù† Ù…ÙˆØ¯Ø§Ù„ Ù¾Ø±ÙˆÚ˜Ù‡ Ø¬Ø¯ÛŒØ¯
    newProjectBtn.addEventListener('click', function() {
        document.getElementById('newProjectTitle').value = '';
        document.getElementById('newProjectType').value = 'novel';
        document.getElementById('newProjectDescription').value = '';
        newProjectModal.classList.add('show');
    });
    
    // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ø¨Ø³ØªÙ† Ù…ÙˆØ¯Ø§Ù„ Ù¾Ø±ÙˆÚ˜Ù‡ Ø¬Ø¯ÛŒØ¯
    closeNewProjectModal.addEventListener('click', function() {
        newProjectModal.classList.remove('show');
    });
    
    // Ú©Ù„ÛŒÚ© Ø®Ø§Ø±Ø¬ Ø§Ø² Ù…ÙˆØ¯Ø§Ù„
    window.addEventListener('click', function(event) {
        if (event.target === newProjectModal) {
            newProjectModal.classList.remove('show');
        }
    });
    
    // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ø§ÛŒØ¬Ø§Ø¯ Ù¾Ø±ÙˆÚ˜Ù‡ Ø¬Ø¯ÛŒØ¯
    createProjectBtn.addEventListener('click', function() {
        const title = document.getElementById('newProjectTitle').value.trim();
        const type = document.getElementById('newProjectType').value;
        const description = document.getElementById('newProjectDescription').value.trim();
        
        if (!title) {
            alert('Ù„Ø·ÙØ§Ù‹ Ø¹Ù†ÙˆØ§Ù† Ù¾Ø±ÙˆÚ˜Ù‡ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.');
            return;
        }
        
        createNewProject(title, type, description);
        updateProjectsList();
        
        // Ø¨Ø³ØªÙ† Ù…ÙˆØ¯Ø§Ù„
        newProjectModal.classList.remove('show');
        
        // ØªØºÛŒÛŒØ± Ø¨Ù‡ ØªØ¨ ÙˆÛŒØ±Ø§ÛŒØ´Ú¯Ø±
        document.querySelector('.tab-btn[data-tab="editor"]').click();
    });

    // Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ Ø§ÙˆÙ„ÛŒÙ‡ Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§
    loadProjects();

    // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ú©Ù„ÛŒÚ© Ø±ÙˆÛŒ Ø¯Ú©Ù…Ù‡ Ø®Ù„Ø§ØµÙ‡â€ŒØ³Ø§Ø²ÛŒ
    document.getElementById('summarizeBtn').addEventListener('click', function() {
        if (!editor.value.trim()) {
            alert('Ù„Ø·ÙØ§Ù‹ Ø§Ø¨ØªØ¯Ø§ Ù…ØªÙ†ÛŒ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.');
            return;
        }

        if (!apiKey || !selectedModel) {
            alert('Ù„Ø·ÙØ§Ù‹ Ø§Ø¨ØªØ¯Ø§ API Ùˆ Ù…Ø¯Ù„ Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ Ø±Ø§ Ø¯Ø± ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ù¾ÛŒÚ©Ø±Ø¨Ù†Ø¯ÛŒ Ú©Ù†ÛŒØ¯.');
            settingsModal.classList.add('show');
            return;
        }

        // Ù†Ù…Ø§ÛŒØ´ ØªØ¨ Ø®Ù„Ø§ØµÙ‡ Ø¯Ø§Ø³ØªØ§Ù†
        document.querySelector('.tab-btn[data-tab="analysis"]').click();
        document.querySelectorAll('.analysis-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('.analysis-tab-btn[data-analysis-tab="summary"]').classList.add('active');

        document.querySelectorAll('.analysis-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById('summaryAnalysisTab').style.display = 'block';

        // Ø§Ø¬Ø±Ø§ÛŒ Ø®ÙˆØ¯Ú©Ø§Ø± ØªÙˆÙ„ÛŒØ¯ Ø®Ù„Ø§ØµÙ‡
        generateSummary();
    });

    // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ú©Ù„ÛŒÚ© Ø±ÙˆÛŒ Ø¯Ú©Ù…Ù‡ ØªÙˆÙ„ÛŒØ¯ Ø®Ù„Ø§ØµÙ‡
    document.getElementById('generateSummaryBtn').addEventListener('click', generateSummary);

    // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ú©Ù„ÛŒÚ© Ø±ÙˆÛŒ Ø¯Ú©Ù…Ù‡ Ú©Ù¾ÛŒ Ø®Ù„Ø§ØµÙ‡
    document.getElementById('copySummaryBtn').addEventListener('click', function() {
        const summaryText = document.getElementById('summaryResult').textContent;
        navigator.clipboard.writeText(summaryText)
            .then(() => {
                // ØªØºÛŒÛŒØ± Ù…ÙˆÙ‚Øª Ù…ØªÙ† Ø¯Ú©Ù…Ù‡ Ø¨Ø±Ø§ÛŒ Ù†Ù…Ø§ÛŒØ´ Ø¹Ù…Ù„ÛŒØ§Øª Ù…ÙˆÙÙ‚
                this.innerHTML = '<i class="fas fa-check"></i> Ú©Ù¾ÛŒ Ø´Ø¯';
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-copy"></i> Ú©Ù¾ÛŒ';
                }, 2000);
            })
            .catch(err => {
                console.error('Ø®Ø·Ø§ Ø¯Ø± Ú©Ù¾ÛŒ Ù…ØªÙ†:', err);
                alert('Ø®Ø·Ø§ Ø¯Ø± Ú©Ù¾ÛŒ Ù…ØªÙ† Ø¨Ù‡ Ú©Ù„ÛŒÙ¾â€ŒØ¨ÙˆØ±Ø¯.');
            });
    });

    // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ú©Ù„ÛŒÚ© Ø±ÙˆÛŒ Ø¯Ú©Ù…Ù‡ ØªÙˆÙ„ÛŒØ¯ Ù…Ø¬Ø¯Ø¯ Ø®Ù„Ø§ØµÙ‡
    document.getElementById('regenerateSummaryBtn').addEventListener('click', generateSummary);

    // ØªØ§Ø¨Ø¹ ØªÙˆÙ„ÛŒØ¯ Ø®Ù„Ø§ØµÙ‡ Ø¯Ø§Ø³ØªØ§Ù†
    async function generateSummary() {
        const summaryResult = document.getElementById('summaryResult');
        const summaryLoading = document.querySelector('.summary-loading');
        const summaryActions = document.querySelector('.summary-actions');
        const summaryLength = document.getElementById('summaryLengthSelect').value;
        const summaryStyle = document.getElementById('summaryStyleSelect').value;
        
        if (!editor.value.trim()) {
            summaryResult.innerHTML = '<p class="no-summary-message">Ù…ØªÙ† Ø¯Ø§Ø³ØªØ§Ù† Ø®Ø§Ù„ÛŒ Ø§Ø³Øª. Ù„Ø·ÙØ§Ù‹ Ø§Ø¨ØªØ¯Ø§ Ù…ØªÙ†ÛŒ Ø±Ø§ Ø¯Ø± ÙˆÛŒØ±Ø§ÛŒØ´Ú¯Ø± ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.</p>';
            summaryActions.style.display = 'none';
            return;
        }
        
        // Ù†Ù…Ø§ÛŒØ´ Ø­Ø§Ù„Øª Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ
        summaryLoading.style.display = 'flex';
        summaryResult.style.display = 'none';
        summaryActions.style.display = 'none';
        
        try {
            // ØªÙ†Ø¸ÛŒÙ… Ù¾Ø±Ø§Ù…Ù¾Øª Ø¨Ø§ ØªÙˆØ¬Ù‡ Ø¨Ù‡ Ø·ÙˆÙ„ Ùˆ Ø³Ø¨Ú© Ø®Ù„Ø§ØµÙ‡
            let lengthInstruction = '';
            switch (summaryLength) {
                case 'short':
                    lengthInstruction = 'Ø®Ù„Ø§ØµÙ‡ Ú©ÙˆØªØ§Ù‡ Ø¯Ø± Ø­Ø¯ ÛŒÚ© Ù¾Ø§Ø±Ø§Ú¯Ø±Ø§Ù';
                    break;
                case 'medium':
                    lengthInstruction = 'Ø®Ù„Ø§ØµÙ‡ Ù…ØªÙˆØ³Ø· Ø¯Ø± Ø­Ø¯ÙˆØ¯ Û²-Û³ Ù¾Ø§Ø±Ø§Ú¯Ø±Ø§Ù';
                    break;
                case 'long':
                    lengthInstruction = 'Ø®Ù„Ø§ØµÙ‡ Ù†Ø³Ø¨ØªØ§Ù‹ Ø·ÙˆÙ„Ø§Ù†ÛŒ Ø´Ø§Ù…Ù„ Ú†Ù†Ø¯ Ù¾Ø§Ø±Ø§Ú¯Ø±Ø§Ù';
                    break;
            }
            
            let styleInstruction = '';
            switch (summaryStyle) {
                case 'descriptive':
                    styleInstruction = 'Ø¨Ù‡ ØµÙˆØ±Øª ØªÙˆØµÛŒÙÛŒ Ø¨Ø§ ØªÙ…Ø±Ú©Ø² Ø¨Ø± Ø±ÙˆÛŒØ¯Ø§Ø¯Ù‡Ø§ Ùˆ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§';
                    break;
                case 'analytical':
                    styleInstruction = 'Ø¨Ù‡ ØµÙˆØ±Øª ØªØ­Ù„ÛŒÙ„ÛŒ Ø¨Ø§ ØªÙ…Ø±Ú©Ø² Ø¨Ø± Ù…ÙØ§Ù‡ÛŒÙ… Ùˆ Ù¾ÛŒØ§Ù…â€ŒÙ‡Ø§ÛŒ Ø¯Ø§Ø³ØªØ§Ù†';
                    break;
                case 'creative':
                    styleInstruction = 'Ø¨Ù‡ ØµÙˆØ±Øª Ø®Ù„Ø§Ù‚Ø§Ù†Ù‡ Ùˆ Ù†ÙˆØ¢ÙˆØ±Ø§Ù†Ù‡';
                    break;
            }
            
            const prompt = `Ù„Ø·ÙØ§Ù‹ ${lengthInstruction} Ø§Ø² Ù…ØªÙ† Ø²ÛŒØ± ØªÙ‡ÛŒÙ‡ Ú©Ù†ÛŒØ¯. Ø®Ù„Ø§ØµÙ‡ Ø¨Ø§ÛŒØ¯ ${styleInstruction} Ø¨Ø§Ø´Ø¯:

"""
${editor.value}
"""

Ø®Ù„Ø§ØµÙ‡ Ø¨Ø§ÛŒØ¯ Ø´Ø§Ù…Ù„ Ù†Ú©Ø§Øª Ú©Ù„ÛŒØ¯ÛŒØŒ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§ÛŒ Ø§ØµÙ„ÛŒ Ùˆ Ø±ÙˆÛŒØ¯Ø§Ø¯Ù‡Ø§ÛŒ Ù…Ù‡Ù… Ø¯Ø§Ø³ØªØ§Ù† Ø¨Ø§Ø´Ø¯. Ø¨Ù‡ Ø¬Ø§ÛŒ Ø®Ø· Ø¨Ù‡ Ø®Ø· Ø®Ù„Ø§ØµÙ‡ Ú©Ø±Ø¯Ù†ØŒ Ù…ÙØ§Ù‡ÛŒÙ… Ø§ØµÙ„ÛŒ Ø±Ø§ Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ú©Ù†ÛŒØ¯.`;
            
            // Ø¯Ø±ÛŒØ§ÙØª Ø®Ù„Ø§ØµÙ‡ Ø§Ø² Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ
            const summary = await fetchAIResponse(prompt);
            
            // Ù†Ù…Ø§ÛŒØ´ Ø®Ù„Ø§ØµÙ‡
            if (summary) {
                summaryResult.textContent = summary;
                summaryActions.style.display = 'flex';
            } else {
                summaryResult.innerHTML = '<p class="no-summary-message">Ø®Ø·Ø§ Ø¯Ø± ØªÙˆÙ„ÛŒØ¯ Ø®Ù„Ø§ØµÙ‡. Ù„Ø·ÙØ§Ù‹ Ø¯ÙˆØ¨Ø§Ø±Ù‡ ØªÙ„Ø§Ø´ Ú©Ù†ÛŒØ¯ ÛŒØ§ ØªÙ†Ø¸ÛŒÙ…Ø§Øª API Ø±Ø§ Ø¨Ø±Ø±Ø³ÛŒ Ú©Ù†ÛŒØ¯.</p>';
            }
        } catch (error) {
            console.error('Ø®Ø·Ø§ Ø¯Ø± ØªÙˆÙ„ÛŒØ¯ Ø®Ù„Ø§ØµÙ‡:', error);
            summaryResult.innerHTML = '<p class="no-summary-message">Ø®Ø·Ø§ Ø¯Ø± ØªÙˆÙ„ÛŒØ¯ Ø®Ù„Ø§ØµÙ‡. Ù„Ø·ÙØ§Ù‹ Ø¯ÙˆØ¨Ø§Ø±Ù‡ ØªÙ„Ø§Ø´ Ú©Ù†ÛŒØ¯.</p>';
        } finally {
            // Ù¾Ù†Ù‡Ø§Ù† Ú©Ø±Ø¯Ù† Ø­Ø§Ù„Øª Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ
            summaryLoading.style.display = 'none';
            summaryResult.style.display = 'block';
        }
    }

    // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ú©Ù„ÛŒÚ© Ø±ÙˆÛŒ Ø¯Ú©Ù…Ù‡ ØªØ­Ù„ÛŒÙ„ Ù…ØªÙ†
    document.getElementById('analyzeBtn').addEventListener('click', function() {
        if (!editor.value.trim()) {
            alert('Ù„Ø·ÙØ§Ù‹ Ø§Ø¨ØªØ¯Ø§ Ù…ØªÙ†ÛŒ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.');
            return;
        }

        if (!apiKey || !selectedModel) {
            alert('Ù„Ø·ÙØ§Ù‹ Ø§Ø¨ØªØ¯Ø§ API Ùˆ Ù…Ø¯Ù„ Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ Ø±Ø§ Ø¯Ø± ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ù¾ÛŒÚ©Ø±Ø¨Ù†Ø¯ÛŒ Ú©Ù†ÛŒØ¯.');
            settingsModal.classList.add('show');
            return;
        }

        // Ù†Ù…Ø§ÛŒØ´ ØªØ¨ ØªØ­Ù„ÛŒÙ„ Ø³Ø¨Ú©
        document.querySelector('.tab-btn[data-tab="analysis"]').click();
        document.querySelectorAll('.analysis-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('.analysis-tab-btn[data-analysis-tab="style"]').classList.add('active');

        document.querySelectorAll('.analysis-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById('styleAnalysisTab').style.display = 'block';

        // Ø§Ø¬Ø±Ø§ÛŒ ØªØ­Ù„ÛŒÙ„ Ø³Ø¨Ú© Ù†ÙˆØ´ØªØ§Ø±ÛŒ
        analyzeWritingStyle();
    });

    // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ú©Ù„ÛŒÚ© Ø±ÙˆÛŒ Ø¯Ú©Ù…Ù‡ ØªØ­Ù„ÛŒÙ„ Ù…Ø¬Ø¯Ø¯ Ø³Ø¨Ú©
    document.getElementById('runStyleAnalysisBtn').addEventListener('click', analyzeWritingStyle);

    // ØªØ§Ø¨Ø¹ ØªØ­Ù„ÛŒÙ„ Ø³Ø¨Ú© Ù†ÙˆØ´ØªØ§Ø±ÛŒ
    async function analyzeWritingStyle() {
        if (!editor.value.trim()) {
            alert('Ù„Ø·ÙØ§Ù‹ Ø§Ø¨ØªØ¯Ø§ Ù…ØªÙ†ÛŒ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.');
            return;
        }

        // Ú¯Ø±ÙØªÙ† Ø§Ù„Ù…Ø§Ù†â€ŒÙ‡Ø§ÛŒ Ù„Ø§Ø²Ù…
        const avgSentenceLengthElement = document.getElementById('avgSentenceLength');
        const lexicalDiversityElement = document.getElementById('lexicalDiversity');
        const dialogueRatioElement = document.getElementById('dialogueRatio');
        const sentenceLengthSuggestion = document.getElementById('sentenceLengthSuggestion');
        const diversitySuggestion = document.getElementById('diversitySuggestion');
        const dialogueSuggestion = document.getElementById('dialogueSuggestion');
        const repeatingWordsList = document.getElementById('repeatingWordsList');

        // Ù†Ù…Ø§ÛŒØ´ Ø­Ø§Ù„Øª Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ
        avgSentenceLengthElement.textContent = '...';
        lexicalDiversityElement.textContent = '...';
        dialogueRatioElement.textContent = '...';
        sentenceLengthSuggestion.textContent = 'Ø¯Ø± Ø­Ø§Ù„ ØªØ­Ù„ÛŒÙ„...';
        diversitySuggestion.textContent = 'Ø¯Ø± Ø­Ø§Ù„ ØªØ­Ù„ÛŒÙ„...';
        dialogueSuggestion.textContent = 'Ø¯Ø± Ø­Ø§Ù„ ØªØ­Ù„ÛŒÙ„...';
        repeatingWordsList.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Ø¯Ø± Ø­Ø§Ù„ ØªØ­Ù„ÛŒÙ„ Ú©Ù„Ù…Ø§Øª ØªÚ©Ø±Ø§Ø±ÛŒ...</div>';

        try {
            // ØªØ­Ù„ÛŒÙ„ Ù…Ø­Ù„ÛŒ Ø¨Ø±Ø§ÛŒ Ø¨Ø±Ø®ÛŒ Ù…Ø¹ÛŒØ§Ø±Ù‡Ø§
            const text = editor.value;
            const sentences = text.split(/[.!?ØŸà¥¤Û”Ø›:]/); // Ø¬Ø¯Ø§Ø³Ø§Ø²ÛŒ Ø¬Ù…Ù„Ø§Øª Ø¨Ø§ Ù†Ø´Ø§Ù†Ù‡â€ŒÙ‡Ø§ÛŒ Ù†Ù‚Ø·Ù‡â€ŒÚ¯Ø°Ø§Ø±ÛŒ
            const words = text.split(/\s+/).filter(word => word.length > 0); // Ø¬Ø¯Ø§Ø³Ø§Ø²ÛŒ Ú©Ù„Ù…Ø§Øª
            
            // Ù…ÛŒØ§Ù†Ú¯ÛŒÙ† Ø·ÙˆÙ„ Ø¬Ù…Ù„Ù‡
            const validSentences = sentences.filter(s => s.trim().length > 0);
            const avgSentenceLength = (words.length / validSentences.length).toFixed(1);
            
            // ØªÙ†ÙˆØ¹ ÙˆØ§Ú˜Ú¯Ø§Ù† (Ù†Ø³Ø¨Øª Ú©Ù„Ù…Ø§Øª ÛŒÚ©ØªØ§ Ø¨Ù‡ Ú©Ù„ Ú©Ù„Ù…Ø§Øª)
            const uniqueWords = new Set(words.map(w => w.replace(/[^\w\u0600-\u06FF]/g, '').toLowerCase()));
            const lexicalDiversity = ((uniqueWords.size / words.length) * 100).toFixed(1);
            
            // ÛŒØ§ÙØªÙ† Ú©Ù„Ù…Ø§Øª ØªÚ©Ø±Ø§Ø±ÛŒ
            const wordCounts = {};
            words.forEach(word => {
                // Ø­Ø°Ù Ø¹Ù„Ø§Ø¦Ù… Ù†Ú¯Ø§Ø±Ø´ÛŒ Ø§Ø² Ú©Ù„Ù…Ø§Øª
                const cleanWord = word.replace(/[^\w\u0600-\u06FF]/g, '').toLowerCase();
                if (cleanWord.length > 2) { // ÙÙ‚Ø· Ú©Ù„Ù…Ø§Øª Ø¨Ø§ Ø·ÙˆÙ„ Ø¨ÛŒØ´ØªØ± Ø§Ø² 2 Ø±Ø§ Ø¨Ø±Ø±Ø³ÛŒ Ù…ÛŒâ€ŒÚ©Ù†ÛŒÙ…
                    wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
                }
            });
            
            // ÙÛŒÙ„ØªØ± Ú©Ø±Ø¯Ù† Ú©Ù„Ù…Ø§Øª ØªÚ©Ø±Ø§Ø±ÛŒ (Ø¨ÛŒØ´ Ø§Ø² 3 Ø¨Ø§Ø± ØªÚ©Ø±Ø§Ø±)
            const repeatingWords = Object.entries(wordCounts)
                .filter(([word, count]) => count > 3 && word.length > 2)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 15); // Ù†Ù…Ø§ÛŒØ´ Ø­Ø¯Ø§Ú©Ø«Ø± 15 Ú©Ù„Ù…Ù‡ ØªÚ©Ø±Ø§Ø±ÛŒ
            
            // ØªØ­Ù„ÛŒÙ„ Ù†Ø³Ø¨Øª Ø¯ÛŒØ§Ù„ÙˆÚ¯ (ØªØ®Ù…ÛŒÙ†ÛŒ Ø¨Ø± Ø§Ø³Ø§Ø³ ÙˆØ¬ÙˆØ¯ Ø¹Ù„Ø§Ù…Øªâ€ŒÙ‡Ø§ÛŒ Ù†Ù‚Ù„ Ù‚ÙˆÙ„)
            const dialogueLines = text.split('\n').filter(line => line.includes('Â«') || line.includes('Â»') || line.includes('"') || line.includes("'"));
            const dialogueRatio = ((dialogueLines.length / text.split('\n').length) * 100).toFixed(1);
            
            // Ù†Ù…Ø§ÛŒØ´ Ù†ØªØ§ÛŒØ¬ ØªØ­Ù„ÛŒÙ„ Ù…Ø­Ù„ÛŒ
            avgSentenceLengthElement.textContent = avgSentenceLength;
            lexicalDiversityElement.textContent = lexicalDiversity + '%';
            dialogueRatioElement.textContent = dialogueRatio + '%';
            
            // Ø¯Ø±ÛŒØ§ÙØª ØªØ­Ù„ÛŒÙ„ Ùˆ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ø§Ø² Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ
            const prompt = `Ù„Ø·ÙØ§Ù‹ Ø§ÛŒÙ† Ù…ØªÙ† Ø±Ø§ Ø§Ø² Ù†Ø¸Ø± Ø³Ø¨Ú© Ù†ÙˆØ´ØªØ§Ø±ÛŒ ØªØ­Ù„ÛŒÙ„ Ú©Ù†ÛŒØ¯ Ùˆ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§ØªÛŒ Ø¨Ø±Ø§ÛŒ Ø¨Ù‡Ø¨ÙˆØ¯ Ø§Ø±Ø§Ø¦Ù‡ Ø¯Ù‡ÛŒØ¯. Ù¾Ø§Ø³Ø® Ø±Ø§ Ø¨Ù‡ ØµÙˆØ±Øª JSON Ø¨Ø§ Ø§ÛŒÙ† Ø³Ø§Ø®ØªØ§Ø± Ø¨Ø±Ú¯Ø±Ø¯Ø§Ù†ÛŒØ¯:
{
    "sentenceLengthAnalysis": "ØªØ­Ù„ÛŒÙ„ Ùˆ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ Ú©ÙˆØªØ§Ù‡ Ø¨Ø±Ø§ÛŒ Ø·ÙˆÙ„ Ø¬Ù…Ù„Ø§Øª (Ø­Ø¯Ø§Ú©Ø«Ø± ÛŒÚ© Ø®Ø·)",
    "diversityAnalysis": "ØªØ­Ù„ÛŒÙ„ Ùˆ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ Ú©ÙˆØªØ§Ù‡ Ø¨Ø±Ø§ÛŒ ØªÙ†ÙˆØ¹ ÙˆØ§Ú˜Ú¯Ø§Ù† (Ø­Ø¯Ø§Ú©Ø«Ø± ÛŒÚ© Ø®Ø·)",
    "dialogueAnalysis": "ØªØ­Ù„ÛŒÙ„ Ùˆ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯ Ú©ÙˆØªØ§Ù‡ Ø¨Ø±Ø§ÛŒ Ù†Ø³Ø¨Øª Ø¯ÛŒØ§Ù„ÙˆÚ¯ Ø¨Ù‡ Ø±ÙˆØ§ÛŒØª (Ø­Ø¯Ø§Ú©Ø«Ø± ÛŒÚ© Ø®Ø·)"
}

Ø§Ø·Ù„Ø§Ø¹Ø§Øª ØªØ­Ù„ÛŒÙ„ÛŒ Ù…Ø­Ø§Ø³Ø¨Ù‡ Ø´Ø¯Ù‡:
- Ù…ÛŒØ§Ù†Ú¯ÛŒÙ† Ø·ÙˆÙ„ Ø¬Ù…Ù„Ù‡: ${avgSentenceLength} Ú©Ù„Ù…Ù‡
- ØªÙ†ÙˆØ¹ ÙˆØ§Ú˜Ú¯Ø§Ù†: ${lexicalDiversity}%
- Ù†Ø³Ø¨Øª Ø¯ÛŒØ§Ù„ÙˆÚ¯ Ø¨Ù‡ Ø±ÙˆØ§ÛŒØª: ${dialogueRatio}%

Ù…ØªÙ†:
"""
${text.slice(0, 2000)}${text.length > 2000 ? '...' : ''}
"""`;
            
            // Ø¯Ø±ÛŒØ§ÙØª Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ø§Ø² Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ
            const aiAnalysisResponse = await fetchAIResponse(prompt);
            let aiAnalysis = {};
            
            try {
                aiAnalysis = JSON.parse(aiAnalysisResponse);
            } catch (error) {
                console.error('Ø®Ø·Ø§ Ø¯Ø± ØªØ¬Ø²ÛŒÙ‡ Ù¾Ø§Ø³Ø® Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ:', error);
                aiAnalysis = {
                    sentenceLengthAnalysis: "Ø®Ø·Ø§ Ø¯Ø± Ø¯Ø±ÛŒØ§ÙØª ØªØ­Ù„ÛŒÙ„. Ù„Ø·ÙØ§Ù‹ Ø¯ÙˆØ¨Ø§Ø±Ù‡ ØªÙ„Ø§Ø´ Ú©Ù†ÛŒØ¯.",
                    diversityAnalysis: "Ø®Ø·Ø§ Ø¯Ø± Ø¯Ø±ÛŒØ§ÙØª ØªØ­Ù„ÛŒÙ„. Ù„Ø·ÙØ§Ù‹ Ø¯ÙˆØ¨Ø§Ø±Ù‡ ØªÙ„Ø§Ø´ Ú©Ù†ÛŒØ¯.",
                    dialogueAnalysis: "Ø®Ø·Ø§ Ø¯Ø± Ø¯Ø±ÛŒØ§ÙØª ØªØ­Ù„ÛŒÙ„. Ù„Ø·ÙØ§Ù‹ Ø¯ÙˆØ¨Ø§Ø±Ù‡ ØªÙ„Ø§Ø´ Ú©Ù†ÛŒØ¯."
                };
            }
            
            // Ù†Ù…Ø§ÛŒØ´ Ù¾ÛŒØ´Ù†Ù‡Ø§Ø¯Ø§Øª Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ
            sentenceLengthSuggestion.textContent = aiAnalysis.sentenceLengthAnalysis || "ØªØ­Ù„ÛŒÙ„ Ø¯Ø± Ø¯Ø³ØªØ±Ø³ Ù†ÛŒØ³Øª.";
            diversitySuggestion.textContent = aiAnalysis.diversityAnalysis || "ØªØ­Ù„ÛŒÙ„ Ø¯Ø± Ø¯Ø³ØªØ±Ø³ Ù†ÛŒØ³Øª.";
            dialogueSuggestion.textContent = aiAnalysis.dialogueAnalysis || "ØªØ­Ù„ÛŒÙ„ Ø¯Ø± Ø¯Ø³ØªØ±Ø³ Ù†ÛŒØ³Øª.";
            
            // Ù†Ù…Ø§ÛŒØ´ Ú©Ù„Ù…Ø§Øª ØªÚ©Ø±Ø§Ø±ÛŒ
            repeatingWordsList.innerHTML = '';
            if (repeatingWords.length > 0) {
                repeatingWords.forEach(([word, count]) => {
                    const wordItem = document.createElement('div');
                    wordItem.className = 'repeating-word-item';
                    wordItem.innerHTML = `
                        <span>${word}</span>
                        <span class="word-count-badge">${count} Ø¨Ø§Ø±</span>
                    `;
                    repeatingWordsList.appendChild(wordItem);
                });
            } else {
                repeatingWordsList.innerHTML = '<div class="no-repeating-words">Ú©Ù„Ù…Ù‡ ØªÚ©Ø±Ø§Ø±ÛŒ Ù‚Ø§Ø¨Ù„ ØªÙˆØ¬Ù‡ÛŒ ÛŒØ§ÙØª Ù†Ø´Ø¯.</div>';
            }
            
        } catch (error) {
            console.error('Ø®Ø·Ø§ Ø¯Ø± ØªØ­Ù„ÛŒÙ„ Ø³Ø¨Ú© Ù†ÙˆØ´ØªØ§Ø±ÛŒ:', error);
            
            // Ù†Ù…Ø§ÛŒØ´ Ø®Ø·Ø§
            avgSentenceLengthElement.textContent = '-';
            lexicalDiversityElement.textContent = '-';
            dialogueRatioElement.textContent = '-';
            sentenceLengthSuggestion.textContent = 'Ø®Ø·Ø§ Ø¯Ø± ØªØ­Ù„ÛŒÙ„. Ù„Ø·ÙØ§Ù‹ Ø¯ÙˆØ¨Ø§Ø±Ù‡ ØªÙ„Ø§Ø´ Ú©Ù†ÛŒØ¯.';
            diversitySuggestion.textContent = 'Ø®Ø·Ø§ Ø¯Ø± ØªØ­Ù„ÛŒÙ„. Ù„Ø·ÙØ§Ù‹ Ø¯ÙˆØ¨Ø§Ø±Ù‡ ØªÙ„Ø§Ø´ Ú©Ù†ÛŒØ¯.';
            dialogueSuggestion.textContent = 'Ø®Ø·Ø§ Ø¯Ø± ØªØ­Ù„ÛŒÙ„. Ù„Ø·ÙØ§Ù‹ Ø¯ÙˆØ¨Ø§Ø±Ù‡ ØªÙ„Ø§Ø´ Ú©Ù†ÛŒØ¯.';
            repeatingWordsList.innerHTML = '<div class="error-message">Ø®Ø·Ø§ Ø¯Ø± ØªØ­Ù„ÛŒÙ„ Ú©Ù„Ù…Ø§Øª ØªÚ©Ø±Ø§Ø±ÛŒ.</div>';
        }
    }

    // ØªØ§Ø¨Ø¹ Ø°Ø®ÛŒØ±Ù‡â€ŒØ³Ø§Ø²ÛŒ Ø®ÙˆØ¯Ú©Ø§Ø±
    function setupAutoSave() {
        // Ù¾Ø§Ú©Ø³Ø§Ø²ÛŒ ØªØ§ÛŒÙ…Ø± Ù‚Ø¨Ù„ÛŒ Ø§Ú¯Ø± ÙˆØ¬ÙˆØ¯ Ø¯Ø§Ø±Ø¯
        if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
        }
        
        // Ø§ÛŒØ¬Ø§Ø¯ ØªØ§ÛŒÙ…Ø± Ø¬Ø¯ÛŒØ¯ Ø¨Ø±Ø§ÛŒ Ø°Ø®ÛŒØ±Ù‡â€ŒØ³Ø§Ø²ÛŒ Ù‡Ø± Û±Û° Ø«Ø§Ù†ÛŒÙ‡
        autoSaveTimer = setInterval(() => {
            if (currentProject) {
                // Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ù…Ø­ØªÙˆØ§ Ùˆ Ø²Ù…Ø§Ù† ØªØºÛŒÛŒØ± Ù¾Ø±ÙˆÚ˜Ù‡
                updateProject(currentProject.id, {
                    content: editor.value,
                    lastModified: new Date().toISOString()
                });
                
                // Ù†Ù…Ø§ÛŒØ´ Ù¾ÛŒØ§Ù… Ø°Ø®ÛŒØ±Ù‡â€ŒØ³Ø§Ø²ÛŒ Ø®ÙˆØ¯Ú©Ø§Ø±
                showAutoSaveNotification();
            }
        }, 10000); // Û±Û° Ø«Ø§Ù†ÛŒÙ‡ = Û±Û°Û°Û°Û° Ù…ÛŒÙ„ÛŒâ€ŒØ«Ø§Ù†ÛŒÙ‡
    }

    // Ù†Ù…Ø§ÛŒØ´ Ø§Ø¹Ù„Ø§Ù† Ø°Ø®ÛŒØ±Ù‡â€ŒØ³Ø§Ø²ÛŒ Ø®ÙˆØ¯Ú©Ø§Ø±
    function showAutoSaveNotification() {
        // Ø§ÛŒØ¬Ø§Ø¯ ÛŒÚ© Ø§Ø¹Ù„Ø§Ù† Ú¯Ø°Ø±Ø§ Ø¨Ø±Ø§ÛŒ Ø°Ø®ÛŒØ±Ù‡â€ŒØ³Ø§Ø²ÛŒ Ø®ÙˆØ¯Ú©Ø§Ø±
        const notification = document.createElement('div');
        notification.className = 'autosave-notification';
        notification.innerHTML = '<i class="fas fa-save"></i> Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯';
        
        document.body.appendChild(notification);
        
        // Ù†Ù…Ø§ÛŒØ´ Ø§Ø¹Ù„Ø§Ù†
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Ø­Ø°Ù Ø§Ø¹Ù„Ø§Ù† Ù¾Ø³ Ø§Ø² Û² Ø«Ø§Ù†ÛŒÙ‡
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }

    // Ø§ÛŒØ¬Ø§Ø¯ Ù¾Ø±ÙˆÚ˜Ù‡ Ø¬Ø¯ÛŒØ¯ Ø§ÙˆÙ„ÛŒÙ‡ Ù‡Ù†Ú¯Ø§Ù… Ø´Ø±ÙˆØ¹ Ù†ÙˆØ´ØªÙ†
    function handleInitialTyping() {
        // Ø§Ú¯Ø± Ù¾Ø±ÙˆÚ˜Ù‡â€ŒØ§ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ù†Ø´Ø¯Ù‡ Ùˆ Ú©Ø§Ø±Ø¨Ø± Ø´Ø±ÙˆØ¹ Ø¨Ù‡ Ù†ÙˆØ´ØªÙ† Ú©Ø±Ø¯Ù‡ØŒ ÛŒÚ© Ù¾Ø±ÙˆÚ˜Ù‡ Ø¬Ø¯ÛŒØ¯ Ø§ÛŒØ¬Ø§Ø¯ Ú©Ù†
        if (!currentProject && editor.value.trim() !== '') {
            const projectTitle = 'Ù¾Ø±ÙˆÚ˜Ù‡ Ø¨Ø¯ÙˆÙ† Ø¹Ù†ÙˆØ§Ù†';
            const newProject = createNewProject(projectTitle, 'other', '');
            
            // Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ UI
            document.getElementById('currentProjectTitle').value = projectTitle;
            updateProjectsList();
            
            // Ù†Ù…Ø§ÛŒØ´ Ø§Ø¹Ù„Ø§Ù†
            const notification = document.createElement('div');
            notification.className = 'project-created-notification';
            notification.innerHTML = `<i class="fas fa-file-alt"></i> Ù¾Ø±ÙˆÚ˜Ù‡ Ø¬Ø¯ÛŒØ¯ "${projectTitle}" Ø§ÛŒØ¬Ø§Ø¯ Ø´Ø¯`;
            
            document.body.appendChild(notification);
            
            // Ù†Ù…Ø§ÛŒØ´ Ø§Ø¹Ù„Ø§Ù†
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);
            
            // Ø­Ø°Ù Ø§Ø¹Ù„Ø§Ù† Ù¾Ø³ Ø§Ø² Û³ Ø«Ø§Ù†ÛŒÙ‡
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
            
            // Ø´Ø±ÙˆØ¹ Ø°Ø®ÛŒØ±Ù‡â€ŒØ³Ø§Ø²ÛŒ Ø®ÙˆØ¯Ú©Ø§Ø±
            setupAutoSave();
        }
    }

    // Ø±ÙˆÛŒØ¯Ø§Ø¯ keydown Ø¨Ø±Ø§ÛŒ ØªØ´Ø®ÛŒØµ Ø´Ø±ÙˆØ¹ Ù†ÙˆØ´ØªÙ†
    editor.addEventListener('keydown', function(e) {
        // Ø§Ú¯Ø± Ú©Ù„ÛŒØ¯ enter ÛŒØ§ space ÛŒØ§ Ú©Ù„ÛŒØ¯ Ù…Ø¹Ù†Ø§Ø¯Ø§Ø± Ø¯ÛŒÚ¯Ø±ÛŒ Ø²Ø¯Ù‡ Ø´Ø¯
        if (e.key.length === 1 || e.key === 'Enter' || e.key === ' ' || e.key === 'Backspace') {
            handleInitialTyping();
        }
    });
    
    // Ø´Ø±ÙˆØ¹ Ø°Ø®ÛŒØ±Ù‡â€ŒØ³Ø§Ø²ÛŒ Ø®ÙˆØ¯Ú©Ø§Ø± Ø§Ú¯Ø± Ù¾Ø±ÙˆÚ˜Ù‡â€ŒØ§ÛŒ Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡ Ø§Ø³Øª
    if (currentProject) {
        setupAutoSave();
    }
    
    // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ú©Ù„ÛŒÚ© Ø±ÙˆÛŒ Ø¯Ú©Ù…Ù‡ Ø°Ø®ÛŒØ±Ù‡
    document.getElementById('saveBtn').addEventListener('click', function() {
        openSaveProjectModal();
    });
    
    // Ù…ØªØºÛŒØ±Ù‡Ø§ÛŒ Ù…ÙˆØ¯Ø§Ù„ Ø°Ø®ÛŒØ±Ù‡ Ù¾Ø±ÙˆÚ˜Ù‡
    const saveProjectModal = document.getElementById('saveProjectModal');
    const closeSaveProjectModal = saveProjectModal.querySelector('.close-modal');
    const confirmSaveProjectBtn = document.getElementById('confirmSaveProjectBtn');
    const saveProjectOptions = document.getElementById('saveProjectOptions');
    
    // Ø¨Ø§Ø² Ú©Ø±Ø¯Ù† Ù…ÙˆØ¯Ø§Ù„ Ø°Ø®ÛŒØ±Ù‡ Ù¾Ø±ÙˆÚ˜Ù‡
    function openSaveProjectModal() {
        // Ø¨Ø±Ø±Ø³ÛŒ ÙˆØ¬ÙˆØ¯ Ù…ØªÙ†
        if (!editor.value.trim()) {
            alert('Ù„Ø·ÙØ§Ù‹ Ø§Ø¨ØªØ¯Ø§ Ù…ØªÙ†ÛŒ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.');
            return;
        }
        
        // Ù¾Ø± Ú©Ø±Ø¯Ù† Ù…Ù‚Ø§Ø¯ÛŒØ± Ù¾ÛŒØ´â€ŒÙØ±Ø¶ Ø¨Ø§ Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ù¾Ø±ÙˆÚ˜Ù‡ ÙØ¹Ù„ÛŒ (Ø§Ú¯Ø± ÙˆØ¬ÙˆØ¯ Ø¯Ø§Ø±Ø¯)
        if (currentProject) {
            document.getElementById('saveProjectName').value = currentProject.title;
            document.getElementById('saveProjectType').value = currentProject.type;
            document.getElementById('saveProjectDescription').value = currentProject.description || '';
            
            // Ù†Ù…Ø§ÛŒØ´ Ú¯Ø²ÛŒÙ†Ù‡â€ŒÙ‡Ø§ÛŒ Ø°Ø®ÛŒØ±Ù‡ (Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ ÛŒØ§ Ø°Ø®ÛŒØ±Ù‡ Ø¨Ù‡ Ø¹Ù†ÙˆØ§Ù† Ø¬Ø¯ÛŒØ¯)
            saveProjectOptions.style.display = 'block';
        } else {
            // Ø§Ú¯Ø± Ù¾Ø±ÙˆÚ˜Ù‡â€ŒØ§ÛŒ ÙØ¹Ø§Ù„ Ù†ÛŒØ³ØªØŒ Ù…Ù‚Ø§Ø¯ÛŒØ± Ù¾ÛŒØ´â€ŒÙØ±Ø¶
            document.getElementById('saveProjectName').value = 'Ù¾Ø±ÙˆÚ˜Ù‡ Ø¬Ø¯ÛŒØ¯';
            document.getElementById('saveProjectType').value = 'other';
            document.getElementById('saveProjectDescription').value = '';
            
            // Ù¾Ù†Ù‡Ø§Ù† Ú©Ø±Ø¯Ù† Ú¯Ø²ÛŒÙ†Ù‡â€ŒÙ‡Ø§ÛŒ Ø°Ø®ÛŒØ±Ù‡ (ÙÙ‚Ø· Ù¾Ø±ÙˆÚ˜Ù‡ Ø¬Ø¯ÛŒØ¯)
            saveProjectOptions.style.display = 'none';
        }
        
        // Ù†Ù…Ø§ÛŒØ´ Ù…ÙˆØ¯Ø§Ù„
        saveProjectModal.classList.add('show');
    }
    
    // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ø¨Ø³ØªÙ† Ù…ÙˆØ¯Ø§Ù„ Ø°Ø®ÛŒØ±Ù‡ Ù¾Ø±ÙˆÚ˜Ù‡
    closeSaveProjectModal.addEventListener('click', function() {
        saveProjectModal.classList.remove('show');
    });
    
    // Ú©Ù„ÛŒÚ© Ø®Ø§Ø±Ø¬ Ø§Ø² Ù…ÙˆØ¯Ø§Ù„ Ø¨Ø±Ø§ÛŒ Ø¨Ø³ØªÙ† Ø¢Ù†
    window.addEventListener('click', function(event) {
        if (event.target === saveProjectModal) {
            saveProjectModal.classList.remove('show');
        }
    });
    
    // Ø±ÙˆÛŒØ¯Ø§Ø¯ Ø°Ø®ÛŒØ±Ù‡ Ù¾Ø±ÙˆÚ˜Ù‡
    confirmSaveProjectBtn.addEventListener('click', function() {
        const projectName = document.getElementById('saveProjectName').value.trim();
        const projectType = document.getElementById('saveProjectType').value;
        const projectDescription = document.getElementById('saveProjectDescription').value.trim();
        
        if (!projectName) {
            alert('Ù„Ø·ÙØ§Ù‹ ÛŒÚ© Ù†Ø§Ù… Ø¨Ø±Ø§ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.');
            return;
        }
        
        // Ø¨Ø±Ø±Ø³ÛŒ Ú¯Ø²ÛŒÙ†Ù‡ Ø§Ù†ØªØ®Ø§Ø¨ Ø´Ø¯Ù‡ Ø¨Ø±Ø§ÛŒ Ø°Ø®ÛŒØ±Ù‡
        const saveOption = currentProject 
            ? document.querySelector('input[name="saveOption"]:checked').value 
            : 'new';
        
        if (saveOption === 'update' && currentProject) {
            // Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡ ÙØ¹Ù„ÛŒ
            updateProject(currentProject.id, {
                title: projectName,
                type: projectType,
                description: projectDescription,
                content: editor.value
            });
            
            // Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø¹Ù†ÙˆØ§Ù† Ø¯Ø± ÙˆØ±ÙˆØ¯ÛŒ
            document.getElementById('currentProjectTitle').value = projectName;
            
            // Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ù„ÛŒØ³Øª Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§
            updateProjectsList();
            
            showMessage('Ù¾Ø±ÙˆÚ˜Ù‡ Ø¨Ø§ Ù…ÙˆÙÙ‚ÛŒØª Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø´Ø¯');
        } else {
            // Ø§ÛŒØ¬Ø§Ø¯ Ù¾Ø±ÙˆÚ˜Ù‡ Ø¬Ø¯ÛŒØ¯
            const newProject = createNewProject(projectName, projectType, projectDescription);
            
            // Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ù…Ø­ØªÙˆØ§
            updateProject(newProject.id, { content: editor.value });
            
            // Ø§Ù†ØªØ®Ø§Ø¨ Ù¾Ø±ÙˆÚ˜Ù‡ Ø¬Ø¯ÛŒØ¯
            setCurrentProject(newProject.id);
            
            showMessage('Ù¾Ø±ÙˆÚ˜Ù‡ Ø¬Ø¯ÛŒØ¯ Ø¨Ø§ Ù…ÙˆÙÙ‚ÛŒØª Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯');
        }
        
        // Ø¨Ø³ØªÙ† Ù…ÙˆØ¯Ø§Ù„
        saveProjectModal.classList.remove('show');
    });
    
    // Ù†Ù…Ø§ÛŒØ´ Ù¾ÛŒØ§Ù… Ù…ÙˆÙÙ‚ÛŒØª
    function showMessage(message) {
        const notification = document.createElement('div');
        notification.className = 'project-created-notification';
        notification.innerHTML = `<i class="fas fa-check"></i> ${message}`;
        
        document.body.appendChild(notification);
        
        // Ù†Ù…Ø§ÛŒØ´ Ø§Ø¹Ù„Ø§Ù†
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Ø­Ø°Ù Ø§Ø¹Ù„Ø§Ù† Ù¾Ø³ Ø§Ø² Û³ Ø«Ø§Ù†ÛŒÙ‡
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Ø¯Ú©Ù…Ù‡ Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø®ÙˆØ¯Ú©Ø§Ø± Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§
    document.getElementById('extractCharactersBtn').addEventListener('click', function() {
        extractCharactersFromStory();
    });
    
    // Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø®ÙˆØ¯Ú©Ø§Ø± Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§ Ø§Ø² Ù…ØªÙ† Ø¯Ø§Ø³ØªØ§Ù†
    async function extractCharactersFromStory() {
        if (!currentProject) {
            alert('Ù„Ø·ÙØ§Ù‹ Ø§Ø¨ØªØ¯Ø§ ÛŒÚ© Ù¾Ø±ÙˆÚ˜Ù‡ Ø±Ø§ Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ù†ÛŒØ¯.');
            return;
        }
        
        const storyText = editor.value.trim();
        if (!storyText) {
            alert('Ù…ØªÙ† Ø¯Ø§Ø³ØªØ§Ù† Ø®Ø§Ù„ÛŒ Ø§Ø³Øª. Ù„Ø·ÙØ§Ù‹ Ø§Ø¨ØªØ¯Ø§ Ù…ØªÙ†ÛŒ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.');
            return;
        }
        
        // Ù†Ù…Ø§ÛŒØ´ ÙˆØ¶Ø¹ÛŒØª Ø¯Ø± Ø­Ø§Ù„ Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ
        const charactersList = document.getElementById('charactersList');
        charactersList.innerHTML = `
            <div class="loading-characters">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Ø¯Ø± Ø­Ø§Ù„ Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§...</p>
            </div>
        `;
        
        try {
            // Ø³Ø§Ø®Øª Ù¾Ø±Ø§Ù…Ù¾Øª Ø¨Ø±Ø§ÛŒ Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§
            const prompt = `
            Ù…ØªÙ† Ø²ÛŒØ± Ø±Ø§ Ø¨Ø§ Ø¯Ù‚Øª Ø¨Ø®ÙˆØ§Ù† Ùˆ ØªÙ…Ø§Ù… Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§ÛŒ Ø¯Ø§Ø³ØªØ§Ù† Ø±Ø§ Ø´Ù†Ø§Ø³Ø§ÛŒÛŒ Ú©Ù†. Ø¨Ø±Ø§ÛŒ Ù‡Ø± Ø´Ø®ØµÛŒØª Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ø²ÛŒØ± Ø±Ø§ Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ú©Ù†:
            1. Ù†Ø§Ù… Ø´Ø®ØµÛŒØª
            2. Ù†Ù‚Ø´ Ø¯Ø± Ø¯Ø§Ø³ØªØ§Ù† (Ø´Ø®ØµÛŒØª Ø§ØµÙ„ÛŒØŒ Ø¶Ø¯ Ù‚Ù‡Ø±Ù…Ø§Ù†ØŒ Ø´Ø®ØµÛŒØª ÙØ±Ø¹ÛŒ ÛŒØ§ Ø´Ø®ØµÛŒØª Ø¬Ø²Ø¦ÛŒ)
            3. ÙˆÛŒÚ˜Ú¯ÛŒâ€ŒÙ‡Ø§ÛŒ Ø¸Ø§Ù‡Ø±ÛŒ (Ø¯Ø± ØµÙˆØ±Øª Ø°Ú©Ø± Ø¯Ø± Ù…ØªÙ†)
            4. ÙˆÛŒÚ˜Ú¯ÛŒâ€ŒÙ‡Ø§ÛŒ Ø´Ø®ØµÛŒØªÛŒ (Ø®Ù„Ù‚ Ùˆ Ø®ÙˆØŒ Ø®ØµÙˆØµÛŒØ§Øª Ø±ÙØªØ§Ø±ÛŒ Ùˆ ØºÛŒØ±Ù‡)
            5. Ù¾ÛŒØ´ÛŒÙ†Ù‡ Ùˆ ØªØ§Ø±ÛŒØ®Ú†Ù‡ (Ø§Ú¯Ø± Ø¯Ø± Ù…ØªÙ† Ø¢Ù…Ø¯Ù‡ Ø§Ø³Øª)
            6. Ø§Ù‡Ø¯Ø§Ù Ùˆ Ø§Ù†Ú¯ÛŒØ²Ù‡â€ŒÙ‡Ø§

            Ù¾Ø§Ø³Ø® Ø±Ø§ Ø¨Ù‡ ØµÙˆØ±Øª JSON Ø¨Ø§ ÙØ±Ù…Øª Ø²ÛŒØ± Ø¨Ø±Ú¯Ø±Ø¯Ø§Ù†:
            [
                {
                    "name": "Ù†Ø§Ù… Ø´Ø®ØµÛŒØª",
                    "role": "protagonist ÛŒØ§ antagonist ÛŒØ§ supporting ÛŒØ§ minor",
                    "physical": "ÙˆÛŒÚ˜Ú¯ÛŒâ€ŒÙ‡Ø§ÛŒ Ø¸Ø§Ù‡Ø±ÛŒ",
                    "personality": "ÙˆÛŒÚ˜Ú¯ÛŒâ€ŒÙ‡Ø§ÛŒ Ø´Ø®ØµÛŒØªÛŒ",
                    "backstory": "Ù¾ÛŒØ´ÛŒÙ†Ù‡ Ùˆ ØªØ§Ø±ÛŒØ®Ú†Ù‡",
                    "goals": "Ø§Ù‡Ø¯Ø§Ù Ùˆ Ø§Ù†Ú¯ÛŒØ²Ù‡â€ŒÙ‡Ø§"
                },
                {...}
            ]
            
            Ø§Ú¯Ø± Ø§Ø·Ù„Ø§Ø¹Ø§ØªÛŒ Ø¯Ø± Ù…ØªÙ† Ù†ÛŒØ§Ù…Ø¯Ù‡ØŒ Ø¢Ù† ÙÛŒÙ„Ø¯ Ø±Ø§ Ø®Ø§Ù„ÛŒ Ø¨Ú¯Ø°Ø§Ø±. ÙÙ‚Ø· JSON Ø®Ø±ÙˆØ¬ÛŒ Ø±Ø§ Ø¨Ø±Ú¯Ø±Ø¯Ø§Ù†ØŒ Ø¨Ø¯ÙˆÙ† Ù‡ÛŒÚ† ØªÙˆØ¶ÛŒØ­ Ø§Ø¶Ø§ÙÛŒ.
            
            Ù…ØªÙ† Ø¯Ø§Ø³ØªØ§Ù†:
            ${storyText}
            `;
            
            // Ø¯Ø±Ø®ÙˆØ§Ø³Øª Ø¨Ù‡ API
            const response = await fetchAIResponse(prompt);
            
            // ØªÙ„Ø§Ø´ Ø¨Ø±Ø§ÛŒ Ù¾Ø§Ø±Ø³ Ú©Ø±Ø¯Ù† Ù¾Ø§Ø³Ø® Ø¨Ù‡ Ø¹Ù†ÙˆØ§Ù† JSON
            let characters = [];
            try {
                // Ø¬Ø¯Ø§ Ú©Ø±Ø¯Ù† Ø¨Ø®Ø´ JSON Ø§Ø² Ù¾Ø§Ø³Ø®
                const jsonMatch = response.match(/\[\s*\{.*?\}\s*\]/s);
                if (jsonMatch) {
                    characters = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('ÙØ±Ù…Øª JSON ÛŒØ§ÙØª Ù†Ø´Ø¯');
                }
            } catch (jsonError) {
                console.error('Ø®Ø·Ø§ Ø¯Ø± Ù¾Ø§Ø±Ø³ Ú©Ø±Ø¯Ù† JSON:', jsonError);
                // ØªÙ„Ø§Ø´ Ø¨Ø±Ø§ÛŒ Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø¯Ø³ØªÛŒ Ø§Ø·Ù„Ø§Ø¹Ø§Øª
                characters = parseCharactersManually(response);
            }
            
            if (characters.length === 0) {
                charactersList.innerHTML = `
                    <div class="no-characters-found">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Ù‡ÛŒÚ† Ø´Ø®ØµÛŒØªÛŒ Ø¯Ø± Ù…ØªÙ† Ø´Ù†Ø§Ø³Ø§ÛŒÛŒ Ù†Ø´Ø¯. Ù„Ø·ÙØ§Ù‹ Ù…ØªÙ† Ø·ÙˆÙ„Ø§Ù†ÛŒâ€ŒØªØ±ÛŒ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯ ÛŒØ§ Ø¬Ø²Ø¦ÛŒØ§Øª Ø¨ÛŒØ´ØªØ±ÛŒ Ø¯Ø±Ø¨Ø§Ø±Ù‡ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§ Ø¨Ù†ÙˆÛŒØ³ÛŒØ¯.</p>
                    </div>
                `;
                return;
            }
            
            // Ø°Ø®ÛŒØ±Ù‡ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§ Ø¯Ø± Ù¾Ø±ÙˆÚ˜Ù‡
            const projectCharacters = currentProject.characters || [];
            characters.forEach(character => {
                // Ø¨Ø±Ø±Ø³ÛŒ ØªÚ©Ø±Ø§Ø±ÛŒ Ù†Ø¨ÙˆØ¯Ù† Ø´Ø®ØµÛŒØª
                const existingIndex = projectCharacters.findIndex(c => c.name && c.name.toLowerCase() === character.name.toLowerCase());
                
                if (existingIndex >= 0) {
                    // Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø´Ø®ØµÛŒØª Ù…ÙˆØ¬ÙˆØ¯
                    projectCharacters[existingIndex] = {
                        ...projectCharacters[existingIndex],
                        ...character,
                        id: projectCharacters[existingIndex].id
                    };
                } else {
                    // Ø§ÙØ²ÙˆØ¯Ù† Ø´Ø®ØµÛŒØª Ø¬Ø¯ÛŒØ¯
                    projectCharacters.push({
                        ...character,
                        id: Date.now() + Math.random().toString(36).substr(2, 9)
                    });
                }
            });
            
            // Ø°Ø®ÛŒØ±Ù‡ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§ Ø¯Ø± Ù¾Ø±ÙˆÚ˜Ù‡
            currentProject.characters = projectCharacters;
            updateProject(currentProject.id, { characters: projectCharacters });
            
            // Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ù„ÛŒØ³Øª Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§
            updateCharactersList();
            
            // Ù†Ù…Ø§ÛŒØ´ Ù¾ÛŒØ§Ù… Ù…ÙˆÙÙ‚ÛŒØª
            showMessage(`${characters.length} Ø´Ø®ØµÛŒØª Ø¨Ø§ Ù…ÙˆÙÙ‚ÛŒØª Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø´Ø¯`);
            
        } catch (error) {
            console.error('Ø®Ø·Ø§ Ø¯Ø± Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§:', error);
            charactersList.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Ø®Ø·Ø§ Ø¯Ø± Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§. Ù„Ø·ÙØ§Ù‹ Ø¯ÙˆØ¨Ø§Ø±Ù‡ ØªÙ„Ø§Ø´ Ú©Ù†ÛŒØ¯.</p>
                </div>
            `;
        }
    }
    
    // ØªØ§Ø¨Ø¹ Ú©Ù…Ú©ÛŒ Ø¨Ø±Ø§ÛŒ Ù¾Ø§Ø±Ø³ Ø¯Ø³ØªÛŒ Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§ Ø¯Ø± ØµÙˆØ±Øª Ø®Ø·Ø§ Ø¯Ø± JSON
    function parseCharactersManually(response) {
        const characters = [];
        
        // Ø§Ù„Ú¯ÙˆÛŒ Ø³Ø§Ø¯Ù‡ Ø¨Ø±Ø§ÛŒ Ø´Ù†Ø§Ø³Ø§ÛŒÛŒ Ø¨Ø®Ø´â€ŒÙ‡Ø§ÛŒ Ù…Ø±Ø¨ÙˆØ· Ø¨Ù‡ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§
        const characterBlocks = response.split(/\d+\.\s*[^:]+:/);
        
        for (let i = 1; i < characterBlocks.length; i++) {
            const block = characterBlocks[i].trim();
            
            // Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ù†Ø§Ù… Ø´Ø®ØµÛŒØª
            const nameMatch = block.match(/Ù†Ø§Ù…[^:]*:\s*([^\n]+)/);
            const name = nameMatch ? nameMatch[1].trim() : '';
            
            if (!name) continue;
            
            // Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø³Ø§ÛŒØ± ÙˆÛŒÚ˜Ú¯ÛŒâ€ŒÙ‡Ø§
            const roleMatch = block.match(/Ù†Ù‚Ø´[^:]*:\s*([^\n]+)/);
            const physicalMatch = block.match(/Ø¸Ø§Ù‡Ø±ÛŒ[^:]*:\s*([^\n]+)/);
            const personalityMatch = block.match(/Ø´Ø®ØµÛŒØªÛŒ[^:]*:\s*([^\n]+)/);
            const backstoryMatch = block.match(/Ù¾ÛŒØ´ÛŒÙ†Ù‡[^:]*:\s*([^\n]+)/);
            const goalsMatch = block.match(/Ø§Ù‡Ø¯Ø§Ù[^:]*:\s*([^\n]+)/);
            
            // ØªØ¨Ø¯ÛŒÙ„ Ù†Ù‚Ø´ Ø¨Ù‡ Ø§Ù†Ú¯Ù„ÛŒØ³ÛŒ
            let role = 'supporting';
            if (roleMatch) {
                const roleText = roleMatch[1].toLowerCase();
                if (roleText.includes('Ø§ØµÙ„ÛŒ')) {
                    role = 'protagonist';
                } else if (roleText.includes('Ø¶Ø¯') || roleText.includes('Ø´Ø±ÙˆØ±') || roleText.includes('Ù…Ù†ÙÛŒ')) {
                    role = 'antagonist';
                } else if (roleText.includes('ÙØ±Ø¹ÛŒ')) {
                    role = 'supporting';
                } else if (roleText.includes('Ø¬Ø²Ø¦ÛŒ')) {
                    role = 'minor';
                }
            }
            
            characters.push({
                name: name,
                role: role,
                physical: physicalMatch ? physicalMatch[1].trim() : '',
                personality: personalityMatch ? personalityMatch[1].trim() : '',
                backstory: backstoryMatch ? backstoryMatch[1].trim() : '',
                goals: goalsMatch ? goalsMatch[1].trim() : ''
            });
        }
        
        return characters;
    }
    
    // ØªØ§Ø¨Ø¹ Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø¢Ù…Ø§Ø± Ù†ÙˆØ´ØªÙ†
    function updateWritingStats() {
        // Ø¨Ø±Ø±Ø³ÛŒ ÙˆØ¬ÙˆØ¯ Ù¾Ø±ÙˆÚ˜Ù‡ ÙØ¹Ù„ÛŒ
        if (!currentProject) {
            return;
        }
        
        try {
            // Ù†Ù…Ø§ÛŒØ´ ØªØ¹Ø¯Ø§Ø¯ Ú©Ù„Ù…Ø§Øª Ø§Ù…Ø±ÙˆØ² (ÙØ¹Ù„Ø§Ù‹ Ù…Ù‚Ø¯Ø§Ø± Ø«Ø§Ø¨Øª)
            document.getElementById('todayWords').textContent = editor.value.trim().split(/\s+/).length || 0;
            
            // Ù…ÛŒØ§Ù†Ú¯ÛŒÙ† Ø±ÙˆØ²Ø§Ù†Ù‡ (ÙØ¹Ù„Ø§Ù‹ Ù…Ù‚Ø¯Ø§Ø± Ø«Ø§Ø¨Øª)
            document.getElementById('averageWords').textContent = "500";
            
            // Ø±ÙˆØ²Ù‡Ø§ÛŒ Ù…ØªÙˆØ§Ù„ÛŒ Ù†ÙˆØ´ØªÙ† (ÙØ¹Ù„Ø§Ù‹ Ù…Ù‚Ø¯Ø§Ø± Ø«Ø§Ø¨Øª)
            document.getElementById('writingStreak').textContent = "1";
            
            // Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ù†Ù…ÙˆØ¯Ø§Ø± (Ø§Ú¯Ø± ÙˆØ¬ÙˆØ¯ Ø¯Ø§Ø´ØªÙ‡ Ø¨Ø§Ø´Ø¯)
            updateWritingChart();
        } catch (error) {
            console.error('Ø®Ø·Ø§ Ø¯Ø± Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø¢Ù…Ø§Ø± Ù†ÙˆØ´ØªÙ†:', error);
        }
    }

    // ØªØ§Ø¨Ø¹ Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ù†Ù…ÙˆØ¯Ø§Ø± Ù†ÙˆØ´ØªÙ†
    function updateWritingChart() {
        const canvas = document.getElementById('writingStatsChart');
        if (!canvas) {
            return;
        }
        
        // Ø¯Ø± Ø§ÛŒÙ†Ø¬Ø§ Ú©Ø¯ Ù…Ø±Ø¨ÙˆØ· Ø¨Ù‡ Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ù†Ù…ÙˆØ¯Ø§Ø± Ù‚Ø±Ø§Ø± Ù…ÛŒâ€ŒÚ¯ÛŒØ±Ø¯
        // Ø§ÛŒÙ† Ù‚Ø³Ù…Øª Ø±Ø§ Ø¨Ø¹Ø¯Ø§Ù‹ ØªÚ©Ù…ÛŒÙ„ Ø®ÙˆØ§Ù‡ÛŒÙ… Ú©Ø±Ø¯
    }
    
    return streak;
}

// Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ù†Ù…ÙˆØ¯Ø§Ø± Ø¢Ù…Ø§Ø± Ù†ÙˆØ´ØªÙ†
function updateWritingStatsChart(period) {
    if (!currentProject) return;
    
    // Ø¯Ø±ÛŒØ§ÙØª Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ø¨Ø± Ø§Ø³Ø§Ø³ Ø¯ÙˆØ±Ù‡ Ø²Ù…Ø§Ù†ÛŒ
    let labels = [];
    let data = [];
    let goalLine = [];
    
    const dailyGoal = currentProject.writingStats ? currentProject.writingStats.dailyGoal : 500;
    
    switch (period) {
        case 'week':
            // Ø¢Ù…Ø§Ø± Ù‡ÙØªÙ‡ Ø§Ø®ÛŒØ± (7 Ø±ÙˆØ²)
            const last7Days = [];
            const today = new Date();
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateString = date.toISOString().split('T')[0];
                const persianDate = new Date(dateString).toLocaleDateString('fa-IR', { weekday: 'short' });
                
                labels.push(persianDate);
                
                const record = currentProject.writingStats && currentProject.writingStats.wordCountHistory 
                    ? currentProject.writingStats.wordCountHistory.find(r => r.date === dateString)
                    : null;
                    
                data.push(record ? record.wordCount : 0);
                goalLine.push(dailyGoal);
            }
            break;
            
        case 'month':
            // Ø¢Ù…Ø§Ø± Ù…Ø§Ù‡ Ø§Ø®ÛŒØ± (30 Ø±ÙˆØ²)
            const last30Days = [];
            const todayForMonth = new Date();
            
            for (let i = 29; i >= 0; i--) {
                const date = new Date(todayForMonth);
                date.setDate(todayForMonth.getDate() - i);
                const dateString = date.toISOString().split('T')[0];
                
                // ÙÙ‚Ø· Ø±ÙˆØ² Ø±Ø§ Ù†Ù…Ø§ÛŒØ´ Ù…ÛŒâ€ŒØ¯Ù‡ÛŒÙ…
                const day = new Date(dateString).getDate();
                labels.push(day);
                
                const record = currentProject.writingStats && currentProject.writingStats.wordCountHistory 
                    ? currentProject.writingStats.wordCountHistory.find(r => r.date === dateString)
                    : null;
                    
                data.push(record ? record.wordCount : 0);
                goalLine.push(dailyGoal);
            }
            break;
            
        case 'year':
            // Ø¢Ù…Ø§Ø± Ø³Ø§Ù„ Ø§Ø®ÛŒØ± (12 Ù…Ø§Ù‡)
            const monthNames = ['ÙØ±ÙˆØ±Ø¯ÛŒÙ†', 'Ø§Ø±Ø¯ÛŒØ¨Ù‡Ø´Øª', 'Ø®Ø±Ø¯Ø§Ø¯', 'ØªÛŒØ±', 'Ù…Ø±Ø¯Ø§Ø¯', 'Ø´Ù‡Ø±ÛŒÙˆØ±', 'Ù…Ù‡Ø±', 'Ø¢Ø¨Ø§Ù†', 'Ø¢Ø°Ø±', 'Ø¯ÛŒ', 'Ø¨Ù‡Ù…Ù†', 'Ø§Ø³ÙÙ†Ø¯'];
            const todayForYear = new Date();
            
            for (let i = 11; i >= 0; i--) {
                const date = new Date(todayForYear);
                date.setMonth(todayForYear.getMonth() - i);
                
                const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const monthIndex = date.getMonth();
                
                labels.push(monthNames[monthIndex]);
                
                // Ø¬Ù…Ø¹ Ú©Ø±Ø¯Ù† ØªØ¹Ø¯Ø§Ø¯ Ú©Ù„Ù…Ø§Øª Ø¨Ø±Ø§ÛŒ Ù‡Ø± Ù…Ø§Ù‡
                let monthTotal = 0;
                
                if (currentProject.writingStats && currentProject.writingStats.wordCountHistory) {
                    currentProject.writingStats.wordCountHistory.forEach(record => {
                        if (record.date.startsWith(yearMonth)) {
                            monthTotal += record.wordCount;
                        }
                    });
                }
                
                data.push(monthTotal);
                
                // Ù‡Ø¯Ù Ù…Ø§Ù‡Ø§Ù†Ù‡ (Ù…ÛŒØ§Ù†Ú¯ÛŒÙ† Ø±ÙˆØ²Ù‡Ø§ÛŒ Ù…Ø§Ù‡ * Ù‡Ø¯Ù Ø±ÙˆØ²Ø§Ù†Ù‡)
                const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
                goalLine.push(dailyGoal * daysInMonth);
            }
            break;
    }
    
    // Ø§ÛŒØ¬Ø§Ø¯ ÛŒØ§ Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ù†Ù…ÙˆØ¯Ø§Ø±
    const ctx = document.getElementById('writingStatsChart').getContext('2d');
    
    if (writingStatsChart) {
        writingStatsChart.data.labels = labels;
        writingStatsChart.data.datasets[0].data = data;
        writingStatsChart.data.datasets[1].data = goalLine;
        writingStatsChart.update();
    } else {
        writingStatsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'ØªØ¹Ø¯Ø§Ø¯ Ú©Ù„Ù…Ø§Øª',
                        data: data,
                        backgroundColor: 'rgba(100, 181, 246, 0.7)',
                        borderColor: '#64b5f6',
                        borderWidth: 1
                    },
                    {
                        label: 'Ù‡Ø¯Ù',
                        data: goalLine,
                        type: 'line',
                        fill: false,
                        borderColor: '#f44336',
                        borderDash: [5, 5],
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'ØªØ¹Ø¯Ø§Ø¯ Ú©Ù„Ù…Ø§Øª'
                        }
                    }
                }
            }
        });
    }
}

// ØªØ§Ø¨Ø¹ ØªÙˆÙ„ÛŒØ¯ Ø®Ù„Ø§ØµÙ‡ Ø¯Ø§Ø³ØªØ§Ù†
async function generateSummary() {
    if (!apiKey || !selectedModel) {
        alert('Ù„Ø·ÙØ§Ù‹ Ø§Ø¨ØªØ¯Ø§ API Ùˆ Ù…Ø¯Ù„ Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ Ø±Ø§ Ø¯Ø± ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ù¾ÛŒÚ©Ø±Ø¨Ù†Ø¯ÛŒ Ú©Ù†ÛŒØ¯.');
        settingsModal.classList.add('show');
        return;
    }
    
    const summaryResult = document.getElementById('summaryResult');
    const summaryLoading = document.querySelector('.summary-loading');
    const summaryActions = document.querySelector('.summary-actions');
    const summaryLength = document.getElementById('summaryLengthSelect').value;
    const summaryStyle = document.getElementById('summaryStyleSelect').value;
    
    if (!editor.value.trim()) {
        summaryResult.innerHTML = '<p class="no-summary-message">Ù…ØªÙ† Ø¯Ø§Ø³ØªØ§Ù† Ø®Ø§Ù„ÛŒ Ø§Ø³Øª. Ù„Ø·ÙØ§Ù‹ Ø§Ø¨ØªØ¯Ø§ Ù…ØªÙ†ÛŒ Ø±Ø§ Ø¯Ø± ÙˆÛŒØ±Ø§ÛŒØ´Ú¯Ø± ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.</p>';
        summaryActions.style.display = 'none';
        return;
    }
    
    // Ù†Ù…Ø§ÛŒØ´ Ø­Ø§Ù„Øª Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ
    summaryLoading.style.display = 'flex';
    summaryResult.style.display = 'none';
    summaryActions.style.display = 'none';
    
    try {
        // ØªÙ†Ø¸ÛŒÙ… Ù¾Ø±Ø§Ù…Ù¾Øª Ø¨Ø§ ØªÙˆØ¬Ù‡ Ø¨Ù‡ Ø·ÙˆÙ„ Ùˆ Ø³Ø¨Ú© Ø®Ù„Ø§ØµÙ‡
        let lengthInstruction = '';
        switch (summaryLength) {
            case 'short':
                lengthInstruction = 'Ø®Ù„Ø§ØµÙ‡ Ú©ÙˆØªØ§Ù‡ Ø¯Ø± Ø­Ø¯ ÛŒÚ© Ù¾Ø§Ø±Ø§Ú¯Ø±Ø§Ù';
                break;
            case 'medium':
                lengthInstruction = 'Ø®Ù„Ø§ØµÙ‡ Ù…ØªÙˆØ³Ø· Ø¯Ø± Ø­Ø¯ÙˆØ¯ Û²-Û³ Ù¾Ø§Ø±Ø§Ú¯Ø±Ø§Ù';
                break;
            case 'long':
                lengthInstruction = 'Ø®Ù„Ø§ØµÙ‡ Ù†Ø³Ø¨ØªØ§Ù‹ Ø·ÙˆÙ„Ø§Ù†ÛŒ Ø´Ø§Ù…Ù„ Ú†Ù†Ø¯ Ù¾Ø§Ø±Ø§Ú¯Ø±Ø§Ù';
                break;
        }
        
        let styleInstruction = '';
        switch (summaryStyle) {
            case 'descriptive':
                styleInstruction = 'Ø¨Ù‡ ØµÙˆØ±Øª ØªÙˆØµÛŒÙÛŒ Ø¨Ø§ ØªÙ…Ø±Ú©Ø² Ø¨Ø± Ø±ÙˆÛŒØ¯Ø§Ø¯Ù‡Ø§ Ùˆ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§';
                break;
            case 'analytical':
                styleInstruction = 'Ø¨Ù‡ ØµÙˆØ±Øª ØªØ­Ù„ÛŒÙ„ÛŒ Ø¨Ø§ ØªÙ…Ø±Ú©Ø² Ø¨Ø± Ù…ÙØ§Ù‡ÛŒÙ… Ùˆ Ù¾ÛŒØ§Ù…â€ŒÙ‡Ø§ÛŒ Ø¯Ø§Ø³ØªØ§Ù†';
                break;
            case 'creative':
                styleInstruction = 'Ø¨Ù‡ ØµÙˆØ±Øª Ø®Ù„Ø§Ù‚Ø§Ù†Ù‡ Ùˆ Ù†ÙˆØ¢ÙˆØ±Ø§Ù†Ù‡';
                break;
        }
        
        const prompt = `Ù„Ø·ÙØ§Ù‹ ${lengthInstruction} Ø§Ø² Ù…ØªÙ† Ø²ÛŒØ± ØªÙ‡ÛŒÙ‡ Ú©Ù†ÛŒØ¯. Ø®Ù„Ø§ØµÙ‡ Ø¨Ø§ÛŒØ¯ ${styleInstruction} Ø¨Ø§Ø´Ø¯:

"""
${editor.value}
"""

Ø®Ù„Ø§ØµÙ‡ Ø¨Ø§ÛŒØ¯ Ø´Ø§Ù…Ù„ Ù†Ú©Ø§Øª Ú©Ù„ÛŒØ¯ÛŒØŒ Ø´Ø®ØµÛŒØªâ€ŒÙ‡Ø§ÛŒ Ø§ØµÙ„ÛŒ Ùˆ Ø±ÙˆÛŒØ¯Ø§Ø¯Ù‡Ø§ÛŒ Ù…Ù‡Ù… Ø¯Ø§Ø³ØªØ§Ù† Ø¨Ø§Ø´Ø¯. Ø¨Ù‡ Ø¬Ø§ÛŒ Ø®Ø· Ø¨Ù‡ Ø®Ø· Ø®Ù„Ø§ØµÙ‡ Ú©Ø±Ø¯Ù†ØŒ Ù…ÙØ§Ù‡ÛŒÙ… Ø§ØµÙ„ÛŒ Ø±Ø§ Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ú©Ù†ÛŒØ¯.`;
        
        // Ø¯Ø±ÛŒØ§ÙØª Ø®Ù„Ø§ØµÙ‡ Ø§Ø² Ù‡ÙˆØ´ Ù…ØµÙ†ÙˆØ¹ÛŒ
        const summary = await fetchAIResponse(prompt);
        
        // Ù†Ù…Ø§ÛŒØ´ Ø®Ù„Ø§ØµÙ‡
        if (summary) {
            summaryResult.textContent = summary;
            summaryActions.style.display = 'flex';
        } else {
            summaryResult.innerHTML = '<p class="no-summary-message">Ø®Ø·Ø§ Ø¯Ø± ØªÙˆÙ„ÛŒØ¯ Ø®Ù„Ø§ØµÙ‡. Ù„Ø·ÙØ§Ù‹ Ø¯ÙˆØ¨Ø§Ø±Ù‡ ØªÙ„Ø§Ø´ Ú©Ù†ÛŒØ¯ ÛŒØ§ ØªÙ†Ø¸ÛŒÙ…Ø§Øª API Ø±Ø§ Ø¨Ø±Ø±Ø³ÛŒ Ú©Ù†ÛŒØ¯.</p>';
        }
    } catch (error) {
        console.error('Ø®Ø·Ø§ Ø¯Ø± ØªÙˆÙ„ÛŒØ¯ Ø®Ù„Ø§ØµÙ‡:', error);
        summaryResult.innerHTML = '<p class="no-summary-message">Ø®Ø·Ø§ Ø¯Ø± ØªÙˆÙ„ÛŒØ¯ Ø®Ù„Ø§ØµÙ‡. Ù„Ø·ÙØ§Ù‹ Ø¯ÙˆØ¨Ø§Ø±Ù‡ ØªÙ„Ø§Ø´ Ú©Ù†ÛŒØ¯.</p>';
    } finally {
        // Ù¾Ù†Ù‡Ø§Ù† Ú©Ø±Ø¯Ù† Ø­Ø§Ù„Øª Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ
        summaryLoading.style.display = 'none';
        summaryResult.style.display = 'block';
    }
}

// Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø¨Ø®Ø´ ØªØ­Ù„ÛŒÙ„ Ùˆ Ø¢Ù…Ø§Ø± Ù‡Ù†Ú¯Ø§Ù… ØªØºÛŒÛŒØ± ØªØ¨
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // Ø±ÙˆÛŒØ¯Ø§Ø¯ ØªØºÛŒÛŒØ± ØªØ¨ Ø¨Ø±Ø§ÛŒ Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø±Ø§Ø¨Ø· Ú©Ø§Ø±Ø¨Ø±ÛŒ
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            if (tabId === 'analysis' && currentProject) {
                // Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø¢Ù…Ø§Ø± Ù†ÙˆØ´ØªÙ† Ù‡Ù†Ú¯Ø§Ù… ÙˆØ±ÙˆØ¯ Ø¨Ù‡ ØªØ¨ ØªØ­Ù„ÛŒÙ„ Ùˆ Ø¢Ù…Ø§Ø±
                // Ú©Ù…ÛŒ ØªØ£Ø®ÛŒØ± Ø§Ø¶Ø§ÙÙ‡ Ù…ÛŒâ€ŒÚ©Ù†ÛŒÙ… ØªØ§ Ù…Ø·Ù…Ø¦Ù† Ø´ÙˆÛŒÙ… Ø§Ù„Ù…Ø§Ù†â€ŒÙ‡Ø§ Ø¨Ù‡ Ø¯Ø±Ø³ØªÛŒ Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ Ø´Ø¯Ù‡â€ŒØ§Ù†Ø¯
                setTimeout(() => {
                    document.querySelectorAll('.analysis-tab-btn').forEach(btn => {
                        if (btn.classList.contains('active')) {
                            const analysisTabId = btn.getAttribute('data-analysis-tab');
                            
                            if (analysisTabId === 'stats') {
                                updateWritingStats();
                            }
                        }
                    });
                }, 100);
            }
        });
    });
});

// Ø¨Ù‡â€ŒØ±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ù†Ù…ÙˆØ¯Ø§Ø± Ø¢Ù…Ø§Ø± Ù†ÙˆØ´ØªÙ†
function updateWritingStatsChart(period) {
    if (!currentProject) return;
    
    // Ø¯Ø±ÛŒØ§ÙØª Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ø¨Ø± Ø§Ø³Ø§Ø³ Ø¯ÙˆØ±Ù‡ Ø²Ù…Ø§Ù†ÛŒ
    let labels = [];
    let data = [];
    let goalLine = [];
    
    const dailyGoal = currentProject.writingStats ? currentProject.writingStats.dailyGoal : 500;
    
    switch (period) {
        case 'week':
            // Ø¢Ù…Ø§Ø± Ù‡ÙØªÙ‡ Ø§Ø®ÛŒØ± (7 Ø±ÙˆØ²)
            const last7Days = [];
            const today = new Date();
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateString = date.toISOString().split('T')[0];
                const persianDate = new Date(dateString).toLocaleDateString('fa-IR', { weekday: 'short' });
                
                labels.push(persianDate);
                
                const record = currentProject.writingStats && currentProject.writingStats.wordCountHistory 
                    ? currentProject.writingStats.wordCountHistory.find(r => r.date === dateString)
                    : null;
                    
                data.push(record ? record.wordCount : 0);
                goalLine.push(dailyGoal);
            }
            break;
            
        case 'month':
            // Ø¢Ù…Ø§Ø± Ù…Ø§Ù‡ Ø§Ø®ÛŒØ± (30 Ø±ÙˆØ²)
            const last30Days = [];
            const todayForMonth = new Date();
            
            for (let i = 29; i >= 0; i--) {
                const date = new Date(todayForMonth);
                date.setDate(todayForMonth.getDate() - i);
                const dateString = date.toISOString().split('T')[0];
                
                // ÙÙ‚Ø· Ø±ÙˆØ² Ø±Ø§ Ù†Ù…Ø§ÛŒØ´ Ù…ÛŒâ€ŒØ¯Ù‡ÛŒÙ…
                const day = new Date(dateString).getDate();
                labels.push(day);
                
                const record = currentProject.writingStats && currentProject.writingStats.wordCountHistory 
                    ? currentProject.writingStats.wordCountHistory.find(r => r.date === dateString)
});} ) 
 
 
