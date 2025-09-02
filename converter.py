import sys

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hsl(r, g, b):
    r /= 255.0
    g /= 255.0
    b /= 255.0
    high = max(r, g, b)
    low = min(r, g, b)
    h = s = l = (high + low) / 2.0

    if high == low:
        h = s = 0.0
    else:
        d = high - low
        s = d / (2.0 - high - low) if l > 0.5 else d / (high + low)
        if high == r:
            h = (g - b) / d + (6.0 if g < b else 0.0)
        elif high == g:
            h = (b - r) / d + 2.0
        else:
            h = (r - g) / d + 4.0
        h /= 6.0

    return round(h * 360), round(s * 100), round(l * 100)

if __name__ == "__main__":
    hex_code = sys.argv[1]
    r, g, b = hex_to_rgb(hex_code)
    h, s, l = rgb_to_hsl(r, g, b)
    print(f"{h} {s}% {l}%")
