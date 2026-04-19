// JavaScript / p5.js
// ElevationMap_sketch
// 国土地理院標高データ 3D地形ビューア (p5.js WEBGL版)
// Version: 1.1.0
// データ: https://cyberjapandata.gsi.go.jp/xyz/dem/

let terrain = [];
let nRows = 0;
let nCols = 0;
const SCL  = 0.9;   // 水平スケール
const ZSCL = 5.0;   // 標高縦倍率

let rawLines;
let loaded = false;

function preload() {
  rawLines = loadStrings('data/15_allzz28962-9.csv');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  colorMode(RGB, 255);
  parseTerrain(rawLines);
  loaded = true;
  document.getElementById('loading-screen').style.display = 'none';
  // 初期カメラ：斜め上から見下ろす
  camera(0, -600, 800, 0, 0, 0, 0, 1, 0);
}

function parseTerrain(lines) {
  terrain = [];
  for (let j = 0; j < lines.length; j++) {
    if (lines[j].trim() === '') continue;
    let vals = lines[j].split(',');
    let row = [];
    for (let i = 0; i < vals.length; i++) {
      let v = vals[i].trim();
      row.push((v === 'e' || v === '') ? null : parseFloat(v));
    }
    terrain.push(row);
  }
  nRows = terrain.length;
  nCols = terrain.length > 0 ? terrain[0].length : 0;
  console.log('nRows=' + nRows + ' nCols=' + nCols);
}

function draw() {
  if (!loaded) return;

  background(220);

  // マウス・タッチで自由回転・ズーム（これだけで動く）
  orbitControl(3, 3, 0.1);

  // 地形の中心を原点に合わせる
  let cx = (nCols * SCL) / 2;
  let cy = (nRows * SCL) / 2;
  translate(-cx, -cy, 0);

  strokeWeight(0.15);
  stroke(80);

  for (let j = 0; j < nRows - 1; j++) {
    beginShape(TRIANGLE_STRIP);
    for (let i = 0; i < nCols; i++) {
      let z0 = terrain[j]     ? terrain[j][i]     : null;
      let z1 = terrain[j + 1] ? terrain[j + 1][i] : null;

      if (z0 !== null) {
        let c = elevColor(z0);
        fill(c[0], c[1], c[2]);
        vertex(i * SCL, j * SCL, -z0 / ZSCL);
      }
      if (z1 !== null) {
        let c = elevColor(z1);
        fill(c[0], c[1], c[2]);
        vertex(i * SCL, (j + 1) * SCL, -z1 / ZSCL);
      }
    }
    endShape();
  }
}

// 標高に応じた色（低=緑、中=茶、高=白）
function elevColor(z) {
  if (z === null) return [180, 180, 180];
  let r, g, b;
  if (z < 200) {
    let t = map(z, 0, 200, 0, 1);
    r = lerp(50, 110, t);
    g = lerp(130, 100, t);
    b = lerp(50,  60, t);
  } else if (z < 1000) {
    let t = map(z, 200, 1000, 0, 1);
    r = lerp(110, 180, t);
    g = lerp(100, 140, t);
    b = lerp(60,  100, t);
  } else {
    let t = constrain(map(z, 1000, 3000, 0, 1), 0, 1);
    r = lerp(180, 255, t);
    g = lerp(140, 255, t);
    b = lerp(100, 255, t);
  }
  return [r, g, b];
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
