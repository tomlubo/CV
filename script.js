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
    let numberOfBalls = 50;
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
        if(ball.radius >= 0){
          ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
          ball.color = "white";
        }else{
          ctx.arc(ball.x, ball.y, ball.radius*(-1), 0, Math.PI * 2);
          ball.color = "red";
        }
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

    function calculateAverageSpeed(balls) {
        let totalSpeed = 0;
        for (let ball of balls) {
            totalSpeed += 0.5*ball.radius*(ball.dx * ball.dx + ball.dy * ball.dy);
        }
        return totalSpeed / balls.length;
    }

    function update() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let totalSpeed = 0;
        for(let i = 0; i < balls.length; i++) {
            let ball = balls[i];
            totalSpeed += Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
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
            let newRadius = ball.baseRadius * (ball.z / 100);
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
                    if (ball.connections.length >= 2) {
                        ball.connections.shift();
                    }
                    if (otherBall.connections.length >= 2) {
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
                let force = (maxDistance - distance)*0.05 / maxDistance;

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
        let averageSpeed = totalSpeed / balls.length;
            let temperature = averageSpeed; // Here, temperature is directly proportional to average speed

            // Display the temperature
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // Semi-transparent white
            ctx.font = '20px Arial';
            ctx.fillText(`Average KE: ${temperature.toFixed(1)}`,670, 40);

        requestAnimationFrame(update);
    }

    update();
});

document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('ballCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // ... [rest of the initialization code]

    let animationFrameId;

    // Define the function to start the animation
    function startAnimation() {
        if (!animationFrameId) { // Prevent multiple loops
            update();
        }
    }

    // Define the function to stop the animation
    function stopAnimation() {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.target.id === 'home') {
            if (!entry.isIntersecting) {
                startAnimation();
            } else {
                stopAnimation();
            }
        }
    });
}, {threshold: 0.1}); // Threshold is 50% visibility

// Target the elements to observe
observer.observe(document.getElementById('home'));



    function update() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // ... [rest of the update function including ball movement and collision logic]

        // Request the next frame
        animationFrameId = requestAnimationFrame(update);
    }
    const aboutContent = document.getElementById('about-content');

    const circleContainer = document.getElementById('circle-container');
    const totalCircles = 6; // Number of small circles
    const radius = 150; // Radius of the large circle

    // Create small circles and position them around the large circle
    for (let i = 0; i < totalCircles; i++) {
        const angle = (i / totalCircles) * Math.PI * 2; // Angle for each circle
        const x = radius * Math.cos(angle) - 50; // x position
        const y = radius * Math.sin(angle) - 50; // y position

        const circle = document.createElement('div');
        circle.classList.add('small-circle');
        circle.style.left = `${50+x}px`;
        circle.style.top = `${50+y}px`;
        circle.style.transitionDelay = `${i * 1}s`; // Staggered transition delay
        circle.setAttribute('data-text-id', `text${i + 1}`); // Ensure this is set
        //console.log(circle.getAttribute('data-text-id')); // Check if the attribute is correctly set


        circleContainer.appendChild(circle);
         applyHoverEffects(circle,x,y,angle);
    }

    // Observer for the about section (use the same observer as for fading the text)
    const aboutObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        const smallCircles = document.querySelectorAll('.small-circle');
        const aboutHeader = document.getElementById('about-me-header');
        const spans = aboutHeader.querySelectorAll('span');

        if (entry.isIntersecting) {
            aboutHeader.classList.add('animate');
            aboutContent.classList.add('visible'); // Add class to make content visible
            spans.forEach((span, index) => {
                span.style.animation = 'none';
                span.offsetHeight; // Trigger reflow
                span.style.animation = '';
                span.style.animationDelay = `${index * 0.6}s`; // Staggered delay
                span.style.animation = 'bounceIn 0.6s ease forwards';
            });
            gatherCircles(smallCircles);
        } else {
            aboutHeader.classList.remove('animate');
            aboutContent.classList.remove('visible'); // Remove class to hide content
            spans.forEach(span => {
                // Optionally, reset styles when out of view
                span.style.animation = '';
                span.style.opacity = '0';
                span.style.transform = 'translateY(20px)';
            });
            disperseCircles(smallCircles);
        }
    });
}, {threshold: 0.8});

