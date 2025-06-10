const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');

let gameState = {
    isGameOver: false,
    score: 0,
    frame: 0,
    lastBossScore: 0
};

let player = {
    x: canvas.width / 2 - 15,
    y: canvas.height - 60,
    width: 30,
    height: 40,
    speed: 5,
    bullets: [],
    powerUpTime: 0,
    hasPowerUp: false,
    giganticCannon: null
};

let enemies = [];
let explosions = [];
let stars = [];
let items = [];
let boss = null;
let damageEffects = [];

const itemImage = new Image();
itemImage.src = 'sample_images/item_regit.webp';

const bossImage1 = new Image();
bossImage1.src = 'sample_images/kinnnikun1.png';

const bossImage2 = new Image();
bossImage2.src = 'sample_images/kinnnikun2.png';

const powerSound = new Audio('sample_sound/power.mp3');

const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
    v: false
};

for (let i = 0; i < 50; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() * 2 + 1,
        brightness: Math.random()
    });
}

function drawPlayer() {
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(player.x + 10, player.y, 10, 20);
    ctx.fillRect(player.x, player.y + 20, 30, 20);
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(player.x + 12, player.y + 25, 6, 10);
}

function drawBullet(bullet) {
    if (bullet.gigantic) {
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        const gradient = ctx.createLinearGradient(bullet.x, bullet.y, bullet.x + bullet.width, bullet.y + bullet.height);
        gradient.addColorStop(0, '#ff00ff');
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(1, '#ff00ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    } else if (bullet.rainbow) {
        const hue = (gameState.frame + bullet.x + bullet.y) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fillRect(bullet.x, bullet.y, 4, 10);
    } else {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(bullet.x, bullet.y, 4, 10);
    }
}

function drawItem(item) {
    const glowIntensity = Math.sin(item.glowPhase) * 0.5 + 0.5;
    const glowRadius = 40 + glowIntensity * 20;
    
    const gradient = ctx.createRadialGradient(
        item.x + item.width / 2, item.y + item.height / 2, 0,
        item.x + item.width / 2, item.y + item.height / 2, glowRadius
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 * glowIntensity})`);
    gradient.addColorStop(0.5, `rgba(200, 200, 255, ${0.4 * glowIntensity})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(
        item.x - glowRadius + item.width / 2, 
        item.y - glowRadius + item.height / 2, 
        glowRadius * 2, 
        glowRadius * 2
    );
    
    if (itemImage.complete) {
        ctx.drawImage(itemImage, item.x, item.y, item.width, item.height);
    } else {
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(item.x, item.y, item.width, item.height);
    }
}

function drawBoss(boss) {
    const currentImage = boss.isDamaged ? bossImage2 : bossImage1;
    
    if (currentImage.complete) {
        ctx.drawImage(currentImage, boss.x, boss.y, boss.width, boss.height);
    } else {
        ctx.fillStyle = '#800080';
        ctx.fillRect(boss.x, boss.y, boss.width, 30);
        ctx.fillRect(boss.x + 10, boss.y + 30, boss.width - 20, 40);
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(boss.x + 20, boss.y + 35, boss.width - 40, 20);
    }
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(boss.x + 5, boss.y - 15, boss.width - 10, 8);
    ctx.fillStyle = '#ff0000';
    const healthWidth = (boss.health / boss.maxHealth) * (boss.width - 10);
    ctx.fillRect(boss.x + 5, boss.y - 15, healthWidth, 8);
}

function drawEnemy(enemy) {
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(enemy.x, enemy.y, enemy.width, 10);
    ctx.fillRect(enemy.x + 5, enemy.y + 10, enemy.width - 10, 15);
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(enemy.x + 8, enemy.y + 15, enemy.width - 16, 5);
}

