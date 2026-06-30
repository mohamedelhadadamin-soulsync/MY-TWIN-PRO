import torch
from diffusers import StableDiffusionXLPipeline, EulerAncestralDiscreteScheduler
from PIL import Image, ImageDraw, ImageFilter
import os
import numpy as np

# ========== الإعدادات ==========
MODEL_ID = "stabilityai/stable-diffusion-xl-base-1.0"
OUTPUT_DIR = "assets"
LOGO_PATH = os.path.join(OUTPUT_DIR, "logo.png")
DEVICE = "cpu"  # استخدم "cuda" إذا توفرت GPU

# أبعاد الصور المطلوبة
IMAGE_SPECS = {
    "splash": {"size": (1024, 1024), "prompt": "cosmic nebula scene, deep purple and gold swirls, a luminous digital twin entity emerging from center, surrounded by ethereal rotating rings, tiny glowing particles, ultra detailed, spiritual awakening, digital art, masterpiece"},
    "adaptive-icon": {"size": (1024, 1024), "prompt": "minimalist digital twin icon, golden infinity symbol merged with human silhouette, inside dark cosmic circle, purple rim light, centered, flat vector style, clean background"},
    "notification-icon": {"size": (1024, 1024), "prompt": "simple white silhouette of two overlapping geometric shapes diamond and circle representing twin soul, transparent background, minimalistic, monochrome, high contrast"},
    "favicon": {"size": (1024, 1024), "prompt": "simplified version of digital twin logo, glowing golden twin souls, tiny, high resolution"},
    "bg_cosmic_dark": {"size": (1024, 1024), "prompt": "dark cosmic background, deep space, purple nebula clouds, distant galaxies, soft particles, ethereal, 4k"},
    "bg_cosmic_light": {"size": (1024, 1024), "prompt": "light ethereal cosmic background, soft white and gold tones, gentle purple accents, spiritual energy, heavenly glow, 4k"},
    "nebula_1": {"size": (1024, 1024), "prompt": "isolated purple nebula cloud with stars, transparent background, digital art, soft edges"},
    "nebula_2": {"size": (1024, 1024), "prompt": "golden glowing nebula with subtle sparks, transparent background, ethereal energy"},
    "ring_outer": {"size": (1024, 1024), "prompt": "thin golden glowing circle ring, transparent background, sharp, neon style"},
    "ring_inner": {"size": (1024, 1024), "prompt": "thin purple glowing circle ring, transparent background, sharp"},
    "particle_glow": {"size": (512, 512), "prompt": "single glowing particle, soft lens flare, transparent background, 32x32 style but highres"},
}

# تحميل النموذج
print("⏳ تحميل النموذج...")
pipe = StableDiffusionXLPipeline.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.float32,
    variant="fp16" if DEVICE == "cuda" else None,
    use_safetensors=True,
)
pipe.scheduler = EulerAncestralDiscreteScheduler.from_config(pipe.scheduler.config)
pipe.to(DEVICE)
print("✅ النموذج جاهز")

# دالة وضع الشعار فوق الصورة
def overlay_logo(base_image, logo_path, position="center", size_ratio=0.25):
    try:
        logo = Image.open(logo_path).convert("RGBA")
        bwidth, bheight = base_image.size
        logo_size = int(bwidth * size_ratio)
        logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)

        # إنشاء طبقة للدمج
        layer = Image.new("RGBA", base_image.size, (0,0,0,0))
        if position == "center":
            x = (bwidth - logo_size) // 2
            y = (bheight - logo_size) // 2
        else:  # bottom-right
            x = bwidth - logo_size - 20
            y = bheight - logo_size - 20
        layer.paste(logo, (x, y), logo)
        return Image.alpha_composite(base_image.convert("RGBA"), layer)
    except FileNotFoundError:
        print("⚠️  logo.png غير موجود، سيتم تخطي الدمج")
        return base_image

# توليد الصور
for name, spec in IMAGE_SPECS.items():
    print(f"🎨 توليد {name}...")
    image = pipe(
        prompt=spec["prompt"],
        negative_prompt="text, watermark, signature, low quality, blurry",
        width=spec["size"][0],
        height=spec["size"][1],
        guidance_scale=7.5,
        num_inference_steps=25,
    ).images[0]

    # دمج الشعار في جميع الصور ما عدا الأيقونة الصغيرة
    if name not in ["notification-icon", "favicon", "particle_glow"]:
        image = overlay_logo(image, LOGO_PATH, "bottom-right", size_ratio=0.15)

    # حفظ
    out_path = os.path.join(OUTPUT_DIR, f"{name}_ai.png")
    image.save(out_path)
    print(f"✅ محفوظ: {out_path}")

print("🎉 تم إنشاء جميع الصور الاحترافية بنجاح!")