function gatherCircles(circles) {
    circles.forEach((circle, index) => {
        const angle = (index / circles.length) * Math.PI * 2; // Angle for each circle
        const x = 100 * Math.cos(angle); // x position
        const y = 100 * Math.sin(angle); // y position

        // Reset position and opacity
        circle.style.opacity = 1;
        circle.style.transform = `translate(-50%, -50%) translateX(${x}px) translateY(${y}px)`;
        circle.style.transition = 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out';
        circle.style.transitionDelay = `${index * 0.15}s`; // Staggered transition delay
    });
}

function disperseCircles(circles) {
    circles.forEach(circle => {
        // Random values for the direction and distance
        const randomX = (Math.random() - 0.5) * 600; // Adjust range as needed
        const randomY = (Math.random() - 0.5) * 700; // Adjust range as needed

        // Fly away animation
        circle.style.transform = `translate(-50%, -50%) scale(0.5) translateX(${randomX}px) translateY(${randomY}px)`;
        circle.style.opacity = 0;
        circle.style.transition = 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out';
        circle.style.transitionDelay = 0.01; // No delay for flying away
    });
}
// Function to apply hover effects
    function applyHoverEffects(circle,x,y,angle) {
        circle.addEventListener('mouseover', () => {
            circle.style.width = '55px'; // 20% larger than the base 20px
            circle.style.height = '55px';
            circle.style.backgroundColor = 'rgba(103, 0, 202, 1)';
            circle.style.transition = 'all 0.2s ease-in-out';
            console.log('Circle hovered'); // Check if hover event is triggered
            const textId = circle.getAttribute('data-text-id');
            const textElement = document.getElementById(textId);
            if (textElement) {
                textElement.classList.add('visible');

                // Adjust distanceFromCenter to consider the radius of the ring and add some margin
                const ringRadius = 200; // This should match the radius used to position the circles
                const additionalMargin = 50; // Adjust this value as needed for spacing between the ring and text
                const distanceFromCenter = ringRadius + additionalMargin;

                // Calculate the position for the text based on the angle
                console.log(angle);
                const textX =  distanceFromCenter * Math.cos(angle)+90;
                const textY =  distanceFromCenter * Math.sin(angle)+95;

                // Position text element in the radial direction from the center of the ring
                textElement.style.left = `${circleContainer.offsetWidth / 2 + textX}px`;
                textElement.style.top = `${circleContainer.offsetHeight / 2 + textY}px`;
            }


        });

        circle.addEventListener('mouseout', () => {
            circle.style.width = '50px'; // Reset to original size
            circle.style.height = '50px';
            circle.style.backgroundColor = '#fff'; // Reset to original color
            circle.style.transition = 'all 0.2s ease-in-out';
            const textId = circle.getAttribute('data-text-id');
            const textElement = document.getElementById(textId);
            if (textElement) {
              console.log('Text element found:', textElement);
                textElement.classList.remove('visible');
            }
        });
    }

    // Apply hover effects to each small circle
    const smallCircles = document.querySelectorAll('.small-circle');
    smallCircles.forEach(circle => {
        applyHoverEffects(circle);
    });

    // Target the element to observe
    aboutObserver.observe(document.getElementById('about'));

    const experienceCanvas = document.getElementById('experienceCanvas');
    const ctxExperience = experienceCanvas.getContext('2d');
    experienceCanvas.width = window.innerWidth;
    experienceCanvas.height = experienceCanvas.offsetHeight + 200;

    function randomizeWaveProperties(wave) {
        const minFrequency = 0.01;
        const maxFrequency = 0.2;
        const minLength = 0.01;
        const maxLength = 0.2;

        // Randomize frequency and length within bounds
        wave.frequency = minFrequency + Math.random() * (maxFrequency - minFrequency);
        wave.length = minLength + Math.random() * (maxLength - minLength);

        // Initialize change rates
        wave.frequencyChangeRate =  0.00005 + Math.random() * (0.00012 - 0.00005); // Adjust this value as needed
        wave.lengthChangeRate = 0.00005 + Math.random() * (0.00012 - 0.00005); // Adjust this value as needed
    }

    const wave1 = {
        y: experienceCanvas.height * (1/11),
        length: null, // To be randomized
        amplitude: 45,
        frequency: null, // To be randomized
        startX: 0,
        endX: experienceCanvas.width *(1/3)
    };

    const wave2 = {
        y: experienceCanvas.height * (1/11),
        length: null, // To be randomized
        amplitude: 45,
        frequency: null, // To be randomized
        startX: experienceCanvas.width,
        endX: experienceCanvas.width *(2/3)
    };
    randomizeWaveProperties(wave1);
    randomizeWaveProperties(wave2);

    const superpositionWave = {
        y: experienceCanvas.height *(3/10),
        length: 0.05,
        amplitude: 800,
        frequency: 0.05
    };

    let increment1 = wave1.frequency;
    let increment2 = wave2.frequency;
    let incrementSuperposition = superpositionWave.frequency;
    function updateWaveProperties(wave) {
       // Change frequency
       wave.frequency += wave.frequencyChangeRate;
       if (wave.frequency > 0.2 || wave.frequency < 0.01) {
           // Reverse direction if limits are reached
           wave.frequencyChangeRate *= -1;
       }

       // Change length
       wave.length += wave.lengthChangeRate;
       if (wave.length > 0.2 || wave.length < 0.01) {
           // Reverse direction if limits are reached
           wave.lengthChangeRate *= -1;
       }
     }


    function animateExperience() {
        requestAnimationFrame(animateExperience);
        ctxExperience.clearRect(0, 0, experienceCanvas.width, experienceCanvas.height);

        // Draw wave1 rectangle
        ctxExperience.fillStyle = 'rgba(0, 10, 51, 0.2)'; // Translucent fill for rectangle
        ctxExperience.fillRect(0, 50, wave1.endX, 100); // Rectangle for wave1

        // Draw wave1
        ctxExperience.beginPath();
        ctxExperience.moveTo(wave1.startX, wave1.y);
        for (let i = wave1.startX; i < wave1.endX; i++) {
            ctxExperience.lineTo(i, wave1.y + Math.cos(i * wave1.length + increment1) * wave1.amplitude);
        }
        ctxExperience.strokeStyle = 'rgba(0, 1, 51, 1)';
        ctxExperience.stroke();

        // Draw wave2 rectangle
        ctxExperience.fillStyle = 'rgba(191, 0, 78, 0.1)'; // Translucent fill for rectangle
        ctxExperience.fillRect(wave2.endX, 50, wave2.startX - wave2.endX, 100); // Rectangle for wave2

        // Draw wave2
        ctxExperience.beginPath();
        ctxExperience.moveTo(wave2.startX, wave2.y);
        for (let i = wave2.startX; i > wave2.endX; i--) {
            ctxExperience.lineTo(i, wave2.y + Math.cos(i * wave2.length + increment2) * wave2.amplitude);
        }
        ctxExperience.strokeStyle = 'rgba(151, 0, 78, 1)';
        ctxExperience.stroke();

        // Draw superpositionWave (middle wave)
        ctxExperience.beginPath();
        ctxExperience.moveTo(0, superpositionWave.y);
        for (let i = 0; i < experienceCanvas.width - 1; i++) {
            // Calculate the y values for this point and the next point
            const superpositionY1 = superpositionWave.y +
                                    (Math.sin(i * wave1.length + increment1) * wave1.amplitude +
                                     Math.sin(i * wave2.length + increment2) * wave2.amplitude) ;
            const superpositionY2 = superpositionWave.y +
                                    (Math.sin((i + 1) * wave1.length + increment1) * wave1.amplitude +
                                     Math.sin((i + 1) * wave2.length + increment2) * wave2.amplitude) ;

            // Create a gradient for this segment
            const gradient = ctxExperience.createLinearGradient(i, superpositionY1, i + 1, superpositionY2);
            gradient.addColorStop(0, 'rgba(0, 1, 51, 1)');
            gradient.addColorStop(1, 'rgba(151, 0, 78, 1)');

            // Draw this segment with the gradient
            ctxExperience.beginPath();
            ctxExperience.moveTo(i, superpositionY1);
            ctxExperience.lineTo(i + 1, superpositionY2);
            ctxExperience.strokeStyle = gradient;
            ctxExperience.stroke();
        }
        updateWaveProperties(wave1);
        updateWaveProperties(wave2);

        // increment1 = updateWaveProperties(wave1, increment1);
        // increment2 = updateWaveProperties(wave2, increment2);

        incrementSuperposition += superpositionWave.frequency;
    }

    const experienceObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Rerandomize properties of wave1 and wave2 when section comes into view
                randomizeWaveProperties(wave1);
                randomizeWaveProperties(wave2);

                // Reset increments to restart the animation from its current state
                increment1 = wave1.frequency;
                increment2 = wave2.frequency;

                // Optionally clear the canvas and restart the animation
                ctxExperience.clearRect(0, 0, experienceCanvas.width, experienceCanvas.height);
                animateExperience(); // Restart the animation if needed
            }
        });
    }, {threshold: 0.2});
    experienceObserver.observe(document.getElementById('experience'));


    // ... [rest of the code]
});
