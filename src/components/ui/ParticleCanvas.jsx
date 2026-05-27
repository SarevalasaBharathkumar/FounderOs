"use client";
import { useEffect, useRef } from "react";
import { T } from "../../styles/tokens";

export default function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const particles = [];
    const mouse = { x: null, y: null, radius: 240 };
    let frameId = null;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createParticles();
    };

    const createParticles = () => {
      particles.length = 0;
      const particleCount = Math.max(90, Math.floor((canvas.width * canvas.height) / 7000));
      for (let index = 0; index < particleCount; index += 1) {
        const size = Math.random() * 2 + 1;
        particles.push({
          x: Math.random() * (canvas.width - size * 2) + size,
          y: Math.random() * (canvas.height - size * 2) + size,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: size,
        });
      }
    };

    const draw = () => {
      context.fillStyle = T.bg;
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (mouse.x !== null && mouse.y !== null) {
        const glow = context.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mouse.radius
        );
        glow.addColorStop(0, "rgba(168, 85, 247, 0.26)");
        glow.addColorStop(0.35, "rgba(129, 140, 248, 0.16)");
        glow.addColorStop(1, "rgba(129, 140, 248, 0)");
        context.beginPath();
        context.fillStyle = glow;
        context.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
        context.fill();
      }

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - particle.x;
          const dy = mouse.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouse.radius + particle.r) {
            const forceX = dx / distance;
            const forceY = dy / distance;
            const force = (mouse.radius - distance) / mouse.radius;
            particle.x -= forceX * force * 5;
            particle.y -= forceY * force * 5;
          }
        }

        if (particle.x > canvas.width || particle.x < 0) particle.vx = -particle.vx;
        if (particle.y > canvas.height || particle.y < 0) particle.vy = -particle.vy;

        particle.x += particle.vx;
        particle.y += particle.vy;

        context.beginPath();
        context.fillStyle = "rgba(191, 128, 255, 0.92)";
        context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2, false);
        context.fill();
      }

      for (let first = 0; first < particles.length; first += 1) {
        for (let second = first + 1; second < particles.length; second += 1) {
          const a = particles[first];
          const b = particles[second];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 160) {
            context.beginPath();
            const isNearCursor =
              mouse.x !== null &&
              (Math.hypot(a.x - mouse.x, a.y - mouse.y) < mouse.radius ||
                Math.hypot(b.x - mouse.x, b.y - mouse.y) < mouse.radius);
            const opacity = (1 - distance / 160) * (isNearCursor ? 0.65 : 0.3);
            context.strokeStyle = isNearCursor
              ? `rgba(255,255,255,${opacity})`
              : `rgba(200,150,255,${opacity})`;
            context.lineWidth = isNearCursor ? 1.4 : 1.1;
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.stroke();
          }
        }
      }

      frameId = window.requestAnimationFrame(draw);
    };

    resize();
    draw();

    const handleMouseMove = (event) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    };

    const handleMouseOut = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseOut);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseOut);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
