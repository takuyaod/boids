import type { BoidsRenderer } from './renderer';
import type { Boid } from './Boid';
import type { Predator } from './Predator';
import { computeInkCloudState } from './inkUtils';
import {
  BoidSpecies,
  SPECIES_SPRITES,
  SPECIES_COLORS,
  SPECIES_PIXEL_SIZES,
  SHARK_SPRITE,
  PREDATOR_PIXEL_SIZE,
  PREDATOR_COLOR,
  PREDATOR_STUN_COLOR,
  PREDATOR_STUN_DOT_COUNT,
  PREDATOR_STUN_DOT_ORBIT,
  PREDATOR_STUN_DOT_RADIUS,
  PREDATOR_STUN_ORBIT_WOBBLE,
  PREDATOR_CONFUSION_COLOR,
  PREDATOR_CONFUSION_DOT_COUNT,
  PREDATOR_CONFUSION_DOT_ORBIT,
  PREDATOR_CONFUSION_DOT_RADIUS,
  OCTOPUS_INK_CLOUD_DURATION_MS,
  CRT_SCANLINE_INTERVAL,
  CRT_SCANLINE_OPACITY,
  CRT_VIGNETTE_INNER_RADIUS,
  CRT_VIGNETTE_OUTER_RADIUS,
  CRT_VIGNETTE_OPACITY,
} from './constants';

// ────── スプライトピクセルの事前計算 ──────────────────────────────────────

// スプライト内の塗りつぶしピクセルの中心座標（スプライトローカル座標、原点はスプライト中央）
type PixelOffset = { ox: number; oy: number };

function computeFilledPixels(
  sprite: ReadonlyArray<ReadonlyArray<0 | 1>>,
  pixelSize: number,
): PixelOffset[] {
  const cols = sprite[0].length;
  const rows = sprite.length;
  // スプライト全体の中心を原点とする
  const originX = (cols * pixelSize) / 2;
  const originY = (rows * pixelSize) / 2;

  const result: PixelOffset[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (sprite[row][col] === 1) {
        result.push({
          ox: (col + 0.5) * pixelSize - originX,
          oy: (row + 0.5) * pixelSize - originY,
        });
      }
    }
  }
  return result;
}

// 起動時に1回だけ計算してキャッシュ
const SPECIES_PIXEL_OFFSETS: Record<BoidSpecies, PixelOffset[]> = Object.fromEntries(
  Object.values(BoidSpecies).map((species) => [
    species,
    computeFilledPixels(SPECIES_SPRITES[species], SPECIES_PIXEL_SIZES[species]),
  ]),
) as Record<BoidSpecies, PixelOffset[]>;

const SHARK_PIXEL_OFFSETS = computeFilledPixels(SHARK_SPRITE, PREDATOR_PIXEL_SIZE);

// しびれドット用：オフセット(0,0)の1点スプライト
const STUN_DOT_PIXEL_OFFSETS: PixelOffset[] = [{ ox: 0, oy: 0 }];

// しびれエフェクトのドット色をモジュール初期化時に1回だけ変換してキャッシュ
const STUN_DOT_RGB = hexToRgb(PREDATOR_STUN_COLOR);
// 混乱エフェクトのドット色
const CONFUSION_DOT_RGB = hexToRgb(PREDATOR_CONFUSION_COLOR);
// スミ雲色（boidRenderer.ts の rgba(160,140,180) に合わせた薄紫がかったグレー）
const INK_CLOUD_RGB: [number, number, number] = [160 / 255, 140 / 255, 180 / 255];

// ────── バッファレイアウト定数 ─────────────────────────────────────────────

// インスタンスあたり7 floats: x, y, halfSize, alpha, r, g, b
const MAX_INSTANCES = 8192;
const INSTANCE_FLOATS = 7;
const INSTANCE_STRIDE = INSTANCE_FLOATS * 4; // 28 bytes

// ────── WGSL シェーダー ────────────────────────────────────────────────────

