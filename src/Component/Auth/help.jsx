import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const canvasRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        setMessage(null);
        setIsLoading(true);

        if (!email || !password) {
            setMessage({ type: 'error', text: "Please enter both email and password." });
            setIsLoading(false);
            return;
        }

        setTimeout(() => {
            setMessage({ type: 'success', text: "Login successful! (Simulated)" });
            setEmail('');
            setPassword('');
            setIsLoading(false);
        }, 1500);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let particlesArray;
        let animationFrameId;
        const mouse = { x: null, y: null, radius: 150 };

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            mouse.x = window.innerWidth / 2;
            mouse.y = window.innerHeight / 2;
            init();
        };

        const handleMouseMove = (event) => { mouse.x = event.clientX; mouse.y = event.clientY; };
        const handleTouchMove = (event) => { if (event.touches.length > 0) { mouse.x = event.touches[0].clientX; mouse.y = event.touches[0].clientY; } };
        const handleTouchEnd = () => { mouse.x = null; mouse.y = null; };

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleTouchEnd);

        class Particle {
            constructor(x, y, directionX, directionY, size, color) {
                this.x = x; this.y = y;
                this.directionX = directionX; this.directionY = directionY;
                this.size = size; this.color = color;
            }
            draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fillStyle = this.color; ctx.fill(); }
            update() {
                if (this.x + this.size > canvas.width || this.x - this.size < 0) this.directionX = -this.directionX;
                if (this.y + this.size > canvas.height || this.y - this.size < 0) this.directionY = -this.directionY;

                let dx = mouse.x - this.x; let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius + this.size) {
                    let forceX = dx / distance * (mouse.radius - distance) / mouse.radius * 8;
                    let forceY = dy / distance * (mouse.radius - distance) / mouse.radius * 8;
                    this.x -= forceX; this.y -= forceY;
                }

                this.x += this.directionX; this.y += this.directionY;
                this.draw();
            }
        }

        function init() {
            particlesArray = [];
            let numberOfParticles = (canvas.width * canvas.height) / 9000;
            if (numberOfParticles < 100) numberOfParticles = 100;
            const colors = ['#ffffff', '#FFD700', '#00BFFF', '#FF6347'];

            for (let i = 0; i < numberOfParticles; i++) {
                let size = Math.random() * 5 + 1;
                let x = Math.random() * (canvas.width - size * 2) + size * 2;
                let y = Math.random() * (canvas.height - size * 2) + size * 2;
                let dirX = (Math.random() * 0.5) - 0.25;
                let dirY = (Math.random() * 0.5) - 0.25;
                let color = colors[Math.floor(Math.random() * colors.length)];
                particlesArray.push(new Particle(x, y, dirX, dirY, size, color));
            }
        }

        function connect() {
            for (let a = 0; a < particlesArray.length; a++) {
                for (let b = a; b < particlesArray.length; b++) {
                    let dx = particlesArray[a].x - particlesArray[b].x;
                    let dy = particlesArray[a].y - particlesArray[b].y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < 120) {
                        ctx.strokeStyle = `rgba(255,255,255,${1 - distance / 120})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                        ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                        ctx.stroke();
                    }
                }
            }
        }

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particlesArray.forEach(p => p.update());
            connect();
        }

        resizeCanvas();
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            cancelAnimationFrame(animationFrameId);
        }
    }, []);

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#2e3a59] to-[#4b5c9f] flex items-center justify-center overflow-hidden p-4">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none z-0"></canvas>

            {/* Floating academic icons */}
            <motion.img src="/graduation-cap.png" alt="cap" className="absolute w-12 h-12 top-10 left-20 z-10"
                animate={{ y: [0, 15, 0], rotate: [0, 15, -15, 0] }} transition={{ duration: 4, repeat: Infinity }} />
            <motion.img src="/book.png" alt="book" className="absolute w-14 h-14 bottom-20 right-10 z-10"
                animate={{ y: [0, -20, 0], rotate: [0, -10, 10, 0] }} transition={{ duration: 5, repeat: Infinity }} />

            {/* Floating text */}
            <motion.div className="absolute top-5 left-1/2 transform -translate-x-1/2 text-white font-bold text-xl z-10"
                animate={{ y: [0, -10, 0], opacity: [0.7, 1, 0.7] }} transition={{ duration: 3, repeat: Infinity }}>
                Learn. Study. Achieve.
            </motion.div>

            <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden md:max-w-md relative z-10">
                <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center text-white">
                    <h2 className="text-3xl font-extrabold">Welcome Back</h2>
                    <p className="mt-2 text-sm text-gray-200">Sign in to access your documents.</p>
                </div>

                <div className="p-8">
                    {message && (
                        <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                        </div>

                        <button type="submit" disabled={isLoading}
                            className={`w-full py-2 px-4 rounded-lg font-semibold text-white transition-colors ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                            {isLoading ? 'Processing...' : 'Log In'}
                        </button>
                        <div className="mt-4 text-center">
                            <Link
                                to="/register"
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                            >
                                Don't have an account? Sign Up
                            </Link>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
