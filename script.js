
"use strict";

// ==========================================
// SIDDARTH GAME PLAY - TIC TAC TOE
// Static HTML, CSS and JavaScript
// ==========================================

const $ = id => document.getElementById(id);

const cells = [...document.querySelectorAll(".cell")];

const statusElement = $("status");
const instruction = $("instruction");
const countX = $("countX");
const countO = $("countO");

const playerX = $("playerX");
const playerO = $("playerO");

const restartButton = $("restart");
const themeToggle = $("themeToggle");
const musicToggle = $("musicToggle");
const aboutOpen = $("aboutOpen");
const aboutClose = $("aboutClose");
const aboutDone = $("aboutDone");
const modal = $("aboutModal");

const backgroundMusic = $("backgroundMusic");
const placeSound = $("placeSound");
const moveSound = $("moveSound");
const winSound = $("winSound");

const audioElements = [
    backgroundMusic,
    placeSound,
    moveSound,
    winSound
].filter(Boolean);

// Game state
let board = Array(9).fill("");
let currentPlayer = "X";
let xMoves = 0;
let oMoves = 0;
let selectedIndex = null;
let winner = null;
let gameOver = false;

// Music preferences
let musicEnabled = false;
let soundEnabled = true;

const winningLines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

// ==========================================
// AUDIO
// ==========================================

function stopAudio(audio) {
    if (!audio) return;

    audio.pause();

    try {
        audio.currentTime = 0;
    } catch (error) {
        // Ignore unsupported seeking.
    }
}

function playEffect(audio) {
    if (!soundEnabled || !audio) return;

    audio.currentTime = 0;

    audio.play().catch(() => {
        // Browser audio can require user interaction.
    });
}

function syncMusicButton() {
    if (!musicToggle) return;

    musicToggle.textContent = musicEnabled ? "♫" : "♪";

    musicToggle.classList.toggle(
        "music-on",
        musicEnabled
    );

    musicToggle.setAttribute(
        "aria-pressed",
        String(musicEnabled)
    );

    musicToggle.title = musicEnabled
        ? "Background music enabled"
        : "Background music disabled";
}

function startBackgroundMusic() {
    if (
        !backgroundMusic ||
        !musicEnabled ||
        !soundEnabled ||
        gameOver
    ) {
        return;
    }

    backgroundMusic.play().catch(() => {
        // The user can click the music button again if needed.
    });
}

function stopBackgroundMusic() {
    if (backgroundMusic) {
        backgroundMusic.pause();
        // Keep its position so music can continue after a win.
    }
}

function playWinningMusic() {
    // Background music must stop before the victory sound.
    stopBackgroundMusic();

    if (!winSound || !soundEnabled) return;

    stopAudio(winSound);

    winSound.play().catch(() => {
        // A browser may block audio until user interaction.
    });
}

// User controls background music preference.
musicToggle?.addEventListener("click", () => {
    musicEnabled = !musicEnabled;

    syncMusicButton();

    if (musicEnabled && !gameOver && soundEnabled) {
        startBackgroundMusic();
    } else {
        stopBackgroundMusic();
    }
});

// Volume can be adjusted here if a volume slider exists in the HTML.
function setVolume(volume) {
    const safeVolume = Math.max(0, Math.min(1, volume));

    audioElements.forEach(audio => {
        audio.volume = safeVolume;
    });
}

setVolume(0.35);

// ==========================================
// GAME RULES
// ==========================================

function hasWon(player) {
    return winningLines.some(line =>
        line.every(index => board[index] === player)
    );
}

function switchPlayer() {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    selectedIndex = null;
}

function updateStatus(message) {
    if (statusElement) {
        statusElement.textContent = message;
    }
}

function updateInstruction(message) {
    if (instruction) {
        instruction.textContent = message;
    }
}

function render() {
    cells.forEach((cell, index) => {
        const value = board[index];

        cell.textContent = value;
        cell.classList.toggle("x-cell", value === "X");
        cell.classList.toggle("o-cell", value === "O");
        cell.classList.toggle("selected", index === selectedIndex);

        cell.setAttribute(
            "aria-label",
            value
                ? `Cell ${index + 1}: ${value}`
                : `Empty cell ${index + 1}`
        );
    });

    if (countX) {
        countX.textContent =
            board.filter(value => value === "X").length;
    }

    if (countO) {
        countO.textContent =
            board.filter(value => value === "O").length;
    }

    playerX?.classList.toggle(
        "active",
        !gameOver && currentPlayer === "X"
    );

    playerO?.classList.toggle(
        "active",
        !gameOver && currentPlayer === "O"
    );

    if (winner) {
        updateStatus(`Player ${winner} wins! 🎉`);
        updateInstruction(
            "Congratulations! Restart to play again."
        );
    } else {
        updateStatus(`Player ${currentPlayer}'s turn`);
    }
}

