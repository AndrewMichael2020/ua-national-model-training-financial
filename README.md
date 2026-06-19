# Ukrainian National LLM Training Simulator

**Live demo → [andrewmichael2020.github.io/ua-national-model-training-financial](https://andrewmichael2020.github.io/ua-national-model-training-financial/)**

An interactive cost and compute sandbox for planning large-language-model training runs at Ukrainian national-model scale, based on the **Gemma 4 31B Dense** architecture and the **Diia AI Factory / Syaivo** infrastructure assumptions.

---

## What it does

Drag the sliders, pick a cloud provider and GPU type, and the simulator instantly recalculates:

| Output | What it means |
|---|---|
| **Total Tokens** | Dataset GB × 250 M tokens/GB × epochs |
| **Compute Time** | Derived from hardware TFLOPS × MFU efficiency × cluster size |
| **Est. Cloud Cost** | GPU/node-hours × public or inferred hourly price |

A live **Insights panel** surfaces availability warnings, pricing basis notes, spot-viability flags, and scale-extrapolation alerts as you change settings.

---

## Training modes

| Mode | Weights | FLOPs/token | Typical use |
|---|---|---|---|
| **LoRA Fine-Tuning** | Frozen (adapter only) | 4 × 31 B = 124 B | Style / format adaptation |
| **Continuous Pre-training** | All unfrozen | 6 × 31 B = 186 B | New language integration |

---

## Supported providers & hardware

### Google Cloud (Hypercomputer)
| SKU | GPUs/node | TFLOPS | $/GPU-hr |
|---|---|---|---|
| H100 (A3 High) | 8 | 989.5 | $11.06 (on-demand) |
| H200 (A3 Ultra) | 8 | 989.5 | $7.42 (DWS Calendar) |
| B200 (A4) | 8 | 2 250 | $11.28 (DWS Calendar) |
| GB200 (A4X) | 4 | 2 500 | ~$10.50 (proxy) |
| GB300 (A4X Max) | 4 | 2 500 | Custom quote only |

### Hugging Face (Jobs / Training Clusters)
| SKU | GPUs/node | TFLOPS | $/GPU-hr |
|---|---|---|---|
| A100 (Jobs) | 8 | 312 | $2.50 |
| H200 (Jobs) | 8 | 989.5 | $5.00 |
| Custom Cluster | 8 | 989.5 | ~$8.25 (waitlist) |

### DeepInfra (Instances / DeepCluster)
| SKU | GPUs/node | TFLOPS | $/GPU-hr |
|---|---|---|---|
| B200 GPU Instance | 8 | 2 250 | $2.79 |
| H100 Dedicated | 8 | 989.5 | $1.79 (sales req.) |
| B300 Dedicated | 8 | 2 500 | $2.99 (3–5 yr term, 256+ GPUs) |

---

## Key model constants

```
Model parameters : 31,000,000,000  (31B Dense)
Tokens per GB    : 250,000,000
LoRA epochs      : 3
Pre-train epochs : 1
FLOPs/token (LoRA)     : 4 × params
FLOPs/token (Pre-train): 6 × params
```

---

## Run locally

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build → docs/
```

Requires Node 18+.

---

## How the cost formula works

```
GPU-hours = (tokens × FLOPs/token) / (TFLOPS × 1e12 × MFU × GPUs) / 3600
Cost      = GPU-hours × price/GPU-hr   (LoRA)
          = node-hours × price/node-hr (Pre-training)
```

Prices marked `*` are inferred from public pricing signals and still require a direct vendor quote for confirmed capacity.

---

## Project structure

```
llm_training_cost_simulator.tsx   # single-file React component (source of truth)
src/
  main.jsx                        # Vite entry point
  App.jsx                         # wraps the simulator component
  index.css                       # Tailwind directives
docs/                             # production build served by GitHub Pages
index.html                        # Vite HTML template
vite.config.js
tailwind.config.js
```

---

## Context

This tool was built to support financial and infrastructure planning for the **Ukrainian National LLM** initiative — a sovereign AI project grounded in the Ministry of Digital Transformation's Diia AI Factory programme. Compute cost modelling helps policymakers and engineers understand the real resource envelope before committing to hardware reservations or cloud contracts.
