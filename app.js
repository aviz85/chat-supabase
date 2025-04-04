// Initialize Supabase client
const SUPABASE_URL = 'https://paoemykauclmgkwhzcju.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhb2VteWthdWNsbWdrd2h6Y2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MzI1MDQsImV4cCI6MjA1OTMwODUwNH0.isxNKSns8LLFayGFYLhWHximiPwa65U3V1MFuzNSNRM';
// Site URL for authentication redirects (localhost and Netlify URL)
const SITE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? window.location.origin 
  : 'https://musical-pegasus-13b46c.netlify.app';
  
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    redirectTo: SITE_URL
  }
});

// DOM Elements
const authContainer = document.getElementById('auth-container');
const chatContainer = document.getElementById('chat-container');
const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');
const logoutBtn = document.getElementById('logout-btn');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages-container');

// Current user info
let currentUser = null;

// Check if user is already logged in
async function checkSession() {
    const { data, error } = await supabase.auth.getSession();
    
    if (data.session) {
        currentUser = data.session.user;
        showChatInterface();
        loadMessages();
        subscribeToMessages();
    }
}

// Switch between login and signup forms
loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
});

signupTab.addEventListener('click', () => {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.style.display = 'block';
    loginForm.style.display = 'none';
});

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        showChatInterface();
        loadMessages();
        subscribeToMessages();
    } catch (error) {
        loginError.textContent = error.message;
    }
});

// Signup form submission
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const username = document.getElementById('signup-username').value;
    
    try {
        // Sign up the user
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username
                }
            }
        });
        
        if (error) throw error;
        
        // If signup was successful
        if (data.user) {
            // Check if email confirmation is required
            if (data.session === null) {
                // Email confirmation is required
                signupForm.reset();
                signupError.style.color = '#4f46e5'; // Change color to indicate this is a success message
                signupError.textContent = 'הרשמה בוצעה בהצלחה! נשלח אליך מייל לאימות החשבון. אנא בדוק את תיבת הדואר שלך ולחץ על הקישור לאימות.';
                return;
            }
            
            // If no confirmation needed or already confirmed
            try {
                // Create a profile entry in the profiles table
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: data.user.id,
                            username,
                            created_at: new Date().toISOString()
                        }
                    ]);
                    
                if (profileError) throw profileError;
                
                currentUser = data.user;
                showChatInterface();
                loadMessages();
                subscribeToMessages();
            } catch (profileError) {
                signupError.textContent = `שגיאה ביצירת פרופיל: ${profileError.message}`;
            }
        }
    } catch (error) {
        signupError.textContent = error.message;
    }
});

// Logout functionality
logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    currentUser = null;
    showAuthInterface();
});

// Send message functionality
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const messageText = messageInput.value.trim();
    if (!messageText) return;
    
    try {
        const { error } = await supabase
            .from('messages')
            .insert([
                {
                    content: messageText,
                    user_id: currentUser.id,
                    username: currentUser.user_metadata.username || 'Anonymous'
                }
            ]);
            
        if (error) throw error;
        
        messageInput.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
    }
});

// Load existing messages
async function loadMessages() {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true });
            
        if (error) throw error;
        
        messagesContainer.innerHTML = '';
        data.forEach(message => {
            appendMessage(message);
        });
        
        scrollToBottom();
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Subscribe to new messages
function subscribeToMessages() {
    supabase
        .channel('public:messages')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages' 
        }, (payload) => {
            appendMessage(payload.new);
            scrollToBottom();
        })
        .subscribe();
}

// Append a message to the chat container
function appendMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    // Check if the message is from the current user
    if (message.user_id === currentUser.id) {
        messageElement.classList.add('sent');
    } else {
        messageElement.classList.add('received');
    }
    
    const timestamp = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
        <div>${message.content}</div>
        <div class="metadata">
            ${message.user_id !== currentUser.id ? `<span>${message.username}</span> • ` : ''}
            <span>${timestamp}</span>
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
}

// Scroll to the bottom of the messages container
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Show chat interface
function showChatInterface() {
    authContainer.style.display = 'none';
    chatContainer.style.display = 'flex';
}

// Show auth interface
function showAuthInterface() {
    chatContainer.style.display = 'none';
    authContainer.style.display = 'block';
}

// Initialize app
document.addEventListener('DOMContentLoaded', checkSession); 