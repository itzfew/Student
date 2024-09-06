import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAJVzWcSVu7nW-069bext5W6Nizx4sfxIA",
  authDomain: "edu-hub-c81b5.firebaseapp.com",
  databaseURL: "https://edu-hub-c81b5-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "edu-hub-c81b5",
  storageBucket: "edu-hub-c81b5.appspot.com",
  messagingSenderId: "560742513136",
  appId: "1:560742513136:web:102edd272982704fdb8535",
  measurementId: "G-78TC8XTPF7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Profile page logic
if (window.location.pathname.includes('profile.html')) {
    const authSection = document.getElementById('auth-section');
    const userInfo = document.getElementById('user-info');
    const usernameDisplay = document.getElementById('username-display');
    const signOutButton = document.getElementById('sign-out');
    const viewPostsButton = document.getElementById('view-posts');

    signOutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    });

    document.getElementById('sign-in').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert('Welcome back!');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error signing in: ', error);
        }
    });

    document.getElementById('sign-up').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            alert('Welcome to Ind Edu!');
            window.location.href = 'profile.html';
        } catch (error) {
            console.error('Error signing up: ', error);
        }
    });

    onAuthStateChanged(auth, user => {
        if (user) {
            authSection.style.display = 'none';
            userInfo.style.display = 'block';
            usernameDisplay.textContent = user.email.split('@')[0];
        } else {
            authSection.style.display = 'block';
            userInfo.style.display = 'none';
        }
    });

    viewPostsButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

