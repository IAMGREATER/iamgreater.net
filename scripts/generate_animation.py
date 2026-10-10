import os
import math
import shutil
import subprocess
from PIL import Image, ImageDraw, ImageFilter, ImageFont

frames_dir = "/tmp/qd_anim_frames"
os.makedirs(frames_dir, exist_ok=True)

# Load base screen (screenshot_main) and overlay screen (screenshot_overlay)
screen_base = Image.open("/home/subi/Work/swiftopen/assets/store/screenshot_main.png").convert("RGBA")
screen_over = Image.open("/home/subi/Work/swiftopen/assets/store/screenshot_overlay.png").convert("RGBA")

# Target dimensions for video render (e.g. 540x1188 for crisp mobile mockup)
tw, th = 540, 1188
screen_base = screen_base.resize((tw, th), Image.Resampling.LANCZOS)
screen_over = screen_over.resize((tw, th), Image.Resampling.LANCZOS)

fps = 30
duration = 5.0
total_frames = int(fps * duration) # 150 frames

print(f"Generating {total_frames} frames...")

# Key timestamps:
# 0.0 - 0.8s (frames 0-24): Idle, subtle pulsing edge trigger on right edge
# 0.8 - 1.6s (frames 24-48): Thumb touch down on edge, sweeps inward to x = tw - 160
# 1.6 - 2.4s (frames 48-72): QuickDraw fan fades/expands in
# 2.4 - 3.4s (frames 72-102): Thumb moves to select app icon, hover pulse
# 3.4 - 4.0s (frames 102-120): Selection ripple/shockwave
# 4.0 - 5.0s (frames 120-150): Screen transitions back to base with subtle success flash

edge_x = tw - 8
edge_y = th // 2
hover_x = tw - 180
hover_y = th // 2 - 80

