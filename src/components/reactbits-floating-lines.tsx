'use client'

import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import {
  Clock,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'

const vertexShader = `
precision highp float;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec3  iResolution;
uniform float animationSpeed;

uniform bool enableTop;
uniform bool enableMiddle;
uniform bool enableBottom;

uniform int topLineCount;
uniform int middleLineCount;
uniform int bottomLineCount;

uniform float topLineDistance;
uniform float middleLineDistance;
uniform float bottomLineDistance;

uniform vec3 topWavePosition;
uniform vec3 middleWavePosition;
uniform vec3 bottomWavePosition;

uniform vec2 iMouse;
uniform bool interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float bendInfluence;

uniform bool parallax;
uniform float parallaxStrength;
uniform vec2 parallaxOffset;

uniform vec3 lineGradient[8];
uniform int lineGradientCount;

vec3 getLineColor(float t) {
  if (lineGradientCount <= 0) {
    return vec3(1.0);
  }

  vec3 gradientColor;
  
  if (lineGradientCount == 1) {
    gradientColor = lineGradient[0];
  } else {
    float clampedT = clamp(t, 0.0, 0.9999);
    float scaled = clampedT * float(lineGradientCount - 1);
    int idx = int(floor(scaled));
    float f = fract(scaled);
    int idx2 = min(idx + 1, lineGradientCount - 1);

    vec3 c1 = lineGradient[idx];
    vec3 c2 = lineGradient[idx2];
    
    gradientColor = mix(c1, c2, f);
  }
  
  return gradientColor * 0.5;
}

mat2 rotate(float r) {
  return mat2(cos(r), sin(r), -sin(r), cos(r));
}

float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv, bool shouldBend) {
  float time = iTime * animationSpeed;
  float x_offset   = offset;
  float x_movement = time * 0.1;
  float amp        = sin(offset + time * 0.2) * 0.3;
  float y          = sin(uv.x + x_offset + x_movement) * amp;

  if (shouldBend) {
    vec2 d = screenUv - mouseUv;
    float influence = exp(-dot(d, d) * bendRadius);
    float bendOffset = (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
    y += bendOffset;
  }

  float m = uv.y - y;
  return 0.0175 / max(abs(m) + 0.01, 1e-3) + 0.01;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 baseUv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
  baseUv.y *= -1.0;
  
  if (parallax) {
    baseUv += parallaxOffset;
  }

  vec3 col = vec3(0.0);
  vec2 mouseUv = vec2(0.0);
  if (interactive) {
    mouseUv = (2.0 * iMouse - iResolution.xy) / iResolution.y;
    mouseUv.y *= -1.0;
  }
  
  if (enableBottom) {
    for (int i = 0; i < bottomLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(bottomLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t);
      float angle = bottomWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(bottomLineDistance * fi + bottomWavePosition.x, bottomWavePosition.y),
        1.5 + 0.2 * fi,
        baseUv,
        mouseUv,
        interactive
      ) * 0.2;
    }
  }

  if (enableMiddle) {
    for (int i = 0; i < middleLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(middleLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t);
      float angle = middleWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(middleLineDistance * fi + middleWavePosition.x, middleWavePosition.y),
        2.0 + 0.15 * fi,
        baseUv,
        mouseUv,
        interactive
      );
    }
  }

  if (enableTop) {
    for (int i = 0; i < topLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(topLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t);
      float angle = topWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      ruv.x *= -1.0;
      col += lineCol * wave(
        ruv + vec2(topLineDistance * fi + topWavePosition.x, topWavePosition.y),
        1.0 + 0.2 * fi,
        baseUv,
        mouseUv,
        interactive
      ) * 0.1;
    }
  }

  fragColor = vec4(col, 1.0);
}

void main() {
  vec4 color = vec4(0.0);
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}
`

const MAX_GRADIENT_STOPS = 8

type WavePosition = {
  x: number
  y: number
  rotate: number
}

function hexToVec3(hex: string): Vector3 {
  const value = hex.trim().replace('#', '')
  let r = 255
  let g = 255
  let b = 255

  if (value.length === 3) {
    r = parseInt(value[0] + value[0], 16)
    g = parseInt(value[1] + value[1], 16)
    b = parseInt(value[2] + value[2], 16)
  } else if (value.length === 6) {
    r = parseInt(value.slice(0, 2), 16)
    g = parseInt(value.slice(2, 4), 16)
    b = parseInt(value.slice(4, 6), 16)
  }

  return new Vector3(r / 255, g / 255, b / 255)
}

export function ReactBitsFloatingLines({
  linesGradient = ['#34d399', '#60a5fa', '#a78bfa'],
  enabledWaves = ['top', 'middle', 'bottom'] as Array<'top' | 'middle' | 'bottom'>,
  lineCount = [4, 6, 4],
  lineDistance = [12, 10, 14],
  topWavePosition = { x: 9.0, y: 0.48, rotate: -0.4 },
  middleWavePosition = { x: 4.8, y: 0.02, rotate: 0.16 },
  bottomWavePosition = { x: 1.9, y: -0.72, rotate: 0.34 },
  animationSpeed = 0.7,
  interactive = false,
  bendRadius = 5.0,
  bendStrength = -0.5,
  mouseDamping = 0.05,
  parallax = false,
  parallaxStrength = 0.12,
  mixBlendMode = 'screen',
}: {
  linesGradient?: string[]
  enabledWaves?: Array<'top' | 'middle' | 'bottom'>
  lineCount?: number | number[]
  lineDistance?: number | number[]
  topWavePosition?: WavePosition
  middleWavePosition?: WavePosition
  bottomWavePosition?: WavePosition
  animationSpeed?: number
  interactive?: boolean
  bendRadius?: number
  bendStrength?: number
  mouseDamping?: number
  parallax?: boolean
  parallaxStrength?: number
  mixBlendMode?: CSSProperties['mixBlendMode']
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let active = true
    const scene = new Scene()
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    camera.position.z = 1

    const renderer = new WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    container.appendChild(renderer.domElement)

    const targetMouseRef = { current: new Vector2(-1000, -1000) }
    const currentMouseRef = { current: new Vector2(-1000, -1000) }
    const targetInfluenceRef = { current: 0 }
    const currentInfluenceRef = { current: 0 }
    const targetParallaxRef = { current: new Vector2(0, 0) }
    const currentParallaxRef = { current: new Vector2(0, 0) }

    const getLineCount = (waveType: 'top' | 'middle' | 'bottom'): number => {
      if (typeof lineCount === 'number') return lineCount
      if (!enabledWaves.includes(waveType)) return 0
      const index = enabledWaves.indexOf(waveType)
      return lineCount[index] ?? 6
    }

    const getLineDistance = (waveType: 'top' | 'middle' | 'bottom'): number => {
      if (typeof lineDistance === 'number') return lineDistance
      if (!enabledWaves.includes(waveType)) return 0.1
      const index = enabledWaves.indexOf(waveType)
      return lineDistance[index] ?? 0.1
    }

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new Vector3(1, 1, 1) },
      animationSpeed: { value: animationSpeed },
      enableTop: { value: enabledWaves.includes('top') },
      enableMiddle: { value: enabledWaves.includes('middle') },
      enableBottom: { value: enabledWaves.includes('bottom') },
      topLineCount: { value: enabledWaves.includes('top') ? getLineCount('top') : 0 },
      middleLineCount: { value: enabledWaves.includes('middle') ? getLineCount('middle') : 0 },
      bottomLineCount: { value: enabledWaves.includes('bottom') ? getLineCount('bottom') : 0 },
      topLineDistance: { value: enabledWaves.includes('top') ? getLineDistance('top') * 0.01 : 0.01 },
      middleLineDistance: { value: enabledWaves.includes('middle') ? getLineDistance('middle') * 0.01 : 0.01 },
      bottomLineDistance: { value: enabledWaves.includes('bottom') ? getLineDistance('bottom') * 0.01 : 0.01 },
      topWavePosition: { value: new Vector3(topWavePosition.x, topWavePosition.y, topWavePosition.rotate) },
      middleWavePosition: {
        value: new Vector3(middleWavePosition.x, middleWavePosition.y, middleWavePosition.rotate),
      },
      bottomWavePosition: {
        value: new Vector3(bottomWavePosition.x, bottomWavePosition.y, bottomWavePosition.rotate),
      },
      iMouse: { value: new Vector2(-1000, -1000) },
      interactive: { value: interactive },
      bendRadius: { value: bendRadius },
      bendStrength: { value: bendStrength },
      bendInfluence: { value: 0 },
      parallax: { value: parallax },
      parallaxStrength: { value: parallaxStrength },
      parallaxOffset: { value: new Vector2(0, 0) },
      lineGradient: {
        value: Array.from({ length: MAX_GRADIENT_STOPS }, () => new Vector3(1, 1, 1)),
      },
      lineGradientCount: { value: 0 },
    }

    const stops = linesGradient.slice(0, MAX_GRADIENT_STOPS)
    uniforms.lineGradientCount.value = stops.length
    stops.forEach((hex, index) => {
      const color = hexToVec3(hex)
      uniforms.lineGradient.value[index].set(color.x, color.y, color.z)
    })

    const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true })
    const geometry = new PlaneGeometry(2, 2)
    const mesh = new Mesh(geometry, material)
    scene.add(mesh)

    const clock = new Clock()

    const setSize = () => {
      if (!active) return
      const width = container.clientWidth || 1
      const height = container.clientHeight || 1
      renderer.setSize(width, height, false)
      uniforms.iResolution.value.set(renderer.domElement.width, renderer.domElement.height, 1)
    }

    setSize()
    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            setSize()
          })
        : null
    observer?.observe(container)

    const handlePointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const dpr = renderer.getPixelRatio()

      targetMouseRef.current.set(x * dpr, (rect.height - y) * dpr)
      targetInfluenceRef.current = 1

      if (parallax) {
        const offsetX = (x - rect.width / 2) / rect.width
        const offsetY = -(y - rect.height / 2) / rect.height
        targetParallaxRef.current.set(offsetX * parallaxStrength, offsetY * parallaxStrength)
      }
    }

    const handlePointerLeave = () => {
      targetInfluenceRef.current = 0
    }

    if (interactive) {
      renderer.domElement.addEventListener('pointermove', handlePointerMove)
      renderer.domElement.addEventListener('pointerleave', handlePointerLeave)
    }

    let raf = 0
    const renderLoop = () => {
      if (!active) return
      uniforms.iTime.value = clock.getElapsedTime()

      if (interactive) {
        currentMouseRef.current.lerp(targetMouseRef.current, mouseDamping)
        uniforms.iMouse.value.copy(currentMouseRef.current)
        currentInfluenceRef.current += (targetInfluenceRef.current - currentInfluenceRef.current) * mouseDamping
        uniforms.bendInfluence.value = currentInfluenceRef.current
      }

      if (parallax) {
        currentParallaxRef.current.lerp(targetParallaxRef.current, mouseDamping)
        uniforms.parallaxOffset.value.copy(currentParallaxRef.current)
      }

      renderer.render(scene, camera)
      raf = requestAnimationFrame(renderLoop)
    }
    renderLoop()

    return () => {
      active = false
      cancelAnimationFrame(raf)
      observer?.disconnect()
      if (interactive) {
        renderer.domElement.removeEventListener('pointermove', handlePointerMove)
        renderer.domElement.removeEventListener('pointerleave', handlePointerLeave)
      }
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.parentElement?.removeChild(renderer.domElement)
    }
  }, [
    animationSpeed,
    bendRadius,
    bendStrength,
    bottomWavePosition,
    enabledWaves,
    interactive,
    lineCount,
    lineDistance,
    linesGradient,
    middleWavePosition,
    mixBlendMode,
    mouseDamping,
    parallax,
    parallaxStrength,
    topWavePosition,
  ])

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-70"
      style={{ mixBlendMode }}
    />
  )
}
