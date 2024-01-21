window.addEventListener('scroll', function() {
    const homeContent = document.getElementById('home-content');
    // Adjust the '50' below to the scroll threshold you prefer for the fade effect to start
    const opacity = 1 - Math.min(window.scrollY, 1);
    homeContent.style.opacity = opacity;
});
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('ballCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let colors = ['green', 'yellow', 'white', 'orange', 'red'];
    let balls = [];
    let numberOfBalls = 35;
    let ballRadius = 15;

    // Initialize balls
    for(let i = 0; i < numberOfBalls; i++) {
        let x = Math.random() * (canvas.width - 2 * ballRadius) + ballRadius;
        let y = Math.random() * (canvas.height - 2 * ballRadius) + ballRadius;
        let dx = (Math.random() - 0.5) * 4;
        let dy = (Math.random() - 0.5) * 4;
        let color = "white";//colors[Math.floor(Math.random() * colors.length)];
        let z = Math.random() * 200 + 100; // Depth between 100 and 300
        let baseRadius = 10; // Base radius for z = 200
        balls.push({x, y, dx, dy, z, baseRadius, radius: baseRadius * (z / 200), color, connections: []});

    }

    function drawBall(ball) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.closePath();
    }

    function drawLine(ball1, ball2) {
        ctx.beginPath();
        ctx.moveTo(ball1.x, ball1.y);
        ctx.lineTo(ball2.x, ball2.y);
        ctx.strokeStyle = ball1.color; // Line color matches the ball color
        ctx.stroke();
    }
    function resolveCollision(ball, otherBall) {
    const xVelocityDiff = ball.dx - otherBall.dx;
    const yVelocityDiff = ball.dy - otherBall.dy;

    const xDist = otherBall.x - ball.x;
    const yDist = otherBall.y - ball.y;

    // Prevent accidental overlap of balls
    if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {

        // Grab angle between the two colliding balls
        const angle = -Math.atan2(otherBall.y - ball.y, otherBall.x - ball.x);

        // Store mass in var for better readability in collision equation
        const m1 = ball.radius; // Consider mass proportional to radius (for simplicity)
        const m2 = otherBall.radius;

        // Velocity before equation
        const u1 = rotate(ball.dx, ball.dy, angle);
        const u2 = rotate(otherBall.dx, otherBall.dy, angle);

        // Velocity after 1d collision equation
        const v1 = { x: u1.x * (m1 - m2) / (m1 + m2) + u2.x * 2 * m2 / (m1 + m2), y: u1.y };
        const v2 = { x: u2.x * (m1 - m2) / (m1 + m2) + u1.x * 2 * m1 / (m1 + m2), y: u2.y };

        // Final velocity after rotating axis back to original location
        const vFinal1 = rotate(v1.x, v1.y, -angle);
        const vFinal2 = rotate(v2.x, v2.y, -angle);

        // Swap ball velocities for realistic bounce effect
        ball.dx = vFinal1.x;
        ball.dy = vFinal1.y;

        otherBall.dx = vFinal2.x;
        otherBall.dy = vFinal2.y;
        ball.radius +=(ball.dx*ball.dy*0.1);
        otherBall.radius +=(otherBall.dx*ball.dy*0.1);
    }
}

function rotate(dx, dy, angle) {
    const rotatedVelocities = {
        x: dx * Math.cos(angle) - dy * Math.sin(angle),
        y: dx * Math.sin(angle) + dy * Math.cos(angle)
    };

    return rotatedVelocities;
}
let mouse = {
        x: undefined,
        y: undefined,
        radius: 100 // Radius of influence around the mouse
    }

    // Update mouse position
    canvas.addEventListener('mousemove', function(event) {
        mouse.x = event.x - canvas.offsetLeft;
        mouse.y = event.y - canvas.offsetTop;
    });

    // Hide mouse influence circle when leaving the canvas
    canvas.addEventListener('mouseleave', function(event) {
        mouse.x = undefined;
        mouse.y = undefined;
    });


    function update() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for(let i = 0; i < balls.length; i++) {
            let ball = balls[i];
            drawBall(ball);

            // Wall collision detection
            if(ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
                ball.dx = -ball.dx*0.95;
            }
            if(ball.y + ball.dy > canvas.height - ball.radius || ball.y + ball.dy < ball.radius) {
                ball.dy = -ball.dy*0.95;
            }

            ball.x += ball.dx;
            ball.y += ball.dy;

            ball.z += ball.dx * 0.1; // Change the 0.1 to adjust the depth speed

            // Calculate new radius based on z value, ensuring it's not larger than baseRadius and not negative
            let newRadius = ball.baseRadius * (ball.z / 200);
            ball.radius = Math.min(Math.max(newRadius, 5), ball.baseRadius); // Clamp value between 1 and baseRadius


            // Ball collision detection
            for(let j = i + 1; j < balls.length; j++) {
                let otherBall = balls[j];
                let dx = otherBall.x - ball.x;
                let dy = otherBall.y - ball.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < ball.radius + otherBall.radius) {
                  resolveCollision(ball, otherBall);

                    // Draw a line if they collide
                    drawLine(ball, otherBall);

                    // Manage connections (limited to 5)
                    if (ball.connections.length >= 3) {
                        ball.connections.shift();
                    }
                    if (otherBall.connections.length >= 3) {
                        otherBall.connections.shift();
                    }
                    ball.connections.push(otherBall);
                    otherBall.connections.push(ball);
                }
            }
            // Mouse interaction
            if (mouse.x) {
                const dx = ball.x - mouse.x;
                const dy = ball.y - mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;

                // Max distance that mouse can influence
                const maxDistance = mouse.radius;
                let force = (maxDistance - distance)*0.01 / maxDistance;

                // Ensure the force is not negative
                if (force < 0) force = 0;

                // Repulsion force inversely proportional to distance squared
                let repulsionPower = 1;
                let distanceSquared = (distance * distance) / (mouse.radius * mouse.radius);
                if (distanceSquared > 0) {
                    repulsionPower = Math.min(50 / distanceSquared, 50); // Adjust 50 to increase/decrease repulsion
                }

                // Apply repulsion force to ball
                ball.dx += forceDirectionX * repulsionPower * force;
                ball.dy += forceDirectionY * repulsionPower * force;
            }

            // Draw connections
            ball.connections.forEach(connectedBall => {
                drawLine(ball, connectedBall);
            });
        }

        requestAnimationFrame(update);
    }

    update();
});