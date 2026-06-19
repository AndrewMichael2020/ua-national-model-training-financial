import React, { useState, useEffect } from 'react';

const HW_PROFILES = {
  gcp: {
    h100: {
      id: 'h100',
      name: 'H100 (A3 High)',
      gpusPerNode: 8,
      tflops: 989.5,
      price: 11.06,
      flexStart: 4.79,
      calendar: 5.20,
      spot: null,
      type: 'PUBLIC_PRICE',
      priceNote: 'Approx. public on-demand. DWS calendar/flex-start are cheaper but capacity scheduled.'
    },
    h200: {
      id: 'h200',
      name: 'H200 (A3 Ultra)',
      gpusPerNode: 8,
      tflops: 989.5,
      price: 7.42,
      flexStart: 5.30,
      calendar: 7.42,
      spot: null,
      type: 'PUBLIC_DWS_PRICE',
      priceNote: 'Using GCP DWS Calendar price. Flex-start is cheaper but less schedulable.'
    },
    b200: {
      id: 'b200',
      name: 'B200 (A4)',
      gpusPerNode: 8,
      tflops: 2250,
      price: 11.28,
      flexStart: 8.06,
      calendar: 11.28,
      spot: null,
      type: 'PUBLIC_DWS_PRICE',
      priceNote: 'Using GCP DWS Calendar price. Flex-start is cheaper but less schedulable.'
    },
    gb200: {
      id: 'gb200',
      name: 'GB200 (A4X)',
      gpusPerNode: 4,
      tflops: 2500,
      price: 10.50,
      spot: null,
      type: 'INFERRED_REQUIRES_QUOTE',
      priceNote: 'External GB200 NVL72 market proxy from CoreWeave. Google A4X still requires quote/reservation.'
    },
    gb300: {
      id: 'gb300',
      name: 'GB300 (A4X Max)',
      gpusPerNode: 4,
      tflops: 2500,
      price: null,
      spot: null,
      type: 'CUSTOM_QUOTE_ONLY',
      priceNote: 'No reliable public hourly price. Rack-cost estimates are too uncertain for calculator use.'
    }
  },
  hf: {
    a100: {
      id: 'a100',
      name: 'A100 (Jobs)',
      gpusPerNode: 8,
      tflops: 312,
      price: 2.50,
      spot: null,
      type: 'PUBLIC_PRICE',
      priceNote: 'HF Jobs public price.'
    },
    h200: {
      id: 'h200',
      name: 'H200 (Jobs)',
      gpusPerNode: 8,
      tflops: 989.5,
      price: 5.00,
      spot: null,
      type: 'PUBLIC_PRICE',
      priceNote: 'HF Jobs public price.'
    },
    custom: {
      id: 'custom',
      name: 'Custom Cluster',
      gpusPerNode: 8,
      tflops: 989.5,
      price: 8.25,
      priceLow: 5.00,
      priceHigh: 8.25,
      spot: null,
      type: 'INFERRED_REQUIRES_QUOTE',
      priceNote: 'HF custom cluster estimate. Low anchor = H200 Jobs; high anchor = historical HF DGX Cloud H100 training.'
    }
  },
  deepinfra: {
    b200: {
      id: 'b200',
      name: 'B200 (GPU Inst.)',
      gpusPerNode: 8,
      tflops: 2250,
      price: 2.79,
      spot: null,
      type: 'PUBLIC_PRICE',
      priceNote: 'DeepInfra public B200 GPU Instance price.'
    },
    h100_ded: {
      id: 'h100_ded',
      name: 'H100 Dedicated',
      gpusPerNode: 8,
      tflops: 989.5,
      price: 1.79,
      spot: null,
      type: 'INFERRED_REQUIRES_QUOTE',
      priceNote: 'DeepInfra public dedicated H100 GPU-hour signal; large training cluster still requires sales confirmation.'
    },
    b300_ded: {
      id: 'b300_ded',
      name: 'B300 Dedicated',
      gpusPerNode: 8,
      tflops: 2500,
      price: 2.99,
      fiveYearPrice: 1.98,
      spot: null,
      type: 'INFERRED_REQUIRES_QUOTE',
      minGPUs: 256,
      priceNote: 'DeepInfra DeepCluster 3-year B300 price. Requires 256–5,000 GPU dedicated cluster and 3–5 year term.'
    }
  }
};

