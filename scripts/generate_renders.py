import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageOps

def create_phone_frame(screen_path, output_path, glow_color=(56, 189, 248, 140)):
    # Load screen image
    screen = Image.open(screen_path).convert("RGBA")
    sw, sh = screen.size
    
    # Scale down for web if too large (e.g. 1440x3168 -> 720x1584)
    target_w = 640
    scale = target_w / sw
    target_h = int(sh * scale)
    screen = screen.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # Frame dimensions
    bezel = 18
    fw = target_w + bezel * 2
    fh = target_h + bezel * 2
    corner_radius = 52
    
    # Create mask for screen corners
    screen_mask = Image.new("L", (target_w, target_h), 0)
    draw_smask = ImageDraw.Draw(screen_mask)
    draw_smask.rounded_rectangle([0, 0, target_w, target_h], radius=corner_radius - 8, fill=255)
    screen.putalpha(screen_mask)
    
    # Phone body
    pad = 60
    total_w = fw + pad * 2
    total_h = fh + pad * 2
    
    canvas = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    
    # Glow / Drop Shadow
    shadow = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    draw_shadow = ImageDraw.Draw(shadow)
    # Ambient glow
    draw_shadow.rounded_rectangle([pad - 10, pad - 10, pad + fw + 10, pad + fh + 10], radius=corner_radius + 10, fill=glow_color)
    shadow = shadow.filter(ImageFilter.GaussianBlur(35))
    
    # Deep shadow
    drop_shadow = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    draw_ds = ImageDraw.Draw(drop_shadow)
    draw_ds.rounded_rectangle([pad, pad + 15, pad + fw, pad + fh + 35], radius=corner_radius, fill=(0, 0, 0, 180))
    drop_shadow = drop_shadow.filter(ImageFilter.GaussianBlur(25))
    
    canvas = Image.alpha_composite(canvas, shadow)
    canvas = Image.alpha_composite(canvas, drop_shadow)
    
    # Bezel chassis
    chassis = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    draw_ch = ImageDraw.Draw(chassis)
    
    # Outer metal rim
    draw_ch.rounded_rectangle([pad, pad, pad + fw, pad + fh], radius=corner_radius, fill=(28, 33, 48, 255), outline=(90, 105, 140, 220), width=3)
    
    # Inner dark bezel
    draw_ch.rounded_rectangle([pad + 4, pad + 4, pad + fw - 4, pad + fh - 4], radius=corner_radius - 4, fill=(10, 12, 18, 255), outline=(40, 48, 65, 180), width=2)
    
    canvas = Image.alpha_composite(canvas, chassis)
    
    # Paste screen
    canvas.paste(screen, (pad + bezel, pad + bezel), screen)
    
    # Camera punch hole at top center
    punch = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    draw_punch = ImageDraw.Draw(punch)
    cx = total_w // 2
    cy = pad + bezel + 28
    draw_punch.ellipse([cx - 10, cy - 10, cx + 10, cy + 10], fill=(0, 0, 0, 255), outline=(30, 35, 45, 200), width=2)
    # Lens reflection dot
    draw_punch.ellipse([cx - 4, cy - 4, cx - 1, cy - 1], fill=(40, 60, 100, 150))
    
    # Glass glare overlay
    glare = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    draw_glare = ImageDraw.Draw(glare)
    # subtle diagonal light sheen
    draw_glare.polygon([
        (pad + bezel + 40, pad + bezel),
        (pad + bezel + 180, pad + bezel),
        (pad + bezel + 60, pad + bezel + 400),
        (pad + bezel, pad + bezel + 320)
    ], fill=(255, 255, 255, 12))
    
    canvas = Image.alpha_composite(canvas, punch)
    canvas = Image.alpha_composite(canvas, glare)
    
    canvas.save(output_path, "PNG", optimize=True)
    print(f"Generated frame: {output_path}")

os.makedirs("/home/subi/Projects/IAMGREATER.net/assets/renders", exist_ok=True)

# Generate phone renders
create_phone_frame(
    "/home/subi/Work/swiftopen/assets/store/screenshot_overlay.png",
    "/home/subi/Projects/IAMGREATER.net/assets/renders/mockup_overlay.png",
    glow_color=(56, 189, 248, 120)
)

create_phone_frame(
    "/home/subi/Work/swiftopen/assets/store/screenshot_main.png",
    "/home/subi/Projects/IAMGREATER.net/assets/renders/mockup_main.png",
    glow_color=(168, 85, 247, 100)
)

create_phone_frame(
    "/home/subi/Work/swiftopen/assets/store/screenshot_settings.png",
    "/home/subi/Projects/IAMGREATER.net/assets/renders/mockup_settings.png",
    glow_color=(52, 211, 153, 100)
)

print("Done!")
