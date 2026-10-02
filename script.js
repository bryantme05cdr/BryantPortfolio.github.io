// Menu mobile
const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");

menuBtn.addEventListener("click", () => {
    navMenu.classList.toggle("active");
});


// Form kontak
const form = document.getElementById("contactForm");
const formMessage = document.getElementById("formMessage");

form.addEventListener("submit", function(event) {
    event.preventDefault();
    const name = document.getElementById("name").value;
    formMessage.textContent = "Terima kasih, " + name + "! Pesan kamu berhasil dikirim.";
    form.reset();
});


// Nature Dino Run Minigame Logic
const dino = document.getElementById("dino");
const obstacle = document.getElementById("obstacle");
const gameBox = document.getElementById("gameBox");
const gameOverlay = document.getElementById("gameOverlay");
const startBtn = document.getElementById("startBtn");
const scoreVal = document.getElementById("scoreVal");
const highScoreVal = document.getElementById("highScoreVal");

let isPlaying = false;
let score = 0;
let highScore = 0;
let scoreInterval;
let collisionCheckInterval;

function startGame() {
    if (isPlaying) return;
    isPlaying = true;
    score = 0;
    scoreVal.textContent = score;
    gameOverlay.style.display = "none";

    obstacle.classList.add("run-obstacle");

    scoreInterval = setInterval(() => {
        score++;
        scoreVal.textContent = score;
        if (score > highScore) {
            highScore = score;
            highScoreVal.textContent = highScore;
        }
    }, 200);

    collisionCheckInterval = setInterval(() => {
        const dinoBottom = parseInt(window.getComputedStyle(dino).getPropertyValue("bottom"));
        const obstacleRight = parseInt(window.getComputedStyle(obstacle).getPropertyValue("right"));

        if (obstacleRight >= 710 && obstacleRight <= 760 && dinoBottom < 95) {
            gameOver();
        }
    }, 20);
}

function jump() {
    if (!isPlaying) {
        startGame();
        return;
    }
    if (!dino.classList.contains("jump")) {
        dino.classList.add("jump");
        setTimeout(() => {
            dino.classList.remove("jump");
        }, 450);
    }
}

function gameOver() {
    isPlaying = false;
    clearInterval(scoreInterval);
    clearInterval(collisionCheckInterval);

    obstacle.classList.remove("run-obstacle");
    
    gameOverlay.style.display = "flex";
    gameOverlay.querySelector("h3").textContent = "Game Over!";
    gameOverlay.querySelector("p").innerHTML = `Skor akhir kamu: <strong>${score}</strong><br>Tekan tombol di bawah untuk main lagi.`;
    startBtn.textContent = "Main Lagi";
}

startBtn.addEventListener("click", () => {
    startGame();
});

gameBox.addEventListener("click", () => {
    jump();
});

document.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
    }
});