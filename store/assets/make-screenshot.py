#!/usr/bin/env python3
"""Compose a 1280x800 Chrome Web Store screenshot from a cropped panel capture.

Usage:
    python3 store/assets/make-screenshot.py <panel.png> <out.png> "Headline" "Sub" "b1|b2|b3" [amber|red|green]

Capture the panel with cmd+shift+4 on a real listing, dragging tightly around the
card. The script finds the card edges, rounds the corners and lays it out.
"""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1280, 800
INK = (11, 15, 20); PAPER = (255, 255, 255); MUTED = (148, 163, 184)
ACCENTS = {'amber': (247, 144, 9), 'red': (217, 45, 32), 'green': (18, 183, 106)}


def font(size, bold=True):
    p = "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf"
    try:
        return ImageFont.truetype(p, size)
    except Exception:
        return ImageFont.load_default()


def wrap(d, text, f, max_w):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=f) <= max_w:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def trim_to_card(im):
    """Drop any page that bled into the capture around the dark panel."""
    im = im.convert('RGB')
    px, (w, h) = im.load(), im.size
    dark = lambda p: p[0] < 60 and p[1] < 60 and p[2] < 70
    xs = [x for x in range(w) if dark(px[x, h // 2])]
    ys = [y for y in range(h) if dark(px[w // 2, y])]
    if not xs or not ys:
        return im
    return im.crop((xs[0], ys[0], xs[-1] + 1, ys[-1] + 1))


def compose(src, out, headline, sub, bullets, accent='amber'):
    accent = ACCENTS.get(accent, ACCENTS['amber'])
    canvas = Image.new('RGB', (W, H), INK)
    glow = Image.new('RGB', (W, H), INK)
    ImageDraw.Draw(glow).ellipse([780, 40, 1440, 740], fill=(25, 33, 44))
    canvas = Image.blend(canvas, glow.filter(ImageFilter.GaussianBlur(100)), 0.95).convert('RGBA')

    panel = trim_to_card(Image.open(src))
    target_h = 700
    panel = panel.resize((int(panel.width * target_h / panel.height), target_h), Image.LANCZOS)
    mask = Image.new('L', panel.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, panel.width - 1, panel.height - 1], radius=18, fill=255)
    rounded = Image.new('RGBA', panel.size, (0, 0, 0, 0))
    rounded.paste(panel, (0, 0), mask)

    px, py = W - rounded.width - 80, (H - rounded.height) // 2
    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        [px + 6, py + 16, px + rounded.width + 6, py + rounded.height + 16], radius=20, fill=(0, 0, 0, 170))
    canvas = Image.alpha_composite(canvas, shadow.filter(ImageFilter.GaussianBlur(26)))
    canvas.alpha_composite(rounded, (px, py))
    canvas = canvas.convert('RGB')
    d = ImageDraw.Draw(canvas)

    col_w, x, y = px - 142, 78, 168
    d.rectangle([x, y, x + 54, y + 5], fill=accent)
    y += 42
    for line in wrap(d, headline, font(48), col_w):
        d.text((x, y), line, font=font(48), fill=PAPER); y += 58
    y += 16
    for line in wrap(d, sub, font(22, False), col_w):
        d.text((x, y), line, font=font(22, False), fill=MUTED); y += 33
    y += 28
    for b in bullets:
        d.ellipse([x + 2, y + 8, x + 10, y + 16], fill=accent)
        d.text((x + 26, y), b, font=font(20, False), fill=(203, 213, 225)); y += 35

    canvas.save(out)
    print(out, canvas.size)


if __name__ == '__main__':
    src, out, headline, sub, bullets = sys.argv[1:6]
    accent = sys.argv[6] if len(sys.argv) > 6 else 'amber'
    compose(src, out, headline, sub, [b for b in bullets.split('|') if b], accent)