// Main index page logic
if (window.location.pathname.includes('index.html')) {
    const postForm = document.getElementById('post-form');
    const signOutButton = document.getElementById('sign-out');

    onAuthStateChanged(auth, user => {
        if (user) {
            postForm.style.display = 'block';
            signOutButton.style.display = 'inline';
        } else {
            postForm.style.display = 'none';
            signOutButton.style.display = 'none';
        }
    });

    document.getElementById('submit-post').addEventListener('click', async () => {
        const postContent = document.getElementById('post-content').value;
        const displayName = document.getElementById('display-name').value;
        if (postContent.trim() === '' || displayName.trim() === '') {
            alert('Post content and display name cannot be empty.');
            return;
        }

        if (auth.currentUser) {
            try {
                await addDoc(collection(db, 'posts'), {
                    content: postContent,
                    timestamp: serverTimestamp(),
                    uid: auth.currentUser.uid,
                    displayName: displayName
                });
                document.getElementById('post-content').value = '';
                document.getElementById('display-name').value = '';
                displayPosts();
                alert('Post added successfully!');
            } catch (error) {
                console.error('Error adding post: ', error);
            }
        } else {
            alert('You must be logged in to post.');
        }
    });

    document.getElementById('sign-out').addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'profile.html';
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    });

    async function displayPosts() {
        const postList = document.getElementById('post-list');
        postList.innerHTML = '';

        try {
            const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(doc => {
                const post = doc.data();
                const postDiv = document.createElement('div');
                postDiv.classList.add('post');

                // Format timestamp
                const timestamp = post.timestamp.toDate();
                const formattedDate = timestamp.toLocaleString('en-US', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
                    hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' 
                });

                // Check if display name includes "verify"
                const isVerified = post.displayName.toLowerCase().includes('verify');
                // Remove "verify" from display name
                const cleanDisplayName = post.displayName.replace(/verify/i, '').trim();
                
                postDiv.innerHTML = `
                    <div class="author">
                        ${cleanDisplayName} ${isVerified ? '<i class="fa fa-check-circle verified"></i> Verified' : ''}
                    </div>
                    <div class="content">${post.content}</div>
                    <div class="date">Published on: ${formattedDate}</div>
                    <div class="actions">
                        <button class="share-btn" onclick="sharePost('${doc.id}')"><i class="fa fa-share"></i> Share</button>
                        ${auth.currentUser && auth.currentUser.uid === post.uid ? `
                            <button class="edit-btn" onclick="editPost('${doc.id}', '${post.content}')"><i class="fa fa-edit"></i> Edit</button>
                            <button class="delete-btn" onclick="deletePost('${doc.id}')"><i class="fa fa-trash"></i> Delete</button>
                        ` : ''}
                    </div>
                    <!-- Replies Section -->
                    <div id="replies-${doc.id}" class="replies"></div>
                    <textarea id="reply-content-${doc.id}" placeholder="Write a reply..."></textarea>
                    <button onclick="submitReply('${doc.id}')">Submit Reply</button>
                `;
                postList.appendChild(postDiv);
                displayReplies(doc.id);
            });
        } catch (error) {
            console.error('Error getting posts: ', error);
        }
    }

    window.editPost = async function(postId, currentContent) {
        const newContent = prompt('Edit your post:', currentContent);
        if (newContent !== null && newContent.trim() !== '') {
            try {
                const postRef = doc(db, 'posts', postId);
                await updateDoc(postRef, {
                    content: newContent
                });
                displayPosts();
            } catch (error) {
                console.error('Error updating post: ', error);
            }
        }
    };

    window.deletePost = async function(postId) {
        if (confirm('Are you sure you want to delete this post?')) {
            try {
                await deleteDoc(doc(db, 'posts', postId));
                displayPosts();
            } catch (error) {
                console.error('Error deleting post: ', error);
            }
        }
    };

    async function displayReplies(postId) {
        const repliesDiv = document.getElementById(`replies-${postId}`);
        repliesDiv.innerHTML = '';

        try {
            const q = query(collection(db, `posts/${postId}/replies`), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(doc => {
                const reply = doc.data();
                const replyDiv = document.createElement('div');
                replyDiv.classList.add('reply');

                // Format timestamp
                const timestamp = reply.timestamp.toDate();
                const formattedDate = timestamp.toLocaleString('en-US', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
                    hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' 
                });

                // Check if display name includes "verify"
                const isVerified = reply.displayName.toLowerCase().includes('verify');
                // Remove "verify" from display name
                const cleanDisplayName = reply.displayName.replace(/verify/i, '').trim();
                
                replyDiv.innerHTML = `
                    <div class="author">
                        ${cleanDisplayName} ${isVerified ? '<i class="fa fa-check-circle verified"></i> Verified' : ''}
                    </div>
                    <div class="content">${reply.content}</div>
                    <div class="date">Published on: ${formattedDate}</div>
                    ${auth.currentUser && auth.currentUser.uid === reply.uid ? `
                        <button class="edit-btn" onclick="editReply('${doc.id}', '${reply.content}')"><i class="fa fa-edit"></i> Edit</button>
                        <button class="delete-btn" onclick="deleteReply('${doc.id}')"><i class="fa fa-trash"></i> Delete</button>
                    ` : ''}
                `;
                repliesDiv.appendChild(replyDiv);
            });
        } catch (error) {
            console.error('Error getting replies: ', error);
        }
    }

    window.submitReply = async function(postId) {
        const replyContent = document.getElementById(`reply-content-${postId}`).value;
        if (replyContent.trim() === '') {
            alert('Reply content cannot be empty.');
            return;
        }

        if (auth.currentUser) {
            try {
                await addDoc(collection(db, `posts/${postId}/replies`), {
                    content: replyContent,
                    timestamp: serverTimestamp(),
                    uid: auth.currentUser.uid,
                    displayName: auth.currentUser.email.split('@')[0]
                });
                document.getElementById(`reply-content-${postId}`).value = '';
                displayReplies(postId);
                alert('Reply added successfully!');
            } catch (error) {
                console.error('Error adding reply: ', error);
            }
        } else {
            alert('You must be logged in to reply.');
        }
    };

    window.editReply = async function(replyId, currentContent) {
        const newContent = prompt('Edit your reply:', currentContent);
        if (newContent !== null && newContent.trim() !== '') {
            try {
                const replyRef = doc(db, `posts/${postId}/replies`, replyId);
                await updateDoc(replyRef, {
                    content: newContent
                });
                displayReplies(postId);
            } catch (error) {
                console.error('Error updating reply: ', error);
            }
        }
    };

    window.deleteReply = async function(replyId) {
        if (confirm('Are you sure you want to delete this reply?')) {
            try {
                await deleteDoc(doc(db, `posts/${postId}/replies`, replyId));
                displayReplies(postId);
            } catch (error) {
                console.error('Error deleting reply: ', error);
            }
        }
    };

    function sharePost(postId) {
        const postUrl = `${window.location.origin}/posts/${postId}`;
        if (navigator.share) {
            navigator.share({
                title: 'Check out this post!',
                url: postUrl
            }).catch(err => {
                console.error('Error sharing post: ', err);
            });
        } else {
            // Fallback for browsers that don't support the Web Share API
            navigator.clipboard.writeText(postUrl).then(() => {
                alert('Post URL copied to clipboard!');
            }).catch(err => {
                console.error('Error copying URL: ', err);
            });
        }
    }

    displayPosts();
}

// Settings page logic
if (window.location.pathname.includes('settings.html')) {
    const themeSelect = document.getElementById('theme-select');
    const fontSizeSelect = document.getElementById('font-size');

    themeSelect.addEventListener('change', () => {
        const theme = themeSelect.value;
        document.body.className = theme;
        localStorage.setItem('theme', theme);
    });

    fontSizeSelect.addEventListener('change', () => {
        const fontSize = fontSizeSelect.value;
        document.body.style.fontSize = fontSize === 'small' ? '14px' :
            fontSize === 'medium' ? '16px' : '18px';
        localStorage.setItem('fontSize', fontSize);
    });

    window.addEventListener('load', () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedFontSize = localStorage.getItem('fontSize') || 'medium';
        document.body.className = savedTheme;
        themeSelect.value = savedTheme;
        document.body.style.fontSize = savedFontSize === 'small' ? '14px' :
            savedFontSize === 'medium' ? '16px' : '18px';
        fontSizeSelect.value = savedFontSize;
    });
}