// スプライト描画シェーダー
const SPRITE_SHADER = /* wgsl */ `
struct Uniforms {
  screen_size: vec2f,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
}

@vertex
fn vs_main(
  @builtin(vertex_index) vi: u32,
  @location(0) world_pos: vec2f,
  @location(1) size_alpha: vec2f,
  @location(2) color: vec3f,
) -> VertexOutput {
  // triangle-list で1クワッド（2三角形＝6頂点）を構成
  let qx = array<f32, 6>(-1.0,  1.0, -1.0,  1.0,  1.0, -1.0);
  let qy = array<f32, 6>(-1.0, -1.0,  1.0, -1.0,  1.0,  1.0);

  let half_size = size_alpha.x;
  let wx = world_pos.x + qx[vi] * half_size;
  let wy = world_pos.y + qy[vi] * half_size;

  // スクリーン座標 → NDC（Y 軸反転）
  let ndc_x = (wx / uniforms.screen_size.x) * 2.0 - 1.0;
  let ndc_y = 1.0 - (wy / uniforms.screen_size.y) * 2.0;

  var out: VertexOutput;
  out.position = vec4f(ndc_x, ndc_y, 0.0, 1.0);
  out.color = vec4f(color, size_alpha.y);
  return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4f {
  return in.color;
}
`;

// CRT オーバーレイシェーダー（スキャンライン＋ビネット）
const CRT_SHADER = /* wgsl */ `
struct CRTUniforms {
  screen_size: vec2f,
  scanline_interval: f32,
  scanline_opacity: f32,
  vignette_inner: f32,
  vignette_outer: f32,
  vignette_opacity: f32,
  _pad: f32,
}

@group(0) @binding(0) var<uniform> crt: CRTUniforms;

struct VertexOutput {
  @builtin(position) position: vec4f,
}

// フルスクリーン三角形（3頂点でビューポート全体をカバー）
@vertex
fn vs_main(@builtin(vertex_index) vi: u32) -> VertexOutput {
  let pos = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f( 3.0, -1.0),
    vec2f(-1.0,  3.0),
  );
  var out: VertexOutput;
  out.position = vec4f(pos[vi], 0.0, 1.0);
  return out;
}

@fragment
fn fs_main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  var a = 0.0;

  // スキャンライン：一定間隔で黒い帯を描画
  let row = pos.y % crt.scanline_interval;
  if (row < 1.0) {
    a = crt.scanline_opacity;
  }

  // ビネット：画面端に向かって暗くなる放射状グラデーション
  let center = crt.screen_size * 0.5;
  let dist = distance(pos.xy, center) / crt.screen_size.y;
  let t = clamp(
    (dist - crt.vignette_inner) / (crt.vignette_outer - crt.vignette_inner),
    0.0, 1.0,
  );
  a = max(a, t * crt.vignette_opacity);

  return vec4f(0.0, 0.0, 0.0, a);
}
`;

