// ARENA V1.0 - Fetch OSM Buildings for Buenos Aires
// Run: node scripts/fetch-buildings.js

const fs = require('fs');
const https = require('https');

// Bounding box for Buenos Aires (entire city)
// Format: [south, west, north, east]
const BUENOS_AIRES_BBOX = [-34.705, -58.531, -34.526, -58.335];

// For testing, use smaller Núñez area first
const NUNEZ_BBOX = [-34.560, -58.470, -34.530, -58.440];

// Use Núñez for now (change to BUENOS_AIRES_BBOX for full city)
const bbox = NUNEZ_BBOX;

// Overpass API query for building footprints
const query = `
[out:json][timeout:90];
(
  way["building"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
  relation["building"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
);
out geom;
`;

const url = 'https://overpass-api.de/api/interpreter';

console.log('🔍 Fetching OSM buildings from Overpass API...');
console.log(`📍 Bounding box: ${bbox.join(', ')}`);

const postData = `data=${encodeURIComponent(query)}`;

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(url, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const osmData = JSON.parse(data);

      // Convert OSM data to GeoJSON
      const geojson = {
        type: 'FeatureCollection',
        features: []
      };

      osmData.elements.forEach((element) => {
        if (element.type === 'way' && element.geometry) {
          // Extract building height (if available)
          const height = element.tags?.height
            ? parseFloat(element.tags.height)
            : element.tags?.['building:levels']
              ? parseFloat(element.tags['building:levels']) * 3 // Assume 3m per level
              : 10; // Default 10m

          const feature = {
            type: 'Feature',
            id: element.id,
            properties: {
              id: element.id.toString(),
              osmId: element.id.toString(),
              type: 'building',
              height: height,
              levels: element.tags?.['building:levels'],
              name: element.tags?.name,
              ...element.tags
            },
            geometry: {
              type: 'Polygon',
              coordinates: [element.geometry.map(node => [node.lon, node.lat])]
            }
          };

          geojson.features.push(feature);
        }
      });

      console.log(`✅ Fetched ${geojson.features.length} buildings`);

      // Save to file
      const outputPath = 'public/data/ba-buildings.json';
      fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));

      const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(2);
      console.log(`💾 Saved to ${outputPath} (${fileSize} KB)`);

    } catch (err) {
      console.error('❌ Error parsing response:', err.message);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Request failed:', err.message);
});

req.write(postData);
req.end();
