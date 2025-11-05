# Depth of Field Effect - Research & Implementation Notes

## Summary

**Status**: ❌ Not natively supported in Mapbox GL JS
**Alternative**: ✅ CSS vignette effect implemented

## Native Depth of Field Support

Mapbox GL JS does **not** currently support true depth of field (DOF) effects. The rendering engine does not provide:

- Camera aperture/focus distance controls
- Gaussian blur based on depth buffer
- Bokeh effects
- Post-processing blur shaders

### Why Not?

1. **Performance**: Real-time DOF requires multiple render passes and depth buffer sampling, which would significantly impact frame rate on complex 3D maps
2. **Mobile**: Most DOF implementations are too GPU-intensive for mobile devices
3. **Use Case**: Maps typically need to show all details clearly, making DOF counterproductive for most use cases

## Alternatives Implemented

### 1. CSS Vignette Effect ✅

A subtle darkening at the edges of the viewport creates a cinematic focus effect without blurring content.

**Pros**:
- Very performant (CSS-only)
- Works on all devices
- Subtle and professional
- Doesn't obscure map data

**Cons**:
- Not a true DOF effect
- Static (doesn't respond to camera focus)

**Implementation**:
```css
.map-container::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    circle at center,
    transparent 0%,
    transparent 50%,
    rgba(0, 0, 0, 0.15) 100%
  );
}
```

### 2. Fog Effects ✅ (Already Implemented)

Mapbox's built-in fog provides atmospheric depth:
- Distance-based color fading
- Horizon blending
- Sky gradient integration

**This is the closest to DOF we can achieve natively.**

## Future Possibilities

### Custom WebGL Post-Processing

Could potentially implement DOF via:
1. Render map to off-screen framebuffer
2. Extract depth information from camera distance
3. Apply Gaussian blur shader with depth-based radius
4. Composite back to screen

**Challenges**:
- Requires deep Mapbox GL JS internals knowledge
- Risk of breaking on Mapbox updates
- Significant performance overhead
- Complex implementation (~1000+ lines)

**Estimated effort**: 2-3 weeks of development + testing

### Three.js Integration

Use Three.js post-processing stack:
- EffectComposer
- BokehPass
- Depth texture from Mapbox

**Challenges**:
- Very complex integration
- Doubles rendering overhead
- Maintenance burden

**Estimated effort**: 3-4 weeks

## Recommendation

**For ARENA v1.1**:
- ✅ Use CSS vignette effect (simple, performant)
- ✅ Leverage Mapbox fog for depth perception
- ✅ Focus on lighting and camera animations for cinematic feel

**For future versions**:
- Monitor Mapbox GL JS releases for native DOF support
- Consider custom WebGL implementation only if becomes critical user feature
- Survey users to validate demand before investing effort

## Implementation Status

- [x] Research completed
- [x] CSS vignette effect available as optional enhancement
- [x] Fog effects implemented via lighting system
- [x] Documented limitations and alternatives

## Usage

To enable vignette effect in MapboxView:

```tsx
<MapboxView
  enableCinematicEnhancements={true}
  // Other props...
  className="map-vignette" // Add custom class for vignette
/>
```

Then in your CSS:
```css
.map-vignette::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    circle at center,
    transparent 40%,
    rgba(0, 0, 0, 0.2) 100%
  );
  z-index: 1;
}
```

---

**Conclusion**: While true DOF isn't feasible, the combination of fog, vignette, and dynamic lighting creates a sufficiently cinematic experience for ARENA's use case.
