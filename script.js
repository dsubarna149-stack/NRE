const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const statusText = document.getElementById('status');
const galleryImage = document.getElementById('gallery-image');

// গ্যালারির ছবিগুলোর একটি তালিকা (তুমি চাইলে নিজের ছবির লিঙ্ক দিতে পারো)
const images = [
    "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800&q=80",
    "https://images.unsplash.com/photo-1531804055935-76f44d7c3621?w=800&q=80",
    "https://images.unsplash.com/photo-1470770841072-f978ccc4d047?w=800&q=80",
    "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=800&q=80"
];

let currentIndex = 0;
let lastGestureTime = 0;
const gestureCooldown = 1500; // একবার সোয়াইপ করার পর ১.৫ সেকেন্ড অপেক্ষা করবে

function updateImage() {
    galleryImage.style.opacity = 0.3; // ট্রানজিশন এফেক্ট
    setTimeout(() => {
        galleryImage.src = images[currentIndex];
        galleryImage.style.opacity = 1;
    }, 200);
}

function nextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    updateImage();
}

function prevImage() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateImage();
}

// MediaPipe Hands সেটআপ
const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 1, // একটি হাত ট্র্যাক করবে
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

let previousX = null;

hands.onResults((results) => {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // ক্যানভাসে ক্যামেরার ভিডিও দেখানো
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        statusText.innerText = "হাত শনাক্ত হয়েছে! ডানে বা বামে সোয়াইপ করুন।";
        statusText.style.color = "#00ff00";
        const landmarks = results.multiHandLandmarks[0];
        
        // হাতের পয়েন্টগুলো আঁকা (সবুজ ও লাল রঙের)
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 2});
        drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 1});

        // হাতের কব্জির (Landmark 0) X পজিশন নেওয়া হচ্ছে
        const currentX = landmarks[0].x; 
        const currentTime = new Date().getTime();

        if (previousX !== null) {
            const deltaX = currentX - previousX;

            // সোয়াইপ ডিটেকশন (cooldown এর সাথে)
            if (currentTime - lastGestureTime > gestureCooldown) {
                // ক্যামেরা মিরর করা আছে, তাই লজিক উল্টো হবে
                if (deltaX < -0.15) { 
                    nextImage(); // হাত বাঁদিক থেকে ডানদিকে গেলে
                    lastGestureTime = currentTime;
                    statusText.innerText = "👉 ডানদিকে সোয়াইপ করা হয়েছে (Next)";
                    statusText.style.color = "#ffcc00";
                } 
                else if (deltaX > 0.15) {
                    prevImage(); // হাত ডানদিক থেকে বাঁদিকে গেলে
                    lastGestureTime = currentTime;
                    statusText.innerText = "👈 বাঁদিকে সোয়াইপ করা হয়েছে (Prev)";
                    statusText.style.color = "#ffcc00";
                }
            }
        }
        previousX = currentX;
    } else {
        statusText.innerText = "ক্যামেরার সামনে হাত আনুন...";
        statusText.style.color = "#fff";
        previousX = null; 
    }
    canvasCtx.restore();
});

// ক্যামেরা চালু করা
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: 320,
    height: 240
});

camera.start().then(() => {
    statusText.innerText = "ক্যামেরা চালু হয়েছে। ক্যামেরার সামনে হাত আনুন...";
}).catch((err) => {
    statusText.innerText = "ক্যামেরা পারমিশন দেওয়া হয়নি বা ক্যামেরা পাওয়া যায়নি!";
    statusText.style.color = "red";
    console.error(err);
});