// スミ雲シェーダー（ドットグリッドパターン、boidRenderer.ts と同じ見た目）
const INK_CLOUD_SHADER = /* wgsl */ `
struct Uniforms {
  screen_size: vec2f,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) color: vec3f,
  @location(2) alpha: f32,
  @location(3) radius: f32,
  @location(4) center: vec2f,
}

@vertex
fn vs_main(
  @builtin(vertex_index) vi: u32,
  @location(0) center: vec2f,
  @location(1) size_alpha: vec2f,
  @location(2) color: vec3f,
) -> VertexOut {
  let qx = array<f32, 6>(-1.0,  1.0, -1.0,  1.0,  1.0, -1.0);
  let qy = array<f32, 6>(-1.0, -1.0,  1.0, -1.0,  1.0,  1.0);
  let uv = vec2f(qx[vi], qy[vi]);
  let radius = size_alpha.x;
  let wx = center.x + uv.x * radius;
  let wy = center.y + uv.y * radius;
  let ndc_x = (wx / uniforms.screen_size.x) * 2.0 - 1.0;
  let ndc_y = 1.0 - (wy / uniforms.screen_size.y) * 2.0;
  var out: VertexOut;
  out.position = vec4f(ndc_x, ndc_y, 0.0, 1.0);
  out.uv = uv;
  out.color = color;
  out.alpha = size_alpha.y;
  out.radius = radius;
  out.center = center;
  return out;
}

// グリッドセル座標とクラウド中心を組み合わせた決定論的ハッシュ（[0, 1] を返す）
// 異なるタコのスミ雲が同じセル番号を持っても異なるパターンになるよう center を seed に含める
// center 座標を整数変換してシードに利用（整数演算のみ）
fn dotHash(ix: i32, iy: i32, cx: f32, cy: f32) -> f32 {
  let seed = u32(i32(cx) * 22695477 + i32(cy) * 6364136);
  var v = (u32(ix) * 1664525u) ^ (u32(iy) * 1013904223u) ^ seed;
  v ^= v >> 16u;
  v *= 0x45d9f3bu;
  v ^= v >> 15u;
  return f32(v) / 4294967295.0;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4f {
  let dist = length(in.uv);
  if (dist > 1.0) { discard; }

  // UV [-1, 1] → スミ雲ローカル座標（px）
  let px = in.uv.x * in.radius;
  let py = in.uv.y * in.radius;

  // ドットグリッド（boidRenderer.ts と同じ定数: gridStep = 6, dotSize = 3）
  let gridStep = 6.0;
  let dotHalf  = 1.5;
  let cell_x = i32(floor(px / gridStep));
  let cell_y = i32(floor(py / gridStep));

  // セル中心からの距離でドット矩形を判定
  let local_x = px - (f32(cell_x) + 0.5) * gridStep;
  let local_y = py - (f32(cell_y) + 0.5) * gridStep;
  if (abs(local_x) > dotHalf || abs(local_y) > dotHalf) { discard; }

  // 中心ほど密に、外側ほど間引く（boidRenderer.ts の density と同じ計算）
  let density = 1.0 - dist;
  if (dotHash(cell_x, cell_y, in.center.x, in.center.y) > density) { discard; }

  // 黒背景で視認しやすいよう外縁の最小アルファを 0.6 に引き上げ
  let dotAlpha = in.alpha * (0.6 + density * 0.4);
  return vec4f(in.color, dotAlpha);
}
`;

// スミ雲インスタンスの上限（同時に放出中の雲の最大数）
const INK_CLOUD_MAX_INSTANCES = 16;

// ────── WebGPU レンダラー ─────────────────────────────────────────────────

export class WebGPURenderer implements BoidsRenderer {
  private device: GPUDevice;
  private context: GPUCanvasContext;
  private format: GPUTextureFormat;

  private spritePipeline!: GPURenderPipeline;
  private crtPipeline!: GPURenderPipeline;
  private inkCloudPipeline!: GPURenderPipeline;

  private uniformBuffer!: GPUBuffer;
  private crtUniformBuffer!: GPUBuffer;
  private instanceBuffer!: GPUBuffer;
  private inkCloudBuffer!: GPUBuffer;

  private spriteBindGroup!: GPUBindGroup;
  private crtBindGroup!: GPUBindGroup;
  private inkCloudBindGroup!: GPUBindGroup;

  // CPU 側のインスタンスデータ（フレームごとに書き直す）
  private instanceData: Float32Array<ArrayBuffer>;
  private inkCloudData: Float32Array<ArrayBuffer>;

  constructor(canvas: HTMLCanvasElement, device: GPUDevice) {
    this.device = device;
    this.format = navigator.gpu.getPreferredCanvasFormat();

    const context = canvas.getContext('webgpu');
    if (!context) throw new Error('WebGPU コンテキストの取得に失敗しました');
    this.context = context;

    context.configure({ device, format: this.format, alphaMode: 'opaque' });

    this.instanceData    = new Float32Array(new ArrayBuffer(MAX_INSTANCES * INSTANCE_FLOATS * 4));
    this.inkCloudData    = new Float32Array(new ArrayBuffer(INK_CLOUD_MAX_INSTANCES * INSTANCE_FLOATS * 4));

    this._createBuffers();
    this._createPipelines();
    this._createBindGroups();
  }