for f in range(total_frames):
    t = f / fps
    
    # Base canvas
    frame = screen_base.copy()
    
    # Overlay progress
    if t < 0.8:
        # Idle edge pulse
        pulse = 0.5 + 0.5 * math.sin(t * 8)
        draw = ImageDraw.Draw(frame, "RGBA")
        bar_w = 6 + int(pulse * 4)
        bar_h = 140
        draw.rounded_rectangle([tw - bar_w, edge_y - bar_h//2, tw, edge_y + bar_h//2], radius=4, fill=(56, 189, 248, int(160 + pulse * 80)))
    
    elif 0.8 <= t < 1.6:
        # Thumb sweeps inward
        prog = (t - 0.8) / 0.8
        # easeOutQuad
        ease = 1 - (1 - prog) * (1 - prog)
        tx = edge_x - (edge_x - hover_x) * ease
        ty = edge_y - (edge_y - hover_y) * ease * 0.4
        
        # Subtle fade in of overlay
        alpha = int(ease * 180)
        over_sub = screen_over.copy()
        over_sub.putalpha(alpha)
        frame = Image.alpha_composite(frame, over_sub)
        
        # Thumb touch indicator
        draw = ImageDraw.Draw(frame, "RGBA")
        r = 30
        draw.ellipse([tx - r, ty - r, tx + r, ty + r], fill=(255, 255, 255, 160), outline=(56, 189, 248, 240), width=3)
        # Trail
        draw.line([edge_x, edge_y, tx, ty], fill=(56, 189, 248, 120), width=4)
        
    elif 1.6 <= t < 2.4:
        # Full overlay visible, thumb settles onto icon
        prog = (t - 1.6) / 0.8
        ease = 1 - (1 - prog) * (1 - prog)
        frame = screen_over.copy()
        
        tx = hover_x
        ty = hover_y
        
        draw = ImageDraw.Draw(frame, "RGBA")
        r = 32 + int(math.sin(prog * math.pi) * 6)
        draw.ellipse([tx - r, ty - r, tx + r, ty + r], fill=(56, 189, 248, 140), outline=(255, 255, 255, 220), width=3)
        
    elif 2.4 <= t < 3.4:
        # Hovering over app, pulsing glow
        frame = screen_over.copy()
        cycle = math.sin((t - 2.4) * 8)
        tx = hover_x
        ty = hover_y
        
        draw = ImageDraw.Draw(frame, "RGBA")
        r = 34 + int(cycle * 4)
        # Target ripple
        draw.ellipse([tx - r, ty - r, tx + r, ty + r], fill=(56, 189, 248, 160), outline=(255, 255, 255, 240), width=4)
        # Target highlight ring
        draw.ellipse([tx - r - 12, ty - r - 12, tx + r + 12, ty + r + 12], outline=(56, 189, 248, int(120 + cycle * 60)), width=2)
        
    elif 3.4 <= t < 4.0:
        # Trigger release shockwave
        prog = (t - 3.4) / 0.6
        frame = screen_over.copy()
        tx = hover_x
        ty = hover_y
        
        draw = ImageDraw.Draw(frame, "RGBA")
        wave_r = int(30 + prog * 100)
        wave_alpha = int((1 - prog) * 200)
        draw.ellipse([tx - wave_r, ty - wave_r, tx + wave_r, ty + wave_r], outline=(56, 189, 248, wave_alpha), width=6)
        
    else:
        # Return to base with fade
        prog = (t - 4.0) / 1.0
        frame = screen_base.copy()
        draw = ImageDraw.Draw(frame, "RGBA")
        # Flash indicator
        flash_alpha = int((1 - prog) * 80)
        if flash_alpha > 0:
            flash_overlay = Image.new("RGBA", (tw, th), (56, 189, 248, flash_alpha))
            frame = Image.alpha_composite(frame, flash_overlay)

    # Put screen into modern phone frame with rounded corners
    corner_radius = 42
    smask = Image.new("L", (tw, th), 0)
    draw_sm = ImageDraw.Draw(smask)
    draw_sm.rounded_rectangle([0, 0, tw, th], radius=corner_radius, fill=255)
    frame.putalpha(smask)
    
    # Outer frame
    pad = 24
    out_w = tw + pad * 2
    out_h = th + pad * 2
    out_canvas = Image.new("RGBA", (out_w, out_h), (11, 14, 22, 255))
    
    # Bezel border
    draw_out = ImageDraw.Draw(out_canvas)
    draw_out.rounded_rectangle([pad - 4, pad - 4, pad + tw + 4, pad + th + 4], radius=corner_radius + 4, outline=(45, 55, 75, 255), width=4)
    
    # Camera punch
    cx = out_w // 2
    cy = pad + 24
    draw_out.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], fill=(0, 0, 0, 255))
    
    out_canvas.paste(frame, (pad, pad), frame)
    
    # Save frame as RGB JPEG for speed
    out_rgb = out_canvas.convert("RGB")
    out_rgb.save(f"{frames_dir}/frame_{f:04d}.jpg", quality=90)

print("Frames rendered! Assembling MP4 & WebM with ffmpeg...")

out_dir = "/home/subi/Projects/IAMGREATER.net/assets/renders"
mp4_path = f"{out_dir}/quickdraw_demo.mp4"
webm_path = f"{out_dir}/quickdraw_demo.webm"

# Render H264 MP4
subprocess.run([
    "ffmpeg", "-y",
    "-framerate", "30",
    "-i", f"{frames_dir}/frame_%04d.jpg",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-profile:v", "high",
    "-level", "4.1",
    "-crf", "22",
    "-movflags", "+faststart",
    mp4_path
], check=True)

# Render WebM VP9
subprocess.run([
    "ffmpeg", "-y",
    "-framerate", "30",
    "-i", f"{frames_dir}/frame_%04d.jpg",
    "-c:v", "libvpx-vp9",
    "-crf", "30",
    "-b:v", "0",
    webm_path
], check=True)

# Clean up temporary frames
shutil.rmtree(frames_dir)
print(f"Generated: {mp4_path} and {webm_path}")
