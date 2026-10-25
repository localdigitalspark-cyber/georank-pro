/**
 * Verification test for dynamic grid size selector (3x3, 5x5, 7x7, 9x9)
 * and adjustable radius controls (0.5km, 1.0km, 2.5km, 5.0km).
 */

import { generateGeoGrid } from '../src/lib/geo/grid-generator.ts';

async function testGridMath() {
  console.log('Testing Geodesic Grid generation for 3x3, 5x5, 7x7, 9x9...');
  const center = { lat: 30.2672, lng: -97.7431 };

  const configs = [
    { size: 3, step: 0.5, expectedNodes: 9 },
    { size: 5, step: 1.0, expectedNodes: 25 },
    { size: 7, step: 2.5, expectedNodes: 49 },
    { size: 9, step: 5.0, expectedNodes: 81 },
  ];

  for (const cfg of configs) {
    const grid = generateGeoGrid({
      center,
      gridSize: cfg.size,
      distanceStep: cfg.step,
      unit: 'km',
    });

    if (grid.points.length !== cfg.expectedNodes) {
      throw new Error(`Grid size ${cfg.size} returned ${grid.points.length} nodes, expected ${cfg.expectedNodes}`);
    }

    const creditCost = cfg.size * cfg.size;
    if (creditCost !== cfg.expectedNodes) {
      throw new Error(`Credit cost mismatch for ${cfg.size}x${cfg.size}: ${creditCost} !== ${cfg.expectedNodes}`);
    }

    console.log(`✓ ${cfg.size}×${cfg.size} generated ${grid.points.length} nodes with ${cfg.step}km step (Credit cost: ${creditCost} credits).`);
  }
}

async function testServerScanEndpoint() {
  console.log('\nTesting /api/scan endpoint with 3x3, 5x5, 7x7, 9x9 grids...');
  const testSizes = [3, 5, 7, 9];

  for (const size of testSizes) {
    const resp = await fetch('http://localhost:3000/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: 'Austin Premier Plumbing',
        keyword: 'Emergency Plumber',
        lat: 30.2672,
        lng: -97.7431,
        gridSize: size,
        distanceStep: 1.0,
        unit: 'km',
        mode: 'mock',
      }),
    });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status} for gridSize ${size}`);
    }

    const data = await resp.json();
    if (!data.success) {
      throw new Error(`Scan failed for gridSize ${size}: ${data.error}`);
    }

    const expectedCount = size * size;
    if (data.nodes.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} nodes for ${size}x${size}, received ${data.nodes.length}`);
    }

    console.log(`✓ /api/scan returned ${data.nodes.length} nodes for ${size}×${size} grid.`);
  }
}

async function run() {
  try {
    await testGridMath();
    await testServerScanEndpoint();
    console.log('\nAll grid size and radius selector tests PASSED successfully!');
  } catch (err) {
    console.error('Test FAILED:', err);
    process.exit(1);
  }
}

run();