  // バッファを生成する
  private _createBuffers(): void {
    const { device } = this;

    // スプライト用ユニフォームバッファ（screen_size: vec2f）
    this.uniformBuffer = device.createBuffer({
      size: 16, // vec2f(8 bytes) + パディング
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // CRT 用ユニフォームバッファ（8 floats = 32 bytes）
    this.crtUniformBuffer = device.createBuffer({
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // スプライトインスタンスバッファ
    this.instanceBuffer = device.createBuffer({
      size: MAX_INSTANCES * INSTANCE_STRIDE,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    // スミ雲インスタンスバッファ
    this.inkCloudBuffer = device.createBuffer({
      size: INK_CLOUD_MAX_INSTANCES * INSTANCE_STRIDE,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
  }

  // レンダリングパイプラインを生成する
  private _createPipelines(): void {
    const { device, format } = this;

    const spriteModule   = device.createShaderModule({ code: SPRITE_SHADER });
    const crtModule      = device.createShaderModule({ code: CRT_SHADER });
    const inkCloudModule = device.createShaderModule({ code: INK_CLOUD_SHADER });

    // スプライトパイプライン（通常アルファ合成）
    this.spritePipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: spriteModule,
        entryPoint: 'vs_main',
        buffers: [
          {
            arrayStride: INSTANCE_STRIDE,
            stepMode: 'instance',
            attributes: [
              { shaderLocation: 0, offset: 0,  format: 'float32x2' }, // world_pos
              { shaderLocation: 1, offset: 8,  format: 'float32x2' }, // halfSize, alpha
              { shaderLocation: 2, offset: 16, format: 'float32x3' }, // color
            ],
          },
        ],
      },
      fragment: {
        module: spriteModule,
        entryPoint: 'fs_main',
        targets: [
          {
            format,
            blend: {
              // 通常アルファ合成：Canvas2D と同じ見た目になる
              color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
              alpha: { srcFactor: 'one',       dstFactor: 'zero',                operation: 'add' },
            },
          },
        ],
      },
      primitive: { topology: 'triangle-list' },
    });

    // スミ雲パイプライン（円形 SDF で丸く描画）
    this.inkCloudPipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: inkCloudModule,
        entryPoint: 'vs_main',
        buffers: [
          {
            arrayStride: INSTANCE_STRIDE,
            stepMode: 'instance',
            attributes: [
              { shaderLocation: 0, offset: 0,  format: 'float32x2' }, // center
              { shaderLocation: 1, offset: 8,  format: 'float32x2' }, // radius, alpha
              { shaderLocation: 2, offset: 16, format: 'float32x3' }, // color
            ],
          },
        ],
      },
      fragment: {
        module: inkCloudModule,
        entryPoint: 'fs_main',
        targets: [
          {
            format,
            blend: {
              color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
              alpha: { srcFactor: 'one',       dstFactor: 'zero',                operation: 'add' },
            },
          },
        ],
      },
      primitive: { topology: 'triangle-list' },
    });

    // CRT オーバーレイパイプライン（通常アルファ合成）
    this.crtPipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: { module: crtModule, entryPoint: 'vs_main' },
      fragment: {
        module: crtModule,
        entryPoint: 'fs_main',
        targets: [
          {
            format,
            blend: {
              color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
              alpha: { srcFactor: 'one',       dstFactor: 'zero',                operation: 'add' },
            },
          },
        ],
      },
      primitive: { topology: 'triangle-list' },
    });
  }

