# Week 1 Implementation: Proposal Pins on Map

## ✅ What Was Implemented (Nov 2, 2024)

### 1. **Pin Click → Detail Panel Flow**
- **File**: `app/page.tsx`
- **Changes**:
  - Added `selectedProposalId` state to track which proposal was clicked
  - Created `handleMapProposalClick()` function that opens panel with specific proposal
  - Wired up MapView → page.tsx → ProposalsPanel data flow

### 2. **ProposalsPanel Enhanced**
- **File**: `app/components/ProposalsPanel.tsx`
- **Changes**:
  - Added `initialProposalId` prop to allow external control
  - Panel now opens directly to detail view when pin is clicked

### 3. **Improved Pin Icon**
- **File**: `app/components/MapView.tsx` (line 285)
- **Design**: Modern teardrop pin (purple #8B5CF6)
- **Features**:
  - Drop shadow for depth
  - White center circle
  - 48x48px size
  - Anchored at bottom point (accurate positioning)

**SVG Code** (decoded from base64):
```xml
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Drop shadow -->
  <ellipse cx="24" cy="44" rx="6" ry="2" fill="black" opacity="0.2"/>
  <!-- Pin body -->
  <path d="M24 4C17.3726 4 12 9.37258 12 16C12 24.5 19 33 24 40C29 33 36 24.5 36 16C36 9.37258 30.6274 4 24 4Z" fill="#8B5CF6"/>
  <!-- Inner circle -->
  <circle cx="24" cy="16" r="6" fill="white"/>
</svg>
```

### 4. **Enhanced Hover Tooltip**
- **File**: `app/components/MapView.tsx` (line 768-794)
- **Design**: Modern card with icon, positioned at top-center
- **Features**:
  - Building icon with gradient background
  - Title, author, summary preview
  - "Click para ver detalles →" call-to-action
  - Arrow pointing down to map
  - Subtle shadow and border

---

## 🎨 CUSTOMIZATION GUIDE (For Later Design Work)

When you have time to design in Figma, here's what you can customize:

### **A. Pin Icon Customization**

**Location**: `app/components/MapView.tsx:285`

Current pin color: `#8B5CF6` (purple)

**To change color**:
1. Export your designed pin from Figma as SVG
2. Use this online tool to convert: https://base64.guru/converter/encode/image/svg
3. Replace the base64 string in the code

**To add color-coded pins** (by status or type):
```typescript
getIcon: (d: any) => {
  // Color code by status
  const pinColor = d.status === 'published' ? '#8B5CF6' : '#6B7280'

  // Or by proposal type
  const pinColor = {
    'park': '#10B981', // Green
    'building': '#3B82F6', // Blue
    'transit': '#F59E0B' // Amber
  }[d.tags[0]] || '#8B5CF6'

  return {
    url: `data:image/svg+xml;base64,${yourBase64PinWithDynamicColor}`,
    width: 48,
    height: 48,
    anchorY: 48
  }
}
```

### **B. Tooltip Customization**

**Location**: `app/components/MapView.tsx:768-794`

**Current design**:
- Colors: Indigo gradient (`from-indigo-500 to-purple-600`)
- Max width: `max-w-sm` (384px)
- Icon: Building icon (can change to lightbulb, star, etc.)

**To redesign**:
1. Modify the Tailwind classes
2. Change the icon SVG path (use heroicons.com)
3. Add thumbnail image:
```tsx
{hoveredProposal.imageUrl && (
  <img src={hoveredProposal.imageUrl} className="w-full h-32 object-cover rounded-lg mb-2" />
)}
```

### **C. Pin States (Hover/Active)**

**Current**: Only default state is implemented

**To add hover effect** (pin grows on hover):
```typescript
// In IconLayer config
getSize: (d: any) => {
  // Check if this proposal is being hovered
  return hoveredProposal?.id === d.id ? 56 : 48 // Grows from 48 to 56
}

updateTriggers: {
  getSize: [hoveredProposal]
}
```

**To add active/selected state** (different color when panel is open):
```typescript
getIcon: (d: any) => {
  const isSelected = selectedProposalId === d.id
  const pinColor = isSelected ? '#A78BFA' : '#8B5CF6' // Lighter purple when selected
  // ... rest of icon config
}
```

---

## 🧪 TESTING CHECKLIST

To test the implementation when dev server is running:

### **1. Basic Flow**
- [ ] Open map (navigate mode)
- [ ] See purple pin markers on map
- [ ] Hover over a pin → tooltip appears at top
- [ ] Click a pin → sidebar opens with proposal detail

### **2. Tooltip Behavior**
- [ ] Tooltip shows title, author, summary
- [ ] Tooltip disappears when moving mouse away
- [ ] "Click para ver detalles →" text is visible

### **3. Panel Integration**
- [ ] Clicking pin opens ProposalDetailPanel (not just the list)
- [ ] Back button in panel returns to proposal list
- [ ] Closing panel clears selected proposal

### **4. Edge Cases**
- [ ] Multiple proposals in same area (pins don't overlap too much)
- [ ] Proposals without summary still show tooltip
- [ ] Clicking same pin twice doesn't break panel

---

## 🎯 NEXT STEPS (Week 1 Remaining Tasks)

### **Day 2-3: Gallery View (Mode D)**
- Add grid/list toggle
- Implement sort dropdown (date, votes, status)
- Add filter checkboxes
- Generate thumbnail images from proposals

### **Day 4-5: Mode B Placeholder UI**
- Create `LayersPanel` component
- Add 3 mock layers (traffic, greenspace, noise)
- Toggle on/off functionality (no real data)

---

## 📁 FILES MODIFIED

```
app/page.tsx                          (+ proposal click handler, state management)
app/components/ProposalsPanel.tsx    (+ external proposal selection)
app/components/MapView.tsx            (+ improved pin icon, tooltip, click wiring)
```

---

## 🔧 TROUBLESHOOTING

### **Pins not showing**
- Check browser console for errors
- Verify proposals are being fetched: `GET /api/proposals?status=public`
- Check that proposals have `geom` field with coordinates

### **Click not working**
- Ensure map is in "navigate" mode (not "create" mode)
- Check console logs for "📍 Clicked proposal:" message
- Verify `onProposalClick` prop is passed through correctly

### **Tooltip looks wrong**
- Clear browser cache
- Check Tailwind classes are compiled (run `npm run dev` fresh)
- Verify viewport width (tooltip has `max-w-sm`)

---

## 💡 DESIGN IDEAS FOR LATER

When you have time to polish:

1. **Animated pins**: Bounce animation when map loads
2. **Cluster pins**: Group nearby proposals into clusters (use @deck.gl/aggregation-layers)
3. **Minimap thumbnail**: Show tiny map preview in tooltip
4. **Status badges**: Visual indicators (🟢 Published, 🟡 Draft, ⭐ Featured)
5. **User avatar**: Show proposal author's avatar in tooltip
6. **Vote count badge**: Small number bubble on pin showing votes

---

**Implementation Date**: November 2, 2024
**Time Spent**: ~2 hours
**Status**: ✅ Complete and ready for testing