const AVAILABILITY = {
  gcp: {
    h100: { status: 'PUBLIC_CAPACITY_CONTROLLED', title: 'Documented training hardware', note: 'A3 H100 is documented for training workloads, but large node counts still depend on quota, region, reservation, and capacity.' },
    h200: { status: 'PUBLIC_CAPACITY_CONTROLLED', title: 'GA, capacity-controlled', note: 'A3 Ultra H200 is documented for foundation-model training. Provisioning requires reservation, Spot, Flex-start, or MIG resize request.' },
    b200: { status: 'PUBLIC_CAPACITY_CONTROLLED', title: 'Documented Blackwell training hardware', note: 'A4 B200 is documented for foundation-model training. Treat large clusters as capacity-controlled, not instant self-serve.' },
    gb200: { status: 'CUSTOM_WAITLIST_OR_SALES', title: 'Reserved enterprise capacity', note: 'A4X GB200 is documented and requires reserved capacity. For real projects, pricing and availability go through Google capacity planning.' },
    gb300: { status: 'CUSTOM_WAITLIST_OR_SALES', title: 'Bare-metal reserved capacity', note: 'A4X Max GB300 is documented as bare metal and requires reserved capacity. Treat it as enterprise/custom, not normal hourly GPU rental.' }
  },
  hf: {
    a100: { status: 'PUBLIC_SELF_SERVE', title: 'Public Jobs SKU', note: 'HF Jobs has public A100 pricing up to 8 GPUs. Good for experiments and fine-tuning; many-node pretraining is not proven by the Jobs table.' },
    h200: { status: 'PUBLIC_SELF_SERVE', title: 'Public Jobs SKU', note: 'HF Jobs has public H200 pricing up to 8 GPUs. Larger H200 clusters belong in the Training Cluster waitlist/custom path.' },
    h100: { status: 'CUSTOM_WAITLIST_OR_SALES', title: 'Training Cluster only', note: 'HF Training Cluster exposes H100 through a waitlist/custom request flow. Do not model it as public Jobs pricing.' },
    b200: { status: 'NO_PUBLIC_EVIDENCE', title: 'No public HF training SKU found', note: 'I found no current public HF Jobs or Training Cluster selector for B200 training.' },
    gb200: { status: 'CUSTOM_WAITLIST_OR_SALES', title: 'Possible through DGX Cloud ecosystem, not self-serve', note: 'HF/NVIDIA announcements mention GB200 via DGX Cloud Lepton ecosystem, but the current HF Training Cluster selector exposes H100/H200. Treat GB200 as custom only.' },
    gb300: { status: 'NO_PUBLIC_EVIDENCE', title: 'No public HF GB300 training product found', note: 'Do not show GB300 as available on Hugging Face unless manually marked as custom quote.' },
    custom: { status: 'CUSTOM_WAITLIST_OR_SALES', title: 'Custom Training Cluster', note: 'HF Training Cluster is a waitlist/custom sourcing flow. Capacity, provider, region, duration, and price are negotiated.' }
  },
  deepinfra: {
    b200: { status: 'PUBLIC_SELF_SERVE', title: 'Public B200 GPU Instances', note: 'DeepInfra publicly documents dedicated B200 GPU Instances for training, fine-tuning, and custom workloads. Large multi-node availability is still not guaranteed.' },
    h100_ded: { status: 'CUSTOM_WAITLIST_OR_SALES', title: 'Dedicated deployment, custom training capacity', note: 'DeepInfra mentions dedicated H100 deployments, but public docs do not prove large self-serve H100 training clusters.' },
    h200_ded: { status: 'CUSTOM_WAITLIST_OR_SALES', title: 'Dedicated deployment, custom training capacity', note: 'DeepInfra mentions dedicated H200 deployments, but public docs do not prove large self-serve H200 training clusters.' },
    b200_ded: { status: 'CUSTOM_WAITLIST_OR_SALES', title: 'B200 cluster by sales/custom capacity', note: 'DeepInfra docs mention B200 clusters with SSH, but not public 512-node B200 availability.' },
    b300_ded: { status: 'CUSTOM_WAITLIST_OR_SALES', title: 'Public DeepCluster offer, long-term dedicated', note: 'DeepInfra DeepCluster is B300, 256–5,000 GPUs, 3–5 year terms. This is dedicated infrastructure, not self-serve hourly cloud.' },
    gb200: { status: 'NO_PUBLIC_EVIDENCE', title: 'No public DeepInfra GB200 product found', note: 'Do not mark GB200 available for DeepInfra based on current public docs.' },
    gb300: { status: 'NO_PUBLIC_EVIDENCE', title: 'No public DeepInfra GB300 product found', note: 'DeepInfra documents B300, not GB300. These are different architectures/products.' }
  }
};

