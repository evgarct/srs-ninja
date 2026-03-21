'use client'

import { useEffect, useRef } from 'react'
import type { FC } from 'react'
import { Renderer, Transform, Vec3, Color, Polyline } from 'ogl'

interface RibbonsProps {
  colors?: string[]
  baseSpring?: number
  baseFriction?: number
  baseThickness?: number
  offsetFactor?: number
  maxAge?: number
  pointCount?: number
  speedMultiplier?: number
  enableFade?: boolean
  enableShaderEffect?: boolean
  effectAmplitude?: number
  backgroundColor?: number[]
}

export const ReactBitsRibbons: FC<RibbonsProps> = ({
  colors = ['#ff9346', '#7cff67', '#ffee51', '#5227FF'],
  baseSpring = 0.03,
  baseFriction = 0.9,
  baseThickness = 30,
  offsetFactor = 0.05,
  maxAge = 500,
  pointCount = 50,
  speedMultiplier = 0.6,
  enableFade = false,
  enableShaderEffect = false,
  effectAmplitude = 2,
  backgroundColor = [0, 0, 0, 0],
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const renderer = new Renderer({ dpr: window.devicePixelRatio || 2, alpha: true })
    const gl = renderer.gl
    gl.clearColor(backgroundColor[0], backgroundColor[1], backgroundColor[2], backgroundColor[3])
    gl.canvas.style.position = 'absolute'
    gl.canvas.style.top = '0'
    gl.canvas.style.left = '0'
    gl.canvas.style.width = '100%'
    gl.canvas.style.height = '100%'
    container.appendChild(gl.canvas)

    const scene = new Transform()
    const lines: {
      spring: number
      friction: number
      mouseVelocity: Vec3
      mouseOffset: Vec3
      points: Vec3[]
      polyline: Polyline
    }[] = []

    const vertex = `
      precision highp float;
      attribute vec3 position;
      attribute vec3 next;
      attribute vec3 prev;
      attribute vec2 uv;
      attribute float side;
      uniform vec2 uResolution;
      uniform float uDPR;
      uniform float uThickness;
      uniform float uTime;
      uniform float uEnableShaderEffect;
      uniform float uEffectAmplitude;
      varying vec2 vUV;
      vec4 getPosition() {
          vec4 current = vec4(position, 1.0);
          vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
          vec2 nextScreen = next.xy * aspect;
          vec2 prevScreen = prev.xy * aspect;
          vec2 tangent = normalize(nextScreen - prevScreen);
          vec2 normal = vec2(-tangent.y, tangent.x);
          normal /= aspect;
          normal *= mix(1.0, 0.1, pow(abs(uv.y - 0.5) * 2.0, 2.0));
          float dist = length(nextScreen - prevScreen);
          normal *= smoothstep(0.0, 0.02, dist);
          float pixelWidthRatio = 1.0 / (uResolution.y / uDPR);
          float pixelWidth = current.w * pixelWidthRatio;
          normal *= pixelWidth * uThickness;
          current.xy -= normal * side;
          if(uEnableShaderEffect > 0.5) {
            current.xy += normal * sin(uTime + current.x * 10.0) * uEffectAmplitude;
          }
          return current;
      }
      void main() {
          vUV = uv;
          gl_Position = getPosition();
      }
    `

    const fragment = `
      precision highp float;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uEnableFade;
      varying vec2 vUV;
      void main() {
          float fadeFactor = 1.0;
          if(uEnableFade > 0.5) {
              fadeFactor = 1.0 - smoothstep(0.0, 1.0, vUV.y);
          }
          gl_FragColor = vec4(uColor, uOpacity * fadeFactor);
      }
    `

    function resize() {
      if (!container) return
      renderer.setSize(container.clientWidth, container.clientHeight)
      lines.forEach((line) => line.polyline.resize())
    }
    window.addEventListener('resize', resize)

    const center = (colors.length - 1) / 2
    colors.forEach((color, index) => {
      const line = {
        spring: baseSpring + (Math.random() - 0.5) * 0.05,
        friction: baseFriction + (Math.random() - 0.5) * 0.05,
        mouseVelocity: new Vec3(),
        mouseOffset: new Vec3(
          (index - center) * offsetFactor + (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.1,
          0
        ),
        points: [] as Vec3[],
        polyline: {} as Polyline,
      }

      const points: Vec3[] = []
      for (let i = 0; i < pointCount; i++) points.push(new Vec3())
      line.points = points

      line.polyline = new Polyline(gl, {
        points,
        vertex,
        fragment,
        uniforms: {
          uColor: { value: new Color(color) },
          uThickness: { value: baseThickness + (Math.random() - 0.5) * 3 },
          uOpacity: { value: 1.0 },
          uTime: { value: 0.0 },
          uEnableShaderEffect: { value: enableShaderEffect ? 1.0 : 0.0 },
          uEffectAmplitude: { value: effectAmplitude },
          uEnableFade: { value: enableFade ? 1.0 : 0.0 },
        },
      })
      line.polyline.mesh.setParent(scene)
      lines.push(line)
    })

    resize()

    const mouse = new Vec3()
    function updateMouse(e: MouseEvent | TouchEvent) {
      if (!container) return
      const rect = container.getBoundingClientRect()
      const point = 'changedTouches' in e && e.changedTouches.length
        ? e.changedTouches[0]
        : (e as MouseEvent)
      const x = point.clientX - rect.left
      const y = point.clientY - rect.top
      mouse.set((x / container.clientWidth) * 2 - 1, (y / container.clientHeight) * -2 + 1, 0)
    }

    container.addEventListener('mousemove', updateMouse)
    container.addEventListener('touchstart', updateMouse)
    container.addEventListener('touchmove', updateMouse)

    const tmp = new Vec3()
    let frameId = 0
    let lastTime = performance.now()

    function update() {
      frameId = requestAnimationFrame(update)
      const currentTime = performance.now()
      const dt = currentTime - lastTime
      lastTime = currentTime

      lines.forEach((line) => {
        tmp.copy(mouse).add(line.mouseOffset).sub(line.points[0]).multiply(line.spring)
        line.mouseVelocity.add(tmp).multiply(line.friction)
        line.points[0].add(line.mouseVelocity)

        for (let i = 1; i < line.points.length; i++) {
          const segmentDelay = maxAge / (line.points.length - 1)
          const alpha = Math.min(1, (dt * speedMultiplier) / segmentDelay)
          line.points[i].lerp(line.points[i - 1], alpha)
        }

        line.polyline.mesh.program.uniforms.uTime.value = currentTime * 0.001
        line.polyline.updateGeometry()
      })

      renderer.render({ scene })
    }
    update()

    return () => {
      window.removeEventListener('resize', resize)
      container.removeEventListener('mousemove', updateMouse)
      container.removeEventListener('touchstart', updateMouse)
      container.removeEventListener('touchmove', updateMouse)
      cancelAnimationFrame(frameId)
      if (gl.canvas.parentNode === container) container.removeChild(gl.canvas)
    }
  }, [
    colors,
    baseSpring,
    baseFriction,
    baseThickness,
    offsetFactor,
    maxAge,
    pointCount,
    speedMultiplier,
    enableFade,
    enableShaderEffect,
    effectAmplitude,
    backgroundColor,
  ])

  return <div ref={containerRef} className="relative h-full w-full" />
}
