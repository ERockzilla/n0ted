'use client';

import { useEffect, useRef, useState, memo } from 'react';
import { usePathname } from 'next/navigation';
import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    PlaneGeometry,
    ShaderMaterial,
    Mesh,
    Color,
    DoubleSide,
} from 'three';

/**
 * GaussianBackground - A subtle 3D Gaussian beam background with light blue styling.
 * Excludes /globe page to prevent interference with globe interaction.
 * 
 * Improvements:
 * - Lighter blue color scheme
 * - Faster animation progression
 * - Thinner, more precise grid lines
 * - Higher resolution mesh
 */
const GaussianBackground = memo(function GaussianBackground() {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<WebGLRenderer | null>(null);
    const animationRef = useRef<number | null>(null);
    const timeRef = useRef(0);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const pathname = usePathname();

    // Don't render on globe page to avoid interfering with interactive globe
    const isGlobePage = pathname === '/globe';

    useEffect(() => {
        if (isGlobePage) return;

        // Check for reduced motion preference
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        if (mediaQuery.matches) return;

        if (!containerRef.current) return;

        const container = containerRef.current;

        // Scene setup
        const scene = new Scene();

        // Camera - positioned to see full beam
        const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 3.2, 4.0);
        camera.lookAt(0, 0, 0);

        // Renderer with transparency - optimized for background
        const isMobile = window.innerWidth < 768;
        const renderer = new WebGLRenderer({
            antialias: !isMobile,
            alpha: true,
            powerPreference: 'low-power',
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 1.5));
        renderer.setClearColor(0x000000, 0);

        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Create Gaussian beam surface geometry - higher resolution for precise lines
        const gridSize = isMobile ? 32 : 48;
        const geometry = new PlaneGeometry(4.5, 4.5, gridSize, gridSize);

        // Light blue themed shader material
        const material = new ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uVortexPhase: { value: 0 },
                // Light blue color scheme
                uColorBase: { value: new Color(0x4a90d9) },   // Sky blue
                uColorMid: { value: new Color(0x7ab8f5) },    // Light blue
                uColorGlow: { value: new Color(0xa8d4ff) },   // Pale blue glow
            },
            vertexShader: `
        uniform float uTime;
        uniform float uVortexPhase;
        
        varying vec2 vUv;
        varying float vElevation;
        varying float vDistance;
        
        void main() {
          vUv = uv;
          
          // Distance from center
          float dist = length(position.xy);
          vDistance = dist;
          
          // Gaussian profile with faster vortex
          float sigma = 0.7 + 0.2 * sin(uTime * 0.6);
          float gaussian = exp(-dist * dist / (2.0 * sigma * sigma));
          
          // Vortex spiral effect - faster rotation
          float angle = atan(position.y, position.x);
          float spiral = sin(angle * 3.0 - uTime * 2.5 + dist * 4.0) * 0.12;
          
          // Vortex collapse cycle - faster
          float vortexCollapse = sin(uVortexPhase) * 0.5 + 0.5;
          
          // Height calculation
          float height = gaussian * (1.0 - vortexCollapse * 0.6) + spiral * (1.0 - vortexCollapse);
          
          // Subtle ripple - faster
          float ripple = sin(dist * 8.0 - uTime * 4.0) * 0.025 * gaussian;
          height += ripple;
          
          vElevation = height;
          
          vec3 newPosition = position;
          newPosition.z = height;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
            fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorBase;
        uniform vec3 uColorMid;
        uniform vec3 uColorGlow;
        
        varying vec2 vUv;
        varying float vElevation;
        varying float vDistance;
        
        void main() {
          // Color based on elevation and distance
          vec3 color = mix(uColorBase, uColorMid, vElevation * 0.9);
          
          // Glow at peak
          float glow = smoothstep(0.15, 0.8, vElevation);
          color = mix(color, uColorGlow, glow * 0.5);
          
          // Precise grid lines - thinner with higher frequency
          float gridFreq = 48.0;
          float gridX = abs(sin(vUv.x * gridFreq * 3.14159));
          float gridY = abs(sin(vUv.y * gridFreq * 3.14159));
          float grid = max(gridX, gridY);
          // Sharper threshold for thinner lines
          grid = smoothstep(0.97, 1.0, grid);
          
          // Subtle alpha - understated background
          float alpha = 0.08 + vElevation * 0.12 + grid * 0.06;
          alpha = clamp(alpha, 0.0, 0.28);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
            transparent: true,
            side: DoubleSide,
            wireframe: false,
        });

        const mesh = new Mesh(geometry, material);
        mesh.rotation.x = -Math.PI * 0.38;
        scene.add(mesh);

        // Wireframe overlay for grid effect - thinner lines
        const wireframeMaterial = new ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uVortexPhase: { value: 0 },
                uColor: { value: new Color(0x6baed6) }, // Light steel blue
            },
            vertexShader: `
        uniform float uTime;
        uniform float uVortexPhase;
        
        varying float vElevation;
        
        void main() {
          float dist = length(position.xy);
          float sigma = 0.7 + 0.2 * sin(uTime * 0.6);
          float gaussian = exp(-dist * dist / (2.0 * sigma * sigma));
          float angle = atan(position.y, position.x);
          float spiral = sin(angle * 3.0 - uTime * 2.5 + dist * 4.0) * 0.12;
          float vortexCollapse = sin(uVortexPhase) * 0.5 + 0.5;
          float height = gaussian * (1.0 - vortexCollapse * 0.6) + spiral * (1.0 - vortexCollapse);
          float ripple = sin(dist * 8.0 - uTime * 4.0) * 0.025 * gaussian;
          height += ripple;
          vElevation = height;
          
          vec3 newPosition = position;
          newPosition.z = height + 0.003;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
            fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        varying float vElevation;
        
        void main() {
          float alpha = 0.03 + vElevation * 0.08;
          float pulse = sin(uTime * 3.0) * 0.08 + 0.92;
          gl_FragColor = vec4(uColor * pulse, alpha);
        }
      `,
            transparent: true,
            wireframe: true,
        });

        const wireframeMesh = new Mesh(geometry.clone(), wireframeMaterial);
        wireframeMesh.rotation.x = -Math.PI * 0.38;
        scene.add(wireframeMesh);

        // Handle resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Animation loop - faster progression
        const animate = () => {
            timeRef.current += 0.025; // Faster animation
            const time = timeRef.current;

            if (material.uniforms) {
                material.uniforms.uTime.value = time;
                material.uniforms.uVortexPhase.value = time * 0.8;
            }

            if (wireframeMaterial.uniforms) {
                wireframeMaterial.uniforms.uTime.value = time;
                wireframeMaterial.uniforms.uVortexPhase.value = time * 0.8;
            }

            // Gentle camera sway
            camera.position.x = Math.sin(time * 0.15) * 0.15;
            camera.position.z = 4.0 + Math.cos(time * 0.12) * 0.1;
            camera.lookAt(0, 0.15, 0);

            renderer.render(scene, camera);
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
                container.removeChild(rendererRef.current.domElement);
            }
            geometry.dispose();
            material.dispose();
            wireframeMaterial.dispose();
            renderer.dispose();
        };
    }, [isGlobePage]);

    // Don't render on globe page
    if (isGlobePage) return null;

    // Static fallback for reduced motion
    if (prefersReducedMotion) {
        return (
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    background: 'linear-gradient(135deg, rgba(74, 144, 217, 0.03) 0%, rgba(122, 184, 245, 0.05) 50%, rgba(168, 212, 255, 0.03) 100%)',
                }}
            />
        );
    }

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 pointer-events-none z-0"
            aria-hidden="true"
            style={{
                opacity: 0.85,
            }}
        />
    );
});

export default GaussianBackground;