  // バインドグループを生成する
  private _createBindGroups(): void {
    const { device } = this;

    this.spriteBindGroup = device.createBindGroup({
      layout: this.spritePipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: this.uniformBuffer } }],
    });

    this.crtBindGroup = device.createBindGroup({
      layout: this.crtPipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: this.crtUniformBuffer } }],
    });

    // スミ雲はスプライトと同じ uniformBuffer（screen_size）を共有
    this.inkCloudBindGroup = device.createBindGroup({
      layout: this.inkCloudPipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: this.uniformBuffer } }],
    });
  }

  resize(width: number, height: number): void {
    // スクリーンサイズをスプライトシェーダーに送る
    this.device.queue.writeBuffer(
      this.uniformBuffer, 0,
      new Float32Array([width, height, 0, 0]),
    );

    // CRT パラメータをシェーダーに送る
    this.device.queue.writeBuffer(
      this.crtUniformBuffer, 0,
      new Float32Array([
        width, height,
        CRT_SCANLINE_INTERVAL,
        CRT_SCANLINE_OPACITY,
        CRT_VIGNETTE_INNER_RADIUS,
        CRT_VIGNETTE_OUTER_RADIUS,
        CRT_VIGNETTE_OPACITY,
        0, // _pad
      ]),
    );
  }

  render(boids: Boid[], predator: Predator): void {
    let instanceCount = 0;

    // 各 Boid のスプライトピクセルをインスタンスデータに追加する
    const addSprite = (
      cx: number,
      cy: number,
      angle: number,
      pixels: PixelOffset[],
      halfSize: number,
      r: number,
      g: number,
      b: number,
      alpha = 1.0,
    ): void => {
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      for (const { ox, oy } of pixels) {
        if (instanceCount + 1 > MAX_INSTANCES) {
          console.warn(`インスタンス数が上限(${MAX_INSTANCES})に達しました。描画をスキップします`);
          return;
        }

        // ローカル座標を回転してワールド座標へ変換
        const wx = cx + cosA * ox - sinA * oy;
        const wy = cy + sinA * ox + cosA * oy;

        const ci = instanceCount * INSTANCE_FLOATS;
        this.instanceData[ci]     = wx;
        this.instanceData[ci + 1] = wy;
        this.instanceData[ci + 2] = halfSize;
        this.instanceData[ci + 3] = alpha;
        this.instanceData[ci + 4] = r;
        this.instanceData[ci + 5] = g;
        this.instanceData[ci + 6] = b;
        instanceCount++;
      }
    };

    const now = performance.now();

    // スミ雲インスタンスデータを構築（専用パイプラインで円形描画するため別バッファに格納）
    let inkCloudCount = 0;
    const [icR, icG, icB] = INK_CLOUD_RGB;
    for (const boid of boids) {
      if (boid.species !== BoidSpecies.Octopus) continue;
      const age = now - boid.lastInkedAt;
      if (age < 0 || age > OCTOPUS_INK_CLOUD_DURATION_MS) continue;
      if (inkCloudCount >= INK_CLOUD_MAX_INSTANCES) break;

      const { radius, alpha } = computeInkCloudState(age);

      const ci = inkCloudCount * INSTANCE_FLOATS;
      this.inkCloudData[ci]     = boid.lastInkX;
      this.inkCloudData[ci + 1] = boid.lastInkY;
      this.inkCloudData[ci + 2] = radius;
      this.inkCloudData[ci + 3] = alpha;
      this.inkCloudData[ci + 4] = icR;
      this.inkCloudData[ci + 5] = icG;
      this.inkCloudData[ci + 6] = icB;
      inkCloudCount++;
    }

    // Boid を描画
    for (const boid of boids) {
      const pixels  = SPECIES_PIXEL_OFFSETS[boid.species];
      const halfSize = SPECIES_PIXEL_SIZES[boid.species] / 2;
      const [r, g, b] = hexToRgb(SPECIES_COLORS[boid.species]);
      const angle = Math.atan2(boid.vy, boid.vx) + Math.PI / 2;
      addSprite(boid.x, boid.y, angle, pixels, halfSize, r, g, b);
    }

    // 捕食者を描画
    {
      const halfSize = PREDATOR_PIXEL_SIZE / 2;
      const [r, g, b] = hexToRgb(PREDATOR_COLOR);
      // しびれ中は vx/vy がゼロになるため angle ゲッターで保持した角度を使用
      const angle = predator.angle + Math.PI / 2;
      addSprite(predator.x, predator.y, angle, SHARK_PIXEL_OFFSETS, halfSize, r, g, b);
    }

    // しびれ中は黄色ドットエフェクトを描画（混乱より優先）
    if (predator.isStunned) {
      const [dr, dg, db] = STUN_DOT_RGB;
      const blink = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(now * 0.01));
      for (let i = 0; i < PREDATOR_STUN_DOT_COUNT; i++) {
        const angle = now * 0.003 + (i * Math.PI * 2) / PREDATOR_STUN_DOT_COUNT;
        const orbit = PREDATOR_STUN_DOT_ORBIT + PREDATOR_STUN_ORBIT_WOBBLE * Math.sin(now * 0.008 + i);
        const dotX  = predator.x + Math.cos(angle) * orbit;
        const dotY  = predator.y + Math.sin(angle) * orbit;
        addSprite(dotX, dotY, 0, STUN_DOT_PIXEL_OFFSETS, PREDATOR_STUN_DOT_RADIUS, dr, dg, db, blink);
      }
    } else if (predator.isConfused) {
      // 混乱中は白いドットが反時計回りに回転
      const [dr, dg, db] = CONFUSION_DOT_RGB;
      const blink = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(now * 0.008));
      for (let i = 0; i < PREDATOR_CONFUSION_DOT_COUNT; i++) {
        const angle = -now * 0.002 + (i * Math.PI * 2) / PREDATOR_CONFUSION_DOT_COUNT;
        const dotX  = predator.x + Math.cos(angle) * PREDATOR_CONFUSION_DOT_ORBIT;
        const dotY  = predator.y + Math.sin(angle) * PREDATOR_CONFUSION_DOT_ORBIT;
        addSprite(dotX, dotY, 0, STUN_DOT_PIXEL_OFFSETS, PREDATOR_CONFUSION_DOT_RADIUS, dr, dg, db, blink);
      }
    }

    const { device } = this;

    // インスタンスデータを GPU にアップロード
    if (instanceCount > 0) {
      device.queue.writeBuffer(
        this.instanceBuffer, 0,
        this.instanceData, 0, instanceCount * INSTANCE_FLOATS,
      );
    }

    // レンダーパスを実行
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });

    // スミ雲を先に描画（スプライトの背面レイヤー）
    if (inkCloudCount > 0) {
      device.queue.writeBuffer(this.inkCloudBuffer, 0, this.inkCloudData, 0, inkCloudCount * INSTANCE_FLOATS);
      pass.setPipeline(this.inkCloudPipeline);
      pass.setBindGroup(0, this.inkCloudBindGroup);
      pass.setVertexBuffer(0, this.inkCloudBuffer);
      pass.draw(6, inkCloudCount);
    }

    // スプライトを一括描画
    if (instanceCount > 0) {
      pass.setPipeline(this.spritePipeline);
      pass.setBindGroup(0, this.spriteBindGroup);
      pass.setVertexBuffer(0, this.instanceBuffer);
      pass.draw(6, instanceCount);
    }

    // CRT オーバーレイを重ねる
    pass.setPipeline(this.crtPipeline);
    pass.setBindGroup(0, this.crtBindGroup);
    pass.draw(3);

    pass.end();
    device.queue.submit([encoder.finish()]);
  }

  destroy(): void {
    this.uniformBuffer.destroy();
    this.crtUniformBuffer.destroy();
    this.instanceBuffer.destroy();
    this.inkCloudBuffer.destroy();
    this.device.destroy();
  }
}

// ────── ユーティリティ ────────────────────────────────────────────────────

// "#rrggbb" 形式のカラーコードを [r, g, b] (0..1) に変換する
function hexToRgb(hex: `#${string}`): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}