function finishGame() {
    winner = currentPlayer;
    gameOver = true;

    render();

    // Win sound takes priority over background music.
    playWinningMusic();
}

// ==========================================
// CELL INTERACTION
// ==========================================

function handleCellClick(index) {
    if (gameOver) return;

    const playerMoveCount =
        currentPlayer === "X" ? xMoves : oMoves;

    // First three moves for each player are placements.
    if (playerMoveCount < 3) {
        if (board[index] !== "") {
            updateInstruction("Choose an empty cell.");
            return;
        }

        board[index] = currentPlayer;

        if (currentPlayer === "X") {
            xMoves++;
        } else {
            oMoves++;
        }

        playEffect(placeSound);

        if (hasWon(currentPlayer)) {
            finishGame();
            return;
        }

        switchPlayer();

        updateInstruction(
            xMoves === 3 && oMoves === 3
                ? "Select your symbol, then choose an empty cell to move it."
                : `Player ${currentPlayer}, place your symbol.`
        );

        render();
        return;
    }

    // Once each player has three symbols, select one to move.
    if (selectedIndex === null) {
        if (board[index] !== currentPlayer) {
            updateInstruction(
                `Select one of Player ${currentPlayer}'s symbols first.`
            );
            return;
        }

        selectedIndex = index;

        updateInstruction(
            "Now choose an empty destination cell."
        );

        render();
        return;
    }

    // Click the same symbol again to cancel selection.
    if (index === selectedIndex) {
        selectedIndex = null;

        updateInstruction(
            "Selection cancelled. Select a symbol to move."
        );

        render();
        return;
    }

    // Select a different symbol belonging to this player.
    if (board[index] === currentPlayer) {
        selectedIndex = index;

        updateInstruction(
            "Now choose an empty destination cell."
        );

        render();
        return;
    }

    if (board[index] !== "") {
        updateInstruction(
            "Destination must be an empty cell."
        );
        return;
    }

    // Move the selected symbol.
    board[index] = currentPlayer;
    board[selectedIndex] = "";
    selectedIndex = null;

    playEffect(moveSound);

    if (hasWon(currentPlayer)) {
        finishGame();
        return;
    }

    switchPlayer();

    updateInstruction(
        `Player ${currentPlayer}, select and move your symbol.`
    );

    render();
}

cells.forEach((cell, index) => {
    cell.addEventListener("click", () => {
        handleCellClick(index);
    });
});

// ==========================================
// RESTART
// Stop victory music and resume background music.
// ==========================================

restartButton?.addEventListener("click", () => {
    stopAudio(winSound);
    stopAudio(placeSound);
    stopAudio(moveSound);

    board = Array(9).fill("");
    currentPlayer = "X";
    xMoves = 0;
    oMoves = 0;
    selectedIndex = null;
    winner = null;
    gameOver = false;

    updateInstruction(
        "Place your first symbol in an empty cell."
    );

    render();

    if (musicEnabled && soundEnabled) {
        startBackgroundMusic();
    }
});

// ==========================================
// THEME SWITCH
// ==========================================

function applyTheme(theme) {
    const light = theme === "light";

    document.body.classList.toggle("light", light);

    if (themeToggle) {
        themeToggle.textContent = light ? "🌙" : "☀️";

        themeToggle.title = light
            ? "Switch to dark theme"
            : "Switch to light theme";

        themeToggle.setAttribute(
            "aria-pressed",
            String(light)
        );
    }
}

let initialTheme = "dark";

try {
    initialTheme =
        localStorage.getItem("ticTacToeTheme") || "dark";
} catch (error) {
    // Storage might be unavailable.
}

applyTheme(initialTheme);

themeToggle?.addEventListener("click", () => {
    const nextTheme =
        document.body.classList.contains("light")
            ? "dark"
            : "light";

    try {
        localStorage.setItem("ticTacToeTheme", nextTheme);
    } catch (error) {
        // Theme still changes for the current session.
    }

    applyTheme(nextTheme);
});

// ==========================================
// DEVELOPER MODAL
// ==========================================

function openDeveloperModal() {
    if (!modal) return;

    modal.hidden = false;
    aboutClose?.focus();
}

function closeDeveloperModal() {
    if (!modal) return;

    modal.hidden = true;
    aboutOpen?.focus();
}

aboutOpen?.addEventListener("click", openDeveloperModal);
aboutClose?.addEventListener("click", closeDeveloperModal);
aboutDone?.addEventListener("click", closeDeveloperModal);

modal?.addEventListener("click", event => {
    if (event.target === modal) {
        closeDeveloperModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && modal && !modal.hidden) {
        closeDeveloperModal();
    }
});

// ==========================================
// INITIALIZE
// ==========================================

syncMusicButton();

updateInstruction(
    "Place your first symbol in an empty cell."
);

render();