function drawExplosion(explosion) {
    ctx.fillStyle = `rgba(255, ${255 - explosion.age * 10}, 0, ${1 - explosion.age / 20})`;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawDamageEffect(effect) {
    const alpha = 1 - effect.age / 30;
    const scale = 1 + effect.age * 0.1;
    
    ctx.save();
    ctx.translate(effect.x, effect.y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    
    // 十字の光
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(20, 0);
    ctx.moveTo(0, -20);
    ctx.lineTo(0, 20);
    ctx.stroke();
    
    // 外側の輪
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.stroke();
    
    // 内側の光点
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawStars() {
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.fillRect(star.x, star.y, 1, 1);
    });
}

function updatePlayer() {
    if (keys.left && player.x > 0) player.x -= player.speed;
    if (keys.right && player.x < canvas.width - player.width) player.x += player.speed;
    if (keys.up && player.y > 0) player.y -= player.speed;
    if (keys.down && player.y < canvas.height - player.height) player.y += player.speed;

    if (player.powerUpTime > 0) {
        player.powerUpTime--;
        player.hasPowerUp = true;
    } else {
        player.hasPowerUp = false;
    }

    if (keys.v && !player.giganticCannon) {
        player.giganticCannon = {
            x: player.x + player.width / 2 - 25,
            y: player.y - 20,
            width: 50,
            height: canvas.height + 50,
            speed: 24,
            gigantic: true
        };
        player.bullets.push(player.giganticCannon);
    }

    if (keys.space && gameState.frame % 6 === 0) {
        if (player.hasPowerUp) {
            for (let i = -2; i <= 2; i++) {
                player.bullets.push({
                    x: player.x + player.width / 2 - 2 + i * 8,
                    y: player.y,
                    speed: 8,
                    rainbow: true,
                    angle: i * 0.2,
                    width: 4,
                    height: 10
                });
            }
        } else {
            player.bullets.push({
                x: player.x + player.width / 2 - 2,
                y: player.y,
                speed: 8,
                rainbow: false,
                angle: 0,
                width: 4,
                height: 10
            });
        }
    }

    player.bullets = player.bullets.filter(bullet => {
        bullet.y -= bullet.speed;
        if (!bullet.gigantic) {
            bullet.x += Math.sin(bullet.angle) * 2;
        }
        return bullet.y > -100 && bullet.x > -50 && bullet.x < canvas.width + 50;
    });
}

function spawnEnemy() {
    if (!boss && gameState.frame % 60 === 0) {
        enemies.push({
            x: Math.random() * (canvas.width - 40),
            y: -30,
            width: 40,
            height: 25,
            speed: Math.random() * 2 + 1,
            health: 1
        });
    }
}

function spawnItem() {
    if (gameState.frame % 600 === 0 && Math.random() < 0.7) {
        items.push({
            x: Math.random() * (canvas.width - 120),
            y: -60,
            width: 120,
            height: 60,
            speed: 2,
            glowPhase: 0
        });
    }
}

function spawnBoss() {
    if (gameState.score >= gameState.lastBossScore + 2000 && !boss) {
        boss = {
            x: canvas.width / 2 - 100,
            y: -150,
            width: 200,
            height: 200,
            speed: 1,
            health: 100,
            maxHealth: 100,
            shootTimer: 0,
            bullets: [],
            damageFlash: 0,
            isDamaged: false,
            attackPattern: 0,
            burstTimer: 0
        };
        gameState.lastBossScore = Math.floor(gameState.score / 2000) * 2000;
    }
}

function updateEnemies() {
    enemies = enemies.filter(enemy => {
        enemy.y += enemy.speed;
        return enemy.y < canvas.height + 50;
    });
}

function updateItems() {
    items = items.filter(item => {
        item.y += item.speed;
        item.glowPhase += 0.15;
        return item.y < canvas.height + 50;
    });
}

function updateBoss() {
    if (!boss) return;

    if (boss.y < 30) {
        boss.y += boss.speed;
    } else {
        boss.x += Math.sin(gameState.frame * 0.02) * 3;
        if (boss.x < 0) boss.x = 0;
        if (boss.x > canvas.width - boss.width) boss.x = canvas.width - boss.width;
    }

    if (boss.damageFlash > 0) {
        boss.damageFlash--;
        boss.isDamaged = true;
    } else {
        boss.isDamaged = false;
    }

    boss.shootTimer++;

    // シンプルな攻撃パターン: 真下への単発弾（頻度を減らす）
    if (boss.shootTimer % 80 === 0) {
        boss.bullets.push({
            x: boss.x + boss.width / 2 - 3,
            y: boss.y + boss.height,
            speed: 4,
            angle: 0,
            type: 'normal'
        });
    }

    boss.bullets = boss.bullets.filter(bullet => {
        bullet.y += bullet.speed;
        return bullet.y < canvas.height + 20;
    });
}

function updateStars() {
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = -5;
            star.x = Math.random() * canvas.width;
        }
    });
}

function updateExplosions() {
    explosions = explosions.filter(explosion => {
        explosion.age++;
        explosion.radius += 1;
        return explosion.age < 20;
    });
}

function updateDamageEffects() {
    damageEffects = damageEffects.filter(effect => {
        effect.age++;
        return effect.age < 30;
    });
}

