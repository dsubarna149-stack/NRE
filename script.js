const videoElement = document.getElementById('input_video');
const webcamCanvas = document.getElementById('webcam_canvas');
const webcamCtx = webcamCanvas.getContext('2d');
const paintCanvas = document.getElementById('paint_canvas');
const paintCtx = paintCanvas.getContext('2d');
const statusText = document.getElementById('status');
const clearBtn = document.getElementById('clearBtn');
const colorPicker = document.getElementById('colorPicker');

// ক্যানভাস সাইজ ফুল স্ক্রিন করা
function resizeCanvas() {
    paintCanvas.width = window.innerWidth;
    paintCanvas.height = window.innerHeight;
    // রি-সাইজ করার পর ব্যাকগ্রাউন্ড আবার কালো করা (যদি প্রয়োজন হয়)
    paintCtx.fillStyle = '#000000';
    paintCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // প্রথমে একবার কল করা হলো

// পেইন্টিং ভেরিয়েবল
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentColor = colorPicker.value;

// নিয়ন লাইনের সেটিংস
function setupNeonContext(ctx, color) {
    ctx.strokeStyle = color; // কোরের রঙ
    ctx.lineWidth = 8;        // লাইনের পুরুত্ব
    ctx.lineCap = 'round';   // লাইনের মাথা গোল
    ctx.lineJoin = 'round';  // লাইনের মোড় গোল
    
    // নিয়ন গ্লো এফেক্ট
    ctx.shadowColor = color; // গ্লো এর রঙ
    ctx.shadowBlur = 15;     // গ্লো কতটা ছড়াবে
}

// বোতাম এবং পিকারের ইভেন্ট লিসেনার
clearBtn.addEventListener('click', () => {
    paintCtx.fillStyle = '#000000';
    paintCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
});

colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
});

// দুটি বিন্দুর মধ্যে দূরত্ব নির্ণয় করার ফাংশন
function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
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
    minDetectionConfidence: 0.8, // নির্ভরযোগ্যতা বাড়ানো হলো
    minTrackingConfidence: 0.8
});

// হাতের ডেটা প্রসেস করা
hands.onResults((results) => {
    // ১. ক্যামেরা প্রিভিউ আপডেট করা (নিচে ডানদিকে)
    webcamCtx.save();
    webcamCtx.clearRect(0, 0, webcamCanvas.width, webcamCanvas.height);
    webcamCtx.drawImage(results.image, 0, 0, webcamCanvas.width, webcamCanvas.height);
    
    // ২. মেইন ক্যানভাসে আঁকার লজিক
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        statusText.innerText = "হাত পাওয়া গেছে। 'চিমটি' কেটে লিখুন।";
        statusText.style.color = "#00ff00"; // সবুজ স্ট্যাটাস

        const landmarks = results.multiHandLandmarks[0];
        
        // Landmark 4 = বুড়ো আঙুলের ডগা (Thumb Tip)
        // Landmark 8 = তর্জনীর ডগা (Index Finger Tip)
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];

        // তর্জনী ও বুড়ো আঙুলের দূরত্ব নির্ণয়
        const distance = getDistance(thumbTip, indexTip);
        
        // মেইন ক্যানভাসে আঁকার জন্য কোঅর্ডিনেট ম্যাপ করা
        // ক্যামেরা মিরর করা আছে, তাই X কোঅর্ডিনেট উল্টাতে হবে
        const currentX = (1 - indexTip.x) * paintCanvas.width;
        const currentY = indexTip.y * paintCanvas.height;

        // 'চিমটি' সনাক্ত করা (খুব কাছাকাছি হলে দূরত্ব ০.১ এর কম ধরা হয়েছে)
        const pinchThreshold = 0.08; 

        if (distance < pinchThreshold) {
            // আঁকা শুরু বা চলমান
            if (!isDrawing) {
                isDrawing = true;
                lastX = currentX;
                lastY = currentY;
            }
            
            // ক্যানভাসে নিয়ন রেখা আঁকা
            paintCtx.beginPath();
            setupNeonContext(paintCtx, currentColor);
            paintCtx.moveTo(lastX, lastY);
            paintCtx.lineTo(currentX, currentY);
            paintCtx.stroke();
            paintCtx.closePath();
            
            // শেষ পজিশন আপডেট
            lastX = currentX;
            lastY = currentY;
        } else {
            // আঙুল সরিয়ে নিলে আঁকা বন্ধ
            isDrawing = false;
        }
        
    } else {
        statusText.innerText = "ক্যামেরার সামনে হাত আনুন...";
        statusText.style.color = "#888"; // গ্রে স্ট্যাটাস
        isDrawing = false; // হাত চলে গেলে আঁকা বন্ধ
    }
    webcamCtx.restore();
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
    statusText.innerText = "ক্যামেরা চালু হয়েছে।";
}).catch((err) => {
    statusText.innerText = "ক্যামেরা পাওয়া যায়নি!";
    statusText.style.color = "red";
    console.error(err);
});