export default function App() {
  const [mode, setMode] = useState('pretrain'); // 'lora' or 'pretrain'
  const [provider, setProvider] = useState('gcp'); // 'gcp', 'hf', 'deepinfra'
  const [hardware, setHardware] = useState('h100'); 
  const [useSpot, setUseSpot] = useState(false);
  
  // State for LoRA
  const [loraDataGB, setLoraDataGB] = useState(1);
  const [loraGPUs, setLoraGPUs] = useState(1);
  const [loraEfficiency, setLoraEfficiency] = useState(95);
  
  // State for Pre-training (Defaults set to Syaivo national model scale)
  const [pretrainDataGB, setPretrainDataGB] = useState(30000); 
  const [pretrainNodes, setPretrainNodes] = useState(32); 
  const [pretrainEfficiency, setPretrainEfficiency] = useState(65);

  // Auto-switch default hardware when provider changes
  useEffect(() => {
    setUseSpot(false); // Reset Spot state on provider switch
    if (provider === 'gcp') setHardware('h100');
    if (provider === 'hf') setHardware('a100');
    if (provider === 'deepinfra') setHardware('b200');
  }, [provider]);

  // Spot state leak fix: Ensure Spot is always false when switching to pretrain
  useEffect(() => {
    if (mode === 'pretrain') {
      setUseSpot(false);
    }
  }, [mode]);

  const TOKENS_PER_GB = 250_000_000;
  const MODEL_PARAMETERS = 31_000_000_000; // 31B Dense Model
  
  // Floating Point Operations per Token
  const FLOPS_PER_TOKEN_PRETRAIN = 6 * MODEL_PARAMETERS; 
  const FLOPS_PER_TOKEN_LORA = 4 * MODEL_PARAMETERS; // Realistic frozen pass estimation

  const currentDataGB = mode === 'lora' ? loraDataGB : pretrainDataGB;
  const currentCompute = mode === 'lora' ? loraGPUs : pretrainNodes;
  const currentEfficiency = mode === 'lora' ? loraEfficiency : pretrainEfficiency;
  
  const epochs = mode === 'lora' ? 3 : 1;
  const totalTokens = currentDataGB * TOKENS_PER_GB;
  const tokensProcessed = totalTokens * epochs;
  
  const hwProfile = HW_PROFILES[provider][hardware] || HW_PROFILES.gcp.h100;

  // Calculate Base Hardware Throughput (TFLOPS to FLOPS)
  const baseFlopsPerSec = mode === 'lora' 
    ? (hwProfile.tflops * 1_000_000_000_000)
    : (hwProfile.tflops * 1_000_000_000_000) * hwProfile.gpusPerNode;

  const flopsPerToken = mode === 'lora' ? FLOPS_PER_TOKEN_LORA : FLOPS_PER_TOKEN_PRETRAIN;
  const theoreticalTokensPerSecPerUnit = baseFlopsPerSec / flopsPerToken;
  const actualTokensPerSecPerUnit = theoreticalTokensPerSecPerUnit * (currentEfficiency / 100);
  const clusterTotalTokensPerSec = actualTokensPerSecPerUnit * currentCompute;
  
  const totalSeconds = tokensProcessed / clusterTotalTokensPerSec;
  const totalHours = totalSeconds / 3600;

  const spotEligible = provider === 'gcp' && mode === 'lora' && hwProfile.spot !== null;
  const activePricePerGPU = spotEligible && useSpot ? hwProfile.spot : hwProfile.price;
  const activePricePerNode = activePricePerGPU !== null ? activePricePerGPU * hwProfile.gpusPerNode : null;

  let estimatedCost = null;
  if (activePricePerGPU !== null) {
    estimatedCost = mode === 'lora'
      ? totalHours * currentCompute * activePricePerGPU
      : totalHours * currentCompute * activePricePerNode;
  }

  const isQuoteEstimate = hwProfile.type === 'INFERRED_REQUIRES_QUOTE';
  const isCustomOnly = hwProfile.type === 'CUSTOM_QUOTE_ONLY';

  const formatNumber = (num) => {
    if (num >= 1_000_000_000_000) return (num / 1_000_000_000_000).toFixed(2) + ' Trillion';
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + ' Billion';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + ' Million';
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const formatCostDisplay = (num) => {
    if (num === null) return 'Custom Quote';
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  
    return isQuoteEstimate ? `${formatted}*` : formatted;
  };

  // Generate dynamic insights based on current sliders
  const generateInsights = () => {
    const insights = [];
    
    // Core Physics
    if (mode === 'lora') {
      insights.push({ icon: '🧠', text: `Frozen Base Weights: Only training a tiny adapter network, but computing gradients still requires passing through the frozen model (~4x FLOPs per token).` });
    } else {
      insights.push({ icon: '🔥', text: 'Unfrozen Weights: All 31B parameters of the Dense model are being updated. Every token requires ~186 Billion operations.' });
      if (currentDataGB >= 25000 && currentCompute >= 24 && currentCompute <= 64) {
        insights.push({ icon: '🇺🇦', text: 'Syaivo Scale: Training on dozens of terabytes across ~32 nodes mirrors the Diia AI Factory setup. Local data sovereignty requires extended runtimes.' });
      }
    }

    // Provider & Availability Alerts
    if (provider === 'gcp') {
      if (mode === 'lora') {
        if (useSpot) {
          insights.push({ icon: '✅', text: `Spot Viability: LoRA checkpoints are fast enough to absorb high preemption rates, making it operationally viable to use Spot instances.` });
        }
      } else {
        insights.push({ icon: '🚨', text: `Spot is a no-go: A single preempted node can interrupt a conventional synchronized training run unless the stack supports elastic recovery and checkpoint restart.` });
      }
    }

    if (provider === 'hf') {
      if (hwProfile.id === 'custom') {
        insights.push({ icon: '🤗', text: `Capacity: Hugging Face Training Clusters for large-scale pretraining require custom quotes and waitlist negotiations. Do not assume on-demand capacity.` });
      } else {
        insights.push({ icon: '🤗', text: `Platform Architecture: Hugging Face Jobs provides solid public pricing for ${hwProfile.name}, excellent for managed training jobs and fine-tuning.` });
      }
    }

    if (provider === 'deepinfra') {
      if (hwProfile.id === 'b200') {
        insights.push({ icon: '⚡', text: `Self-Serve: DeepInfra's B200 GPU Instances are ideal for highly cost-effective fine-tuning and training experiments without enterprise overhead.` });
      } else {
        insights.push({ icon: '🚧', text: `Availability: Large Dedicated ${hwProfile.name} clusters require contacting sales.` });
      }
    }

    // --- PRICING ASSUMPTIONS & NOTES ---
    const pricingBasisLabel = {
      PUBLIC_PRICE: 'public on-demand pricing',
      PUBLIC_DWS_PRICE: 'public DWS Calendar pricing',
      INFERRED_REQUIRES_QUOTE: 'inferred quote-backed pricing',
      CUSTOM_QUOTE_ONLY: 'custom quote pricing'
    }[hwProfile.type] ?? 'selected pricing';

    if (useSpot && spotEligible) {
      insights.push({
        icon: '🛡️',
        text: `Pricing Assumption: Using Spot/preemptible pricing. This is cheaper but subject to immediate interruption.`
      });
    } else {
      insights.push({
        icon: '🛡️',
        text: `Pricing Assumption: Using ${pricingBasisLabel}. Capacity, quota, and reservation requirements still apply.`
      });
    }

    if (hwProfile.priceNote) {
      const pricingIcon = {
        PUBLIC_PRICE: '💵',
        PUBLIC_DWS_PRICE: '📅',
        INFERRED_REQUIRES_QUOTE: '🧮',
        CUSTOM_QUOTE_ONLY: '🏷️'
      };

      insights.push({
        icon: pricingIcon[hwProfile.type] ?? '💵',
        text: `Pricing basis: ${hwProfile.priceNote}`
      });
    }

    // --- AVAILABILITY TRUTH LABELS ---
    const availability = AVAILABILITY[provider]?.[hardware];
    if (availability) {
      const iconByStatus = {
        PUBLIC_SELF_SERVE: '✅',
        PUBLIC_CAPACITY_CONTROLLED: '🟡',
        CUSTOM_WAITLIST_OR_SALES: '🏛️',
        NO_PUBLIC_EVIDENCE: '⛔'
      };

      insights.push({
        icon: iconByStatus[availability.status] ?? 'ℹ️',
        text: `${availability.title}: ${availability.note}`
      });
    }

    // --- SCALE EXTRAPOLATION WARNINGS ---
    if (mode === 'pretrain') {
      const totalGPUs = currentCompute * hwProfile.gpusPerNode;

      if (provider === 'hf' && hwProfile.type !== 'custom' && currentCompute > 1) {
        insights.push({
          icon: '⚠️',
          text: `Scale extrapolation: HF Jobs pricing is public for up to 8 GPUs per job. ${currentCompute} nodes means ${totalGPUs} GPUs, which should be treated as Training Cluster/custom capacity, not normal Jobs availability.`
        });
      }

      if (provider === 'deepinfra' && hardware === 'b200' && currentCompute > 8) {
        insights.push({
          icon: '⚠️',
          text: `Scale extrapolation: DeepInfra B200 GPU Instances are public, but ${currentCompute} 8-GPU nodes means ${totalGPUs} B200 GPUs. Public docs do not prove this can be allocated as one interconnected training cluster.`
        });
      }

      if (provider === 'deepinfra' && hardware === 'b300_ded' && totalGPUs >= 256) {
        insights.push({
          icon: '🏭',
          text: `DeepCluster scale: ${totalGPUs} B300 GPUs falls into DeepInfra's public 256–5,000 GPU DeepCluster range, but this implies a 3–5 year dedicated infrastructure deal, not hourly rental.`
        });
      }

      if (provider === 'gcp' && currentCompute >= 128) {
        insights.push({
          icon: '🏛️',
          text: `Enterprise scale: ${currentCompute} nodes means ${totalGPUs} GPUs. On Google Cloud this should be treated as quota, reservation, region, and cluster-topology planning, not simple click-to-rent capacity.`
        });
      }
    }

    return insights;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800 flex justify-center items-start">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        <div className="bg-green-700 text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Ukrainian National LLM Training Simulator</h1>
            <p className="text-slate-400 text-sm md:text-base">
              Interactive sandbox based on Gemma 4 (31B Dense).
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          
          {/* Mode Toggle */}
          <div className="flex flex-col space-y-3">
            <label className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Training Objective</label>
            <div className="flex flex-col sm:flex-row bg-slate-100 p-1 rounded-xl w-full">
              <button 
                onClick={() => setMode('lora')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm md:text-base font-medium transition-all duration-200 ${mode === 'lora' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <div className="font-bold">LoRA Fine-Tuning</div>
                <div className="text-xs opacity-75 font-normal mt-0.5">Adjust style/format (Frozen Weights)</div>
              </button>
              <button 
                onClick={() => setMode('pretrain')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm md:text-base font-medium transition-all duration-200 ${mode === 'pretrain' ? 'bg-white text-purple-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <div className="font-bold">Continuous Pre-training</div>
                <div className="text-xs opacity-75 font-normal mt-0.5">Integrate new language (Unfrozen Weights)</div>
              </button>
            </div>
          </div>

          {/* Sliders Container */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div>
              <div className="flex justify-between items-end mb-4">
                <label className="font-semibold text-slate-700">Dataset Scale</label>
                <span className="text-lg font-bold text-slate-900 bg-slate-200 px-3 py-1 rounded-md">
                  {currentDataGB} GB
                </span>
              </div>
              <input 
                type="range" 
                min={0.1} 
                max={mode === 'lora' ? 1000 : 50000} 
                step={0.1}
                value={currentDataGB}
                onChange={(e) => mode === 'lora' ? setLoraDataGB(Number(e.target.value)) : setPretrainDataGB(Number(e.target.value))}
                className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-slate-800"
              />
              <p className="text-xs text-slate-500 mt-2">
                {mode === 'lora' ? '0.1 GB to 1 TB' : '0.1 GB to 50 TB (50,000 GB)'}
              </p>
            </div>

            <div>
              <div className="flex justify-between items-end mb-4">
                <label className="font-semibold text-slate-700">Compute Hardware</label>
                <span className="text-lg font-bold text-slate-900 bg-slate-200 px-3 py-1 rounded-md">
                  {currentCompute} {mode === 'lora' ? 'GPUs' : 'Nodes'}
                </span>
              </div>
              <input 
                type="range" 
                min={1} 
                max={mode === 'lora' ? 16 : 512} 
                step={1}
                value={currentCompute}
                onChange={(e) => mode === 'lora' ? setLoraGPUs(Number(e.target.value)) : setPretrainNodes(Number(e.target.value))}
                className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-slate-800"
              />
              <p className="text-xs text-slate-500 mt-2">
                {mode === 'lora' ? 'Individual GPUs' : `1 Node = ${hwProfile.gpusPerNode}x GPUs`}
              </p>
            </div>

            <div>
              <div className="flex justify-between items-end mb-4">
                <label className="font-semibold text-slate-700">System Efficiency</label>
                <span className={`text-lg font-bold px-3 py-1 rounded-md ${currentEfficiency < 50 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {currentEfficiency}%
                </span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                step="1"
                value={currentEfficiency}
                onChange={(e) => mode === 'lora' ? setLoraEfficiency(Number(e.target.value)) : setPretrainEfficiency(Number(e.target.value))}
                className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-slate-800"
              />
              <p className="text-xs text-slate-500 mt-2">
                MFU + Network Scaling Factor
              </p>
            </div>
          </div>

          {/* Infrastructure Selection */}
          <div className="bg-slate-100 p-5 rounded-xl border border-slate-200 space-y-5">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-slate-800 text-sm">1. Select Provider</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'gcp', name: 'Google Cloud', sub: 'Hypercomputer' },
                  { id: 'hf', name: 'Hugging Face', sub: 'Jobs / Clusters' },
                  { id: 'deepinfra', name: 'DeepInfra', sub: 'Instances / Clusters' }
                ].map(prov => (
                  <label key={prov.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${provider === prov.id ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="provider" className="w-4 h-4 text-blue-600 focus:ring-blue-500 mr-3" checked={provider === prov.id} onChange={() => setProvider(prov.id)} />
                    <div>
                      <div className="font-bold text-sm text-slate-800">{prov.name}</div>
                      <div className="text-xs text-slate-500">{prov.sub}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-slate-800 text-sm">2. Select Hardware Architecture</h4>
                {provider === 'gcp' && mode === 'lora' && hwProfile.spot !== null && (
                  <label className="flex items-center space-x-2 text-xs font-bold bg-green-100 text-green-800 px-3 py-1.5 rounded-lg cursor-pointer border border-green-200 hover:bg-green-200 transition-colors">
                    <input type="checkbox" checked={useSpot} onChange={(e) => setUseSpot(e.target.checked)} className="rounded text-green-600 focus:ring-green-500"/>
                    <span>Enable Spot Pricing</span>
                  </label>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.values(HW_PROFILES[provider]).map(hw => (
                  <button
                    key={hw.id}
                    onClick={() => setHardware(hw.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${hardware === hw.id ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                  >
                    {hw.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-center items-center text-center">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Tokens</span>
              <span className="text-2xl md:text-3xl font-bold text-slate-800">{formatNumber(tokensProcessed)}</span>
              <span className="text-xs text-slate-400 mt-1">across {epochs} {epochs === 1 ? 'epoch' : 'epochs'}</span>
            </div>
            
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-center items-center text-center">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Compute Time</span>
              <span className="text-2xl md:text-3xl font-bold text-slate-800">
                {totalHours < 1 ? '< 1' : totalHours.toLocaleString(undefined, {maximumFractionDigits: 0})} hrs
              </span>
              <span className="text-xs text-slate-400 mt-1">
                {totalHours > 24 ? `(~${(totalHours / 24).toFixed(1)} days)` : 'on selected cluster'}
              </span>
            </div>

            <div className={`border p-5 rounded-xl shadow-sm flex flex-col justify-center items-center text-center transition-colors ${estimatedCost === null ? 'bg-slate-50 border-slate-200' : (mode === 'lora' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200')}`}>
              <span className={`text-sm font-semibold uppercase tracking-wider mb-2 ${estimatedCost === null ? 'text-slate-600' : (mode === 'lora' ? 'text-blue-600' : 'text-purple-600')}`}>Est. Cloud Cost</span>
              <span className={`text-3xl font-bold ${estimatedCost === null ? 'text-slate-800' : (mode === 'lora' ? 'text-blue-700' : 'text-purple-700')}`}>
                {formatCostDisplay(estimatedCost)}
              </span>
              <span className={`text-xs mt-1 px-4 leading-tight ${estimatedCost === null ? 'text-slate-500' : (mode === 'lora' ? 'text-blue-500/80' : 'text-purple-500/80')}`}>
                {estimatedCost === null
                  ? 'Requires direct provider quote'
                  : isQuoteEstimate
                    ? 'Estimated from public pricing signal; still requires custom quote'
                    : 'Compute rental cost only'}
              </span>
            </div>
          </div>

          {/* Insights Panel */}
          <div className="bg-slate-800 text-slate-200 rounded-xl p-5 text-sm leading-relaxed shadow-inner border border-slate-700">
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-xs border-b border-slate-600 pb-2">Live Infra Insights & Availability</h3>
            <div className="space-y-4">
              {generateInsights().map((insight, idx) => (
                <div key={idx} className="flex items-start">
                  <span className="mr-3 text-xl leading-none">{insight.icon}</span>
                  <p className="text-slate-300 leading-snug">{insight.text}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}