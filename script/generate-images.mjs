import { fal } from "@fal-ai/client";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, "../attached_assets");

fal.config({ credentials: "e857faf7-03d6-432f-963f-c277a1cdf7d3:4950b5510aba8ddd1db50d7d7be26ac6" });

const images = [
  {
    filename: "result-profhilo-skin_ora.png",
    prompt: "Luxury beauty photography, close-up portrait of a 35-year-old woman with visibly plump, radiant, hydrated skin after Profhilo aesthetic treatment, warm golden studio lighting, soft bokeh background, high-end medical spa aesthetic, skin glowing with restored elasticity, natural makeup, warm neutral tones, professional beauty editorial photography",
  },
  {
    filename: "result-polynucleotide-antiaging_ora.png",
    prompt: "Professional beauty photography, elegant woman 40s showing remarkable skin transformation after polynucleotide therapy, reduced fine lines around eyes and forehead, smooth refined skin texture, warm studio lighting, clean beige background, luxury aesthetics clinic, editorial beauty portrait, natural glow, tasteful and sophisticated",
  },
  {
    filename: "result-dermal-fillers_ora.png",
    prompt: "High-end beauty photography, beautiful woman with naturally enhanced facial features after subtle dermal filler treatment, perfectly balanced facial harmony, soft sculpted cheekbones, defined lips, warm amber studio lighting, professional medical aesthetics photography, elegant and natural result, luxury spa editorial",
  },
  {
    filename: "result-scalp-health_ora.png",
    prompt: "Professional spa photography, woman receiving luxurious Korean head spa scalp treatment, practitioner applying therapeutic serum to healthy shiny scalp, close-up of thick lustrous hair, warm amber spa lighting, serene wellness atmosphere, premium beauty salon setting, calming and elegant, professional editorial photography",
  },
  {
    filename: "result-hair-growth_ora.png",
    prompt: "Professional beauty photography, close-up of dramatically improved hair density and thickness after Korean head spa ritual, thick flowing healthy hair, visible scalp health improvement, warm studio lighting, luxury hair salon, clean background, editorial hair photography, rich warm tones",
  },
  {
    filename: "result-balayage-hair_ora.png",
    prompt: "Luxury hair salon photography, beautiful seamless balayage hair colour result on a woman, perfectly blended warm bronze and caramel tones, zero brassiness, silky glossy finish, professional colour melt technique, warm studio lighting, high-end hair salon editorial, elegant and sophisticated",
  },
  {
    filename: "result-laser-removal_ora.png",
    prompt: "Professional medical spa photography, smooth flawless skin after laser hair removal treatment, close-up of perfectly smooth skin on arms or legs, clean clinical yet luxurious setting, soft warm lighting, before and after aesthetic result, high-end beauty clinic photography",
  },
  {
    filename: "result-anti-aging_ora.png",
    prompt: "Elegant beauty photography, sophisticated woman in her 40s with remarkably youthful rejuvenated skin, anti-aging treatment results, tighter lifted skin, reduced wrinkles, warm golden hour studio lighting, luxury wellness clinic, editorial beauty portrait, refined and tasteful, warm neutral palette",
  },
  {
    filename: "result-hair-density_ora.png",
    prompt: "Professional beauty photography, close-up of beautifully dense shiny hair after Korean scalp spa monthly membership, rich voluminous healthy hair, visible shine and depth, warm amber lighting, luxury hair spa setting, editorial photography, clean background",
  },
];

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    protocol.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location, filepath).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        writeFileSync(filepath, Buffer.concat(chunks));
        resolve();
      });
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function generateImage(item, index) {
  console.log(`[${index + 1}/${images.length}] Generating: ${item.filename}`);
  try {
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: item.prompt,
        image_size: "portrait_4_3",
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      },
    });

    const imageUrl = result.data?.images?.[0]?.url;
    if (!imageUrl) throw new Error("No image URL in response");

    const filepath = join(ASSETS_DIR, item.filename);
    await downloadImage(imageUrl, filepath);
    console.log(`  ✓ Saved: ${item.filename}`);
    return { filename: item.filename, success: true };
  } catch (err) {
    console.error(`  ✗ Failed: ${item.filename} — ${err.message}`);
    return { filename: item.filename, success: false, error: err.message };
  }
}

async function main() {
  console.log("Starting image generation for Ora Suites results...\n");

  // Run in batches of 3 to avoid rate limits
  const results = [];
  for (let i = 0; i < images.length; i += 3) {
    const batch = images.slice(i, i + 3);
    const batchResults = await Promise.all(batch.map((img, j) => generateImage(img, i + j)));
    results.push(...batchResults);
    if (i + 3 < images.length) {
      console.log("  Waiting 2s between batches...");
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log("\n=== Results ===");
  results.forEach(r => console.log(`${r.success ? "✓" : "✗"} ${r.filename}`));
  console.log(`\nDone: ${results.filter(r => r.success).length}/${results.length} generated`);
}

main().catch(console.error);