function checkCollisions() {
    player.bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            const bulletWidth = bullet.width || 4;
            const bulletHeight = bullet.height || 10;
            
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bulletWidth > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bulletHeight > enemy.y) {
                
                explosions.push({
                    x: enemy.x + enemy.width / 2,
                    y: enemy.y + enemy.height / 2,
                    radius: bullet.gigantic ? 15 : 5,
                    age: 0
                });
                
                enemies.splice(enemyIndex, 1);
                if (!bullet.gigantic) {
                    player.bullets.splice(bulletIndex, 1);
                }
                gameState.score += 100;
                scoreElement.textContent = `スコア: ${gameState.score}`;
            }
        });

        if (boss) {
            const bulletWidth = bullet.width || 4;
            const bulletHeight = bullet.height || 10;
            
            if (bullet.x < boss.x + boss.width &&
                bullet.x + bulletWidth > boss.x &&
                bullet.y < boss.y + boss.height &&
                bullet.y + bulletHeight > boss.y) {
                
                boss.health -= bullet.gigantic ? 5 : 1;
                boss.damageFlash = 10;
                
                if (!bullet.gigantic) {
                    player.bullets.splice(bulletIndex, 1);
                }
                
                explosions.push({
                    x: bullet.x,
                    y: bullet.y,
                    radius: bullet.gigantic ? 20 : 8,
                    age: 0
                });
                
                // 派手なダメージエフェクト追加
                damageEffects.push({
                    x: bullet.x,
                    y: bullet.y,
                    age: 0
                });

                if (boss.health <= 0) {
                    powerSound.play().catch(e => console.log('Audio play failed:', e));
                    explosions.push({
                        x: boss.x + boss.width / 2,
                        y: boss.y + boss.height / 2,
                        radius: 30,
                        age: 0
                    });
                    gameState.score += 1000;
                    scoreElement.textContent = `スコア: ${gameState.score}`;
                    boss = null;
                }
            }
        }
    });

    items.forEach((item, itemIndex) => {
        if (player.x < item.x + item.width &&
            player.x + player.width > item.x &&
            player.y < item.y + item.height &&
            player.y + player.height > item.y) {
            
            player.powerUpTime = 300;
            items.splice(itemIndex, 1);
            gameState.score += 50;
            scoreElement.textContent = `スコア: ${gameState.score}`;
        }
    });

    enemies.forEach(enemy => {
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            
            gameState.isGameOver = true;
            gameOverElement.style.display = 'block';
        }
    });

    if (boss) {
        boss.bullets.forEach(bullet => {
            if (player.x < bullet.x + 6 &&
                player.x + player.width > bullet.x &&
                player.y < bullet.y + 10 &&
                player.y + player.height > bullet.y) {
                
                gameState.isGameOver = true;
                gameOverElement.style.display = 'block';
            }
        });

        if (player.x < boss.x + boss.width &&
            player.x + player.width > boss.x &&
            player.y < boss.y + boss.height &&
            player.y + player.height > boss.y) {
            
            gameState.isGameOver = true;
            gameOverElement.style.display = 'block';
        }
    }
}

function getSkyColors() {
    const level = Math.floor(gameState.score / 2000);
    const colors = [
        ['#001122', '#000033'], // 初期：深い青
        ['#220011', '#330033'], // 2000：紫
        ['#112200', '#003300'], // 4000：深緑
        ['#221100', '#333300'], // 6000：深黄
        ['#220000', '#330000'], // 8000：深赤
        ['#001100', '#002200'], // 10000：森緑
        ['#000022', '#000044'], // 12000：深紺
        ['#220022', '#440044']  // 14000：マゼンタ
    ];
    
    return colors[level % colors.length];
}

function drawBackground() {
    const [color1, color2] = getSkyColors();
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function gameLoop() {
    if (gameState.isGameOver) return;

    drawBackground();

    drawStars();
    updateStars();

    updatePlayer();
    drawPlayer();

    player.bullets.forEach(drawBullet);

    spawnEnemy();
    updateEnemies();
    enemies.forEach(drawEnemy);

    spawnItem();
    updateItems();
    items.forEach(drawItem);

    spawnBoss();
    updateBoss();
    if (boss) {
        drawBoss(boss);
        boss.bullets.forEach(bullet => {
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(bullet.x, bullet.y, 6, 10);
        });
    }

    updateExplosions();
    explosions.forEach(drawExplosion);

    updateDamageEffects();
    damageEffects.forEach(drawDamageEffect);

    checkCollisions();

    gameState.frame++;
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    gameState = {
        isGameOver: false,
        score: 0,
        frame: 0,
        lastBossScore: 0
    };
    player = {
        x: canvas.width / 2 - 15,
        y: canvas.height - 60,
        width: 30,
        height: 40,
        speed: 5,
        bullets: [],
        powerUpTime: 0,
        hasPowerUp: false,
        giganticCannon: null
    };
    enemies = [];
    explosions = [];
    items = [];
    boss = null;
    damageEffects = [];
    scoreElement.textContent = 'スコア: 0';
    gameOverElement.style.display = 'none';
    gameLoop();
}

document.addEventListener('keydown', (e) => {
    switch(e.code) {
        case 'ArrowLeft': keys.left = true; break;
        case 'ArrowRight': keys.right = true; break;
        case 'ArrowUp': keys.up = true; break;
        case 'ArrowDown': keys.down = true; break;
        case 'Space': keys.space = true; e.preventDefault(); break;
        case 'KeyV': keys.v = true; break;
        case 'KeyR': if (gameState.isGameOver) resetGame(); break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.code) {
        case 'ArrowLeft': keys.left = false; break;
        case 'ArrowRight': keys.right = false; break;
        case 'ArrowUp': keys.up = false; break;
        case 'ArrowDown': keys.down = false; break;
        case 'Space': keys.space = false; break;
        case 'KeyV': keys.v = false; player.giganticCannon = null; break;
    }
});

gameLoop();