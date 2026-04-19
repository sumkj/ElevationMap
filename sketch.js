// JavaScript / p5.js
// ElevationMap_sketch
// 国土地理院標高データ 3D地形ビューア (p5.js WEBGL版)
// Version: 1.0.0
// データ: https://cyberjapandata.gsi.go.jp/xyz/dem/
// 元Processing作品: k0085_maptarou15_8x3 を移植・高速化

let terrain = [];   // 標高データ [行][列]
let nRows = 0;
let nCols = 0;
const SCL   = 0.9;  // 水平スケール
const ZSCL  = 5.0;  // 標高の縦倍率（大きいほど山が高く見える）

// 操作ガイド
let showGuide = true;

function preload() {
  // CSVを文字列として読み込む（"e"=void対応のため loadStrings を使用）
  rawLines = loadStrings('data/15_allzz28962-9.csv');
}

let rawLines;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  colorMode(RGB, 255);

  // --- CSVパース ---
  document.getElementById('loading-msg').textContent = 'データ解析中... しばらくお待ちください';
  parseTerrain(rawLines);

  // ローディング画面を隠す
  document.getElementById('loading-screen').style.display = 'none';

  // マウス・タッチで自由に回転できる組み込み関数
  orbitControl(2, 2, 0.1);

  noLoop(); // 静止後に draw() を止める（操作時のみ再描画）
  redraw();
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
  nCols = (nRows > 0) ? terrain[0].length : 0;
  console.log('nRows=' + nRows + '  nCols=' + nCols);
}

function draw() {
  background(230);

  // orbitControl に毎フレーム渡す
  orbitControl(2, 2, 0.1);

  // カメラ初期位置を調整（斜め上から見下ろす）
  // orbitControl 使用時は rotateX などと組み合わせず、
  // translate で中心に合わせるだけにする
  let cx = (nCols * SCL) / 2;
  let cy = (nRows * SCL) / 2;
  translate(-cx, -cy, 0);

  // ---- 三角形メッシュ描画 ----
  strokeWeight(0.2);
  stroke(80);

  for (let j = 0; j < nRows - 1; j++) {
    beginShape(TRIANGLE_STRIP);
    for (let i = 0; i < nCols; i++) {
      let z0 = terrain[j]   ? terrain[j][i]   : null;
      let z1 = terrain[j+1] ? terrain[j+1][i] : null;

      // 標高に応じた色づけ
      if (z0 !== null) {
        let c = elevationColor(z0);
        fill(c[0], c[1], c[2]);
        vertex(i * SCL, j * SCL, -z0 / ZSCL);
      }
      if (z1 !== null) {
        let c = elevationColor(z1);
        fill(c[0], c[1], c[2]);
        vertex(i * SCL, (j+1) * SCL, -z1 / ZSCL);
      }
    }
    endShape();
  }

  // ガイド表示（HUD）
  if (showGuide) drawGuide();
}

// 標高値に応じた色を返す（低い=緑、高い=白）
function elevationColor(z) {
  if (z === null) return [200, 200, 200];
  // 200m以下=緑系、200〜1000m=茶色系、1000m以上=白系
  if (z < 200) {
    let t = map(z, 0, 200, 0, 1);
    return [
      lerp(40, 120, t),
      lerp(120, 100, t),
      lerp(40, 60, t)
    ];
  } else if (z < 1000) {
    let t = map(z, 200, 1000, 0, 1);
    return [
      lerp(120, 180, t),
      lerp(100, 140, t),
      lerp(60, 100, t)
    ];
  } else {
    let t = constrain(map(z, 1000, 3000, 0, 1), 0, 1);
    return [
      lerp(180, 255, t),
      lerp(140, 255, t),
      lerp(100, 255, t)
    ];
  }
}

// ---- 操作ガイドHUD ----
function drawGuide() {
  // WEBGLモードで2D描画するためのカメラリセット
  push();
  // HUDは画面左上に固定表示
  let w = 260, h = 185;
  let px = -windowWidth/2 + 14;
  let py = -windowHeight/2 + 14;

  // 背景
  noStroke();
  fill(0, 0, 0, 160);
  translate(px + w/2, py + h/2, 500);
  box(w, h, 0.1);

  // テキスト（WEBGLではtextSize/fillを使う）
  fill(255);
  textSize(12);
  textAlign(LEFT, TOP);
  let lines = [
    '【操作ガイド】',
    'ドラッグ  : 視点回転',
    '右ドラッグ: 平行移動',
    'スクロール: ズーム',
    'H キー   : ガイド非表示',
  ];
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], -w/2 + 10, -h/2 + 12 + i * 26);
  }
  pop();
}

function keyPressed() {
  if (key === 'h' || key === 'H') {
    showGuide = !showGuide;
    redraw();
  }
}

// マウス・タッチ操作のたびに再描画
function mouseDragged()  { loop(); }
function mouseReleased() { noLoop(); redraw(); }
function mouseWheel()    { loop(); return false; }
function touchStarted()  { loop(); return false; }
function touchEnded()    { noLoop(); redraw(); return false; }

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  redraw();
}
